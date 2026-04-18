"use client";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-themed bg-card-themed">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-gold-cyan-themed flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 120 120" fill="none">
                  <path
                    d="M42 38 C42 22, 78 22, 78 38"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <rect x="38" y="36" width="44" height="8" rx="2" fill="white" />
                  <rect x="40" y="44" width="40" height="36" rx="3" fill="white" opacity="0.8" />
                  <path
                    d="M60 50 C56 56, 52 62, 55 68 C56 70, 58 71, 60 72 C62 71, 64 70, 65 68 C68 62, 64 56, 60 50Z"
                    fill="var(--flame)"
                  />
                </svg>
              </div>
              <span className="font-heading text-themed font-bold tracking-wider">
                Skarbnik
              </span>
            </div>
            <p className="text-muted-themed text-sm">
              {t("footerTagline", lang)}
            </p>
          </div>

          {/* Sponsors */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-themed/50 text-xs uppercase tracking-[0.15em]">
              {t("builtFor", lang)}
            </p>
            <div className="flex items-center gap-6">
              <span className="text-muted-themed/40 text-xs font-medium">
                PKO Bank Polski
              </span>
              <span className="w-px h-3 bg-border" style={{ background: "var(--border-color)" }} />
              <span className="text-muted-themed/40 text-xs font-medium">
                Tauron
              </span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-muted-themed/30 text-xs">
            &copy; 2026 Skarbnik. ETH Silesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
