"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  LogIn,
  Globe,
  Coins,
  Layers,
  Landmark,
} from "lucide-react";
import ChatWidget from "@/components/ui/ChatWidget";
import { useLanguage } from "@/lib/useLanguage";

type ScamAlert = {
  id: string;
  title_pl: string;
  title_en: string | null;
  summary_pl: string;
  summary_en: string | null;
  threat_type: string;
  severity: "critical" | "high" | "medium" | "low";
  amount_lost_usd: number | null;
  detected_at: string;
  analogy_pl: string | null;
  analogy_en: string | null;
  protection_tips_pl: string | null;
  protection_tips_en: string | null;
  source_url: string | null;
  category: "web2" | "web3" | null;
  source_name: string | null;
};

type CategoryFilter = "all" | "web2" | "web3" | "global";

const SOURCE_LABELS: Record<string, string> = {
  cert_pl: "CERT.PL",
  niebezpiecznik: "Niebezpiecznik",
  cointelegraph: "Cointelegraph",
  twitter: "Twitter/X",
  defillama: "DeFiLlama",
  manual: "Skarbnik",
};

const SOURCE_COLORS: Record<string, string> = {
  cert_pl: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  niebezpiecznik: "bg-red-500/10 text-red-400 border-red-500/20",
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  defillama: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  manual: "bg-gold-themed/10 text-gold-themed border-gold-themed/20",
};

export default function AlertsPage() {
  const { lang } = useLanguage();
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");

  const loadAlerts = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const url =
          category === "all"
            ? "/api/alerts"
            : `/api/alerts?category=${category}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch alerts");
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category],
  );

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const toggleExpand = (id: string) => {
    setExpandedAlertId((prev) => (prev === id ? null : id));
  };

  const tabs: { key: CategoryFilter; label: string; icon: React.ReactNode }[] =
    [
      {
        key: "all",
        label: lang === "pl" ? "Wszystko" : "All",
        icon: <Layers className="w-3.5 h-3.5" />,
      },
      {
        key: "global",
        label: lang === "pl" ? "Alerty globalne" : "Global Alerts",
        icon: <Globe className="w-3.5 h-3.5" />,
      },
      {
        key: "web2",
        label: lang === "pl" ? "Bankowość Tradycyjna" : "Traditional Banking",
        icon: <Landmark className="w-3.5 h-3.5" />,
      },
      {
        key: "web3",
        label: "Świat DeFi",
        icon: <Coins className="w-3.5 h-3.5" />,
      },
    ];

  return (
    <main className="min-h-screen bg-themed flex flex-col">
      {/* Minimalna belka nawigacyjna usunięta - strona przeniesiona pod (app) z głównym AppNav */}

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-32 flex-1 w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-themed">
              {lang === "pl" ? "Raport Zagrożeń" : "Threat Report"}
            </h1>
            <p className="text-muted-themed text-sm mt-2">
              {lang === "pl"
                ? "Bieżące oszustwa i ataki w przestrzeni DeFi i bankowości. Skarbnik czuwa."
                : "Current scams and attacks in DeFi and banking. Skarbnik watches."}
            </p>
          </div>
        </motion.div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                category === tab.key
                  ? "bg-gold-themed/10 text-gold-themed border-gold-themed/30 shadow-sm"
                  : "bg-card-themed text-secondary-themed border-themed hover:border-gold-themed/20 hover:text-themed"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-card-themed border border-themed rounded-2xl p-10 text-center text-muted-themed flex flex-col items-center gap-4 shadow-card">
            <p>
              {lang === "pl"
                ? "Brak aktywnych alertów w tej kategorii."
                : "No active alerts in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, idx) => {
              const isExpanded = expandedAlertId === alert.id;
              const title =
                lang === "pl"
                  ? alert.title_pl
                  : alert.title_en || alert.title_pl;
              const summary = (
                lang === "pl"
                  ? alert.summary_pl
                  : alert.summary_en || alert.summary_pl
              )?.replace(/\\n/g, "\n");
              const analogy =
                lang === "pl"
                  ? alert.analogy_pl
                  : alert.analogy_en || alert.analogy_pl;
              const protection = (
                lang === "pl"
                  ? alert.protection_tips_pl
                  : alert.protection_tips_en || alert.protection_tips_pl
              )?.replace(/\\n/g, "\n");

              const sourceName = alert.source_name || "manual";
              const sourceLabel = SOURCE_LABELS[sourceName] || sourceName;
              const sourceColor =
                SOURCE_COLORS[sourceName] || SOURCE_COLORS.manual;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-card-themed border rounded-2xl overflow-hidden shadow-card hover:border-gold-themed/30 transition-colors ${
                    isExpanded
                      ? "border-gold-themed/50 ring-1 ring-gold-themed/20"
                      : "border-themed"
                  }`}
                >
                  {/* Clickable Header */}
                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="w-full text-left p-5 sm:p-6 transition-colors focus:outline-none focus-visible:bg-white/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Category badge */}
                          <span
                            className={`text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-md border ${
                              alert.category === "web3"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : alert.category === "web2"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {alert.category === "web3"
                              ? "DeFi"
                              : alert.category === "web2"
                                ? "Bankowość"
                                : "Globalne"}
                          </span>
                          {/* Threat type */}
                          <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-md border border-themed bg-elevated-themed text-muted-themed">
                            {(alert.threat_type || "").replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-themed ml-auto sm:ml-0">
                            {new Date(alert.detected_at).toLocaleDateString(
                              lang === "pl" ? "pl-PL" : "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-themed mt-2 group-hover:text-gold-themed transition-colors">
                          {title}
                        </h2>
                      </div>

                      {alert.amount_lost_usd ? (
                        <div className="flex flex-col sm:items-end bg-red-500/5 px-3 py-2 rounded-xl border border-red-500/10 self-start shrink-0">
                          <span className="text-[10px] text-muted-themed uppercase tracking-wider font-mono">
                            {lang === "pl"
                              ? "Szacowana strata"
                              : "Estimated loss"}
                          </span>
                          <span className="text-red-500 font-mono font-bold">
                            ${alert.amount_lost_usd.toLocaleString("en-US")}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <p className="text-secondary-themed text-sm line-clamp-1">
                        {summary?.split("\n")[0] || summary}
                      </p>
                      <div className="text-muted-themed bg-elevated-themed p-1.5 rounded-full shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-themed bg-themed/30"
                      >
                        <div className="p-5 sm:p-6 space-y-6">
                          {/* Co się stało (Problem) */}
                          <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-themed uppercase tracking-widest font-mono">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {lang === "pl"
                                ? "Co się stało?"
                                : "What happened?"}
                            </h3>
                            <p className="text-secondary-themed text-sm leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-red-500/20">
                              {summary}
                            </p>
                            {analogy && (
                              <div className="mt-3 pl-4">
                                <p className="text-xs text-muted-themed italic">
                                  🤔{" "}
                                  {lang === "pl"
                                    ? "Upraszczając"
                                    : "In simple terms"}
                                  : {analogy}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Akcja (Jak się chronić) */}
                          <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-themed uppercase tracking-widest font-mono">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  alert.threat_type === "hack"
                                    ? "bg-blue-500"
                                    : "bg-emerald-500"
                                }`}
                              ></span>
                              {alert.threat_type === "Atak hakerski" ||
                              alert.threat_type === "hack"
                                ? lang === "pl"
                                  ? "Kluczowa lekcja"
                                  : "Key lesson"
                                : lang === "pl"
                                  ? "Jak się bronić?"
                                  : "How to protect yourself?"}
                            </h3>
                            <div
                              className={`text-sm font-medium text-themed rounded-xl p-4 whitespace-pre-wrap leading-relaxed shadow-sm border ${
                                alert.threat_type === "hack"
                                  ? "bg-blue-500/5 border-blue-500/20"
                                  : "bg-emerald-500/5 border-emerald-500/20"
                              }`}
                            >
                              {protection ||
                                (lang === "pl"
                                  ? "Bądź ostrożny i analizuj projekty, w które alokujesz kapitał."
                                  : "Be cautious and analyze projects before allocating capital.")}
                            </div>
                          </div>

                          {/* Źródło */}
                          {alert.source_url && (
                            <div className="pt-2 border-t border-themed/50">
                              <a
                                href={alert.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-cyan-themed hover:text-cyan-400 transition-colors font-mono"
                              >
                                {lang === "pl" ? "Źródło" : "Source"}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <ChatWidget lang={lang} />
    </main>
  );
}
