"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lang } from "./i18n";

const STORAGE_KEY = "skarbnik-lang";

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("pl");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pl") {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "pl" ? "en" : "pl");
  }, [lang, setLang]);

  return { lang, setLang, toggle };
}
