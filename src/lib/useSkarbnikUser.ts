"use client";

/**
 * Unified user hook. Returns either:
 *   - a demo user (if ?demo=true is in the URL), or
 *   - a Privy-backed user synced with Supabase via /api/users/create.
 *
 * Shape is intentionally flat so pages can render a skeleton while loading.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { DEMO_USER, type DemoUser } from "./demoUser";

export type SkarbnikUser = {
  id: string;
  privy_id: string;
  wallet_address: string;
  username: string | null;
  google_email: string | null;
  level: number;
  total_xp: number;
  streak_days: number;
  last_active: string | null;
  language: "pl" | "en";
  created_at: string;
};

export type QuestCompletion = {
  quest_id: string;
  xp_earned: number;
  answers_correct: number;
  answers_total: number;
  completed_at: string;
};

type Status =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

type HookResult = {
  status: Status;
  user: SkarbnikUser | DemoUser | null;
  completedQuests: string[];
  questCompletions: QuestCompletion[];
  isDemo: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
  ready: boolean;
};

function isDemoParam(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "true";
}

/**
 * Safe-fail wrapper: Privy throws if not inside a PrivyProvider or if the
 * provider is the no-op passthrough (when NEXT_PUBLIC_PRIVY_APP_ID is unset).
 * We still call the hook unconditionally so hook order stays stable.
 */
function useSafePrivy() {
  try {
    return usePrivy();
  } catch {
    return null;
  }
}

export function useSkarbnikUser(): HookResult {
  const [demo] = useState<boolean>(() => isDemoParam());
  const privy = useSafePrivy();
  const [user, setUser] = useState<SkarbnikUser | null>(null);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>(
    [],
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const syncedPrivyId = useRef<string | null>(null);

  // Privy hooks → always called, conditional branch only in memoised return.
  const privyReady = privy?.ready ?? true;
  const privyAuthed = privy?.authenticated ?? false;
  const privyUser = privy?.user;

  const login = useCallback(() => {
    if (privy?.login) privy.login();
  }, [privy]);

  const logout = useCallback(async () => {
    if (privy?.logout) await privy.logout();
    setUser(null);
    setCompletedQuests([]);
    setQuestCompletions([]);
    syncedPrivyId.current = null;
  }, [privy]);

  const fetchUser = useCallback(async (userId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`GET /api/users/${userId} → ${res.status}`);
      const data = (await res.json()) as {
        user: SkarbnikUser;
        completedQuests: string[];
        questCompletions?: QuestCompletion[];
      };
      setUser(data.user);
      setCompletedQuests(data.completedQuests ?? []);
      setQuestCompletions(data.questCompletions ?? []);
      setStatus("authenticated");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "unknown");
    }
  }, []);

  const syncUser = useCallback(async (): Promise<void> => {
    if (!privyUser) return;
    const wallet = privyUser.wallet?.address;
    if (!wallet) return; // wait for embedded wallet provisioning
    if (syncedPrivyId.current === privyUser.id) return;

    try {
      setStatus("loading");
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privyId: privyUser.id,
          walletAddress: wallet,
          email:
            privyUser.email?.address ?? privyUser.google?.email ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(`POST /api/users/create → ${res.status}`);
      const data = (await res.json()) as { user: SkarbnikUser };
      syncedPrivyId.current = privyUser.id;
      await fetchUser(data.user.id);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "unknown");
    }
  }, [privyUser, fetchUser]);

  useEffect(() => {
    if (demo) return; // demo mode skips Privy entirely
    if (!privyReady) return;
    if (!privyAuthed) {
      setStatus("unauthenticated");
      setUser(null);
      setCompletedQuests([]);
      return;
    }
    void syncUser();
  }, [demo, privyReady, privyAuthed, syncUser]);

  const refetch = useCallback(async (): Promise<void> => {
    if (user?.id) await fetchUser(user.id);
  }, [fetchUser, user?.id]);

  return useMemo<HookResult>(() => {
    if (demo) {
      return {
        status: "authenticated",
        user: DEMO_USER,
        completedQuests: DEMO_USER.completedQuests,
        questCompletions: DEMO_USER.questCompletions,
        isDemo: true,
        error: null,
        refetch: async () => {},
        login: () => {},
        logout: async () => {},
        ready: true,
      };
    }
    return {
      status,
      user,
      completedQuests,
      questCompletions,
      isDemo: false,
      error,
      refetch,
      login,
      logout,
      ready: privyReady,
    };
  }, [
    demo,
    status,
    user,
    completedQuests,
    questCompletions,
    error,
    refetch,
    login,
    logout,
    privyReady,
  ]);
}
