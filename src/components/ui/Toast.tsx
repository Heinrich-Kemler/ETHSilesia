"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Trophy, AlertCircle, X } from "lucide-react";

export type ToastVariant = "success" | "level-up" | "error";
export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
  sub?: string;
};

type ToastContextType = {
  push: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const VARIANT_META: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    accent: string; // CSS var name
  }
> = {
  success: { icon: CheckCircle2, accent: "var(--cyan)" },
  "level-up": { icon: Trophy, accent: "var(--gold)" },
  error: { icon: AlertCircle, accent: "#ef4444" },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, accent } = VARIANT_META[toast.variant];

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-card-themed border border-themed rounded-xl shadow-2xl overflow-hidden w-80"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-themed text-sm font-semibold leading-tight">
            {toast.message}
          </p>
          {toast.sub ? (
            <p className="text-secondary-themed text-xs mt-0.5 leading-snug">
              {toast.sub}
            </p>
          ) : null}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-muted-themed hover:text-themed flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ToastContextType>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Hook for pushing toasts anywhere in the tree. */
export function useToast(): (t: Omit<Toast, "id">) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Silent no-op if provider missing so pages don't crash.
    return () => {};
  }
  return ctx.push;
}
