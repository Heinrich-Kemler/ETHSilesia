"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

/**
 * Slide-in AI coach panel. Opens from the right edge on all app pages.
 * Uses POST /api/ai/chat.
 */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export default function ChatPanel({
  lang,
  open,
  onClose,
}: {
  lang: Lang;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Seed welcome message once.
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: t("chatWelcome", lang),
        },
      ]);
    }
    // re-seed if lang changed and only the welcome is there
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Autoscroll on new message.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: msg,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, language: lang }),
      });
      const data = (await res.json()) as { response?: string; error?: string };
      const text =
        data.response ??
        (lang === "pl"
          ? "Przepraszam, mam kłopot z odpowiedzią. Spróbuj ponownie."
          : "Sorry, I'm having trouble responding. Try again.");
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: t("toastGenericError", lang),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const suggestions: Array<"chatSuggestion1" | "chatSuggestion2" | "chatSuggestion3"> = [
    "chatSuggestion1",
    "chatSuggestion2",
    "chatSuggestion3",
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />
          {/* panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-card-themed border-l border-themed z-[91] flex flex-col shadow-2xl"
          >
            {/* header */}
            <div className="px-5 py-4 border-b border-themed flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gold-themed/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold-themed" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-themed">
                  {t("chatTitle", lang)}
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green" />
                  <span className="text-xs text-muted-themed">
                    {t("chatSubtitle", lang)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-themed hover:border-gold-themed/30 text-muted-themed hover:text-themed flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-gold-themed/10 border border-gold-themed/20 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-themed whitespace-pre-wrap">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-gold-themed" />
                    </div>
                    <div className="bg-elevated-themed rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-secondary-themed leading-relaxed whitespace-pre-wrap">
                        {m.text}
                      </p>
                    </div>
                  </div>
                )
              )}
              {sending && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-gold-themed" />
                  </div>
                  <div className="bg-elevated-themed rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-themed animate-bounce" />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-themed animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-themed animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && !sending && (
                <div className="pt-2">
                  <p className="text-xs text-muted-themed mb-2 uppercase tracking-wider font-mono">
                    {lang === "pl" ? "Popularne pytania" : "Quick questions"}
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((key) => (
                      <button
                        key={key}
                        onClick={() => send(t(key, lang))}
                        className="w-full text-left text-sm bg-elevated-themed hover:bg-card-hover-themed border border-themed hover:border-gold-themed/30 rounded-lg px-3 py-2 text-secondary-themed hover:text-themed transition-colors"
                      >
                        {t(key, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="p-4 border-t border-themed flex items-center gap-2 flex-shrink-0"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chatPlaceholder", lang)}
                className="flex-1 bg-elevated-themed border border-themed focus:border-gold-themed/40 rounded-xl px-4 py-2.5 text-sm text-themed placeholder-muted-themed focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-xl gradient-gold-themed text-white flex items-center justify-center disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Floating FAB that opens the ChatPanel. */
export function ChatFab({ onClick, lang }: { onClick: () => void; lang: Lang }) {
  return (
    <button
      onClick={onClick}
      aria-label={t("chatTitle", lang)}
      className="fixed bottom-6 right-6 z-[80] w-14 h-14 rounded-full gradient-gold-cyan-themed text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
