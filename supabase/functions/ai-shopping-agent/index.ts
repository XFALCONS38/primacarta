import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stage-specific system prompts
const STAGE_PROMPTS: Record<string, string> = {
  identify: `You are a concise AI shopping assistant. The user will describe a shopping need.

Your ONLY job is to:
1. Acknowledge what they need in ONE short sentence (e.g., "Got it — Patriots tailgate, $200 budget.")
2. Call the suggest_items tool with 8-12 relevant item categories for their occasion.

RULES:
- Never write more than 1-2 sentences of text.
- Do NOT do any product research yet.
- The items you suggest are CATEGORIES (e.g., "Jersey", "Cap", "Cooler"), not specific products.
- Include an emoji for each category.
- Think broadly about what someone would need for this occasion.`,

  clarify: `You are a concise AI shopping assistant. The user has selected specific item categories to buy.

Your ONLY job is to call the request_clarification tool with form fields for any details you need to find the right products.

RULES:
- Pre-fill any values you already know from the conversation (scenario, budget, etc.).
- Only add fields that are genuinely needed for purchasing (sizes, color preferences, style preferences, delivery deadline).
- Use appropriate field types: "select" for finite choices, "text" for open-ended, "number" for numeric values.
- Keep field count reasonable (5-10 fields max).
- Do NOT write any conversational text. Just call the tool.
- For apparel: always ask sizes.
- For electronics: ask compatibility/use-case.
- For party supplies: ask guest count, venue type.
- Always include: budget (pre-filled), delivery deadline.`,

  research: `You are a concise AI shopping assistant. You have the user's selected items and their specifications.

You have access to a mock product catalog with ~85 products across categories including apparel, sports gear, electronics, home goods, party supplies, and accessories. Products range from $5-$90 and are from Amazon, Walmart, and Target.

Search the catalog and find the best matching products.

RULES:
- Call the build_cart tool with your recommended items.
- Pick items from MULTIPLE retailers (at least 2-3).
- Stay within the stated budget.
- Match sizes, colors, and preferences the user specified.
- Prioritize: budget fit > preference match > delivery speed.
- Do NOT write long explanations. One sentence summary max.
- Include 1-2 items per selected category.`,

  review: `You are a concise AI shopping assistant. The user is reviewing their cart.

IMPORTANT: Do NOT rebuild the cart unless the user explicitly asks to change, replace, or remove specific items.
If the user says the cart looks good, wants to proceed, or asks general questions — just respond with a short text reply. Do NOT call build_cart.

Only call build_cart when the user specifically asks to:
- Replace a specific item with an alternative
- Remove an item
- Add a new item
- Change quantities

RULES:
- Keep responses to 1-2 sentences max.
- When suggesting alternatives, show name, price, retailer, and delivery time.
- Always stay within budget.
- Only call build_cart when actual cart modifications are requested.`,

  checkout: `You are a concise AI shopping assistant. The user has confirmed their cart and is checking out.

Generate a brief, visual checkout confirmation. Group items by retailer.

Format your response like this:

## 🛒 Order Confirmed!

### Amazon (X items)
- Item 1 — $XX.XX
- Item 2 — $XX.XX
**Subtotal:** $XX.XX • Est. delivery: X days

### Walmart (X items)
- Item 1 — $XX.XX
**Subtotal:** $XX.XX • Est. delivery: X days

---
**Total: $XX.XX** across X retailers
📧 A confirmation email has been sent!

RULES:
- Keep it concise and visual.
- Group by retailer.
- Show subtotals per retailer and grand total.
- End with the confirmation email note.
- Do NOT use any tools. Just respond with formatted text.`,
};

// Tool definitions
const TOOLS = {
  suggest_items: {
    type: "function",
    function: {
      name: "suggest_items",
      description:
        "Suggest item categories the buyer might want for their occasion.",
      parameters: {
        type: "object",
        properties: {
          brief_response: {
            type: "string",
            description: "A 1-2 sentence acknowledgment of what the user wants.",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                emoji: { type: "string" },
              },
              required: ["id", "label", "emoji"],
            },
          },
        },
        required: ["brief_response", "items"],
      },
    },
  },
  request_clarification: {
    type: "function",
    function: {
      name: "request_clarification",
      description:
        "Request additional details from the buyer by presenting a structured form.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                type: { type: "string", enum: ["text", "number", "select", "multiselect"] },
                value: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                required: { type: "boolean" },
              },
              required: ["id", "label", "type", "required"],
            },
          },
        },
        required: ["title", "fields"],
      },
    },
  },
  build_cart: {
    type: "function",
    function: {
      name: "build_cart",
      description: "Build a shopping cart with recommended products.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                retailer: { type: "string", enum: ["Amazon", "Walmart", "Target"] },
                price: { type: "number" },
                delivery_days: { type: "number" },
                emoji: { type: "string" },
                variant: { type: "string" },
              },
              required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
            },
          },
          total_cost: { type: "number" },
          budget: { type: "number" },
        },
        required: ["summary", "items", "total_cost", "budget"],
      },
    },
  },
};

// Map stage to which tools it can use
const STAGE_TOOLS: Record<string, string[]> = {
  identify: ["suggest_items"],
  clarify: ["request_clarification"],
  research: ["build_cart"],
  review: ["build_cart"],
  checkout: [],
};

const OPENAI_MODEL = "gpt-4o-mini";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, stage = "identify" } = body;

    // --- Input Validation ---
    const VALID_STAGES = ["identify", "clarify", "research", "review", "checkout"];
    if (!VALID_STAGES.includes(stage)) {
      return new Response(
        JSON.stringify({ error: "Invalid stage parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length > 100) {
      return new Response(
        JSON.stringify({ error: "Too many messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const VALID_ROLES = ["user", "assistant", "system"];
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!msg.role || !VALID_ROLES.includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: "Invalid message role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof msg.content !== "string" || msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Invalid or overly long message content" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // --- End Input Validation ---

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = STAGE_PROMPTS[stage] || STAGE_PROMPTS.identify;
    const stageToolNames = STAGE_TOOLS[stage] || [];
    const tools = stageToolNames.map((name) => (TOOLS as any)[name]).filter(Boolean);

    console.log(`Stage: ${stage}, Messages: ${messages.length}, Tools: ${stageToolNames.join(",")}`);

    const requestBody: any = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    // If stage has tools, use non-streaming for reliable tool-call parsing
    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "AI service error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      console.log("OpenAI response finish_reason:", choice?.finish_reason);

      // If the model made a tool call, extract and return structured data
      if (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls) {
        const toolCall = choice.message.tool_calls[0];
        const toolName = toolCall.function.name;
        let toolArgs: any;

        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          console.error("Failed to parse tool arguments:", toolCall.function.arguments);
          return new Response(
            JSON.stringify({ error: "Failed to parse AI response" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Tool call: ${toolName}`, JSON.stringify(toolArgs).slice(0, 200));

        return new Response(
          JSON.stringify({
            type: "tool_call",
            tool: toolName,
            data: toolArgs,
            text: choice.message.content || "",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // No tool call — return text content
      return new Response(
        JSON.stringify({
          type: "text",
          text: choice?.message?.content || "I'm not sure how to help with that.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For stages without tools (checkout, general chat), use streaming
    requestBody.stream = true;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from OpenAI");

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("ai-shopping-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
