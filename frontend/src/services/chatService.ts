import type { ChatSettings, Message, StreamEvent } from "../types/chat";
import { API_BASE_URL } from "../config/env";
import { MAX_RETRIES, RETRY_DELAY_MS, TIMEOUT_MS } from "../constants/network";
import { buildApiUrl } from "../utils/url";

type StreamHandler = (event: StreamEvent) => void;

class StreamError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public retryable = false
  ) {
    super(message);
    this.name = "StreamError";
  }
}

const getErrorMessage = (status: number, body?: unknown): string => {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const detail = (body as { detail: string | { message?: string } }).detail;
    if (typeof detail === "string") return detail;
    if (typeof detail === "object" && detail !== null && "message" in detail) {
      return String(detail.message);
    }
  }
  if (typeof body === "object" && body !== null && "message" in body) {
    return String((body as { message: string }).message);
  }

  switch (status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Authentication failed. Please check your API key.";
    case 403:
      return "Access denied. You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 429:
      return "Rate limit exceeded. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again later.";
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return `Request failed with status ${status}. Please try again.`;
  }
};

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new StreamError(
        "Request timeout. Please check your connection and try again.",
        "TIMEOUT",
        0,
        true
      );
    }
    throw error;
  }
};

const CHAT_STREAM_URL = buildApiUrl(API_BASE_URL, "/api/chat/stream");

export const streamChat = async (
  messages: Message[],
  settings: ChatSettings,
  onEvent: StreamHandler,
  retryCount = 0
): Promise<void> => {
  try {
    const response = await fetchWithTimeout(
      CHAT_STREAM_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          settings,
        }),
      },
      TIMEOUT_MS
    );

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const errorMessage = getErrorMessage(response.status, errorBody);
      const isRetryable = response.status >= 500 || response.status === 429;

      if (isRetryable && retryCount < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return streamChat(messages, settings, onEvent, retryCount + 1);
      }

      throw new StreamError(errorMessage, "HTTP_ERROR", response.status, isRetryable);
    }

    if (!response.body) {
      throw new StreamError("No response body received from server.", "NO_BODY", response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let hasReceivedData = false;
    const streamTimeout = setTimeout(() => {
      if (!hasReceivedData) {
        reader.cancel();
        throw new StreamError("Stream timeout. No data received.", "STREAM_TIMEOUT", 0, true);
      }
    }, TIMEOUT_MS);

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          clearTimeout(streamTimeout);
          if (!hasReceivedData) {
            throw new StreamError("Stream ended without data.", "EMPTY_STREAM", 0);
          }
          break;
        }

        hasReceivedData = true;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (!payload.trim()) continue;

            try {
              const event = JSON.parse(payload) as StreamEvent;
              if (!event.type) {
                throw new Error("Invalid event: missing type");
              }
              onEvent(event);
            } catch (parseError) {
              console.error("Failed to parse stream event:", parseError, "Payload:", payload);
              onEvent({
                type: "error",
                message: "Received malformed data from server. Please try again.",
              });
            }
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
    } finally {
      clearTimeout(streamTimeout);
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof StreamError) {
      onEvent({ type: "error", message: error.message });
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      const networkError = new StreamError(
        "Network error. Please check your internet connection and try again.",
        "NETWORK_ERROR",
        0,
        true
      );
      onEvent({ type: "error", message: networkError.message });
      throw networkError;
    }

    const unknownError = new StreamError(
      error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      "UNKNOWN_ERROR",
      0
    );
    onEvent({ type: "error", message: unknownError.message });
    throw unknownError;
  }
};

