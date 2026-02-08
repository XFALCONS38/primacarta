

# "CartPilot" — Rebrand + Challenge Gap Analysis & Implementation Plan

## Naming

Rename from "AI Shopping Agent" to **<Prima** — your AI co-pilot for shopping across the internet. It's short, memorable, aligns with the "delegation" theme of the challenge ("The future of commerce isn't more filters or better search. It's delegation."), and plays on the trending "copilot" AI concept.

Tagline: *"Describe it. We cart it."*

Other options if you prefer: **Swoop**, **Cartable**, **HAUL**, or **Kart**.

---

## Challenge Scorecard: What's Built vs What's Missing

| Requirement | Status | Notes |
|---|---|---|
| Conversational brief + constraints capture | DONE | identify, select, clarify stages |
| Structured shopping spec (JSON) | PARTIAL | Captured internally but never shown to user |
| Multi-retailer discovery (3+ retailers) | DONE | Firecrawl searches across all stores |
| Ranking engine with transparent logic | DONE | Weighted scoring with explanation |
| "Why is this option ranked #1?" | DONE | Collapsible ranking explanation |
| Single combined cart view | DONE | Multi-retailer cart with budget bar |
| Cart modification + agent adapts | DONE | Replace, swap, select alternative sets |
| Checkout: address + payment entered ONCE | MISSING | Currently skips straight to simulation steps without collecting info |
| Checkout: agent fans out per retailer (simulated) | DONE | Animated step-by-step per retailer |
| Budget optimizer ("same setup, cheaper") | MISSING | Stretch goal from challenge |
| Delivery optimizer ("everything by Friday") | MISSING | Stretch goal from challenge |
| Decision trace / Explain mode | PARTIAL | Overall explanation exists, no per-item trace |
| Example scenarios match challenge | NO | Challenge gives 3 specific scenarios; current examples are generic |
| Search progress feedback | MISSING | User sees only a typing indicator during 10-15s search |
| Landing page for VC demo | WEAK | Generic look, no value props or wow factor |

---

## Implementation Plan

### 1. Rebrand: CartPilot

**Files changed:** `index.html`, `src/pages/Index.tsx`, `src/components/ExamplePrompts.tsx`, `src/components/TypingIndicator.tsx`, `src/components/SessionHistory.tsx`, `src/components/ChatMessage.tsx`

- Change all "AI Shopping Agent" and "Shop Genie" references to "CartPilot"
- Update page title in `index.html`
- Update header, landing page title, and subtitle
- New tagline: "Describe it. We cart it."
- Replace the ShoppingCart icon in the header/avatar with a custom icon or keep ShoppingCart but with the "CartPilot" text

### 2. Landing Page Overhaul for VC Demo

**File:** `src/pages/Index.tsx`

Transform the landing page from a simple centered card into a compelling VC demo page:

- Hero section with CartPilot name, tagline, and animated gradient background
- Three-step visual: "Describe" arrow "We Search" arrow "You Buy" (using icons)
- Value props row: "50+ Retailers", "Smart Ranking", "One Checkout"
- Example prompts updated to the 3 challenge scenarios (below)
- "How it works" mini flow diagram using the 6-stage pipeline
- Clean, modern design that looks like a real product

### 3. Example Prompts: Challenge Scenarios

**File:** `src/components/ExamplePrompts.tsx`

Replace current generic prompts with the 3 challenge scenarios plus 2 more:

```text
1. "Full Patriots outfit head-to-toe, budget $150, delivered by Friday"
   -> Super Bowl Party Outfit

2. "Downhill skiing outfit, warm and waterproof, size M, budget $400, delivery within 5 days"
   -> Skiing Outfit

3. "I'm hosting a hackathon for 60 people - figure out snacks, badges, adapters, decorations, and prizes at the best price"
   -> Hackathon Host Kit

4. "Birthday party supplies for 20 people under $100"
   -> Party Supplies

5. "Complete travel accessories kit under $100"
   -> Travel Kit
```

### 4. Checkout: Collect Address + Payment Once, Then Fan Out

**Critical challenge requirement.** The current checkout skips collecting user info entirely.

**New file:** `src/components/CheckoutForm.tsx`

A single form that collects:
- Full name
- Shipping address (street, city, state, ZIP)
- Payment method (simulated card: last 4 digits only, no real data)
- Email for order confirmation

**Flow change in `useChat.ts` and `CheckoutSimulation.tsx`:**

```text
Current:  Cart -> "Confirm & Checkout" -> animated step-by-step
New:      Cart -> "Confirm & Checkout" -> CheckoutForm (fill once)
          -> "Place Orders" -> animated step-by-step per retailer
          -> Each retailer step shows "Using address: [user's address]"
          -> Final: "Confirmation email sent to [email]" (simulated)
```

**Implementation:**
- Add `checkoutInfo` state to `useChat.ts` (name, address, payment, email)
- New `CheckoutForm` component renders between cart confirmation and simulation
- Update `CheckoutSimulation` to display the user's address/payment at each retailer step
- After simulation completes, show a simulated email confirmation card

### 5. Search Progress Indicator

**File:** `src/components/SearchProgress.tsx` (new), `src/hooks/useChat.ts`, edge function

Currently the user sees only a generic typing indicator for 10-15 seconds while Firecrawl searches. This is the weakest UX moment.

**Option A (simpler, no backend changes):**
- Replace the typing indicator during the research stage with a `SearchProgress` component
- Show animated text: "Searching jerseys across 50+ stores...", "Comparing prices...", "Ranking by reviews, delivery, and value..."
- Use a rotating list of messages with a progress bar (time-based, ~15 seconds)

**Option B (backend streaming, more complex):**
Not feasible within time constraints since it requires SSE/streaming from the edge function.

Go with **Option A** — a visually impressive simulated progress that makes the wait feel productive.

### 6. Budget Optimizer ("Same Setup, Cheaper")

**Files:** `src/components/CartRecommendation.tsx`, `src/hooks/useChat.ts`, edge function

Add a "Find Cheaper" button to the cart UI (next to "Confirm & Checkout"):

- Button with a tag/dollar icon: "Optimize Budget"
- When clicked, sends a message to the review stage: "Find cheaper alternatives for all items while keeping the same categories and quality level. Prioritize lowest total cost."
- The edge function triggers fresh Firecrawl searches for each category with price-focused queries
- Returns a new cart with budget-optimized picks

### 7. Delivery Optimizer ("Everything by Friday")

**Files:** Same as above

Add a "Speed Up Delivery" button:

- Button with a truck/clock icon: "Optimize Delivery"
- When clicked, sends: "Re-rank all items prioritizing fastest delivery. Everything should arrive within [delivery_by date or 3 days]. Prioritize retailers with free/fast shipping."
- Returns re-ranked cart favoring fast-shipping retailers

### 8. Structured Shopping Spec Display

**New file:** `src/components/ShoppingSpec.tsx`

After the clarification form is submitted, display a collapsible "Shopping Spec" card that shows the extracted JSON:

```text
Shopping Spec
{
  "scenario": "Super Bowl Party Outfit",
  "budget": 150,
  "delivery_by": "Friday",
  "location": "02101",
  "items": ["Jersey", "Cap", "Sneakers", ...],
  "preferences": {
    "team": "Patriots",
    "size": "L",
    "style": "sporty"
  }
}
```

This directly addresses the challenge requirement: "Output: a structured shopping spec (e.g. JSON)."

**Implementation:**
- Parse the clarification values + selected items into a clean JSON spec
- Show it as a collapsible card in the chat after clarification submission
- Add it as an assistant message with a new `shoppingSpec` field on `ChatMessage`

### 9. Per-Item Decision Trace

**Files:** `src/components/CartRecommendation.tsx`, edge function prompt

Enhance the cart UI to show why each specific item was chosen:

- Add a small info icon next to each cart item
- On click/hover, show a tooltip: "Best value: 4.5 stars with 2,300 reviews. Free shipping. 15% cheaper than alternatives."
- Update the edge function's research prompt to include a `reason` field per item in the build_cart tool schema
- Update `CartRecommendationItem` type to include `reason?: string`

### 10. Remove Dead Code

**File to delete:** `src/data/products.ts`

This static 85-item mock catalog is no longer used anywhere (Firecrawl handles all product search now). Remove it to keep the codebase clean.

### 11. Dark Mode Support

**Files:** `src/App.tsx`, `src/pages/Index.tsx`

- next-themes is already installed but not configured
- Add `ThemeProvider` wrapper in `App.tsx`
- Add a sun/moon toggle button in the chat header
- The CSS already has `.dark` variables defined

---

## Priority Order for Implementation

Since this is for a 24-hour hackathon, here's the execution order by impact:

```text
Priority 1 - MUST (directly judged):
  1. Rebrand to CartPilot (15 min)
  2. Example prompts -> 3 challenge scenarios (10 min)
  3. Checkout form: address + payment once (45 min)
  4. Search progress indicator (20 min)
  5. Landing page overhaul (30 min)

Priority 2 - HIGH IMPACT (stretch goals that impress):
  6. Budget optimizer button (20 min)
  7. Delivery optimizer button (15 min)
  8. Structured shopping spec display (20 min)

Priority 3 - POLISH:
  9. Per-item decision trace (25 min)
  10. Remove dead code (5 min)
  11. Dark mode toggle (15 min)
```

---

## Files Changed Summary

| File | Change |
|---|---|
| `index.html` | Title to "CartPilot" |
| `src/pages/Index.tsx` | Full landing page overhaul + rebrand |
| `src/components/ExamplePrompts.tsx` | 3 challenge scenarios + 2 extras |
| `src/components/CheckoutForm.tsx` | NEW: address + payment form (enter once) |
| `src/components/SearchProgress.tsx` | NEW: animated search progress during research |
| `src/components/ShoppingSpec.tsx` | NEW: structured JSON spec display |
| `src/components/CartRecommendation.tsx` | Add "Optimize Budget" + "Optimize Delivery" buttons, per-item reason tooltip |
| `src/components/CheckoutSimulation.tsx` | Show user's address/payment at each retailer step, email confirmation |
| `src/components/ChatMessage.tsx` | Render ShoppingSpec + SearchProgress components |
| `src/hooks/useChat.ts` | Checkout form state, optimizer actions, shopping spec generation, search progress stage |
| `src/types/chat.ts` | Add `reason` to CartRecommendationItem, `shoppingSpec` to ChatMessage, `CheckoutInfo` type |
| `src/config/agentStages.ts` | Add `reason` field to build_cart tool schema |
| `supabase/functions/ai-shopping-agent/index.ts` | Add `reason` per item in research prompt, update tool schema |
| `src/App.tsx` | ThemeProvider wrapper |
| `src/data/products.ts` | DELETE (dead code) |

