import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { MAX_MESSAGE_LENGTH, STARTER_PROMPTS } from "../constants/chat";
import { useToast } from "../hooks/useToast";
import { streamChat } from "../services/chatService";
import type { ChatSettings, Message, StreamEvent, ToolError, WeatherPayload } from "../types/chat";
import { ToastContainer } from "./Toast";
import ChatComposer from "./chat/ChatComposer";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./chat/ChatMessages";
import ChatPrompts from "./chat/ChatPrompts";
import ChatSidebar from "./chat/ChatSidebar";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can pull real-time forecasts, compare cities, and help plan your day. Ask me about any location.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings>({ units: "metric" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toasts, error: showError, warning: showWarning, removeToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessage]);

  const isToolError = (
    payload: WeatherPayload | ToolError | { results: WeatherPayload[] }
  ): payload is ToolError => {
    return typeof payload === "object" && payload !== null && "error" in payload;
  };

  const handleEvent = (assistantId: string) => (event: StreamEvent) => {
    try {
      if (event.type === "token") {
        if (!event.value) {
          console.warn("Received empty token");
          return;
        }
        setMessages((prev: Message[]) =>
          prev.map((message: Message) =>
            message.id === assistantId
              ? { ...message, content: message.content + event.value }
              : message
          )
        );
      } else if (event.type === "tool") {
        const payload = event.payload;
        if (!payload) {
          showWarning("Received empty tool payload");
          return;
        }
        if (isToolError(payload)) {
          const errorMsg = payload.message || "An error occurred while fetching weather data.";
          showError(errorMsg);
          setMessages((prev: Message[]) =>
            prev.map((message: Message) =>
              message.id === assistantId
                ? { ...message, content: `${message.content}\n\n**Error:** ${errorMsg}` }
                : message
            )
          );
        } else if ("results" in payload) {
          if (!Array.isArray(payload.results) || payload.results.length === 0) {
            showWarning("No weather data received for the requested locations.");
            return;
          }
          setMessages((prev: Message[]) =>
            prev.map((message: Message) =>
              message.id === assistantId ? { ...message, weather: payload.results } : message
            )
          );
        } else {
          setMessages((prev: Message[]) =>
            prev.map((message: Message) =>
              message.id === assistantId ? { ...message, weather: [payload] } : message
            )
          );
        }
      } else if (event.type === "status") {
        if (!event.message) {
          console.warn("Received empty status message");
          return;
        }
        setStatusMessage(event.message);
      } else if (event.type === "error") {
        const errorMsg = event.message || "An unexpected error occurred.";
        showError(errorMsg);
        setMessages((prev: Message[]) =>
          prev.map((message: Message) =>
            message.id === assistantId
              ? { ...message, content: `${message.content}\n\n**Error:** ${errorMsg}` }
              : message
          )
        );
      } else if (event.type === "done") {
        setStatusMessage(null);
        setIsStreaming(false);
      }
    } catch (err) {
      console.error("Error handling stream event:", err, event);
      const errorMsg = err instanceof Error ? err.message : "Failed to process stream event.";
      showError(errorMsg);
    }
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      showError(`Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);
    setStatusMessage("Analyzing your request...");

    const history = [...messages, userMessage];
    try {
      await streamChat(history, settings, handleEvent(assistantMessage.id));
    } catch (err) {
      console.error("Stream error:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to send message. Please check your connection and try again.";
      showError(errorMsg);
      setMessages((prev: Message[]) =>
        prev.map((message: Message) =>
          message.id === assistantMessage.id
            ? { ...message, content: `**Error:** ${errorMsg}` }
            : message
        )
      );
    } finally {
      setStatusMessage(null);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr] overflow-y-auto">
        <section className="glass flex flex-col rounded-3xl p-6 overflow-y-auto">
          <ChatHeader />
          <ChatMessages
            messages={messages}
            isStreaming={isStreaming}
            statusMessage={statusMessage}
            containerRef={messagesContainerRef}
            endRef={messagesEndRef}
          />
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <ChatPrompts
              prompts={STARTER_PROMPTS}
              onSelect={sendMessage}
              disabled={isStreaming}
            />
            <ChatComposer
              value={input}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              onSend={() => sendMessage(input)}
              isStreaming={isStreaming}
            />
          </div>
        </section>
        <ChatSidebar
          isStreaming={isStreaming}
          settings={settings}
          onUnitsChange={(units) => setSettings({ units })}
        />
      </div>
    </>
  );
};

export default Chat;
