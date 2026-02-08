

# Fix Auth + Device-Adaptive Touch-Friendly Interface

This plan addresses two critical issues: the app is completely broken due to authentication gates (401 errors), and the interface needs to be tailored to each device type with enhanced touch friendliness.

---

## Part 1: Fix the 401 -- Remove Authentication Gates

The app is currently non-functional because two auth gates block every request.

### 1A. Frontend: `src/hooks/useChat.ts`

**Problem:** Lines 42-47 call `supabase.auth.getSession()` and throw "Not authenticated" when no session exists. Since there is no login flow, this always fails.

**Fix:**
- Remove the `supabase.auth.getSession()` call and the "Not authenticated" guard
- Send the anon key as the Bearer token instead (standard pattern for public edge functions)
- Remove the unused `supabase` import

### 1B. Edge Function: `supabase/functions/ai-shopping-agent/index.ts`

**Problem:** Lines 736-761 validate the Bearer token with `supabase.auth.getUser()` and return 401 when the token is the anon key (not a user JWT).

**Fix:**
- Remove the entire JWT authentication block (lines 736-761)
- Remove the `createClient` import since it is no longer needed
- Keep the IP-based rate limiting (already in place)
- Keep all input validation (already in place)
- The `verify_jwt = false` config already allows public access at the gateway level

### 1C. Cleanup (optional)

Remove unused auth files that are not referenced anywhere:
- `src/pages/Auth.tsx`
- `src/hooks/useAuth.tsx`
- `src/components/ProtectedRoute.tsx`

---

## Part 2: Device-Adaptive Interface

Create a `useDeviceType` hook that detects the device category and pointer type, then use it to tailor layouts and interactions across all components.

### 2A. New Hook: `src/hooks/useDeviceType.ts`

Detects three dimensions:
- **Screen class:** `mobile` (under 640px), `tablet` (640-1024px), `desktop` (over 1024px)
- **Pointer type:** `coarse` (touch) or `fine` (mouse/trackpad)
- **Orientation:** `portrait` or `landscape`

Uses `matchMedia` listeners for live updates when a device rotates or windows resize.

### 2B. Landing Page Adaptation: `src/pages/Index.tsx`

- **Mobile:** Single-column "How it works" cards, compact hero text (`text-3xl`), smaller example prompts, full-bleed layout
- **Tablet:** Two-column example prompts, medium hero text (`text-4xl`), sidebar slides in with gesture-like overlay
- **Desktop:** Three-column how-it-works, full hero text (`text-5xl/6xl`), persistent sidebar
- **Touch devices:** Larger "Start Shopping" button (56px height), larger spacing between example prompts for fat-finger safety

### 2C. Chat Interface Adaptation: `src/pages/Index.tsx`

- **Mobile touch:** Bottom-sheet style sidebar (slides up from bottom instead of from left), chat input has larger padding, message bubbles use full width
- **Tablet:** Sidebar width increases to 280px, chat area maxes at `max-w-3xl`
- **Desktop:** Persistent sidebar, wider chat area
- Use `useDeviceType` to control sidebar behavior (swipe-to-dismiss on touch, click-overlay on desktop)

### 2D. Component-Level Tailoring

**ItemChecklist (`src/components/ItemChecklist.tsx`):**
- Mobile: `grid-cols-1` for narrow phones (under 380px), `grid-cols-2` otherwise
- Tablet/Desktop: `grid-cols-2 sm:grid-cols-3`
- Touch: Larger checklist buttons with more padding (`py-4`), active state has a slight scale animation for tactile feedback

**ClarificationForm (`src/components/ClarificationForm.tsx`):**
- Touch: All input fields get `h-12` (48px) instead of `h-10`
- Multiselect chips get `min-h-[44px]` and `px-3 py-2` for easier tapping
- Mobile: Stack form fields single-column, full-width selects

**CartRecommendation (`src/components/CartRecommendation.tsx`):**
- Touch: Replace button shows immediately (already has `touch-visible`), make it 44px
- Mobile: Cart item names wrap instead of truncate
- Action buttons (Optimize Budget/Delivery) get `h-12` on touch devices

**CartItemExplorer (`src/components/CartItemExplorer.tsx`):**
- Touch: Accordion items expand with a single tap (already works), but add active:scale-[0.98] for tactile feedback
- Mobile: Sort dropdown becomes full-width
- Tab triggers get `min-h-[44px]` on touch devices

**CheckoutForm (`src/components/CheckoutForm.tsx`):**
- Touch: Input height becomes `h-12`, City/State/ZIP grid changes from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` on very small screens
- Add `inputMode="numeric"` to ZIP and card fields for numeric keyboard on mobile
- Add `autocomplete` attributes for autofill on all devices

**ExamplePrompts (`src/components/ExamplePrompts.tsx`):**
- Touch: Add `active:scale-[0.98]` for tactile press feedback
- Mobile: Single column layout, full-width cards
- Desktop: Two-column grid (already in place)

**ChatInput (`src/components/ChatInput.tsx`):**
- Touch: Textarea gets `text-base` (16px, already in place), send button stays `h-10 w-10`
- Add `enterKeyHint="send"` to the textarea for mobile keyboards showing "Send" instead of "Return"

**StageIndicator (`src/components/StageIndicator.tsx`):**
- Touch: Stage dots become tappable with tooltip-like label on tap
- Mobile: Show current stage label always (remove `hidden sm:inline`)
- Add `min-h-[28px]` to the dot row for easier interaction

### 2E. CSS Enhancements: `src/index.css`

Add device-aware utility classes:

```css
/* Tactile feedback for touch devices */
@media (pointer: coarse) {
  .touch-active:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }
  
  /* Disable hover effects that cause "sticky hover" on touch */
  .touch-no-hover:hover {
    background-color: inherit;
  }
}

/* Landscape phone adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .landscape-compact {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
}
```

### 2F. Swipe-to-Close Sidebar on Touch

In `src/pages/Index.tsx`, add touch event handlers to the sidebar overlay:
- Track `touchstart` and `touchmove` events
- When swiping left more than 80px, close the sidebar
- Add `will-change: transform` for smooth animation

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/hooks/useChat.ts` | Remove auth gate, use anon key as Bearer token |
| `supabase/functions/ai-shopping-agent/index.ts` | Remove JWT auth block, keep rate limiting |
| `src/hooks/useDeviceType.ts` | **NEW** -- device type, pointer, orientation detection hook |
| `src/pages/Index.tsx` | Device-adaptive layouts, swipe-to-close sidebar, responsive hero |
| `src/components/ItemChecklist.tsx` | Touch-friendly grid, tactile feedback |
| `src/components/ClarificationForm.tsx` | Larger touch targets, mobile stacking |
| `src/components/CartRecommendation.tsx` | Touch-friendly actions, mobile word-wrap |
| `src/components/CartItemExplorer.tsx` | Tactile feedback, full-width sort on mobile |
| `src/components/CheckoutForm.tsx` | Numeric keyboards, autocomplete, responsive grid |
| `src/components/ExamplePrompts.tsx` | Tactile press feedback, mobile single-column |
| `src/components/ChatInput.tsx` | `enterKeyHint="send"` for mobile keyboards |
| `src/components/StageIndicator.tsx` | Always-visible label, larger touch area |
| `src/index.css` | Touch-active utility, landscape mode, sticky-hover fix |
| `src/pages/Auth.tsx` | **DELETE** -- unused |
| `src/hooks/useAuth.tsx` | **DELETE** -- unused |
| `src/components/ProtectedRoute.tsx` | **DELETE** -- unused |

---

## Priority Order

```text
CRITICAL (app is broken without this):
  1. Remove auth gate in useChat.ts
  2. Remove JWT auth in edge function + redeploy

DEVICE ADAPTATION:
  3. Create useDeviceType hook
  4. Adapt Index.tsx layout per device class
  5. Touch-friendly component updates (all components)
  6. CSS utility additions
  7. Mobile keyboard optimizations (enterKeyHint, inputMode)

CLEANUP:
  8. Delete unused auth files
```

