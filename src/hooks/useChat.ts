import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  ChecklistItem,
  ClarificationRequest,
  CartRecommendation,
  CartRecommendationItem,
  CheckoutStep,
  AlternativeSet,
  CheckoutInfo,
  ShoppingSpec,
  SearchCandidate,
} from "@/types/chat";
import type { WorkflowStage } from "@/config/agentStages";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-shopping-agent`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<WorkflowStage>("identify");
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastCartRef = useRef<CartRecommendation | null>(null);

  // Context accumulated across stages
  const contextRef = useRef<{
    scenario?: string;
    budget?: number;
    selectedItems?: ChecklistItem[];
    clarificationValues?: Record<string, string>;
    checkoutInfo?: CheckoutInfo;
  }>({});

  /** Generic fetch + handle response */
  const fetchAndHandle = async (
    allMessages: { role: string; content: string }[],
    targetStage: WorkflowStage,
    signal?: AbortSignal
  ) => {
    const token = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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

    const data = await resp.json();
    handleToolCallResponse(data, targetStage);
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
            items: (data.data.items || []).map((item: any) => ({
              name: item.name,
              category: item.category,
              retailer: item.retailer,
              price: item.price,
              delivery_days: item.delivery_days,
              emoji: item.emoji,
              variant: item.variant,
              replace: item.replace ?? true,
              url: item.url || undefined,
              rating: item.rating || undefined,
              review_count: item.review_count || undefined,
              shipping_cost: item.shipping_cost != null ? item.shipping_cost : undefined,
              original_price: item.original_price || undefined,
              discount_label: item.discount_label || undefined,
              reason: item.reason || undefined,
            })),
            totalCost: data.data.total_cost || 0,
            budget: data.data.budget || 0,
            rankingExplanation: data.data.ranking_explanation || undefined,
            alternativeSets: data.data.alternative_sets
              ? data.data.alternative_sets.map((alt: any) => ({
                  set_name: alt.set_name,
                  items: (alt.items || []).map((item: any) => ({
                    name: item.name,
                    category: item.category,
                    retailer: item.retailer,
                    price: item.price,
                    delivery_days: item.delivery_days,
                    emoji: item.emoji,
                    variant: item.variant,
                    url: item.url || undefined,
                    rating: item.rating || undefined,
                    review_count: item.review_count || undefined,
                    shipping_cost: item.shipping_cost != null ? item.shipping_cost : undefined,
                    original_price: item.original_price || undefined,
                    discount_label: item.discount_label || undefined,
                    reason: item.reason || undefined,
                  })),
                  ranking_explanation: alt.ranking_explanation || "",
                }))
              : undefined,
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

        case "generate_checkout": {
          const checkoutSteps: CheckoutStep[] = (data.data.steps || []).map(
            (step: any) => ({
              retailer: step.retailer,
              items: step.items || [],
              subtotal: step.subtotal || 0,
              estimated_delivery_days: step.estimated_delivery_days,
              steps: step.steps || [],
            })
          );
          const grandTotal = data.data.grand_total || 0;
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            timestamp: new Date(),
            checkoutSteps,
            checkoutGrandTotal: grandTotal,
            checkoutInfo: contextRef.current.checkoutInfo || undefined,
            stage: currentStage,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setPendingCheckout(false);
          break;
        }

        default:
          if (data.text) addAssistantMessage(data.text);
      }
    } else if (data.type === "text") {
      addAssistantMessage(data.text || "");
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

  /** Submit clarification form → build shopping spec → advance to research stage */
  const submitClarification = useCallback(
    async (values: Record<string, string>) => {
      contextRef.current.clarificationValues = values;

      const details = Object.entries(values)
        .filter(([, v]) => typeof v === "string" ? v.trim() !== "" : !!v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      const userMsg = `Here are my details: ${details}`;

      // Build shopping spec from context
      const selectedItems = contextRef.current.selectedItems || [];
      const spec: ShoppingSpec = {
        scenario: messages[0]?.content?.slice(0, 80) || "Shopping request",
        budget: parseFloat(values.budget) || 0,
        delivery_by: values.delivery_by || undefined,
        location: values.location || undefined,
        items: selectedItems.map((i) => i.label),
        preferences: Object.fromEntries(
          Object.entries(values).filter(
            ([k]) => !["budget", "delivery_by", "location"].includes(k)
          ).filter(([, v]) => typeof v === "string" ? v.trim() !== "" : !!v)
        ),
      };

      // Add user message
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

      // Add shopping spec as assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Here's your structured shopping spec:",
          timestamp: new Date(),
          shoppingSpec: spec,
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

  /** Confirm cart → show checkout form */
  const confirmCheckout = useCallback(() => {
    const cart = lastCartRef.current;
    if (!cart) return;

    setPendingCheckout(true);

    // Add a message that triggers the checkout form
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: "Confirm & Checkout",
        timestamp: new Date(),
        stage: "review",
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Enter your details below — you'll only need to do this once. Prima handles checkout at every retailer for you.",
        timestamp: new Date(),
        checkoutInfo: null as any, // Signal to render the form
        stage: "checkout",
      },
    ]);
  }, []);

  /** Submit checkout form → proceed to checkout simulation */
  const submitCheckoutForm = useCallback(
    async (info: CheckoutInfo) => {
      contextRef.current.checkoutInfo = info;
      const cart = lastCartRef.current;
      if (!cart) return;

      // Build cart summary for checkout prompt
      const cartSummary = cart.items
        .map((i) => `${i.emoji} ${i.name} (${i.retailer}) — $${i.price.toFixed(2)}`)
        .join("\n");

      const userMsg = `Proceed to checkout with this cart:\n${cartSummary}\nTotal: $${cart.totalCost.toFixed(2)}\nShipping to: ${info.fullName}, ${info.address}, ${info.city}, ${info.state} ${info.zip}\nPayment: card ending ${info.cardLast4}`;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: `Placing orders for ${info.fullName}...`,
          timestamp: new Date(),
          stage: "checkout",
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
    },
    [messages]
  );

  /** Optimize budget: find cheaper alternatives */
  const optimizeBudget = useCallback(async () => {
    const cart = lastCartRef.current;
    if (!cart) return;

    const userMsg = `Find cheaper alternatives for all items while keeping the same categories and quality level. Prioritize lowest total cost. Current total: $${cart.totalCost.toFixed(2)}, budget: $${cart.budget.toFixed(2)}`;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: "Optimize Budget — find the same setup, cheaper",
        timestamp: new Date(),
        stage: "review",
      },
    ]);

    setIsLoading(true);

    try {
      const allMessages = [
        ...messages,
        { role: "user" as const, content: userMsg },
      ].map((m) => ({ role: m.role, content: m.content }));

      await fetchAndHandle(allMessages, "research");
    } catch (err) {
      console.error("Budget optimize error:", err);
      addAssistantMessage("Sorry, something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  /** Optimize delivery: prioritize fastest shipping */
  const optimizeDelivery = useCallback(async () => {
    const cart = lastCartRef.current;
    if (!cart) return;

    const userMsg = `Re-rank all items prioritizing fastest delivery. Everything should arrive within 3 days if possible. Prioritize retailers with free/fast shipping. Current items: ${cart.items.map((i) => i.name).join(", ")}`;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: "Optimize Delivery — everything ASAP",
        timestamp: new Date(),
        stage: "review",
      },
    ]);

    setIsLoading(true);

    try {
      const allMessages = [
        ...messages,
        { role: "user" as const, content: userMsg },
      ].map((m) => ({ role: m.role, content: m.content }));

      await fetchAndHandle(allMessages, "research");
    } catch (err) {
      console.error("Delivery optimize error:", err);
      addAssistantMessage("Sorry, something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  /** Select an entire alternative set to replace the main cart */
  const selectAlternativeSet = useCallback(
    async (alt: AlternativeSet) => {
      const itemSummary = alt.items.map((i) => `${i.emoji} ${i.name}`).join(", ");
      const userMsg = `I want to use the "${alt.set_name}" alternative set instead: ${itemSummary}`;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: `Use "${alt.set_name}" set instead`,
          timestamp: new Date(),
          stage: "review",
        },
      ]);

      setIsLoading(true);

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: userMsg },
        ].map((m) => ({ role: m.role, content: m.content }));

        await fetchAndHandle(allMessages, "review");
      } catch (err) {
        console.error("Alternative set selection error:", err);
        addAssistantMessage("Sorry, something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  /** Swap a single item from an alternative into the main cart */
  const swapAlternativeItem = useCallback(
    async (originalItem: CartRecommendationItem, newItem: CartRecommendationItem) => {
      const userMsg = `Replace "${originalItem.name}" (${originalItem.retailer}, $${originalItem.price.toFixed(2)}) with "${newItem.name}" (${newItem.retailer}, $${newItem.price.toFixed(2)}) in my cart.`;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: `Swap "${originalItem.name}" → "${newItem.name}"`,
          timestamp: new Date(),
          stage: "review",
        },
      ]);

      setIsLoading(true);

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: userMsg },
        ].map((m) => ({ role: m.role, content: m.content }));

        await fetchAndHandle(allMessages, "review");
      } catch (err) {
        console.error("Item swap error:", err);
        addAssistantMessage("Sorry, something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStage("identify");
    lastCartRef.current = null;
    contextRef.current = {};
    setPendingCheckout(false);
  }, []);

  return {
    messages,
    isLoading,
    stage,
    pendingCheckout,
    sendMessage,
    submitChecklist,
    submitClarification,
    confirmCheckout,
    submitCheckoutForm,
    optimizeBudget,
    optimizeDelivery,
    selectAlternativeSet,
    swapAlternativeItem,
    cancelStream,
    clearMessages,
  };
}
