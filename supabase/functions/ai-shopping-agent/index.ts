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

// Candidate format sent to frontend
interface SearchCandidate {
  name: string;
  url: string;
  retailer: string;
  price: number | null;
  description: string;
  category: string;
}

/**
 * Extract retailer name from a URL's domain.
 */
function extractRetailer(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const domainMap: Record<string, string> = {
      "amazon.com": "Amazon",
      "walmart.com": "Walmart",
      "target.com": "Target",
      "shein.com": "Shein",
      "temu.com": "Temu",
      "aliexpress.com": "AliExpress",
      "ebay.com": "eBay",
      "bestbuy.com": "Best Buy",
      "etsy.com": "Etsy",
      "nordstrom.com": "Nordstrom",
      "costco.com": "Costco",
      "wayfair.com": "Wayfair",
      "nike.com": "Nike",
      "adidas.com": "Adidas",
      "asos.com": "ASOS",
      "zara.com": "Zara",
      "hm.com": "H&M",
      "macys.com": "Macy's",
      "homedepot.com": "Home Depot",
      "lowes.com": "Lowe's",
      "rei.com": "REI",
      "dickssportinggoods.com": "Dick's",
      "backcountry.com": "Backcountry",
      "zappos.com": "Zappos",
      "overstock.com": "Overstock",
      "kohls.com": "Kohl's",
      "newegg.com": "Newegg",
    };
    for (const [domain, name] of Object.entries(domainMap)) {
      if (hostname.includes(domain)) return name;
    }
    // Capitalize first letter of domain
    const parts = hostname.split(".");
    const base = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "Unknown";
  }
}

/**
 * Try to extract a price from text content. Handles $XX.XX, USD XX, and comma-separated prices.
 * Returns null if no valid price found (never returns 0).
 */
function extractPrice(text: string): number | null {
  // Try multiple price patterns
  const patterns = [
    /\$(\d{1,5}(?:,\d{3})*(?:\.\d{1,2})?)/,          // $1,234.56 or $29.99
    /USD\s*(\d{1,5}(?:,\d{3})*(?:\.\d{1,2})?)/i,      // USD 29.99
    /(\d{1,5}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:USD|\$)/,  // 29.99 USD
    /price[:\s]*\$?(\d{1,5}(?:,\d{3})*(?:\.\d{1,2})?)/i, // price: 29.99
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (val > 0) return val;
    }
  }
  return null;
}

/**
 * Search for products using Firecrawl web search API.
 */
async function searchProducts(
  query: string,
  location: string,
  preferredRetailers: string[],
  firecrawlKey: string,
  buyerContext?: string
): Promise<SearchResult[]> {
  let searchQuery = `${query} buy online price reviews shipping`;
  if (buyerContext) {
    searchQuery += ` ${buyerContext}`;
  }
  if (location) {
    searchQuery += ` delivery to ${location}`;
  }

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
        limit: 10,
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
 * Search all categories in parallel.
 * Returns both a formatted context string for the AI prompt AND raw search candidates.
 */
async function searchAllCategories(
  categories: string[],
  location: string,
  preferredRetailers: string[],
  firecrawlKey: string,
  buyerContext?: string
): Promise<{ context: string; candidates: Record<string, SearchCandidate[]>; allResults: ProductSearchResult[] }> {
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
    return {
      context: "No products found. Please suggest the user try different search terms or broader retailer options.",
      candidates: {},
      allResults: [],
    };
  }

  // Build context string for AI
  let context = "";
  // Build candidates map for frontend
  const candidates: Record<string, SearchCandidate[]> = {};

  for (const { category, results } of successfulResults) {
    context += `\n=== ${category.toUpperCase()} ===\n`;
    candidates[category] = [];

    for (const r of results) {
      context += `\n--- Product ---\n`;
      context += `Title: ${r.title}\n`;
      context += `URL: ${r.url}\n`;
      context += `Description: ${r.description}\n`;
      context += `Details:\n${r.markdown}\n`;

      candidates[category].push({
        name: r.title || "Unknown Product",
        url: r.url,
        retailer: extractRetailer(r.url),
        price: extractPrice(r.markdown + " " + r.description),
        description: (r.description || "").slice(0, 200),
        category,
      });
    }
  }

  console.log(`Total search context: ${context.length} chars, candidates: ${Object.keys(candidates).length} categories`);
  return { context, candidates, allResults: successfulResults };
}

/**
 * Extract structured info from conversation messages.
 */
function extractContextFromMessages(messages: { role: string; content: string }[]): {
  categories: string[];
  location: string;
  budget: number;
  preferences: string;
  preferredRetailers: string[];
  buyerContext: string;
} {
  const fullText = messages.map((m) => m.content).join("\n");

  const itemsMatch = fullText.match(/I want these items:\s*(.+)/i);
  const categories = itemsMatch
    ? itemsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const locationMatch = fullText.match(
    /(?:location|zip|zip code|city|deliver to|shipping to)[:\s]*([A-Za-z0-9\s,]+?)(?:\.|,\s*(?:budget|preferred|style|colors|delivery)|$)/im
  );
  const location = locationMatch ? locationMatch[1].trim() : "";

  const budgetMatch = fullText.match(/budget[:\s]*\$?(\d+(?:\.\d{1,2})?)/i);
  const budget = budgetMatch ? parseFloat(budgetMatch[1]) : 0;

  const retailerMatch = fullText.match(
    /(?:preferred retailers|retailers|preferred stores|stores|preferred_retailers)[:\s]*(.+?)(?:\.|,\s*(?:budget|location|style|colors|delivery)|$)/im
  );
  const preferredRetailers = retailerMatch
    ? retailerMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const buyerParts: string[] = [];

  const sizeMatch = fullText.match(/(?:size)[:\s]*([A-Za-z0-9\s\/]+?)(?:,|$)/im);
  if (sizeMatch) buyerParts.push(`size ${sizeMatch[1].trim()}`);

  const colorMatch = fullText.match(/(?:colors?|preferred colors?)[:\s]*([A-Za-z\s,]+?)(?:\.|,\s*(?:budget|location|style|size|delivery)|$)/im);
  if (colorMatch) buyerParts.push(colorMatch[1].trim());

  const genderMatch = fullText.match(/(?:gender)[:\s]*(Male|Female|Unisex)/im);
  if (genderMatch && genderMatch[1].toLowerCase() !== "prefer not to say") buyerParts.push(genderMatch[1].trim());

  const ageMatch = fullText.match(/(?:age_group|age group|age)[:\s]*([A-Za-z0-9\s()-]+?)(?:,|$)/im);
  if (ageMatch) buyerParts.push(ageMatch[1].trim());

  const styleMatch = fullText.match(/(?:style)[:\s]*([A-Za-z\s,]+?)(?:,|$)/im);
  if (styleMatch) buyerParts.push(styleMatch[1].trim());

  const buyerContext = buyerParts.join(" ");
  const preferences = fullText;

  return { categories, location, budget, preferences, preferredRetailers, buyerContext };
}

// ─── URL PRESERVATION ───

/**
 * Normalize a string for fuzzy matching.
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Simple word overlap similarity between two strings (0-1).
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

/**
 * Post-process AI cart items: replace hallucinated URLs with real Firecrawl URLs.
 */
function fixItemUrls(items: any[], allResults: ProductSearchResult[]): any[] {
  // Build a flat list of all known real URLs with their titles
  const realProducts: { title: string; url: string }[] = [];
  for (const { results } of allResults) {
    for (const r of results) {
      if (r.url) realProducts.push({ title: r.title, url: r.url });
    }
  }

  const realUrlSet = new Set(realProducts.map((p) => p.url));

  return items.map((item) => {
    // If the AI's URL is already a real one, keep it
    if (item.url && realUrlSet.has(item.url)) return item;

    // Otherwise, fuzzy-match by name against real product titles
    let bestMatch = "";
    let bestScore = 0;
    for (const rp of realProducts) {
      const score = similarity(item.name || "", rp.title);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = rp.url;
      }
    }

    if (bestScore >= 0.2 && bestMatch) {
      console.log(`URL fix: "${item.name}" → ${bestMatch} (score: ${bestScore.toFixed(2)})`);
      return { ...item, url: bestMatch };
    }

    return item;
  });
}

/**
 * Fix items with $0 price by looking up the price from search candidates.
 */
function fixZeroPrices(items: any[], candidates: Record<string, SearchCandidate[]>): any[] {
  return items.map((item) => {
    if (item.price > 0) return item;

    // Try to find a price from search candidates by matching name
    const allCandidates = Object.values(candidates).flat();
    let bestMatch: SearchCandidate | null = null;
    let bestScore = 0;

    for (const c of allCandidates) {
      if (c.price && c.price > 0) {
        const score = similarity(item.name || "", c.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = c;
        }
      }
    }

    if (bestMatch && bestScore >= 0.15 && bestMatch.price) {
      console.log(`Price fix: "${item.name}" $0 → $${bestMatch.price} (from candidate "${bestMatch.name}", score: ${bestScore.toFixed(2)})`);
      return { ...item, price: bestMatch.price };
    }

    console.warn(`Cannot fix $0 price for "${item.name}" — will be filtered`);
    return item;
  });
}

// ─── STAGE PROMPTS ───

const STAGE_PROMPTS: Record<string, string> = {
  identify: `You are Prima, a concise AI shopping assistant. The user will describe their shopping need in one message.

Instructions:
- Respond in 1-2 sentences maximum acknowledging their request.
- Analyze the user's SPECIFIC scenario and suggest 8-12 item categories that are uniquely relevant to THEIR request.
- Do NOT use generic categories. Tailor every suggestion to the user's exact situation.
- Examples:
  - "Skiing outfit" → "Ski Jacket", "Ski Pants", "Base Layer", "Goggles", "Ski Gloves", "Ski Socks", "Helmet", "Neck Gaiter", "Hand Warmers"
  - "Hackathon for 60 people" → "Snack Boxes", "Name Badges", "USB-C Adapters", "Banner/Signage", "Trophies/Prizes", "Extension Cords", "Stickers", "Lanyards"
  - "Super Bowl party outfit" → "Team Jersey", "Team Cap", "Face Paint", "Rally Towel", "Team Scarf", "Sneakers", "Sunglasses", "Foam Finger"
  - "Birthday party for 20" → "Party Plates & Cups", "Balloons", "Banner/Decorations", "Cake Topper", "Party Favors", "Tablecloth", "Candles", "Gift Bags"
- Do NOT list actual products, only categories.
- Return your tool call using the suggest_items tool.
- Always keep it short, clear, and friendly.`,

  clarify: `You are Prima, a concise AI shopping assistant. The user has selected item categories they want to shop for.

Instructions:
- Call the request_clarification tool to generate a CONTEXT-APPROPRIATE form.
- ALWAYS include these 3 core fields:
  1. "budget" (type: number, required: true, label: "Budget ($)")
  2. "delivery_by" (type: text, required: false, label: "Need it by (date)")
  3. "location" (type: text, required: true, label: "Delivery location (ZIP or City, State)")
- ALWAYS include "preferred_retailers" (type: multiselect, required: false, label: "Preferred retailers", options: ["Any (search everywhere)", "Amazon", "Walmart", "Target", "Shein", "Temu", "AliExpress", "eBay", "Best Buy", "Etsy", "Nordstrom", "Nike", "Adidas"])
- Then add 4-8 ADDITIONAL fields that are specifically relevant to THIS shopping scenario and the selected item categories.
- Do NOT use a fixed template. Generate fields dynamically based on context.
- Examples of scenario-specific fields:
  - Skiing outfit: "Jacket insulation type" (select: Down, Synthetic, Fleece), "Waterproof rating" (select: Light, Moderate, Heavy), "Boot size", "Preferred colors"
  - Hackathon kit: "Number of attendees" (number), "Dietary restrictions" (text), "Prize budget" (number), "Venue type" (select: Office, Convention center, University)
  - Super Bowl outfit: "Team name" (text), "Jersey size" (select: S, M, L, XL, XXL), "Color scheme" (text), "Hat style" (select: Snapback, Fitted, Beanie)
  - Birthday party: "Age of birthday person" (number), "Theme" (text), "Indoor or outdoor" (select), "Color scheme" (text)
- Pre-fill any known values from user input.
- Return only the tool call JSON.
- Do not write conversational text outside the tool call.`,

  // research prompt is dynamically built — see buildResearchPrompt()
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
  return `You are Prima, an agentic commerce AI. Below are REAL product search results from across the internet. Use ONLY these results to build the cart — do NOT make up products or URLs.

CRITICAL URL RULE: You MUST use the EXACT URLs from the search results below. Do NOT modify, shorten, rewrite, or fabricate any URLs. Copy them character-for-character from the search results. If you cannot find a URL for a product, omit the url field entirely rather than guessing.

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
3. For EACH product include: name, category, retailer (actual site name like "Amazon", "Shein", "Temu", etc.), price, delivery_days (estimated), emoji, url (EXACT URL copied from search results above), reason (1 sentence explaining why this specific item was chosen), and optionally: rating, review_count, shipping_cost, original_price, discount_label, variant.
4. CRITICAL PRICE RULE: Every item MUST have a real price greater than $0. Extract the actual price from the search results. If you absolutely cannot determine a price for an item, estimate it reasonably based on the product type — NEVER use 0 as a price.
5. Add "replace": true to each item.
5. Generate 1-2 alternative_sets with different trade-offs (e.g., budget-friendly vs premium, faster delivery vs better reviews).
6. Provide a detailed ranking_explanation covering WHY this set won — mention specific factors.
7. Return structured JSON ONLY using the build_cart tool.
8. Do NOT hallucinate products — use the search results above ONLY.
9. REMEMBER: URLs must be copied EXACTLY from the search results. No fabrication.`;
}

/**
 * Build a review prompt with fresh search results for item replacement.
 */
function buildReviewPromptWithSearch(searchContext: string): string {
  return `You are a concise AI shopping assistant. The user wants to replace or modify items in their cart.

Below are FRESH search results for alternative products:
${searchContext}

CRITICAL URL RULE: Use the EXACT URLs from the search results. Do NOT modify or fabricate URLs.

Instructions:
- Use the search results above to suggest replacements. Do NOT make up products.
- Return updated cart JSON using the build_cart tool.
- Keep all unreplaced items exactly as they were.
- The retailer field can be ANY online store name.
- Include url (EXACT from search results), rating, review_count, shipping_cost, original_price, discount_label where available.`;
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
      description: "Request additional details from the buyer via a structured form. Generate fields dynamically based on the shopping scenario.",
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
                url: { type: "string", description: "EXACT product page URL from search results — do NOT fabricate" },
                rating: { type: "number", description: "Star rating (e.g. 4.5)" },
                review_count: { type: "number", description: "Number of reviews" },
                shipping_cost: { type: "number", description: "Shipping cost (0 = free)" },
                original_price: { type: "number", description: "Price before discount" },
                discount_label: { type: "string", description: "e.g. '20% off', 'Buy 2 Get 1'" },
                reason: { type: "string", description: "1 sentence explaining why this item was chosen (e.g. 'Best value: 4.5 stars, free shipping, 15% cheaper than alternatives')" },
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

// Store search results per request for URL post-processing
let _lastSearchResults: ProductSearchResult[] = [];
let _lastSearchCandidates: Record<string, SearchCandidate[]> = {};

// ─── RATE LIMITING ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300000); // Every 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  
  if (!checkRateLimit(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // --- JWT Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authUser) {
      console.warn("Auth failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${authUser.id}`);

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
    let searchResults: ProductSearchResult[] = [];
    let searchCandidates: Record<string, SearchCandidate[]> = {};

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
        buyerContext: ctx.buyerContext,
      }));

      if (ctx.categories.length > 0) {
        const searchData = await searchAllCategories(
          ctx.categories,
          ctx.location,
          ctx.preferredRetailers,
          FIRECRAWL_API_KEY,
          ctx.buyerContext
        );
        systemPrompt = buildResearchPrompt(searchData.context, ctx.location);
        searchResults = searchData.allResults;
        searchCandidates = searchData.candidates;
      } else {
        console.warn("No categories extracted, falling back to basic research prompt");
        systemPrompt = buildResearchPrompt("No specific product search results available. Ask the user to clarify what items they want.", "");
      }
    }

    // ─── REVIEW STAGE: Check if replacement/swap/set selection needed → search ───
    if (stage === "review" && FIRECRAWL_API_KEY) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      const isReplacement = lastUserMsg?.content && /replace|swap|switch|alternative|instead|different|use.*set/i.test(lastUserMsg.content);

      if (isReplacement) {
        const replaceMatch = lastUserMsg.content.match(/replace\s+"?([^"]+)"?\s+with/i) ||
          lastUserMsg.content.match(/replace\s+"?([^"]+)"?/i) ||
          lastUserMsg.content.match(/swap\s+"?([^"]+)"?\s+/i);
        const itemToReplace = replaceMatch ? replaceMatch[1].trim() : "";
        const searchQuery = itemToReplace || "alternative product";

        const ctx = extractContextFromMessages(messages);
        console.log(`Review replacement search for: "${searchQuery}"`);

        const results = await searchProducts(
          searchQuery,
          ctx.location,
          ctx.preferredRetailers,
          FIRECRAWL_API_KEY,
          ctx.buyerContext
        );

        if (results.length > 0) {
          let searchContext = `\n=== REPLACEMENT OPTIONS for "${itemToReplace}" ===\n`;
          for (const r of results) {
            searchContext += `\n--- Product ---\nTitle: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}\nDetails:\n${r.markdown}\n`;
          }
          systemPrompt = buildReviewPromptWithSearch(searchContext);
          searchResults = [{ category: itemToReplace, results }];
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

      // Post-process build_cart: fix URLs and filter $0 prices
      if (toolName === "build_cart") {
        if (searchResults.length > 0) {
          console.log("Post-processing URLs for build_cart...");
          if (toolArgs.items) {
            toolArgs.items = fixItemUrls(toolArgs.items, searchResults);
          }
          if (toolArgs.alternative_sets) {
            toolArgs.alternative_sets = toolArgs.alternative_sets.map((alt: any) => ({
              ...alt,
              items: alt.items ? fixItemUrls(alt.items, searchResults) : alt.items,
            }));
          }
        }

        // Fix $0 prices: try to recover from search candidates, otherwise remove
        if (toolArgs.items) {
          toolArgs.items = fixZeroPrices(toolArgs.items, searchCandidates);
          // Filter out any items that still have price 0 or negative
          const before = toolArgs.items.length;
          toolArgs.items = toolArgs.items.filter((item: any) => item.price > 0);
          if (toolArgs.items.length < before) {
            console.log(`Filtered out ${before - toolArgs.items.length} items with $0 price`);
          }
          // Recalculate total
          toolArgs.total_cost = toolArgs.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
        }
        if (toolArgs.alternative_sets) {
          toolArgs.alternative_sets = toolArgs.alternative_sets.map((alt: any) => ({
            ...alt,
            items: alt.items ? fixZeroPrices(alt.items, searchCandidates).filter((item: any) => item.price > 0) : [],
          }));
        }
      }

      const responsePayload: any = {
        type: "tool_call",
        tool: toolName,
        data: toolArgs,
        text: choice.message.content || "",
      };

      // Include search candidates for build_cart so frontend can show all results
      if (toolName === "build_cart" && Object.keys(searchCandidates).length > 0) {
        responsePayload.searchCandidates = searchCandidates;
      }

      return new Response(
        JSON.stringify(responsePayload),
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
