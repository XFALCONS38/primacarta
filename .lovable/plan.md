

# Fix Product Discovery, Links, Dynamic Forms, and Sort Controls

## Problems Identified

1. **Only 1 product found per category** -- Firecrawl returns up to 5 results per category, but only the AI's single "winner" plus alternative set items are shown. All discovered candidates should be visible in the explorer.
2. **Product links don't go to actual product pages** -- The LLM rewrites/hallucinates URLs instead of preserving the real Firecrawl result URLs. Links must come directly from search results.
3. **No sort controls in the explorer** -- Users cannot sort items by price, rating, delivery speed, etc.
4. **Clarification form fields are hardcoded** -- The prompt forces the same fixed fields (age_group, gender, size, colors, style) regardless of what the user is shopping for. A hackathon supply kit doesn't need "gender" or "size". The AI should generate context-appropriate fields.
5. **Item category suggestions feel generic/fixed** -- The AI should tailor categories specifically to the user's scenario.

---

## Implementation Plan

### 1. Pass ALL Search Candidates to the Frontend

**File: `supabase/functions/ai-shopping-agent/index.ts`**

- Increase Firecrawl search `limit` from `5` to `10` per category to get more candidates
- After Firecrawl searches complete, return the raw search results alongside the AI response so the frontend can display ALL discovered products
- Modify the edge function response format: instead of just `{ type, tool, data, text }`, add a `searchCandidates` field containing all raw search results grouped by category with their original URLs preserved
- Each candidate will include: `title`, `url` (original Firecrawl URL), `price` (extracted), `retailer` (extracted from domain), `description`

The response structure changes to:
```text
{
  type: "tool_call",
  tool: "build_cart",
  data: { ... },           // AI's ranked picks
  text: "...",
  searchCandidates: {       // NEW: all raw results
    "Jersey": [
      { name: "...", url: "https://amazon.com/...", retailer: "Amazon", ... },
      { name: "...", url: "https://shein.com/...", retailer: "Shein", ... },
      ...
    ],
    "Cap": [ ... ]
  }
}
```

### 2. Fix Product Links -- Preserve Real URLs

**File: `supabase/functions/ai-shopping-agent/index.ts`**

- Update `buildResearchPrompt()` to explicitly instruct the LLM: "Use the EXACT URLs from the search results. Do NOT modify, shorten, or fabricate URLs."
- Add a post-processing step after the AI returns `build_cart`: cross-reference each item's URL against the original Firecrawl results by matching product name/title. If the AI's URL doesn't match any real result, replace it with the closest matching Firecrawl URL.
- This ensures every product link is a real, clickable URL from Firecrawl.

### 3. Add Sort Controls to CartItemExplorer

**File: `src/components/CartItemExplorer.tsx`**

- Add a sort dropdown at the top of each category tab with options:
  - Score (default, current behavior)
  - Price: Low to High
  - Price: High to Low
  - Rating: Best First
  - Delivery: Fastest First
  - Reviews: Most Reviewed
- Store sort selection per category tab using local state
- Re-sort the items array based on the selected criterion before rendering

### 4. Make Clarification Form Fully Dynamic (AI-Generated)

**Files: `supabase/functions/ai-shopping-agent/index.ts`, `src/config/agentStages.ts`**

Current behavior: The `clarify` prompt hardcodes 9+ specific fields. This means every shopping scenario gets the same form regardless of context.

New behavior: Update the `clarify` system prompt to:
- Keep only 3 mandatory fields: `budget`, `location`, and `delivery_by`
- Instruct the AI to dynamically generate additional fields relevant to the specific product categories the user selected
- For example:
  - Skiing outfit: generates fields for "Insulation type", "Waterproof rating", "Boot size", "Preferred colors"
  - Hackathon kit: generates fields for "Number of attendees", "Dietary restrictions", "Prize budget", "Venue type"
  - Super Bowl outfit: generates fields for "Team name", "Jersey size", "Hat style", "Color scheme"
- The AI decides what fields are relevant based on the items selected and the original user prompt
- Remove the hardcoded field lists from both `agentStages.ts` (frontend) and the edge function prompt

### 5. Update CartItemExplorer to Show ALL Candidates

**Files: `src/components/CartItemExplorer.tsx`, `src/hooks/useChat.ts`, `src/types/chat.ts`**

- Add a new `searchCandidates` field to `CartRecommendation` type (and to `ChatMessage` via `cartData`)
- Update `useChat.ts` `handleToolCallResponse` for `build_cart` to read `searchCandidates` from the edge function response and merge them into the cart data
- Update `CartItemExplorer` to display candidates from `searchCandidates` in addition to the AI's main and alternative picks
- Each candidate card shows: name (clickable link to real URL), retailer, price, and a "data from search" badge to distinguish from AI-ranked picks

### 6. Make Item Category Suggestions Truly Dynamic

**File: `supabase/functions/ai-shopping-agent/index.ts`**

- Update the `identify` system prompt to emphasize: "Analyze the user's specific scenario and suggest item categories that are uniquely relevant to THEIR request. Do NOT use generic categories."
- Add examples in the prompt to guide the AI:
  - "Skiing outfit" should yield categories like "Ski Jacket", "Ski Pants", "Base Layer", "Goggles", "Gloves", "Ski Socks", "Helmet", "Neck Gaiter"
  - "Hackathon for 60 people" should yield "Snack Boxes", "Name Badges", "USB-C Adapters", "Banner/Signage", "Trophies/Prizes", "Extension Cords", "Stickers"

---

## Files Changed Summary

| File | Change |
|---|---|
| `supabase/functions/ai-shopping-agent/index.ts` | Increase search limit to 10. Return `searchCandidates` in response. Fix URL preservation. Update clarify prompt to be dynamic. Update identify prompt for better categories. Post-process URLs. |
| `src/components/CartItemExplorer.tsx` | Add sort dropdown per category tab. Accept and display `searchCandidates`. |
| `src/hooks/useChat.ts` | Read `searchCandidates` from edge function response and store in cart data. |
| `src/types/chat.ts` | Add `searchCandidates` field to `CartRecommendation` type. |
| `src/config/agentStages.ts` | Update clarify prompt to remove hardcoded fields. Update identify prompt. |

---

## Technical Details

### URL Preservation Logic (Edge Function)

```text
After AI returns build_cart:
1. Collect all Firecrawl URLs into a map: { normalizedTitle -> originalURL }
2. For each item in AI's response:
   a. If item.url matches a known Firecrawl URL -> keep it
   b. If not, fuzzy-match item.name against Firecrawl titles
   c. Replace with best-matching real URL
3. Same for alternative_sets items
```

### Sort Control UI

A small `Select` dropdown placed between the tab triggers and the item list:
```text
[Score v] [Price: Low-High] [Rating] [Delivery] [Reviews]
```

Each option re-sorts the current category's items. Default is "Score" (composite scoring).

### Dynamic Clarification Prompt (Key Change)

The new prompt tells the AI:
```text
"Generate a form with fields specifically relevant to the user's 
selected item categories. ALWAYS include budget, location, and 
delivery deadline. Then add 4-8 fields that make sense for THIS 
specific shopping scenario. Do NOT use a fixed template."
```

This ensures a hackathon kit gets "Number of attendees" while a skiing outfit gets "Jacket size" and "Waterproof rating".

