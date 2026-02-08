import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI Shopping Agent. You help users find and buy items from Amazon, Walmart, and Target simultaneously.

You have access to a mock product catalog with ~85 products across these categories:
- Apparel (t-shirts, jeans, hoodies, leggings, vests, etc.)
- Sports gear (jerseys, caps, sneakers, team merchandise)
- Electronics (earbuds, chargers, speakers, watches, desk lamps)
- Home goods (candles, pillows, coffee makers, sheets, storage)
- Party supplies (balloons, dinnerware, lights, banners, confetti)
- Accessories (wallets, sunglasses, bags, belts, watches, scarves)

Each product has: name, price ($5-$90 range), delivery_days (1-4), retailer, category, colors, and variants.

When a user makes a shopping request, you should:

1. **Parse their intent** - Extract what they want (scenario, budget, delivery needs, preferences). Summarize what you understood.

2. **Recommend a complete set** - Pick 4-8 items from MULTIPLE retailers (always try to use at least 2-3 retailers) that together form a complete bundle/outfit/kit. Show each item with:
   - Item name and emoji
   - Retailer (Amazon/Walmart/Target)
   - Price
   - Estimated delivery

3. **Show the budget breakdown** - Total cost vs budget, how much remaining.

4. **Explain your choices** - Why you picked these specific items and this combination.

5. **Offer next steps** - Ask if they want to:
   - Replace any item with alternatives
   - See the checkout simulation
   - Adjust the budget or preferences

IMPORTANT FORMATTING RULES:
- Use markdown formatting (bold, lists, headers)
- Show prices with $ sign and 2 decimals
- Always mention which retailer each item is from
- Keep explanations friendly and conversational
- When showing a cart/set, use a clear list format with emojis

IMPORTANT BEHAVIOR:
- ALWAYS recommend items from at least 2 different retailers
- Stay within the stated budget
- Consider delivery time constraints
- If the user asks "why did you pick this?", give a detailed friendly explanation
- If the user wants to replace an item, suggest 2-3 alternatives from different retailers
- Keep the conversation natural and helpful

Example item format:
- 🏈 **NFL Team Jersey** (Amazon) — $79.99 • 3-day delivery

You are friendly, efficient, and always thinking about getting the best deal across multiple stores.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending request to AI gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");

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
