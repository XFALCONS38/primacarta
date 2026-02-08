import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/types/chat";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-shopping-agent`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const assistantId = crypto.randomUUID();

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantSoFar } : m
          );
        }
        return [
          ...prev,
          {
            id: assistantId,
            role: "assistant" as const,
            content: assistantSoFar,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          upsertAssistant("⚠️ Rate limit exceeded. Please wait a moment and try again.");
          setIsLoading(false);
          return;
        }
        if (resp.status === 402) {
          upsertAssistant("⚠️ AI credits exhausted. Please add credits to continue.");
          setIsLoading(false);
          return;
        }
        throw new Error(`Request failed: ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore partial leftovers */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Chat error:", err);
        upsertAssistant("Sorry, something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, cancelStream, clearMessages };
}
