"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default function CTASection({ lang }: { lang: Lang }) {
  return (
    <section className="relative py-24">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-card-themed border border-themed rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          {/* Background accents */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gold/[0.06] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan/[0.06] rounded-full blur-[80px] pointer-events-none" />

          <h2 className="relative font-heading text-3xl md:text-4xl font-bold text-themed mb-4">
            {t("ctaTitle", lang)}
          </h2>
          <p className="relative text-secondary-themed text-lg mb-8 max-w-lg mx-auto">
            {t("ctaDesc", lang)}
          </p>
          <Link
            href="/assess"
            className="relative inline-flex group items-center justify-center gap-2 mx-auto text-white font-heading font-bold text-lg px-10 py-4 rounded-xl transition-all gradient-gold-themed"
            style={{ boxShadow: "0 0 30px var(--gold-glow)" }}
          >
            {t("ctaButton", lang)}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
