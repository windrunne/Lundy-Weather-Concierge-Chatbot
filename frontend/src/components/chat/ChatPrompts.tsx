type ChatPromptsProps = {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled: boolean;
};

const ChatPrompts = ({ prompts, onSelect, disabled }: ChatPromptsProps) => {
  if (!prompts.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default ChatPrompts;

