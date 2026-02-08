

# Universal Access: Responsive, Touch-Friendly, and Secure

## Root Causes Found

### Why it feels "broken" on other devices

1. **`App.css` cripples the layout** -- The leftover Vite boilerplate sets `#root { max-width: 1280px; padding: 2rem; text-align: center; }`. This adds 2rem padding on every side (wasting 64px on mobile), caps width to 1280px, and center-aligns everything. The chat interface uses `h-screen` which conflicts with this padding, causing scroll/overflow issues on smaller screens.

2. **Mobile viewport height is wrong** -- The chat view uses `h-screen` (which equals CSS `100vh`). On mobile browsers, `100vh` includes the address bar, so the input area gets hidden behind the browser chrome. Need to use `100dvh` (dynamic viewport height).

3. **Touch interactions are invisible** -- Multiple components rely on hover-only patterns:
   - Session history delete button: `hidden group-hover:block` (never appears on touch)
   - Alternative item swap button: `opacity-0 group-hover:opacity-100` (invisible on touch)
   - Tooltip-based decision trace on cart items: tooltips don't open on tap by default

4. **Touch targets are too small** -- Many interactive elements are under the 44x44px minimum recommended for touch:
   - Sidebar toggle: `p-2` with 16px icon
   - Sort dropdown: `h-7` (28px)
   - Checklist items: small hit area
   - Stage indicator dots: 6px wide

5. **Cart dashboard breaks on small screens** -- `grid-cols-3` for stat cards and `grid-cols-2` for charts don't stack on mobile, causing horizontal overflow.

6. **No safe area insets** -- Modern phones with notches/dynamic islands clip content behind the notch. The sidebar toggle at `left-3 top-3` sits under the status bar on many phones.

7. **Cart Item Explorer tabs overflow** -- When there are many categories, the `TabsList` with `flex-wrap` still creates a cramped UI on narrow screens.

### Security Vulnerabilities

1. **Edge function is completely open** -- `verify_jwt = false` and no rate limiting means anyone can spam the endpoint, burning through OpenAI and Firecrawl API credits. Each call costs real money.

2. **No input sanitization on checkout form** -- The checkout form passes user input directly without sanitizing against XSS patterns. While React escapes rendered output, the data flows to edge function responses.

3. **Published URL may not be updated** -- If the user is sharing the preview URL (which is session-specific), other people genuinely can't access it. The published URL at `primacarta.lovable.app` is what should be shared.

---

## Implementation Plan

### 1. Remove App.css Boilerplate

**File: `src/App.css`**

Delete all the Vite boilerplate CSS. The `#root` constraints (`max-width: 1280px`, `padding: 2rem`, `text-align: center`) are actively breaking the full-screen chat layout. Replace with a clean reset that respects mobile viewports.

New content:
```css
#root {
  min-height: 100dvh;
  min-height: 100vh; /* fallback */
}
```

### 2. Fix Mobile Viewport Height

**File: `src/pages/Index.tsx`**

- Change `h-screen` to use dynamic viewport height via a utility class
- Add safe area padding for notched devices

**File: `src/index.css`**

Add utility classes:
```css
.h-dvh {
  height: 100dvh;
  height: 100vh; /* fallback for older browsers */
}
```

Add safe area support:
```css
@supports (padding: env(safe-area-inset-top)) {
  .safe-top { padding-top: env(safe-area-inset-top); }
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-left { padding-left: env(safe-area-inset-left); }
  .safe-right { padding-right: env(safe-area-inset-right); }
}
```

**File: `index.html`**

Add `viewport-fit=cover` to the viewport meta tag to enable safe area insets:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 3. Fix Touch Interactions

**File: `src/components/SessionHistory.tsx`**

Change the delete button from `hidden group-hover:block` to always visible on touch devices:
```
className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-destructive 
           opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
           touch-device:opacity-100 transition-opacity"
```

Since CSS can't detect touch reliably, use `@media (pointer: coarse)` in `index.css`:
```css
@media (pointer: coarse) {
  .touch-visible { opacity: 1 !important; display: block !important; }
}
```

Then apply the class to hover-dependent elements.

**File: `src/components/CartRecommendation.tsx`**

Change the swap button in `AlternativeItemRow` from hover-only to always visible on coarse pointer devices. Same pattern.

**File: `src/components/CartRecommendation.tsx`**

The `Tooltip` on cart item reason doesn't work on touch. Wrap it in a click-to-toggle popover for mobile, or use the existing reason display in the explorer instead.

### 4. Increase Touch Target Sizes

**Files: Multiple components**

Apply minimum 44px touch targets on interactive elements:

- `src/pages/Index.tsx`: Sidebar toggle -- change `p-2` to `p-3` (48px target) and move to safe area
- `src/components/SessionHistory.tsx`: Delete button -- change `p-1` to `p-2.5`; session rows -- add `min-h-[44px]`
- `src/components/ItemChecklist.tsx`: Checklist buttons -- ensure `min-h-[44px]` and `py-3`
- `src/components/CartItemExplorer.tsx`: Sort dropdown -- change `h-7` to `h-9`; accordion buttons -- ensure `min-h-[44px]`
- `src/components/ClarificationForm.tsx`: Input fields -- already `h-8`, bump to `h-10` on mobile
- `src/components/CheckoutForm.tsx`: Input fields -- same, `h-10`
- `src/components/ExamplePrompts.tsx`: Prompt cards -- add `min-h-[48px]`
- `src/components/ChatInput.tsx`: Send/cancel buttons -- change `h-8 w-8` to `h-10 w-10`

### 5. Fix CartDashboard Responsive Layout

**File: `src/components/CartDashboard.tsx`**

- Change `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` for stat cards
- Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for charts
- Ensure chart containers have `min-h-[200px]` on mobile

### 6. Fix CartItemExplorer on Small Screens

**File: `src/components/CartItemExplorer.tsx`**

- Change `max-w-md` to `w-full max-w-md` (already done) but also ensure it doesn't overflow its parent
- Make tabs scroll horizontally on narrow screens instead of wrapping awkwardly:
  ```
  TabsList className="w-full overflow-x-auto flex-nowrap scrollbar-hide"
  ```
- Detail grid: change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`

### 7. Fix CartRecommendation on Small Screens

**File: `src/components/CartRecommendation.tsx`**

- Ensure `max-w-md` doesn't cause the card to be narrower than the screen on small devices
- Cart item rows: allow name to wrap instead of `truncate` on mobile
- Optimizer button grid: change `grid-cols-2` to `grid-cols-1 xs:grid-cols-2`

### 8. Fix Landing Page Responsiveness

**File: `src/pages/Index.tsx`**

- Landing page "How it works" grid: already `grid-cols-3` -- add `gap-2` for very small screens
- Hero text: `text-5xl sm:text-6xl` is fine
- Ensure `min-h-dvh` instead of `min-h-screen`

### 9. Add Rate Limiting to Edge Function

**File: `supabase/functions/ai-shopping-agent/index.ts`**

Add a simple in-memory rate limiter (per-IP, 10 requests per minute):
```typescript
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
```

Return `429 Too Many Requests` when limit is exceeded.

### 10. Sanitize Checkout Form Input

**File: `src/components/CheckoutForm.tsx`**

Add Zod validation (already in the project) to the checkout form:
```typescript
const checkoutSchema = z.object({
  fullName: z.string().trim().min(1).max(100).regex(/^[a-zA-Z\s\-'.]+$/),
  email: z.string().trim().email().max(255),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(2),
  zip: z.string().trim().min(5).max(10).regex(/^[0-9\-]+$/),
  cardLast4: z.string().length(4).regex(/^\d{4}$/),
});
```

Validate before calling `onSubmit`.

### 11. Prevent iOS Zoom on Input Focus

**File: `src/index.css`**

iOS Safari zooms in on inputs with font-size below 16px. Prevent this:
```css
@supports (-webkit-touch-callout: none) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```

Or more elegantly, ensure all form inputs use `text-base` (16px) instead of `text-sm` (14px) on mobile.

### 12. Smooth Scrolling on Chat

**File: `src/index.css`**

Add `-webkit-overflow-scrolling: touch` and `overscroll-behavior` for native-feeling scroll:
```css
.chat-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/App.css` | Remove all Vite boilerplate; minimal reset with dvh |
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/index.css` | Add dvh utility, safe-area classes, coarse-pointer touch rules, iOS zoom fix, smooth scroll |
| `src/pages/Index.tsx` | Use `h-dvh` instead of `h-screen`, `min-h-dvh`, safe area padding on sidebar toggle and header |
| `src/components/ChatInput.tsx` | Larger send/cancel buttons (h-10 w-10), `text-base` on mobile |
| `src/components/SessionHistory.tsx` | Always-visible delete on touch, larger touch targets |
| `src/components/CartRecommendation.tsx` | Always-visible swap on touch, responsive optimizer grid, tooltip-to-popover for touch |
| `src/components/CartItemExplorer.tsx` | Horizontal-scroll tabs, larger sort dropdown, responsive detail grid |
| `src/components/CartDashboard.tsx` | Responsive grid stacking on mobile |
| `src/components/ItemChecklist.tsx` | Larger touch targets (min-h-[44px]) |
| `src/components/ClarificationForm.tsx` | Larger inputs on mobile |
| `src/components/CheckoutForm.tsx` | Larger inputs, Zod validation |
| `src/components/ExamplePrompts.tsx` | Larger touch targets |
| `src/components/CheckoutSimulation.tsx` | Responsive card layout |
| `src/components/StageIndicator.tsx` | Slightly larger dots for visibility |
| `supabase/functions/ai-shopping-agent/index.ts` | Add IP-based rate limiting |

---

## Priority Order

```text
CRITICAL (fixes "can't access" feel):
  1. Remove App.css boilerplate padding/max-width (2 min)
  2. Fix mobile viewport height with dvh (5 min)
  3. Add viewport-fit=cover + safe areas (3 min)

HIGH (touch usability):
  4. Fix hover-only interactions for touch (10 min)
  5. Increase touch target sizes across all components (15 min)
  6. Fix iOS zoom on input focus (2 min)

RESPONSIVE (visual correctness):
  7. CartDashboard responsive grid (5 min)
  8. CartItemExplorer scrollable tabs + responsive detail grid (5 min)
  9. CartRecommendation responsive layout (5 min)

SECURITY:
  10. Rate limiting on edge function (10 min)
  11. Checkout form Zod validation (5 min)

POLISH:
  12. Smooth scroll for chat (2 min)
```

