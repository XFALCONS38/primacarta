

# Update System Prompts to Match Spec

The provided prompts are cleaner and more explicit than the current ones. Here is what will change and where.

---

## What needs updating

Comparing the provided prompts against the current code, the differences are:

1. **Stage 1 (Identify)** -- Minor wording differences. The new prompt is slightly more structured with clearer formatting. Current version is already close.

2. **Stage 3 (Clarify)** -- The new prompt adds explicit mention of `preferences (style, team/theme, colors, must_haves, nice_to_haves)` and session pre-fill. Current version is similar but less specific about preference fields.

3. **Stage 4 (Research)** -- The new prompt restructures as numbered steps (1-7), makes the scoring formula more prominent, and explicitly says "Do NOT hallucinate items; use catalog only." The current version covers the same ground but in a different format.

4. **Stage 5 (Review)** -- The new prompt is more concise: "suggest alternatives from the catalog" and "Return updated combined_cart JSON." Current version is more verbose with extra rules.

5. **Stage 6 (Checkout)** -- The new prompt simplifies checkout steps to "Name, Address, Payment, Confirm" and explicitly says "Do NOT stream free text. Use the structured tool output." Current version is more detailed with 4-6 steps per retailer.

---

## Changes by file

### 1. `supabase/functions/ai-shopping-agent/index.ts` (the authoritative prompts)

Update the `STAGE_PROMPTS` object (lines 94-178) with the user's refined prompts:

- **identify**: Replace with the cleaner version that uses bullet points and explicit tool call format
- **clarify**: Add explicit preference field mentions (style, team/theme, colors, must_haves, nice_to_haves) and session pre-fill instruction
- **research**: Restructure as numbered steps 1-7, keep the catalog injection (`${CATALOG_JSON}`), make scoring formula more prominent, add rule 7 "Do NOT hallucinate items; use catalog only"
- **review**: Simplify to the concise version -- no rebuild unless replacement requested, suggest from catalog, return updated cart JSON
- **checkout**: Replace with the simplified 4-step pattern (Name, Address, Payment, Confirm), add "Do NOT stream free text" rule

### 2. `src/config/agentStages.ts` (frontend reference copy)

Update the `systemPrompt` field for each stage (lines 23-118) to mirror the edge function prompts. These are used as documentation/reference on the frontend side:

- **identify** (line 23-34): Update to match new wording
- **clarify** (line 48-61): Add preference fields instruction
- **research** (line 68-81): Restructure as numbered steps with scoring formula
- **review** (line 88-102): Simplify
- **checkout** (line 109-117): Simplify to 4-step pattern with "no streaming" rule

No tool schema changes needed -- the `TOOL_DEFINITIONS` and `TOOLS` objects are already correct and complete.

No frontend logic changes needed -- `useChat.ts` already handles all tool responses correctly.

---

## Technical notes

- The edge function file is the only one that matters at runtime. The `agentStages.ts` file is kept in sync for developer reference only (it is not sent to the AI).
- The product catalog injection (`${CATALOG_JSON}`) in the research and review prompts stays exactly as-is.
- The `generate_checkout` tool and `build_cart` tool schemas remain unchanged.
- After updating the edge function, it will be redeployed automatically.

