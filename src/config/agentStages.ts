export type WorkflowStage =
  | "identify"
  | "select"
  | "clarify"
  | "research"
  | "review"
  | "checkout";

export interface StageConfig {
  id: WorkflowStage;
  label: string;
  step: number;
  description: string;
  systemPrompt: string;
}

export const STAGES: StageConfig[] = [
  {
    id: "identify",
    step: 1,
    label: "Identify",
    description: "Parse occasion and suggest item categories",
    systemPrompt: `You are a concise AI shopping assistant. The user will describe their shopping need in one message.

Instructions:
- Respond in 1-2 sentences maximum acknowledging their request.
- Suggest 8-12 item categories for their scenario (e.g., "Jersey", "Cap", "Cooler").
- Do NOT list actual products.
- Return your tool call using the suggest_items tool.
- Always keep it short, clear, and friendly.`,
  },
  {
    id: "select",
    step: 2,
    label: "Select Items",
    description: "Buyer picks which items to shop for",
    systemPrompt: "", // No AI call needed — handled by UI
  },
  {
    id: "clarify",
    step: 3,
    label: "Details",
    description: "Collect missing details for selected items",
    systemPrompt: `You are a concise AI shopping assistant. The user has selected item categories.

Instructions:
- Call the request_clarification tool to generate a form for the user to fill in.
- ALWAYS include fields for: budget, delivery_by date, location (ZIP code or City/State - required), preferred_retailers (multiselect with options: Any, Amazon, Walmart, Target, Shein, Temu, AliExpress, eBay, Best Buy, Etsy, Nordstrom, Nike, Adidas).
- Also include relevant preference fields: style, team/theme, colors, must_haves, nice_to_haves, and category-specific options.
- Pre-fill any known values from user input or previous sessions.
- Do not write conversational text outside the tool call.`,
  },
  {
    id: "research",
    step: 4,
    label: "Research",
    description: "Find best products with ranking and alternatives",
    systemPrompt: `You are a concise AI shopping assistant that searches the entire internet for products.

Instructions:
1. Build a combined cart from real search results across ANY retailers (Amazon, Shein, Temu, AliExpress, eBay, etc.).
2. Ensure the total cost does not exceed the user's budget.
3. Rank products considering: Value (25%), Delivery (20%), Reviews & Reliability (20%), Preference Match (15%), Retailer Trust (10%), Style Coherence (10%).
4. Generate top_ranked_set, alternative_sets (1-2), and detailed ranking_explanation.
5. Add "replace": true to each item.
6. Include url, rating, review_count, shipping_cost, original_price, discount_label where available.
7. Return structured JSON ONLY using the build_cart tool.
8. Do NOT hallucinate products; use search results only.`,
  },
  {
    id: "review",
    step: 5,
    label: "Review Cart",
    description: "Review and adjust the cart with replace support",
    systemPrompt: `You are a concise AI shopping assistant. The user is reviewing their cart.

Instructions:
- Do NOT rebuild the cart unless the user requests an item replacement, removal, or addition.
- If the user says the cart looks good or wants to proceed, just respond with a short text reply.
- If the user asks to replace an item, alternatives will be searched from real stores.
- Return updated combined_cart JSON using the build_cart tool.
- The retailer field can be ANY online store name.
- Keep responses short and friendly.`,
  },
  {
    id: "checkout",
    step: 6,
    label: "Checkout",
    description: "Structured checkout simulation per retailer",
    systemPrompt: `You are a concise AI shopping assistant generating a structured checkout simulation.

Instructions:
- Group items by retailer.
- Include step-by-step checkout instructions per retailer: Name → Address → Payment → Confirm.
- Include grand_total and retailer-level subtotals.
- Return structured JSON ONLY using the generate_checkout tool.
- Do NOT stream free text. Use the structured tool output.`,
  },
];

export const OPENAI_MODEL = "gpt-4o-mini";

// Tool definitions for OpenAI function calling
export const TOOL_DEFINITIONS = {
  suggest_items: {
    type: "function" as const,
    function: {
      name: "suggest_items",
      description:
        "Suggest a list of item categories the buyer might want for their occasion.",
      parameters: {
        type: "object",
        properties: {
          brief_response: {
            type: "string",
            description:
              "A 1-2 sentence acknowledgment of what the user wants.",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique short ID like 'jersey' or 'cooler'" },
                label: { type: "string", description: "Display name like 'Jersey' or 'Cooler Bag'" },
                emoji: { type: "string", description: "Single emoji representing this category" },
              },
              required: ["id", "label", "emoji"],
              additionalProperties: false,
            },
          },
        },
        required: ["brief_response", "items"],
        additionalProperties: false,
      },
    },
  },

  request_clarification: {
    type: "function" as const,
    function: {
      name: "request_clarification",
      description:
        "Request additional details from the buyer by presenting a structured form.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the form" },
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                type: { type: "string", enum: ["text", "number", "select", "multiselect"] },
                value: { type: "string", description: "Pre-filled value if known" },
                options: { type: "array", items: { type: "string" } },
                required: { type: "boolean" },
              },
              required: ["id", "label", "type", "required"],
              additionalProperties: false,
            },
          },
        },
        required: ["title", "fields"],
        additionalProperties: false,
      },
    },
  },

  build_cart: {
    type: "function" as const,
    function: {
      name: "build_cart",
      description:
        "Build a shopping cart with recommended products from the catalog, including ranking and alternatives.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "One sentence summary of the cart recommendation" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                retailer: { type: "string", description: "The retailer/store name" },
                price: { type: "number" },
                delivery_days: { type: "number" },
                emoji: { type: "string" },
                variant: { type: "string", description: "Selected size/color/variant" },
                replace: { type: "boolean", description: "Whether this item can be replaced" },
                url: { type: "string", description: "Direct product page URL" },
                rating: { type: "number", description: "Star rating (e.g. 4.5)" },
                review_count: { type: "number", description: "Number of reviews" },
                shipping_cost: { type: "number", description: "Shipping cost (0 = free)" },
                original_price: { type: "number", description: "Price before discount" },
                discount_label: { type: "string", description: "e.g. '20% off', 'Buy 2 Get 1'" },
              },
              required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
              additionalProperties: false,
            },
          },
          total_cost: { type: "number" },
          budget: { type: "number" },
          ranking_explanation: {
            type: "string",
            description: "Plain-language explanation of why this set was ranked #1",
          },
          alternative_sets: {
            type: "array",
            description: "1-2 alternative item sets with their own rankings",
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
                      retailer: { type: "string", enum: ["Amazon", "Walmart", "Target"] },
                      price: { type: "number" },
                      delivery_days: { type: "number" },
                      emoji: { type: "string" },
                      variant: { type: "string" },
                    },
                    required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
                  },
                },
                ranking_explanation: { type: "string" },
              },
              required: ["set_name", "items", "ranking_explanation"],
              additionalProperties: false,
            },
          },
        },
        required: ["summary", "items", "total_cost", "budget"],
        additionalProperties: false,
      },
    },
  },

  generate_checkout: {
    type: "function" as const,
    function: {
      name: "generate_checkout",
      description:
        "Generate a structured checkout simulation grouped by retailer with step-by-step actions.",
      parameters: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            description: "Checkout flow grouped by retailer",
            items: {
              type: "object",
              properties: {
                retailer: { type: "string", enum: ["Amazon", "Walmart", "Target"] },
                items: { type: "array", items: { type: "string" }, description: "Item names in this order" },
                subtotal: { type: "number" },
                estimated_delivery_days: { type: "number" },
                steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "Step-by-step checkout actions",
                },
              },
              required: ["retailer", "items", "subtotal", "steps"],
              additionalProperties: false,
            },
          },
          grand_total: { type: "number" },
        },
        required: ["steps", "grand_total"],
        additionalProperties: false,
      },
    },
  },
};
