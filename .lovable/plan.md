

# Real Product Search with Firecrawl Integration

This plan replaces the static 85-item mock product catalog with live internet product search powered by Firecrawl. The agent will search across ALL online retailers -- Amazon, Walmart, Target, Shein, Temu, AliExpress, eBay, Best Buy, Etsy, and any other site with relevant products. Users can optionally restrict searches to specific sites. Ranking will consider reviews, reliability, discounts, shipping costs, delivery time, location, and more -- not just the lowest price.

---

## Architecture Overview

The research stage currently injects a hardcoded JSON catalog into the AI prompt. The new flow replaces this with a two-phase approach inside the edge function:

```text
Phase 1: SEARCH (Firecrawl)
  For each item category the user selected, fire a Firecrawl
  web search query. Include location context for delivery
  filtering. Collect results from across the web.

Phase 2: RANK (OpenAI)
  Feed the aggregated search results into GPT as context.
  The AI evaluates products on price, reviews, reliability,
  discounts, shipping cost, delivery time, and location --
  then builds the ranked cart with alternatives.
```

---

## Step-by-step implementation

### Step 1: Store the Firecrawl API key as a secret

The Firecrawl API key (`fc-cad4021a3da94146883d09cf21cd918f`) needs to be stored as a backend secret named `FIRECRAWL_API_KEY` so the edge function can access it securely.

### Step 2: Add location and retailer preferences to the clarification form

Update the **Clarify** stage system prompt to instruct the AI to always include these fields:

- **Location (ZIP code or city)** -- text field, required. Used to check delivery feasibility.
- **Preferred retailers** -- multiselect field, optional. Options like "Any (search everywhere)", "Amazon", "Walmart", "Target", "Shein", "Temu", "AliExpress", "eBay", "Best Buy", "Etsy". If "Any" or empty, the agent searches broadly.

No frontend form code changes needed -- the AI dynamically generates the form fields via the `request_clarification` tool.

### Step 3: Rewrite the edge function (`supabase/functions/ai-shopping-agent/index.ts`)

This is the core change. The file will be restructured:

**Remove:**
- The entire `PRODUCT_CATALOG` array (lines 11-89)
- The `CATALOG_JSON` constant (line 91)
- Catalog references in the research and review prompts

**Add:**
- A `searchProducts()` helper function that calls Firecrawl's search API
- A `searchAllCategories()` function that runs parallel searches for each item category
- Updated research and review prompts that work with live search results

**`searchProducts` function logic:**
```text
Input: query string, location string, preferred retailers array
Process:
  1. Build a search query: "[item category] buy online [location] reviews price"
  2. If preferred retailers specified, add "site:amazon.com site:shein.com ..."
  3. Call Firecrawl search API (POST https://api.firecrawl.dev/v1/search)
  4. Request scrapeOptions with markdown format to get product details
  5. Return structured results: product name, price, retailer, URL,
     reviews summary, shipping info, discounts
Output: Array of search results per category
```

**`searchAllCategories` function logic:**
```text
Input: item categories array, location, preferred retailers
Process:
  1. For each category, call searchProducts() in parallel
  2. Limit to 5 results per category to stay within token limits
  3. Aggregate all results into a single context block
Output: Formatted string of all search results for the AI prompt
```

**Updated research stage flow:**
```text
1. Parse the conversation to extract: item categories,
   location, budget, preferences, preferred retailers
2. Call searchAllCategories() with Firecrawl
3. Inject search results into the system prompt
4. Call OpenAI with the enriched prompt
5. AI ranks products considering ALL factors and returns
   build_cart tool call
```

**Updated research prompt (key changes):**
```text
You are a shopping assistant. Below are REAL product search
results from across the internet. Use ONLY these results to
build the cart -- do not make up products.

SEARCH RESULTS:
[injected Firecrawl results]

RANKING CRITERIA (weighted scoring):
- 25% Value: price vs budget, active discounts/sales/coupons
- 20% Delivery: estimated shipping time to [user location],
  shipping cost (free shipping = bonus)
- 20% Reviews & reliability: star rating, review count,
  seller reputation, return policy
- 15% Preference match: colors, style, team/theme, features
- 10% Retailer trust: established retailer vs unknown seller
- 10% Style coherence: how items look together as a set

For each product include:
- name, retailer (actual site name), price, shipping_cost,
  estimated_delivery_days, rating, review_count, url,
  discount info, emoji

Explain your ranking in plain language covering WHY each
factor led to this choice.
```

### Step 4: Update the `build_cart` tool schema

Modify the tool definition to support real-world data:

- **Remove** the `retailer` enum restriction (`["Amazon", "Walmart", "Target"]`). Change to a free-form string so any retailer name works.
- **Add** new optional fields to each cart item:
  - `url` (string) -- direct link to the product page
  - `rating` (number) -- star rating (e.g. 4.5)
  - `review_count` (number) -- number of reviews
  - `shipping_cost` (number) -- shipping cost (0 = free)
  - `original_price` (number) -- price before discount, if applicable
  - `discount_label` (string) -- e.g. "20% off", "Buy 2 Get 1"
- Same changes apply to items in `alternative_sets`
- Update `generate_checkout` tool to also remove the retailer enum

### Step 5: Update TypeScript types (`src/types/chat.ts`)

Update `CartRecommendationItem`:
- Change `retailer` from `"Amazon" | "Walmart" | "Target"` to `string`
- Add optional fields: `url`, `rating`, `review_count`, `shipping_cost`, `original_price`, `discount_label`

### Step 6: Update the Cart UI (`src/components/CartRecommendation.tsx`)

- **Retailer colors**: Instead of only 3 hardcoded colors, use a dynamic color assignment for any retailer name (hash the name to pick from a palette)
- **Product details**: Show rating stars, review count, shipping cost, and discount badge when available
- **Product link**: Make the product name clickable, linking to the `url` if available
- **Shipping info**: Show "Free shipping" badge or shipping cost next to delivery days

### Step 7: Update the Checkout UI

- Remove the retailer enum from `CheckoutSimulation.tsx` and `RetailerBadge.tsx` so any retailer string works
- The `RetailerBadge` component should handle arbitrary retailer names gracefully

### Step 8: Update the landing page and header text

- Change "Amazon, Walmart, Target" references to "across the internet" or "all online stores"
- Update the landing page description and header subtitle

### Step 9: Update the review stage prompt

- For replacements, the AI will trigger a new Firecrawl search for alternatives in that specific category rather than referencing the old static catalog
- The edge function will detect replacement requests in the review stage and run a targeted search before calling OpenAI

### Step 10: Update `src/config/agentStages.ts`

Keep the frontend reference prompts in sync with the edge function changes. Update the `systemPrompt` for research, review, and clarify stages.

---

## Technical details

### Firecrawl search call structure

```text
POST https://api.firecrawl.dev/v1/search
Headers:
  Authorization: Bearer [FIRECRAWL_API_KEY]
  Content-Type: application/json
Body:
  {
    "query": "buy wireless earbuds online reviews price shipping",
    "limit": 5,
    "scrapeOptions": { "formats": ["markdown"] }
  }
```

Each search returns up to 5 results with title, URL, description, and scraped markdown content containing pricing and review data.

### Token management

- 10 item categories x 5 results = 50 products max
- Each result's markdown is truncated to ~500 chars to keep total context under 25K tokens
- This fits comfortably within GPT-4o-mini's 128K context window

### Edge function timeout handling

Firecrawl searches may take 3-10 seconds per query. Running them in parallel (Promise.allSettled) keeps total search time under 15 seconds. The edge function has a 60-second timeout, leaving plenty of room.

### Retailer-specific search queries

When the user selects specific retailers, the search query includes `site:` filters:
```text
"wireless earbuds site:amazon.com site:shein.com site:temu.com"
```

When "Any" is selected, no site filter is applied -- Firecrawl searches the entire web.

---

## Files modified

| File | Change |
|------|--------|
| `supabase/functions/ai-shopping-agent/index.ts` | Remove static catalog; add Firecrawl search functions; update research/review/clarify prompts; update tool schemas |
| `supabase/config.toml` | No change needed (function already configured) |
| `src/types/chat.ts` | Update CartRecommendationItem: retailer to string, add url/rating/review_count/shipping_cost/original_price/discount_label |
| `src/config/agentStages.ts` | Update system prompts for research/review/clarify stages; update tool definitions to remove retailer enum |
| `src/components/CartRecommendation.tsx` | Dynamic retailer colors; show ratings, reviews, shipping cost, discount badges; clickable product links |
| `src/components/CheckoutSimulation.tsx` | Remove hardcoded retailer enum |
| `src/components/RetailerBadge.tsx` | Handle any retailer name |
| `src/pages/Index.tsx` | Update "Amazon, Walmart, Target" text to "across the internet" |
| `src/hooks/useChat.ts` | Map new fields (url, rating, shipping_cost, etc.) from build_cart response |

