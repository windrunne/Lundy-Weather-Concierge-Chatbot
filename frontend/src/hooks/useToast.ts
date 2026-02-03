import { useCallback, useState } from "react";

import type { Toast, ToastType } from "../components/Toast";

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => showToast("success", message, duration), [showToast]);
  const error = useCallback((message: string, duration?: number) => showToast("error", message, duration), [showToast]);
  const warning = useCallback((message: string, duration?: number) => showToast("warning", message, duration), [showToast]);
  const info = useCallback((message: string, duration?: number) => showToast("info", message, duration), [showToast]);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
  };
};

