"use client";

import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CoachSection from "@/components/landing/CoachSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/ui/ChatWidget";

export default function Home() {
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
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
