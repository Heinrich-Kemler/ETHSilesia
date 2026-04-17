"use client";

import { useEffect, useState } from "react";

/** Pure hook: reflects ?demo=true presence in the URL. */
export function useDemoMode(): boolean {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDemo(params.get("demo") === "true");
  }, []);
  return demo;
}
