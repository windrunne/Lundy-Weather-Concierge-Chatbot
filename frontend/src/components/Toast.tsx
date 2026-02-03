import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastProps = {
  toast: Toast;
  onRemove: (id: string) => void;
};

const ToastItem = ({ toast, onRemove }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <FiCheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <FiAlertCircle className="h-5 w-5 text-red-400" />,
    warning: <FiAlertCircle className="h-5 w-5 text-yellow-400" />,
    info: <FiInfo className="h-5 w-5 text-sky-400" />,
  };

  const bgColors = {
    success: "bg-emerald-500/10 border-emerald-500/30",
    error: "bg-red-500/10 border-red-500/30",
    warning: "bg-yellow-500/10 border-yellow-500/30",
    info: "bg-sky-500/10 border-sky-500/30",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${
        bgColors[toast.type]
      } ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-white">{toast.message}</p>
      <button
        className="text-slate-400 transition hover:text-white"
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
};

type ToastContainerProps = {
  toasts: Toast[];
  onRemove: (id: string) => void;
};

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

