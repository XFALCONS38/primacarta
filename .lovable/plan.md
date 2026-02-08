

# Agentic Shopping Agent -- Enhancement Plan

This plan upgrades the current shopping agent to match the provided specification, adding **ranking with explainability**, **alternative sets**, **real product catalog usage**, **per-item replace flags**, and **structured checkout simulation**.

---

## What changes and why

The spec introduces several capabilities the current code lacks:

1. **Real product catalog in the AI prompt** -- Today the AI hallucinates product names/prices. The spec requires using the actual `src/data/products.ts` catalog (approximately 85 items). The product catalog JSON will be injected into the Research stage system prompt so the AI picks from real items.

2. **Ranking formula and explainability** -- The spec defines a scoring formula: `0.4*(1-cost/budget) + 0.3*delivery_score + 0.2*preference_match + 0.1*style_coherence`. The AI must return a `ranking_explanation` for why the top set was chosen, plus 1-2 `alternative_sets`.

3. **Structured user spec** -- The spec expects a `user_spec` object (scenario, budget, delivery_by, preferences) to be extracted and returned. This will be added as a new tool output from the Identify/Clarify stages.

4. **Replace flag per cart item** -- Each item in `combined_cart` gets a `replace: boolean` flag so the Review stage UI can show a replace button per item.

5. **Structured checkout simulation** -- Instead of free-form streamed markdown, checkout returns structured JSON with `retailer` and `steps[]` arrays, allowing the existing `CheckoutSimulation` component to drive a real step-by-step UI.

---

## Implementation steps

### Step 1: Expand types (`src/types/chat.ts`)

Add new interfaces to match the spec output:

- `UserSpec` -- holds scenario, budget, delivery_by, preferences (team/theme, style, colors, must-haves, nice-to-haves)
- Update `CartRecommendationItem` to include a `replace` boolean
- `RankedSet` -- wraps an array of items with a `set_name` and `ranking_explanation`
- `CartRecommendation` gets new fields: `rankingExplanation`, `alternativeSets`
- `CheckoutStep` -- `{ retailer: string; steps: string[] }`
- Add `userSpec` and `checkoutSteps` as optional fields on `ChatMessage`

### Step 2: Update the `build_cart` tool schema (edge function + `agentStages.ts`)

Extend the `build_cart` tool parameters to include:

- `ranking_explanation` (string) -- required
- `alternative_sets` (array of `{ set_name, items[], ranking_explanation }`) -- optional
- Each item in `items` gains a `replace` (boolean) field

Add a new tool `generate_checkout` with parameters:
- `steps` (array of `{ retailer, steps[] }`)
- `grand_total` (number)

This replaces the free-form streaming checkout with a structured tool call.

### Step 3: Inject real product catalog into the Research prompt (edge function)

- Serialize the product catalog (from `src/data/products.ts`) as a JSON string and embed it directly in the edge function's `research` system prompt.
- Since edge functions cannot import from `src/`, the catalog data will be duplicated as a const inside the edge function file.
- The prompt will instruct the AI: "You MUST pick items from this catalog. Use exact names and prices."

### Step 4: Update system prompts

**Research stage prompt** changes:
- Include the full product catalog JSON
- Add instructions for the scoring formula
- Require `ranking_explanation` and at least one `alternative_set`
- Require `replace: true` on every item

**Review stage prompt** changes:
- When user asks to replace an item, reference the catalog to suggest alternatives
- Pass catalog in this prompt too

**Checkout stage** changes:
- Switch from streaming text to a tool call (`generate_checkout`)
- Add `generate_checkout` to `STAGE_TOOLS.checkout`

### Step 5: Update edge function tool handling

In `supabase/functions/ai-shopping-agent/index.ts`:

- Add the `generate_checkout` tool definition
- Add it to `STAGE_TOOLS.checkout`
- Checkout stage now uses non-streaming (tool call) instead of streaming
- Embed the product catalog as a const at the top of the file

### Step 6: Update `useChat.ts` to handle new data

- Handle `ranking_explanation` and `alternative_sets` from `build_cart` tool response
- Store them on the `CartRecommendation` object and in the message's `cartData`
- Handle `generate_checkout` tool call -- parse into `checkoutSteps` on the message
- Remove the streaming checkout path (checkout is now structured)

### Step 7: Update UI components

**CartRecommendation.tsx** -- Add:
- A "Why this set?" expandable section showing `rankingExplanation`
- Per-item "Replace" button (only shown if `replace === true` and `isLatest`)
- An "Alternatives" collapsible showing 1-2 alternative sets with their own explanations
- Clicking an alternative set replaces the current cart view

**CartDashboard.tsx** -- Add:
- Ranking explanation card
- Alternative sets comparison section

**ChatMessage.tsx** -- Add:
- Render `checkoutSteps` using the `CheckoutSimulation` component when present

**CheckoutSimulation.tsx** -- Minor update:
- Accept `steps: { retailer: string; steps: string[] }[]` directly instead of deriving from items
- Keep the animated step-through UI, but use the AI-generated step labels

### Step 8: Update `agentStages.ts` config

- Keep the stage definitions in sync with the edge function prompts
- Add `generate_checkout` to `TOOL_DEFINITIONS`
- Update `build_cart` tool definition with new fields

---

## Technical details

### Product catalog embedding

The catalog (~85 products) serialized as JSON is roughly 15-20KB. This fits well within GPT-4o-mini's context window. The catalog will be embedded as a `const PRODUCT_CATALOG` at the top of the edge function, formatted as a compact JSON array.

### Scoring formula in prompt

The research prompt will include:
```text
Score each complete set: 0.4*(1-cost/budget) + 0.3*delivery_score + 0.2*preference_match + 0.1*style_coherence
- delivery_score: 1.0 if all items arrive by deadline, scales down linearly
- preference_match: how well items match stated colors, sizes, team, style
- style_coherence: how well items look together as a set
```

### New tool: `generate_checkout`

```text
Parameters:
  steps: array of { retailer: string, steps: string[] }
  grand_total: number
```

### Files modified

| File | Change |
|------|--------|
| `src/types/chat.ts` | Add UserSpec, RankedSet, CheckoutStep types; update CartRecommendation |
| `src/config/agentStages.ts` | Update prompts, add generate_checkout tool definition |
| `supabase/functions/ai-shopping-agent/index.ts` | Embed catalog, update prompts, add generate_checkout tool, make checkout non-streaming |
| `src/hooks/useChat.ts` | Handle ranking_explanation, alternative_sets, generate_checkout responses |
| `src/components/CartRecommendation.tsx` | Add ranking explanation, replace buttons, alternative sets UI |
| `src/components/ChatMessage.tsx` | Render checkoutSteps via CheckoutSimulation |
| `src/components/CheckoutSimulation.tsx` | Accept structured steps instead of raw items |
| `src/components/CartDashboard.tsx` | Add ranking explanation display |

