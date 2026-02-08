

# Streamlined AI Shopping Agent — Updated Plan

## Overview

Redesign the shopping agent workflow so the AI is concise and efficient. Instead of the AI doing all the research upfront and talking too much, it now follows a **lean workflow**: identify the occasion, present a quick checklist of item categories for the buyer to select, collect any missing details via structured forms, and THEN do market research only on the selected items.

---

## Build Fixes (Do First)

Two existing build errors must be resolved before any new features:

1. **CSS import order**: Move the Google Fonts `@import` to the very top of `src/index.css`, before `@tailwind` directives ✅
2. **Missing dependency**: Install `react-markdown` (used by ChatMessage.tsx but not in package.json) ✅

---

## OpenAI API Key Setup

- Store your OpenAI API key as a backend secret (named `OPENAI_API_KEY`) ✅
- You will be prompted to paste the key securely — it is never stored in code
- The edge function will use this key to call OpenAI's API directly (e.g., GPT-4o, GPT-4o-mini, or whichever model you prefer)

---

## New Workflow (Streamlined) ✅

The current AI talks too much and does everything at once. The new flow is stage-based and buyer-driven:

```text
Stage 1: IDENTIFY
  User says "I need stuff for a Patriots tailgate party under $200"
  AI responds briefly: "Got it — Patriots tailgate, $200 budget."
  AI presents a SELECTABLE CHECKLIST of item categories:
    [ ] Jersey        [ ] Cap           [ ] Hoodie
    [ ] Snacks gear   [ ] Cooler bag    [ ] Face paint
    [ ] Foam finger   [ ] Team towel    [ ] Drinks bottle
  (These are suggested based on the occasion, not from market research)

Stage 2: SELECT
  Buyer checks the items they want (e.g., Jersey, Cap, Hoodie, Team towel)
  Buyer clicks "Find these items"

Stage 3: CLARIFY (only if needed)
  AI checks what info is missing for the selected items
  Presents a STRUCTURED FORM with fields:
    Scenario:    [Patriots tailgate     ] (pre-filled, editable)
    Budget:      [$200                  ] (pre-filled, editable)
    Delivery by: [_______________      ] (blank, required)
    Jersey Size: [ S | M | L | XL     ] (blank, required)
    Cap Style:   [ Fitted | Snapback  ] (blank, required)
    Hoodie Size: [ S | M | L | XL     ] (blank, required)
  All known values are pre-filled. Only new fields are blank.
  Buyer can edit any value.

Stage 4: RESEARCH
  AI searches the mock catalog ONLY for the selected items
  Finds best options across Amazon, Walmart, and Target
  Presents results concisely as a cart with dashboard visualizations

Stage 5: REVIEW
  Buyer can replace individual items or adjust the cart
  Budget charts and delivery timeline update in real-time

Stage 6: CHECKOUT
  Animated step-by-step checkout simulation per retailer
```

---

## New Components

### 1. ItemChecklist (`src/components/ItemChecklist.tsx`) ✅
- Renders a grid of selectable item cards with checkboxes
- Each card shows an emoji icon and item name
- "Find these items" button at the bottom
- The AI generates the checklist items based on the occasion (not hardcoded)
- Appears inline in the chat as a special message type

### 2. ClarificationForm (`src/components/ClarificationForm.tsx`) ✅
- Card with dynamic form fields rendered inline in the chat
- Field types: text input, number input, dropdown select, multi-select checkboxes
- Pre-fills known values (editable), leaves unknown fields blank
- "Submit Details" button sends structured data back to chat
- Category-specific fields (apparel needs sizes, electronics needs compatibility, etc.)

---

## Stage Configuration (`src/config/agentStages.ts`) ✅

A configuration file defining:
- Stage names, order, and descriptions
- **System prompts for each stage** — placeholder prompts you can fully customize
- Field definitions per product category (what to ask for apparel vs electronics vs party supplies)
- The prompts control exactly how the AI behaves at each step

Initial system prompt structure (all customizable by you):

| Stage | Prompt Purpose |
|-------|---------------|
| IDENTIFY | Parse occasion and budget. Return a JSON list of suggested item categories. Be brief. |
| CLARIFY | Determine missing details for selected items. Return a JSON list of form fields needed. |
| RESEARCH | Search catalog for selected items only. Return structured cart JSON. Stay concise. |
| REVIEW | Handle item replacements. Suggest 2-3 alternatives. Update cart JSON. |
| CHECKOUT | Generate checkout simulation steps per retailer. |

---

## Updated Types (`src/types/chat.ts`) ✅

New types added:
- `WorkflowStage`: enum of the 6 stages
- `ChecklistItem`: { id, label, emoji, selected }
- `ClarificationField`: { id, label, type, value, options, required }
- `ClarificationRequest`: { title, fields[] }
- Updated `ChatMessage` to include optional `checklist`, `clarificationRequest`, and `stage` fields

---

## Updated Edge Function (`supabase/functions/ai-shopping-agent/index.ts`) ✅

Major changes:
- Switch from Lovable AI gateway to **direct OpenAI API** using your `OPENAI_API_KEY`
- Accept a `stage` parameter to load stage-specific system prompts
- Use **tool calling** for structured outputs:
  - `suggest_items` tool: AI returns a checklist of suggested items for the occasion
  - `request_clarification` tool: AI returns form fields it needs
  - `build_cart` tool: AI returns structured cart data
- Non-streaming mode for tool-call responses (checklist, forms)
- Streaming mode for conversational text responses
- Concise system prompts that instruct the AI to be brief and action-oriented

---

## Updated `useChat` Hook (`src/hooks/useChat.ts`) ✅

- Track current `workflowStage` state
- Handle three response types: streaming text, tool-call JSON (checklist/forms), and structured cart data
- New functions:
  - `submitChecklist(selectedItems[])`: sends selected items and advances to clarify/research stage
  - `submitClarification(fieldValues)`: sends form data and advances to research stage
- Parse tool-call responses from OpenAI format and create special message types

---

## Updated `ChatMessage` Component (`src/components/ChatMessage.tsx`) ✅

- Detect message type and render the appropriate component:
  - Regular text: render with ReactMarkdown (as now)
  - Checklist message: render `ItemChecklist` component
  - Clarification message: render `ClarificationForm` component
  - Cart message: render `CartDashboard` component

---

## Updated `Index.tsx` ✅

- Show subtle stage indicator in header (e.g., "Step 2 of 6 - Select Items")
- Pass clarification/checklist handlers down to message components
- Wire up the full stage-based flow

---

## AI Behavior Changes (Less Verbose)

The AI will be instructed to:
- Never write more than 2-3 sentences of conversational text
- Use structured UI components (checklists, forms, cart tables) instead of long text explanations
- Only explain choices when the buyer specifically asks "Why did you pick this?"
- Skip pleasantries and get straight to the point
- Present data visually (charts, tables) rather than describing it in paragraphs

---

## Files Changed / Created

| File | Action | Purpose |
|------|--------|---------|
| `src/index.css` | Edit ✅ | Move @import to top (build fix) |
| `package.json` | Edit ✅ | Add react-markdown dependency |
| `src/config/agentStages.ts` | Create ✅ | Stage definitions and system prompts |
| `src/types/chat.ts` | Edit ✅ | Add ChecklistItem, ClarificationField, WorkflowStage types |
| `src/components/ItemChecklist.tsx` | Create ✅ | Selectable item grid for Stage 2 |
| `src/components/ClarificationForm.tsx` | Create ✅ | Structured form for missing details |
| `src/components/CartRecommendation.tsx` | Create ✅ | Cart display card for Stage 4 |
| `src/components/StageIndicator.tsx` | Create ✅ | Stage progress dots in header |
| `src/components/ChatMessage.tsx` | Edit ✅ | Render checklist/form/cart based on message type |
| `src/hooks/useChat.ts` | Edit ✅ | Stage tracking, tool-call parsing, submit handlers |
| `supabase/functions/ai-shopping-agent/index.ts` | Edit ✅ | OpenAI direct API, stage prompts, tool calling |
| `src/pages/Index.tsx` | Edit ✅ | Stage indicator, wire up new handlers |

---

## Technical Notes

- **OpenAI API**: Called directly from the edge function using your API key (not through the Lovable gateway)
- **Model**: You can specify which OpenAI model to use (GPT-4o, GPT-4o-mini, etc.) — I will default to `gpt-4o-mini` for speed/cost but this is easily configurable
- **Tool calling**: Used for structured outputs (checklists, forms, carts) so the AI returns clean JSON instead of messy text
- **Streaming**: Used only for conversational text; tool-call responses are non-streaming for reliability
- **All system prompts are in one config file** (`src/config/agentStages.ts`) so you can edit every stage's behavior in one place
