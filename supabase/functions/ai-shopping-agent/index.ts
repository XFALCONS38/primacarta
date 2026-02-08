import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── PRODUCT CATALOG ───
// Embedded from src/data/products.ts so the AI can reference real products
const PRODUCT_CATALOG = [
  // APPAREL
  { id:"amz-a1", name:"Classic Cotton T-Shirt", price:18.99, delivery_days:2, retailer:"Amazon", category:"apparel", colors:["white","black","navy","red"], variants:["S","M","L","XL"], emoji:"👕" },
  { id:"amz-a2", name:"Slim Fit Jeans", price:34.99, delivery_days:3, retailer:"Amazon", category:"apparel", colors:["blue","black","gray"], variants:["30","32","34","36"], emoji:"👖" },
  { id:"amz-a3", name:"Zip-Up Hoodie", price:42.99, delivery_days:2, retailer:"Amazon", category:"apparel", colors:["gray","black","navy"], variants:["S","M","L","XL"], emoji:"🧥" },
  { id:"amz-a4", name:"Running Shorts", price:22.99, delivery_days:1, retailer:"Amazon", category:"apparel", colors:["black","navy","gray"], variants:["S","M","L"], emoji:"🩳" },
  { id:"amz-a5", name:"Wool Blend Beanie", price:14.99, delivery_days:1, retailer:"Amazon", category:"apparel", colors:["black","gray","red","navy"], variants:["One Size"], emoji:"🧢" },
  { id:"wmt-a1", name:"Athletic Polo Shirt", price:15.99, delivery_days:3, retailer:"Walmart", category:"apparel", colors:["white","blue","black"], variants:["S","M","L","XL"], emoji:"👕" },
  { id:"wmt-a2", name:"Cargo Pants", price:28.99, delivery_days:4, retailer:"Walmart", category:"apparel", colors:["khaki","olive","black"], variants:["30","32","34","36"], emoji:"👖" },
  { id:"wmt-a3", name:"Pullover Sweatshirt", price:24.99, delivery_days:3, retailer:"Walmart", category:"apparel", colors:["gray","navy","red"], variants:["S","M","L","XL"], emoji:"🧥" },
  { id:"wmt-a4", name:"Denim Jacket", price:39.99, delivery_days:4, retailer:"Walmart", category:"apparel", colors:["blue","black"], variants:["S","M","L","XL"], emoji:"🧥" },
  { id:"tgt-a1", name:"Organic Cotton Tee", price:16.99, delivery_days:3, retailer:"Target", category:"apparel", colors:["white","sage","blush","navy"], variants:["XS","S","M","L"], emoji:"👕" },
  { id:"tgt-a2", name:"High-Rise Leggings", price:29.99, delivery_days:2, retailer:"Target", category:"apparel", colors:["black","gray","navy"], variants:["XS","S","M","L"], emoji:"👖" },
  { id:"tgt-a3", name:"Fleece Vest", price:34.99, delivery_days:3, retailer:"Target", category:"apparel", colors:["black","olive","navy"], variants:["S","M","L","XL"], emoji:"🧥" },
  { id:"tgt-a4", name:"Linen Button-Down", price:32.99, delivery_days:3, retailer:"Target", category:"apparel", colors:["white","blue","tan"], variants:["S","M","L","XL"], emoji:"👔" },
  // SPORTS GEAR
  { id:"amz-s1", name:"NFL Team Jersey", price:79.99, delivery_days:3, retailer:"Amazon", category:"sports", colors:["team colors"], variants:["Patriots","Chiefs","Cowboys","49ers"], emoji:"🏈" },
  { id:"amz-s2", name:"Team Baseball Cap", price:24.99, delivery_days:2, retailer:"Amazon", category:"sports", colors:["team colors"], variants:["Patriots","Yankees","Lakers","Bulls"], emoji:"🧢" },
  { id:"amz-s3", name:"Athletic Running Shoes", price:64.99, delivery_days:2, retailer:"Amazon", category:"sports", colors:["black","white","blue"], variants:["8","9","10","11","12"], emoji:"👟" },
  { id:"amz-s4", name:"Insulated Team Water Bottle", price:19.99, delivery_days:1, retailer:"Amazon", category:"sports", colors:["team colors"], variants:["Patriots","Lakers","Yankees"], emoji:"🥤" },
  { id:"amz-s5", name:"Team Fan Scarf", price:22.99, delivery_days:2, retailer:"Amazon", category:"sports", colors:["team colors"], variants:["Patriots","Chiefs","Packers"], emoji:"🧣" },
  { id:"wmt-s1", name:"Sports Team Hoodie", price:44.99, delivery_days:4, retailer:"Walmart", category:"sports", colors:["team colors"], variants:["Patriots","Cowboys","Chiefs","Eagles"], emoji:"🧥" },
  { id:"wmt-s2", name:"Team Logo Socks (3-Pack)", price:12.99, delivery_days:3, retailer:"Walmart", category:"sports", colors:["team colors"], variants:["Patriots","Lakers","Bulls"], emoji:"🧦" },
  { id:"wmt-s3", name:"Basketball Shorts", price:19.99, delivery_days:3, retailer:"Walmart", category:"sports", colors:["black","red","blue"], variants:["S","M","L","XL"], emoji:"🩳" },
  { id:"wmt-s4", name:"Team Rally Towel", price:9.99, delivery_days:3, retailer:"Walmart", category:"sports", colors:["team colors"], variants:["Patriots","Chiefs","Steelers"], emoji:"🏳️" },
  { id:"tgt-s1", name:"Team Spirit T-Shirt", price:21.99, delivery_days:2, retailer:"Target", category:"sports", colors:["team colors"], variants:["Patriots","49ers","Packers","Bears"], emoji:"👕" },
  { id:"tgt-s2", name:"Athletic Sneakers", price:54.99, delivery_days:3, retailer:"Target", category:"sports", colors:["white","black","gray"], variants:["8","9","10","11"], emoji:"👟" },
  { id:"tgt-s3", name:"Team Face Paint Kit", price:8.99, delivery_days:2, retailer:"Target", category:"sports", colors:["multi"], variants:["NFL","NBA","MLB"], emoji:"🎨" },
  { id:"tgt-s4", name:"Sports Backpack", price:34.99, delivery_days:3, retailer:"Target", category:"sports", colors:["black","navy","red"], variants:["Standard"], emoji:"🎒" },
  // ELECTRONICS
  { id:"amz-e1", name:"Wireless Bluetooth Earbuds", price:49.99, delivery_days:1, retailer:"Amazon", category:"electronics", colors:["black","white"], variants:["Standard","Pro"], emoji:"🎧" },
  { id:"amz-e2", name:"Portable Phone Charger 10000mAh", price:24.99, delivery_days:1, retailer:"Amazon", category:"electronics", colors:["black","white"], variants:["10000mAh","20000mAh"], emoji:"🔋" },
  { id:"amz-e3", name:"Smart Watch Fitness Tracker", price:89.99, delivery_days:2, retailer:"Amazon", category:"electronics", colors:["black","silver","rose gold"], variants:["Standard","Premium"], emoji:"⌚" },
  { id:"amz-e4", name:"Bluetooth Speaker Waterproof", price:39.99, delivery_days:2, retailer:"Amazon", category:"electronics", colors:["black","blue","red"], variants:["Mini","Standard"], emoji:"🔊" },
  { id:"amz-e5", name:"USB-C Fast Charging Cable (3-Pack)", price:14.99, delivery_days:1, retailer:"Amazon", category:"electronics", colors:["black","white"], variants:["3ft","6ft"], emoji:"🔌" },
  { id:"wmt-e1", name:"Over-Ear Headphones", price:34.99, delivery_days:3, retailer:"Walmart", category:"electronics", colors:["black","blue"], variants:["Wired","Wireless"], emoji:"🎧" },
  { id:"wmt-e2", name:"LED Desk Lamp", price:22.99, delivery_days:4, retailer:"Walmart", category:"electronics", colors:["white","black"], variants:["Standard","With USB"], emoji:"💡" },
  { id:"wmt-e3", name:"Tablet Stand Adjustable", price:16.99, delivery_days:3, retailer:"Walmart", category:"electronics", colors:["silver","black"], variants:["Standard"], emoji:"📱" },
  { id:"tgt-e1", name:"Wireless Charging Pad", price:19.99, delivery_days:2, retailer:"Target", category:"electronics", colors:["white","black"], variants:["Standard","Fast"], emoji:"🔋" },
  { id:"tgt-e2", name:"Portable Mini Speaker", price:29.99, delivery_days:2, retailer:"Target", category:"electronics", colors:["teal","coral","black"], variants:["Standard"], emoji:"🔊" },
  { id:"tgt-e3", name:"Screen Protector (2-Pack)", price:9.99, delivery_days:1, retailer:"Target", category:"electronics", colors:["clear"], variants:["iPhone","Samsung","Universal"], emoji:"📱" },
  // HOME GOODS
  { id:"amz-h1", name:"Scented Candle Set (3-Pack)", price:24.99, delivery_days:2, retailer:"Amazon", category:"home", colors:["white","amber"], variants:["Vanilla","Lavender","Ocean"], emoji:"🕯️" },
  { id:"amz-h2", name:"Decorative Throw Pillow", price:19.99, delivery_days:2, retailer:"Amazon", category:"home", colors:["gray","blue","cream","rust"], variants:["18x18","20x20"], emoji:"🛋️" },
  { id:"amz-h3", name:"French Press Coffee Maker", price:29.99, delivery_days:2, retailer:"Amazon", category:"home", colors:["black","copper"], variants:["12oz","34oz"], emoji:"☕" },
  { id:"amz-h4", name:"Bamboo Cutting Board Set", price:22.99, delivery_days:2, retailer:"Amazon", category:"home", colors:["natural"], variants:["3-Pack"], emoji:"🪵" },
  { id:"wmt-h1", name:"Microfiber Sheet Set", price:29.99, delivery_days:3, retailer:"Walmart", category:"home", colors:["white","gray","navy","sage"], variants:["Twin","Full","Queen","King"], emoji:"🛏️" },
  { id:"wmt-h2", name:"Stainless Steel Water Bottle", price:14.99, delivery_days:3, retailer:"Walmart", category:"home", colors:["silver","black","blue"], variants:["24oz","32oz"], emoji:"🥤" },
  { id:"wmt-h3", name:"Storage Basket Set (3-Pack)", price:18.99, delivery_days:4, retailer:"Walmart", category:"home", colors:["gray","white","brown"], variants:["Small","Medium"], emoji:"🧺" },
  { id:"tgt-h1", name:"Ceramic Vase", price:16.99, delivery_days:2, retailer:"Target", category:"home", colors:["white","terracotta","sage"], variants:["Small","Medium"], emoji:"🏺" },
  { id:"tgt-h2", name:"Cozy Throw Blanket", price:24.99, delivery_days:2, retailer:"Target", category:"home", colors:["cream","gray","blush"], variants:["50x60"], emoji:"🧶" },
  { id:"tgt-h3", name:"Glass Food Storage Set (8-Piece)", price:32.99, delivery_days:3, retailer:"Target", category:"home", colors:["clear"], variants:["8-Piece"], emoji:"🫙" },
  { id:"tgt-h4", name:"Woven Placemat Set (4-Pack)", price:14.99, delivery_days:2, retailer:"Target", category:"home", colors:["natural","gray","black"], variants:["4-Pack"], emoji:"🍽️" },
  // PARTY SUPPLIES
  { id:"amz-p1", name:"Balloon Arch Kit (100pc)", price:19.99, delivery_days:2, retailer:"Amazon", category:"party", colors:["multi","gold","pastel"], variants:["Birthday","Wedding","Generic"], emoji:"🎈" },
  { id:"amz-p2", name:"Disposable Dinnerware Set (50pc)", price:24.99, delivery_days:2, retailer:"Amazon", category:"party", colors:["gold","silver","rose gold"], variants:["25 guests","50 guests"], emoji:"🍽️" },
  { id:"amz-p3", name:"LED String Lights 50ft", price:15.99, delivery_days:1, retailer:"Amazon", category:"party", colors:["warm white","multi","cool white"], variants:["50ft","100ft"], emoji:"✨" },
  { id:"amz-p4", name:"Photo Booth Props Kit (30pc)", price:12.99, delivery_days:2, retailer:"Amazon", category:"party", colors:["multi"], variants:["Birthday","Wedding","Graduation"], emoji:"📸" },
  { id:"wmt-p1", name:"Paper Cups & Plates Set (40pc)", price:8.99, delivery_days:3, retailer:"Walmart", category:"party", colors:["blue","pink","gold"], variants:["20 guests"], emoji:"🥤" },
  { id:"wmt-p2", name:"Birthday Banner & Bunting", price:6.99, delivery_days:3, retailer:"Walmart", category:"party", colors:["multi","gold","pink"], variants:["Happy Birthday","Congrats"], emoji:"🎉" },
  { id:"wmt-p3", name:"Tablecloth 3-Pack", price:9.99, delivery_days:3, retailer:"Walmart", category:"party", colors:["white","black","red","blue"], variants:["54x108"], emoji:"🎪" },
  { id:"wmt-p4", name:"Party Favor Bags (50pc)", price:7.99, delivery_days:3, retailer:"Walmart", category:"party", colors:["multi","pastel","neon"], variants:["50pc"], emoji:"🎁" },
  { id:"tgt-p1", name:"Confetti Pack (Gold & Silver)", price:5.99, delivery_days:2, retailer:"Target", category:"party", colors:["gold","silver","rose gold"], variants:["1 Pack"], emoji:"🎊" },
  { id:"tgt-p2", name:"Party Napkins 100ct", price:6.99, delivery_days:2, retailer:"Target", category:"party", colors:["white","pastel","bright"], variants:["100ct"], emoji:"🧻" },
  { id:"tgt-p3", name:"Cake Topper Decoration", price:8.99, delivery_days:2, retailer:"Target", category:"party", colors:["gold","silver"], variants:["Happy Birthday","Celebrate","Custom Age"], emoji:"🎂" },
  { id:"tgt-p4", name:"Helium Balloon Kit (20pc)", price:14.99, delivery_days:2, retailer:"Target", category:"party", colors:["pastel","bright","metallic"], variants:["20pc"], emoji:"🎈" },
  // ACCESSORIES
  { id:"amz-x1", name:"Leather Wallet", price:29.99, delivery_days:2, retailer:"Amazon", category:"accessories", colors:["brown","black","tan"], variants:["Bifold","Trifold"], emoji:"👛" },
  { id:"amz-x2", name:"Polarized Sunglasses", price:24.99, delivery_days:2, retailer:"Amazon", category:"accessories", colors:["black","tortoise","clear"], variants:["Standard"], emoji:"🕶️" },
  { id:"amz-x3", name:"Canvas Tote Bag", price:18.99, delivery_days:2, retailer:"Amazon", category:"accessories", colors:["natural","black","navy"], variants:["Standard"], emoji:"👜" },
  { id:"amz-x4", name:"Leather Belt", price:19.99, delivery_days:2, retailer:"Amazon", category:"accessories", colors:["brown","black"], variants:["S","M","L","XL"], emoji:"🪢" },
  { id:"wmt-x1", name:"Digital Watch", price:19.99, delivery_days:3, retailer:"Walmart", category:"accessories", colors:["black","silver"], variants:["Standard"], emoji:"⌚" },
  { id:"wmt-x2", name:"Knit Scarf", price:12.99, delivery_days:3, retailer:"Walmart", category:"accessories", colors:["gray","navy","red","cream"], variants:["Standard"], emoji:"🧣" },
  { id:"wmt-x3", name:"Crossbody Bag", price:22.99, delivery_days:4, retailer:"Walmart", category:"accessories", colors:["black","tan","olive"], variants:["Small","Medium"], emoji:"👜" },
  { id:"tgt-x1", name:"Beaded Bracelet Set", price:12.99, delivery_days:2, retailer:"Target", category:"accessories", colors:["multi","earth tones","metallics"], variants:["Set of 3"], emoji:"📿" },
  { id:"tgt-x2", name:"Hair Accessories Set", price:9.99, delivery_days:2, retailer:"Target", category:"accessories", colors:["multi","neutrals","pastels"], variants:["12-Pack"], emoji:"🎀" },
  { id:"tgt-x3", name:"Travel Toiletry Bag", price:16.99, delivery_days:2, retailer:"Target", category:"accessories", colors:["black","floral","navy"], variants:["Standard"], emoji:"🧳" },
  { id:"tgt-x4", name:"Minimalist Card Holder", price:14.99, delivery_days:2, retailer:"Target", category:"accessories", colors:["black","tan","blush"], variants:["Standard"], emoji:"💳" },
];

const CATALOG_JSON = JSON.stringify(PRODUCT_CATALOG);

// Stage-specific system prompts
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
- Include fields for: budget, delivery_by date, preferences (style, team/theme, colors, must_haves, nice_to_haves), and category-specific options.
- Pre-fill any known values from user input or previous sessions.
- Return only the tool call JSON: { "title": "...", "fields": [{ "id": "...", "label": "...", "type": "...", "value": "...", "options": [...], "required": true/false }] }
- Do not write conversational text outside the tool call.`,

  research: `You are a concise AI shopping assistant with access to a mock product catalog. Use the following catalog exactly as provided (names, prices, variants, retailers, delivery_days). Pick items ONLY from this catalog.

Catalog:
${CATALOG_JSON}

Instructions:
1. Build a combined cart selecting items from 2-3 different retailers.
2. Ensure the total cost does not exceed the user's budget.
3. Score each complete set using:
   score = 0.4*(1 - total_cost/budget) + 0.3*delivery_score + 0.2*preference_match + 0.1*style_coherence
   - delivery_score: 1.0 if all items arrive by delivery_by, scales down linearly
   - preference_match: how well items match colors, team/theme, style
   - style_coherence: how well items look together
4. Generate:
   - top_ranked_set: best set of items
   - alternative_sets: 1-2 alternative sets with explanations
   - ranking_explanation: why the top set was chosen
5. Add "replace": true to each item.
6. Return structured JSON ONLY using the build_cart tool.
7. Do NOT hallucinate items; use catalog only.`,

  review: `You are a concise AI shopping assistant. The user is reviewing their cart.

Instructions:
- Do NOT rebuild the cart unless the user requests an item replacement, removal, or addition.
- If the user says the cart looks good or wants to proceed, just respond with a short text reply. Do NOT call build_cart.
- If the user asks to replace an item, suggest alternatives from the catalog.
- Return updated combined_cart JSON using the build_cart tool with the same structure as before.
- Keep responses short and friendly.

Product catalog for replacements:
${CATALOG_JSON}`,

  checkout: `You are a concise AI shopping assistant generating a structured checkout simulation.

Instructions:
- Group items by retailer.
- Include step-by-step checkout instructions per retailer: Name → Address → Payment → Confirm.
- Include grand_total and retailer-level subtotals.
- Return structured JSON ONLY using the generate_checkout tool.
- Do NOT stream free text. Use the structured tool output.`,
};

// Tool definitions
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
      description: "Build a shopping cart with ranked products from the catalog, including ranking explanation and alternatives.",
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
                retailer: { type: "string", enum: ["Amazon", "Walmart", "Target"] },
                price: { type: "number" },
                delivery_days: { type: "number" },
                emoji: { type: "string" },
                variant: { type: "string" },
                replace: { type: "boolean", description: "Whether this item can be replaced" },
              },
              required: ["name", "category", "retailer", "price", "delivery_days", "emoji"],
            },
          },
          total_cost: { type: "number" },
          budget: { type: "number" },
          ranking_explanation: { type: "string", description: "Why this set was ranked #1" },
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
                retailer: { type: "string", enum: ["Amazon", "Walmart", "Target"] },
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

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = STAGE_PROMPTS[stage] || STAGE_PROMPTS.identify;
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

    // All stages now use non-streaming with tool calls
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
