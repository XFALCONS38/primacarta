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
    systemPrompt: `You are a concise AI shopping assistant. The user will describe a shopping need.

Your ONLY job is to:
1. Acknowledge what they need in ONE short sentence (e.g., "Got it — Patriots tailgate, $200 budget.")
2. Call the suggest_items tool with 8-12 relevant item categories for their occasion.

RULES:
- Never write more than 1-2 sentences of text.
- Do NOT do any product research yet.
- The items you suggest are CATEGORIES (e.g., "Jersey", "Cap", "Cooler"), not specific products.
- Include an emoji for each category.
- Think broadly about what someone would need for this occasion.`,
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
    systemPrompt: `You are a concise AI shopping assistant. The user has selected specific item categories to buy.

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
  },
  {
    id: "research",
    step: 4,
    label: "Research",
    description: "Find best products for selected items",
    systemPrompt: `You are a concise AI shopping assistant. You have the user's selected items and their specifications.

Search the mock product catalog and find the best matching products across Amazon, Walmart, and Target.

RULES:
- Call the build_cart tool with your recommended items.
- Pick items from MULTIPLE retailers (at least 2-3).
- Stay within the stated budget.
- Match sizes, colors, and preferences the user specified.
- Prioritize: budget fit > preference match > delivery speed.
- Do NOT write long explanations. One sentence summary max.
- Include 1-2 items per selected category.`,
  },
  {
    id: "review",
    step: 5,
    label: "Review Cart",
    description: "Review and adjust the cart",
    systemPrompt: `You are a concise AI shopping assistant. The user is reviewing their cart.

If they want to replace an item, suggest 2-3 alternatives from different retailers.
If they want to adjust quantities or remove items, update the cart accordingly.

RULES:
- Keep responses to 1-2 sentences max.
- When suggesting alternatives, show name, price, retailer, and delivery time.
- Always stay within budget.
- Call build_cart with the updated cart when changes are made.`,
  },
  {
    id: "checkout",
    step: 6,
    label: "Checkout",
    description: "Simulate checkout per retailer",
    systemPrompt: `You are a concise AI shopping assistant. Generate a step-by-step checkout simulation.

Group items by retailer and show the checkout flow for each.

RULES:
- Keep it brief and visual.
- Show: retailer name, items, subtotal, estimated delivery.
- Use a clear step format (Step 1, Step 2, etc.).
- Include a total across all retailers at the end.`,
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
        "Suggest a list of item categories the buyer might want for their occasion. These are categories, not specific products.",
      parameters: {
        type: "object",
        properties: {
          brief_response: {
            type: "string",
            description:
              "A 1-2 sentence acknowledgment of what the user wants (e.g., 'Got it — Patriots tailgate, $200 budget.')",
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
        "Request additional details from the buyer by presenting a structured form. Pre-fill known values.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short title for the form, e.g., 'A few more details'",
          },
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Unique field ID" },
                label: { type: "string", description: "Display label" },
                type: {
                  type: "string",
                  enum: ["text", "number", "select", "multiselect"],
                  description: "Input type",
                },
                value: {
                  type: "string",
                  description: "Pre-filled value if known, empty string if unknown",
                },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description: "Options for select/multiselect fields",
                },
                required: { type: "boolean", description: "Whether this field is required" },
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
        "Build a shopping cart with recommended products from the catalog.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "One sentence summary of the cart recommendation",
          },
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
                variant: { type: "string", description: "Selected size/color/variant" },
              },
              required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
              additionalProperties: false,
            },
          },
          total_cost: { type: "number" },
          budget: { type: "number" },
        },
        required: ["summary", "items", "total_cost", "budget"],
        additionalProperties: false,
      },
    },
  },
};
