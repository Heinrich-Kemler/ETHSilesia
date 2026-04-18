"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import LanternGlyph from "@/components/ui/LanternGlyph";

/**
 * Minimal markdown renderer for Skarbnik's chat replies. Grok returns
 * `**bold**` / `*italic*` as plain asterisks, and showing those raw
 * looks broken — the user sees "**Uwaga**" when the model wanted
 * **Uwaga**. We only handle bold + italic + bare URLs (no headings,
 * lists, or code) because the system prompt caps responses at 150
 * words and rarely uses anything else. Pulling in `react-markdown`
 * for this would be overkill.
 *
 * Parsing order matters: bold (`**x**`) is matched before italic
 * (`*x*`) so the asterisks from the bold marker don't get eaten by
 * the italic pass.
 */
function renderInlineMarkdown(text: string): ReactNode[] {
  // First split on bold — non-greedy so consecutive **a** **b** don't
  // merge into one span.
  const boldParts = text.split(/(\*\*[^*]+?\*\*)/g);
  const nodes: ReactNode[] = [];
  boldParts.forEach((chunk, bi) => {
    if (chunk.startsWith("**") && chunk.endsWith("**") && chunk.length >= 4) {
      nodes.push(
        <strong key={`b-${bi}`} className="text-themed font-semibold">
          {chunk.slice(2, -2)}
        </strong>
      );
      return;
    }
    // Italic pass on what's left. We guard against lone asterisks (the
    // model sometimes writes `*` as a bullet) by requiring at least
    // one non-space char on each side of the marker.
    const italicParts = chunk.split(/(\*[^*\s][^*]*?[^*\s]\*|\*[^*\s]\*)/g);
    italicParts.forEach((piece, ii) => {
      if (
        piece.startsWith("*") &&
        piece.endsWith("*") &&
        piece.length >= 3 &&
        !piece.startsWith("**")
      ) {
        nodes.push(
          <em key={`i-${bi}-${ii}`}>{piece.slice(1, -1)}</em>
        );
      } else if (piece) {
        nodes.push(<Fragment key={`t-${bi}-${ii}`}>{piece}</Fragment>);
      }
    });
  });
  return nodes;
}

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
        /* Floating popover anchored above the FAB.
         *
         * No backdrop, no blur, no full-height rail — the user asked
         * that the rest of the page stay readable while the chat is
         * open (useful mid-quest or while browsing the hub). The
         * window scales in from the bottom-right (origin matches the
         * FAB it springs out of) and sits just above where the FAB
         * lives so the two feel connected. Clicking outside doesn't
         * close it — dismissal is explicitly via the X or the FAB,
         * which is what users expect from a sticky chat widget.
         */
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ transformOrigin: "bottom right" }}
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[min(640px,calc(100vh-8rem))] bg-card-themed border border-themed rounded-2xl z-[91] flex flex-col shadow-2xl overflow-hidden"
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
                      {/* Assistant replies go through the inline
                          markdown pass so **bold** renders as bold
                          instead of leaking raw asterisks. User
                          messages stay literal — we don't want their
                          typed text reformatted under them. */}
                      <p className="text-sm text-secondary-themed leading-relaxed whitespace-pre-wrap">
                        {renderInlineMarkdown(m.text)}
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
      )}
    </AnimatePresence>
  );
}

/** Floating FAB that opens the ChatPanel.
 *
 * Design intent: a "coin" — a gradient brand rim with a high-contrast
 * white inner face, and a bold Skarbnik chest on top of that face.
 * The earlier version put a thin white chest directly on the
 * gradient, which disappeared on the PKO theme (navy→green) because
 * a 22px outline with ~1px strokes just can't compete with a dark
 * gradient. The coin design solves that in three ways:
 *   1. The logo sits on a solid card-colour disc, so contrast is
 *      guaranteed regardless of how `--gold` / `--cyan` are themed.
 *   2. The logo scales up to ~55% of the button and the stroke is
 *      thickened so it reads at a glance.
 *   3. The gradient survives as a 3px rim, keeping the brand colour
 *      signal without drowning the mark.
 * Size and positioning match the original compact FAB so the page
 * content behind it stays fully readable.
 */
export function ChatFab({ onClick, lang }: { onClick: () => void; lang: Lang }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={t("chatTitle", lang)}
      title={t("chatTitle", lang)}
      initial={{ opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.2 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-[80] w-14 h-14 rounded-full gradient-gold-cyan-themed p-[3px] shadow-[0_10px_28px_-6px_rgba(0,0,0,0.35)]"
    >
      {/* Inner card-coloured disc — the "face" of the coin. Solid
          fill guarantees the logo reads on both themes.

          Uses LanternGlyph (same mark as the navbar + footer) instead
          of the old "treasure chest" silhouette, which read as a
          padlock at 30px and collided with the actual Lock iconography
          we use for locked quest nodes. Sharing the lantern across
          every mark makes the brand feel unified and stops the user
          thinking "why is my AI coach a locked chest?". */}
      <div className="relative w-full h-full rounded-full bg-card-themed flex items-center justify-center">
        <LanternGlyph size={30} />
      </div>
      {/* Online pip — sits on the gradient rim, cut out by a ring
          the same colour as the inner face so the dot reads as a
          neat badge rather than a sticker. */}
      <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green ring-2 ring-card-themed" />
    </motion.button>
  );
}
