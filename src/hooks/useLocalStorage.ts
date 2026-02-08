import { useState, useCallback } from "react";
import type { ShoppingSession, ChatMessage } from "@/types/chat";

const SESSIONS_KEY = "ai-shopping-sessions";

export function useLocalStorage() {
  const [sessions, setSessions] = useState<ShoppingSession[]>(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((s: ShoppingSession) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });

  const saveSession = useCallback(
    (session: ShoppingSession) => {
      setSessions((prev) => {
        const existing = prev.findIndex((s) => s.id === session.id);
        const updated =
          existing >= 0
            ? prev.map((s) => (s.id === session.id ? session : s))
            : [session, ...prev];
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated.slice(0, 20)));
        return updated;
      });
    },
    []
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { sessions, saveSession, deleteSession };
}
