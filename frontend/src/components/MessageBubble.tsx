import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { FiCopy, FiCloud, FiX } from "react-icons/fi";

import type { Message } from "../types/chat";
import WeatherCard from "./WeatherCard";

type MessageBubbleProps = {
  message: Message;
  isStreaming?: boolean;
  statusMessage?: string | null;
};

const MessageBubble = ({
  message,
  isStreaming = false,
  statusMessage,
}: MessageBubbleProps) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [showWeather, setShowWeather] = useState(false);
  const hasWeather = !!message.weather?.length;
  const isEmpty = !message.content.trim() && message.role === "assistant";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showWeather) {
        setShowWeather(false);
      }
    };
    if (showWeather) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showWeather]);

  return (
    <>
      <div className={`flex w-full items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg transition ${
            isSystem
              ? "border border-dashed border-sky-300/40 bg-sky-400/10 text-sky-100"
              : isUser
              ? "bg-gradient-to-br from-sky-400/80 to-indigo-500/80 text-white"
              : "glass text-slate-100"
          }`}
        >
          <div className="flex-shrink-0 text-xs text-slate-300 text-right">
            { (isUser || (!isUser && !isStreaming)) && new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {isUser || isSystem ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="space-y-3">
              {isEmpty && isStreaming ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300" />
                  <span className="text-xs">{statusMessage ?? "Preparing response..."}</span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 list-disc pl-5 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="break-words">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-white first:mt-0">{children}</h3>,
                    code: ({ children }) => <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-sky-400/50 pl-3 italic text-slate-300">{children}</blockquote>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
          {!isUser && !isSystem && !isEmpty && (
            <div className="mt-3 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={() => navigator.clipboard.writeText(message.content)}
                title="Copy message"
              >
                <FiCopy className="h-3.5 w-3.5" />
              </button>
              {hasWeather && (
                <button
                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setShowWeather(true)}
                  title="View weather details"
                >
                  <FiCloud className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {showWeather &&
        hasWeather &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowWeather(false);
            }}
          >
            <div className="relative max-h-[90vh] w-full max-w-4xl space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 pb-4">
                <h3 className="text-xl font-semibold text-white">Weather Details</h3>
                <button
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setShowWeather(false)}
                  title="Close (Esc)"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                {message.weather?.map((payload, index) => (
                  <WeatherCard key={`${message.id}-modal-${index}`} payload={payload} embedded />
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default memo(MessageBubble);

