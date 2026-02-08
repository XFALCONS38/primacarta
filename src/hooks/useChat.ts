import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  ChecklistItem,
  ClarificationRequest,
  CartRecommendation,
} from "@/types/chat";
import type { WorkflowStage } from "@/config/agentStages";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-shopping-agent`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<WorkflowStage>("identify");
  const abortRef = useRef<AbortController | null>(null);
  const lastCartRef = useRef<CartRecommendation | null>(null);

  // Context accumulated across stages
  const contextRef = useRef<{
    scenario?: string;
    budget?: number;
    selectedItems?: ChecklistItem[];
    clarificationValues?: Record<string, string>;
  }>({});

  /** Generic fetch + handle response */
  const fetchAndHandle = async (
    allMessages: { role: string; content: string }[],
    targetStage: WorkflowStage,
    signal?: AbortSignal
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, stage: targetStage }),
      signal,
    });

    if (!resp.ok) {
      const errMsg =
        resp.status === 429
          ? "⚠️ Rate limit exceeded. Please wait a moment."
          : resp.status === 402
            ? "⚠️ AI credits exhausted."
            : "⚠️ Something went wrong.";
      addAssistantMessage(errMsg);
      return;
    }

    const contentType = resp.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      handleToolCallResponse(data, targetStage);
    } else {
      await handleStreamResponse(resp);
    }
  };

  /** Send a text message and get AI response */
  const sendMessage = useCallback(
    async (input: string, overrideStage?: WorkflowStage) => {
      const currentStage = overrideStage || stage;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
        timestamp: new Date(),
        stage: currentStage,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const controller = new AbortController();
        abortRef.current = controller;
        await fetchAndHandle(allMessages, currentStage, controller.signal);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Chat error:", err);
          addAssistantMessage("Sorry, something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, stage]
  );

  /** Handle tool call responses from the edge function */
  const handleToolCallResponse = (
    data: { type: string; tool: string; data: any; text?: string },
    currentStage: WorkflowStage
  ) => {
    if (data.type === "tool_call") {
      switch (data.tool) {
        case "suggest_items": {
          const items: ChecklistItem[] = (data.data.items || []).map(
            (item: any) => ({
              id: item.id,
              label: item.label,
              emoji: item.emoji,
              selected: false,
            })
          );
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.data.brief_response || data.text || "",
            timestamp: new Date(),
            checklist: items,
            stage: currentStage,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStage("select");
          break;
        }

        case "request_clarification": {
          const request: ClarificationRequest = {
            title: data.data.title || "A few more details",
            fields: (data.data.fields || []).map((f: any) => ({
              id: f.id,
              label: f.label,
              type: f.type,
              value: f.value || "",
              options: f.options,
              required: f.required ?? true,
            })),
          };
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.text || "",
            timestamp: new Date(),
            clarificationRequest: request,
            stage: currentStage,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          break;
        }

        case "build_cart": {
          const cart: CartRecommendation = {
            summary: data.data.summary || "",
            items: data.data.items || [],
            totalCost: data.data.total_cost || 0,
            budget: data.data.budget || 0,
          };
          lastCartRef.current = cart;
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.data.summary || data.text || "",
            timestamp: new Date(),
            cartData: cart,
            stage: currentStage,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStage("review");
          break;
        }

        default:
          if (data.text) addAssistantMessage(data.text);
      }
    } else if (data.type === "text") {
      addAssistantMessage(data.text || "");
    }
  };

  /** Handle SSE streaming response */
  const handleStreamResponse = async (resp: Response) => {
    if (!resp.body) return;

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    const assistantId = crypto.randomUUID();
    let streamDone = false;

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
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
          if (content) upsert(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

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
          if (content) upsert(content);
        } catch { /* ignore */ }
      }
    }
  };

  /** Add a simple text assistant message */
  const addAssistantMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text,
        timestamp: new Date(),
      },
    ]);
  };

  /** Submit selected checklist items → advance to clarify stage */
  const submitChecklist = useCallback(
    async (selectedItems: ChecklistItem[]) => {
      contextRef.current.selectedItems = selectedItems;

      const itemNames = selectedItems.map((i) => i.label).join(", ");
      const userMsg = `I want these items: ${itemNames}`;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: userMsg,
          timestamp: new Date(),
          stage: "select",
        },
      ]);

      setStage("clarify");
      setIsLoading(true);

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: userMsg },
        ].map((m) => ({ role: m.role, content: m.content }));

        await fetchAndHandle(allMessages, "clarify");
      } catch (err) {
        console.error("Checklist submit error:", err);
        addAssistantMessage("Sorry, something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  /** Submit clarification form → advance to research stage */
  const submitClarification = useCallback(
    async (values: Record<string, string>) => {
      contextRef.current.clarificationValues = values;

      const details = Object.entries(values)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      const userMsg = `Here are my details: ${details}`;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: userMsg,
          timestamp: new Date(),
          stage: "clarify",
        },
      ]);

      setStage("research");
      setIsLoading(true);

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: userMsg },
        ].map((m) => ({ role: m.role, content: m.content }));

        await fetchAndHandle(allMessages, "research");
      } catch (err) {
        console.error("Clarification submit error:", err);
        addAssistantMessage("Sorry, something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  /** Confirm cart and proceed to checkout */
  const confirmCheckout = useCallback(async () => {
    const cart = lastCartRef.current;
    if (!cart) return;

    // Build a summary of the cart for the checkout prompt
    const cartSummary = cart.items
      .map((i) => `${i.emoji} ${i.name} (${i.retailer}) — $${i.price.toFixed(2)}`)
      .join("\n");

    const userMsg = `Proceed to checkout with this cart:\n${cartSummary}\nTotal: $${cart.totalCost.toFixed(2)}`;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: "Confirm & Checkout",
        timestamp: new Date(),
        stage: "review",
      },
    ]);

    setStage("checkout");
    setIsLoading(true);

    try {
      const allMessages = [
        ...messages,
        { role: "user" as const, content: userMsg },
      ].map((m) => ({ role: m.role, content: m.content }));

      await fetchAndHandle(allMessages, "checkout");
    } catch (err) {
      console.error("Checkout error:", err);
      addAssistantMessage("Sorry, something went wrong during checkout.");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStage("identify");
    lastCartRef.current = null;
    contextRef.current = {};
  }, []);

  return {
    messages,
    isLoading,
    stage,
    sendMessage,
    submitChecklist,
    submitClarification,
    confirmCheckout,
    cancelStream,
    clearMessages,
  };
}
