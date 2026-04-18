"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useToast } from "@/components/ui/Toast";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CoachSection from "@/components/landing/CoachSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/ui/ChatWidget";

/**
 * Landing page content. The transparent <Navbar> is provided by the
 * sibling layout at `src/app/(landing)/layout.tsx`, not here — that
 * keeps the nav mounted across any future intra-group navigation.
 */
export default function Home() {
  const router = useRouter();
  const pushToast = useToast();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const { status, isDemo, error } = useSkarbnikUser();

  // Redirect to /quest ONLY when the Supabase sync has fully completed.
  //
  // We intentionally do NOT redirect on the raw `privyAuthenticated`
  // flag — a persisted Privy session from a previous dev run can be
  // marked authed even when there's no matching Supabase row, which
  // would bounce the visitor to /quest and leave them staring at a
  // forever-spinner because sync never succeeds.
  useEffect(() => {
    if (isDemo) return;
    if (status !== "authenticated") return;
    router.replace("/quest");
  }, [status, isDemo, router]);

  // Only hide the marketing surface when we're about to redirect. The
  // spinner covers the tiny window between "Supabase sync finished"
  // and `router.replace` firing. Unauth (and stuck-sync) visitors still
  // see the hero so they can click Log in or read the copy.
  const redirecting = !isDemo && status === "authenticated";

  // Chat widget burns API credits on every message — only render it for
  // fully-synced users (or the `?demo=true` preview). Anonymous or stuck
  // visitors don't get the coach.
  const showChat = isDemo || status === "authenticated";

  // If Supabase sync blows up, surface it instead of leaving the user
  // silently stuck on the landing page after a successful Privy login.
  const toastedError = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "error") return;
    if (!error) return;
    if (toastedError.current === error) return;
    toastedError.current = error;
    pushToast({
      variant: "error",
      message: lang === "pl" ? "Blad logowania" : "Login failed",
      sub: error,
    });
  }, [status, error, pushToast, lang]);

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeroSection lang={lang} theme={theme} />
      <StatsSection lang={lang} />
      <HowItWorks lang={lang} />
      <FeaturesSection lang={lang} />
      <CoachSection lang={lang} theme={theme} />
      <CTASection lang={lang} />
      <Footer lang={lang} />
      {showChat ? <ChatWidget lang={lang} /> : null}
    </div>
  );
}
