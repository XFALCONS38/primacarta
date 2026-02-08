import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── FIRECRAWL PRODUCT SEARCH ───

interface SearchResult {
  title: string;
  url: string;
  description: string;
  markdown: string;
}

interface ProductSearchResult {
  category: string;
  results: SearchResult[];
}

/**
 * Search for products using Firecrawl web search API.
 * Supports optional site filtering and location-based queries.
 */
async function searchProducts(
  query: string,
  location: string,
  preferredRetailers: string[],
  firecrawlKey: string,
  buyerContext?: string
): Promise<SearchResult[]> {
  // Build search query with location and buyer context
  let searchQuery = `${query} buy online price reviews shipping`;
  if (buyerContext) {
    searchQuery += ` ${buyerContext}`;
  }
  if (location) {
    searchQuery += ` delivery to ${location}`;
  }

  // Add site: filters if specific retailers requested
  if (preferredRetailers.length > 0 && !preferredRetailers.includes("Any")) {
    const siteMap: Record<string, string> = {
      "Amazon": "amazon.com",
      "Walmart": "walmart.com",
      "Target": "target.com",
      "Shein": "shein.com",
      "Temu": "temu.com",
      "AliExpress": "aliexpress.com",
      "eBay": "ebay.com",
      "Best Buy": "bestbuy.com",
      "Etsy": "etsy.com",
      "Nordstrom": "nordstrom.com",
      "Costco": "costco.com",
      "Wayfair": "wayfair.com",
      "Nike": "nike.com",
      "Adidas": "adidas.com",
      "ASOS": "asos.com",
      "Zara": "zara.com",
      "H&M": "hm.com",
      "Macy's": "macys.com",
      "Home Depot": "homedepot.com",
      "Lowe's": "lowes.com",
    };
    const sites = preferredRetailers
      .map((r) => siteMap[r] || `${r.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)
      .map((s) => `site:${s}`)
      .join(" OR ");
    searchQuery = `${query} buy online price reviews (${sites})`;
  }

  console.log(`Firecrawl search: "${searchQuery}"`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Firecrawl error for "${query}":`, response.status, errText);
      return [];
    }

    const data = await response.json();
    const results: SearchResult[] = (data.data || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      description: r.description || "",
      // Truncate markdown to keep token count manageable
      markdown: (r.markdown || r.description || "").slice(0, 600),
    }));

    console.log(`Found ${results.length} results for "${query}"`);
    return results;
  } catch (err) {
    console.error(`Firecrawl search failed for "${query}":`, err);
    return [];
  }
}

/**
 * Search for products across all selected item categories in parallel.
 * Returns a formatted context block for the AI prompt.
 */
async function searchAllCategories(
  categories: string[],
  location: string,
  preferredRetailers: string[],
  firecrawlKey: string,
  buyerContext?: string
): Promise<string> {
  console.log(`Searching ${categories.length} categories...`);

  const searchPromises = categories.map(async (category) => {
    const results = await searchProducts(category, location, preferredRetailers, firecrawlKey, buyerContext);
    return { category, results };
  });

  const allResults = await Promise.allSettled(searchPromises);
  const successfulResults: ProductSearchResult[] = [];

  for (const result of allResults) {
    if (result.status === "fulfilled" && result.value.results.length > 0) {
      successfulResults.push(result.value);
    }
  }

  if (successfulResults.length === 0) {
    return "No products found. Please suggest the user try different search terms or broader retailer options.";
  }

  // Format results into a structured context block
  let context = "";
  for (const { category, results } of successfulResults) {
    context += `\n=== ${category.toUpperCase()} ===\n`;
    for (const r of results) {
      context += `\n--- Product ---\n`;
      context += `Title: ${r.title}\n`;
      context += `URL: ${r.url}\n`;
      context += `Description: ${r.description}\n`;
      context += `Details:\n${r.markdown}\n`;
    }
  }

  console.log(`Total search context: ${context.length} chars`);
  return context;
}

/**
 * Extract structured info from conversation messages:
 * categories, location, budget, preferences, preferred retailers
 */
function extractContextFromMessages(messages: { role: string; content: string }[]): {
  categories: string[];
  location: string;
  budget: number;
  preferences: string;
  preferredRetailers: string[];
} {
  const fullText = messages.map((m) => m.content).join("\n");

  // Extract item categories from "I want these items: X, Y, Z"
  const itemsMatch = fullText.match(/I want these items:\s*(.+)/i);
  const categories = itemsMatch
    ? itemsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Extract location (ZIP code or city/state)
  const locationMatch = fullText.match(
    /(?:location|zip|zip code|city|deliver to|shipping to)[:\s]*([A-Za-z0-9\s,]+?)(?:\.|,\s*(?:budget|preferred|style|colors|delivery)|$)/im
  );
  const location = locationMatch ? locationMatch[1].trim() : "";

  // Extract budget
  const budgetMatch = fullText.match(/budget[:\s]*\$?(\d+(?:\.\d{1,2})?)/i);
  const budget = budgetMatch ? parseFloat(budgetMatch[1]) : 0;

  // Extract preferred retailers
  const retailerMatch = fullText.match(
    /(?:preferred retailers|retailers|preferred stores|stores)[:\s]*(.+?)(?:\.|,\s*(?:budget|location|style|colors|delivery)|$)/im
  );
  const preferredRetailers = retailerMatch
    ? retailerMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Everything else as preferences context
  const preferences = fullText;

  return { categories, location, budget, preferences, preferredRetailers };
}

// ─── STAGE PROMPTS ───

const STAGE_PROMPTS: Record<string, string> = {
  identify: `You are a concise AI shopping assistant. The user will describe their shopping need in one message.

Instructions:
- Respond in 1-2 sentences maximum acknowledging their request.
- Suggest 8-12 item categories for their scenario (e.g., "Jersey", "Cap", "Cooler").
- Do NOT list actual products.
- Return your tool call using the suggest_items tool with JSON: { "brief_response": "...", "items": [{ "id": "...", "label": "...", "emoji": "..." }...] }
- Always keep it short, clear, and friendly.`,

  clarify: `You are a concise AI shopping assistant. The user has selected item categories.

Instructions:
- Call the request_clarification tool to generate a form for the user to fill in.
- ALWAYS include these core fields:
  1. "budget" (type: number, required: true, label: "Budget ($)")
  2. "delivery_by" (type: text, required: false, label: "Need it by (date)")
  3. "location" (type: text, required: true, label: "Delivery location (ZIP code or City, State)")
  4. "preferred_retailers" (type: multiselect, required: false, label: "Preferred retailers", options: ["Any (search everywhere)", "Amazon", "Walmart", "Target", "Shein", "Temu", "AliExpress", "eBay", "Best Buy", "Etsy", "Nordstrom", "Nike", "Adidas"])
- ALWAYS include these buyer characteristic fields (adapt labels/options to the shopping context):
  5. "age_group" (type: select, required: false, label: "Age group", options: ["Child (2-12)", "Teen (13-17)", "Adult (18-64)", "Senior (65+)"])
  6. "gender" (type: select, required: false, label: "Gender", options: ["Male", "Female", "Unisex", "Prefer not to say"])
  7. "size" (type: text, required: false, label: "Size (e.g., S/M/L/XL, shoe size, or measurements)")
  8. "colors" (type: text, required: false, label: "Preferred colors")
  9. "style" (type: text, required: false, label: "Style preference (e.g., casual, sporty, formal)")
- Also include relevant category-specific fields: team/theme, brand preferences, material, must_haves, nice_to_haves.
- Pre-fill any known values from user input (e.g., if they mentioned a budget or team).
- Return only the tool call JSON.
- Do not write conversational text outside the tool call.`,

  // research prompt is dynamically built with search results — see buildResearchPrompt()
  research: "",

  review: `You are a concise AI shopping assistant. The user is reviewing their cart.

Instructions:
- Do NOT rebuild the cart unless the user requests an item replacement, removal, or addition.
- If the user says the cart looks good or wants to proceed, just respond with a short text reply. Do NOT call build_cart.
- If the user asks to replace an item, you will receive fresh search results for alternatives. Pick from those results only.
- Return updated cart JSON using the build_cart tool with the same structure as before.
- Keep responses short and friendly.
- The retailer field can be ANY online store name (not limited to Amazon/Walmart/Target).`,

  checkout: `You are a concise AI shopping assistant generating a structured checkout simulation.

Instructions:
- Group items by retailer (any retailer name is valid).
- Include step-by-step checkout instructions per retailer: Name → Address → Payment → Confirm.
- Include grand_total and retailer-level subtotals.
- Return structured JSON ONLY using the generate_checkout tool.
- Do NOT stream free text. Use the structured tool output.`,
};

/**
 * Build a dynamic research prompt with injected Firecrawl search results.
 */
function buildResearchPrompt(searchContext: string, location: string): string {
  return `You are a concise AI shopping assistant. Below are REAL product search results from across the internet. Use ONLY these results to build the cart — do NOT make up products or URLs.

SEARCH RESULTS:
${searchContext}

RANKING CRITERIA (weighted scoring — use these to pick the BEST overall set):
- 25% Value: price vs budget, active discounts/sales/coupons, price-to-quality ratio
- 20% Delivery: estimated shipping time to ${location || "user's location"}, shipping cost (free shipping = bonus), delivery reliability
- 20% Reviews & Reliability: star rating, review count, seller reputation, return policy, brand trust
- 15% Preference Match: how well items match user's stated colors, style, team/theme, features, must-haves
- 10% Retailer Trust: established retailer vs unknown/sketchy seller, buyer protection policies
- 10% Style Coherence: how well items look together as a set

Instructions:
1. Build a combined cart from the search results above, selecting the best items across ANY retailers.
2. Ensure the total cost does not exceed the user's budget.
3. For EACH product include: name, category, retailer (actual site name like "Amazon", "Shein", "Temu", etc.), price, delivery_days (estimated), emoji, url (direct product link), and optionally: rating, review_count, shipping_cost, original_price, discount_label, variant.
4. Add "replace": true to each item.
5. Generate 1-2 alternative_sets with different trade-offs (e.g., budget-friendly vs premium, faster delivery vs better reviews).
6. Provide a detailed ranking_explanation covering WHY this set won — mention specific factors.
7. Return structured JSON ONLY using the build_cart tool.
8. Do NOT hallucinate products — use the search results above ONLY.`;
}

/**
 * Build a review prompt with fresh search results for item replacement.
 */
function buildReviewPromptWithSearch(searchContext: string): string {
  return `You are a concise AI shopping assistant. The user wants to replace or modify items in their cart.

Below are FRESH search results for alternative products:
${searchContext}

Instructions:
- Use the search results above to suggest replacements. Do NOT make up products.
- Return updated cart JSON using the build_cart tool.
- Keep all unreplaced items exactly as they were.
- The retailer field can be ANY online store name.
- Include url, rating, review_count, shipping_cost, original_price, discount_label where available.`;
}

// ─── TOOL DEFINITIONS ───

const TOOLS: Record<string, any> = {
  suggest_items: {
    type: "function",
    function: {
      name: "suggest_items",
      description: "Suggest item categories the buyer might want for their occasion.",
      parameters: {
        type: "object",
        properties: {
          brief_response: { type: "string", description: "A 1-2 sentence acknowledgment." },
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
      description: "Request additional details from the buyer via a structured form.",
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
      description: "Build a shopping cart with ranked products from real search results, including ranking explanation and alternatives.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "One sentence summary" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                retailer: { type: "string", description: "The retailer/store name (e.g., Amazon, Shein, Temu, eBay, etc.)" },
                price: { type: "number" },
                delivery_days: { type: "number" },
                emoji: { type: "string" },
                variant: { type: "string" },
                replace: { type: "boolean", description: "Whether this item can be replaced" },
                url: { type: "string", description: "Direct product page URL" },
                rating: { type: "number", description: "Star rating (e.g. 4.5)" },
                review_count: { type: "number", description: "Number of reviews" },
                shipping_cost: { type: "number", description: "Shipping cost (0 = free)" },
                original_price: { type: "number", description: "Price before discount" },
                discount_label: { type: "string", description: "e.g. '20% off', 'Buy 2 Get 1'" },
              },
              required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
            },
          },
          total_cost: { type: "number" },
          budget: { type: "number" },
          ranking_explanation: { type: "string", description: "Detailed explanation of why this set was ranked #1" },
          alternative_sets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                set_name: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string" },
                      retailer: { type: "string" },
                      price: { type: "number" },
                      delivery_days: { type: "number" },
                      emoji: { type: "string" },
                      variant: { type: "string" },
                      url: { type: "string" },
                      rating: { type: "number" },
                      review_count: { type: "number" },
                      shipping_cost: { type: "number" },
                      original_price: { type: "number" },
                      discount_label: { type: "string" },
                    },
                    required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
                  },
                },
                ranking_explanation: { type: "string" },
              },
              required: ["set_name", "items", "ranking_explanation"],
            },
          },
        },
        required: ["summary", "items", "total_cost", "budget"],
      },
    },
  },
  generate_checkout: {
    type: "function",
    function: {
      name: "generate_checkout",
      description: "Generate a structured checkout simulation grouped by retailer with step-by-step actions.",
      parameters: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            description: "Checkout flow grouped by retailer",
            items: {
              type: "object",
              properties: {
                retailer: { type: "string", description: "The retailer/store name" },
                items: { type: "array", items: { type: "string" }, description: "Item names" },
                subtotal: { type: "number" },
                estimated_delivery_days: { type: "number" },
                steps: { type: "array", items: { type: "string" }, description: "Step-by-step checkout actions" },
              },
              required: ["retailer", "items", "subtotal", "steps"],
            },
          },
          grand_total: { type: "number" },
        },
        required: ["steps", "grand_total"],
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
  checkout: ["generate_checkout"],
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
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── RESEARCH STAGE: Firecrawl search → AI ranking ───
    let systemPrompt = STAGE_PROMPTS[stage] || STAGE_PROMPTS.identify;

    if (stage === "research") {
      if (!FIRECRAWL_API_KEY) {
        console.error("FIRECRAWL_API_KEY is not configured");
        return new Response(
          JSON.stringify({ error: "Search API not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const ctx = extractContextFromMessages(messages);
      console.log("Extracted context:", JSON.stringify({
        categories: ctx.categories,
        location: ctx.location,
        budget: ctx.budget,
        preferredRetailers: ctx.preferredRetailers,
      }));

      if (ctx.categories.length > 0) {
        const searchContext = await searchAllCategories(
          ctx.categories,
          ctx.location,
          ctx.preferredRetailers,
          FIRECRAWL_API_KEY
        );
        systemPrompt = buildResearchPrompt(searchContext, ctx.location);
      } else {
        console.warn("No categories extracted, falling back to basic research prompt");
        systemPrompt = buildResearchPrompt("No specific product search results available. Ask the user to clarify what items they want.", "");
      }
    }

    // ─── REVIEW STAGE: Check if replacement needed → search ───
    if (stage === "review" && FIRECRAWL_API_KEY) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      const isReplacement = lastUserMsg?.content && /replace|swap|switch|alternative|instead|different/i.test(lastUserMsg.content);

      if (isReplacement) {
        // Extract what category to search for
        const replaceMatch = lastUserMsg.content.match(/replace\s+"?([^"]+)"?\s+with/i) ||
          lastUserMsg.content.match(/replace\s+"?([^"]+)"?/i);
        const itemToReplace = replaceMatch ? replaceMatch[1].trim() : "";
        const searchQuery = itemToReplace || "alternative product";

        const ctx = extractContextFromMessages(messages);
        console.log(`Review replacement search for: "${searchQuery}"`);

        const searchResults = await searchProducts(
          searchQuery,
          ctx.location,
          ctx.preferredRetailers,
          FIRECRAWL_API_KEY
        );

        if (searchResults.length > 0) {
          let searchContext = `\n=== REPLACEMENT OPTIONS for "${itemToReplace}" ===\n`;
          for (const r of searchResults) {
            searchContext += `\n--- Product ---\nTitle: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}\nDetails:\n${r.markdown}\n`;
          }
          systemPrompt = buildReviewPromptWithSearch(searchContext);
        }
      }
    }

    const stageToolNames = STAGE_TOOLS[stage] || [];
    const tools = stageToolNames.map((name) => TOOLS[name]).filter(Boolean);

    console.log(`Stage: ${stage}, Messages: ${messages.length}, Tools: ${stageToolNames.join(",")}`);

    const requestBody: any = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = "auto";
    }

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

      console.log(`Tool call: ${toolName}`, JSON.stringify(toolArgs).slice(0, 300));

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
  } catch (e) {
    console.error("ai-shopping-agent error:", e instanceof Error ? e.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
