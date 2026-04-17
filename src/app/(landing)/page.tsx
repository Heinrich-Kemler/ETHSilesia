"use client";

import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";
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
  const { lang } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen">
      <HeroSection lang={lang} theme={theme} />
      <StatsSection lang={lang} />
      <HowItWorks lang={lang} />
      <FeaturesSection lang={lang} />
      <CoachSection lang={lang} theme={theme} />
      <CTASection lang={lang} />
      <Footer lang={lang} />
      <ChatWidget lang={lang} />
    </div>
  );
}
