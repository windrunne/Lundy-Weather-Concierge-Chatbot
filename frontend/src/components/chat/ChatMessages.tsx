import type { RefObject } from "react";

import type { Message } from "../../types/chat";
import MessageBubble from "../MessageBubble";

type ChatMessagesProps = {
  messages: Message[];
  isStreaming: boolean;
  statusMessage: string | null;
  containerRef: RefObject<HTMLDivElement>;
  endRef: RefObject<HTMLDivElement>;
};

const ChatMessages = ({
  messages,
  isStreaming,
  statusMessage,
  containerRef,
  endRef,
}: ChatMessagesProps) => {
  return (
    <div
      ref={containerRef}
      className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      style={{ maxHeight: "calc(100vh - 400px)", minHeight: "300px" }}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && message.role === "assistant" && !message.content}
          statusMessage={statusMessage}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessages;

