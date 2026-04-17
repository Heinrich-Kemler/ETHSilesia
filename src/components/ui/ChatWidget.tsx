"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { usePrivy } from "@privy-io/react-auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("chatWelcome", lang) },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() =>
    Math.random().toString(36).substring(2, 10),
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = usePrivy();

  const suggestions = [
    t("chatSuggestion1", lang),
    t("chatSuggestion2", lang),
    t("chatSuggestion3", lang),
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessage(""); // clear input immediately
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: lang,
          userId: user?.id, // Privy ID przekazane do bazy by załączyć poziom, itp.
          sessionId: sessionId,
        }),
      });

      if (!res.ok) throw new Error("Błąd podczas wysyłania wiadomości");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Mój kilof chyba uderzył w złą skałę, spróbuj ponownie za moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, lineIdx) => {
      if (!line.trim()) return <br key={lineIdx} />;

      let isHeader = false;
      let text = line;

      if (line.trim().startsWith("### ")) {
        isHeader = true;
        text = line.trim().slice(4);
      } else if (line.trim().startsWith("## ")) {
        isHeader = true;
        text = line.trim().slice(3);
      } else if (line.trim().startsWith("# ")) {
        isHeader = true;
        text = line.trim().slice(2);
      }

      const isBullet =
        line.trim().startsWith("- ") || line.trim().startsWith("* ");
      if (isBullet) {
        text = line.trim().substring(2);
      }

      const inlineElements = text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className="font-bold text-themed">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isHeader) {
        return (
          <p
            key={lineIdx}
            className="font-bold text-[1.05rem] mt-3 mb-1 text-themed"
          >
            {inlineElements}
          </p>
        );
      }

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex gap-2 mt-1">
            <span className="text-gold-themed mt-0.5">•</span>
            <span>{inlineElements}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="mt-1">
          {inlineElements}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-card-themed border border-themed rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-elevated-themed px-4 py-3 flex items-center justify-between border-b border-themed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold-themed/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold-themed" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-themed">
                    {t("chatTitle", lang)}
                  </p>
                  <p className="text-xs text-muted-themed">
                    {t("chatSubtitle", lang)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-themed hover:text-themed transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages area */}
            <div className="h-72 p-4 overflow-y-auto space-y-4 flex flex-col">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center mt-1">
                      <Sparkles className="w-3 h-3 text-gold-themed" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[85%] break-words ${
                      m.role === "user"
                        ? "bg-gold-themed text-white rounded-tr-sm"
                        : "bg-elevated-themed text-secondary-themed rounded-tl-sm border border-themed/20"
                    }`}
                  >
                    <div className="text-sm">{formatMessage(m.content)}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <Sparkles className="w-3 h-3 text-gold-themed" />
                  </div>
                  <div className="bg-elevated-themed border border-themed/20 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-gold-themed" />
                    <span className="text-xs text-muted-themed tracking-widest">
                      . . .
                    </span>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {messages.length === 1 && (
                <div className="space-y-2 pl-8 pt-2">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-cyan-themed/20 bg-cyan-themed/5 text-cyan-themed hover:bg-cyan-themed/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-themed">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(message);
                }}
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("chatPlaceholder", lang)}
                  disabled={isLoading}
                  className="flex-1 bg-themed border border-themed rounded-lg px-3 py-2 text-sm text-themed placeholder-muted-themed focus:outline-none focus:border-gold-themed/40 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="bg-gold-themed hover:bg-gold-dim-themed text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full gradient-gold-cyan-themed shadow-lg flex items-center justify-center relative"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-gold-themed/20 animate-ping" />
        )}
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}
