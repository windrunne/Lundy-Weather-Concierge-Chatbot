type ChatStatusProps = {
  message: string | null;
};

const ChatStatus = ({ message }: ChatStatusProps) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-sky-200/80">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
      <span>{message}</span>
    </div>
  );
};

export default ChatStatus;

