import { useState, useCallback } from "react";
import type { ShoppingSession, ChatMessage } from "@/types/chat";

const SESSIONS_KEY = "ai-shopping-sessions";

function readSessions(): ShoppingSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(SESSIONS_KEY);
      return [];
    }
    return parsed.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: Array.isArray(s.messages)
        ? s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        : [],
    }));
  } catch {
    localStorage.removeItem(SESSIONS_KEY);
    return [];
  }
}

export function useLocalStorage() {
  const [sessions, setSessions] = useState<ShoppingSession[]>(readSessions);

  const saveSession = useCallback(
    (session: ShoppingSession) => {
      setSessions((prev) => {
        const existing = prev.findIndex((s) => s.id === session.id);
        const updated =
          existing >= 0
            ? prev.map((s) => (s.id === session.id ? session : s))
            : [session, ...prev];
        try {
          localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated.slice(0, 20)));
        } catch {
          // storage full – silently ignore
        }
        return updated;
      });
    },
    []
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return { sessions, saveSession, deleteSession };
}
