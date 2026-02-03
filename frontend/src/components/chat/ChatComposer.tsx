import type { ChangeEvent, KeyboardEvent } from "react";

type ChatComposerProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  isStreaming: boolean;
};

const ChatComposer = ({ value, onChange, onKeyDown, onSend, isStreaming }: ChatComposerProps) => {
  return (
    <div className="glass flex items-end gap-3 rounded-3xl px-4 py-3">
      <textarea
        className="max-h-32 flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
        placeholder="Ask about weather, forecasts, or travel planning... (Press Enter to send)"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        rows={1}
        disabled={isStreaming}
      />
      <button
        className="rounded-2xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
        onClick={onSend}
        disabled={isStreaming || !value.trim()}
      >
        {isStreaming ? "..." : "Send"}
      </button>
    </div>
  );
};

export default ChatComposer;

