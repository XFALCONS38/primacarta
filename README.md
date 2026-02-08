<p align="center">
  <img src="https://img.shields.io/badge/Prima-Agentic%20Commerce-3366CC?style=for-the-badge&logo=shoppingcart&logoColor=white" alt="Prima Badge" />
</p>

<h1 align="center">🛒 Prima</h1>
<h3 align="center">Describe it. We cart it.</h3>

<p align="center">
  <strong>Prima</strong> is an AI-powered agentic commerce platform that transforms a single natural-language prompt into a fully optimized, multi-retailer shopping cart — complete with real-time product discovery, transparent ranking, and simulated one-click checkout across every store.
</p>

<p align="center">
  <a href="https://primacarta.lovable.app">Live Demo</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Table of Contents

- [What is Prima?](#what-is-prima)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [The 6-Stage Lean Workflow](#the-6-stage-lean-workflow)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Component Reference](#component-reference)
- [Backend (Edge Function)](#backend-edge-function)
- [Design System](#design-system)
- [Example Scenarios](#example-scenarios)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## What is Prima?

Prima pioneered the concept of **Agentic Commerce** — delegating the entire buying process to an AI agent. Instead of browsing dozens of tabs, comparing prices manually, and checking out at each retailer separately, you describe what you need in plain language and Prima handles everything:

1. **Understands your intent** — parses occasion, budget, delivery deadline, and preferences
2. **Searches 50+ retailers** — uses Firecrawl to discover real products across Amazon, Walmart, Target, Shein, Temu, eBay, Nike, REI, and more
3. **Ranks by weighted criteria** — Value (25%), Delivery (20%), Reviews (20%), Preference Match (15%), Retailer Trust (10%), Style Coherence (10%)
4. **Builds an optimized cart** — selects the best combination of items across all retailers within your budget
5. **Simulates unified checkout** — groups items by retailer with step-by-step checkout flow

---

## Key Features

| Feature | Description |
|---|---|
| 🗣️ **Natural Language Input** | Describe your shopping need in one message — "Full Patriots outfit head-to-toe, budget $150, delivered by Friday" |
| 🔍 **Real-Time Product Discovery** | Searches up to 10 results per category across 50+ retailers using Firecrawl web search API |
| 📊 **Transparent Ranking** | Every product is scored on a weighted composite: value, delivery speed, reviews, preference match, retailer trust, and style coherence |
| 🔗 **Verified Product Links** | Post-processing fuzzy-matching ensures every link points to a real product page — no hallucinated URLs |
| 💰 **Price Integrity** | Multi-layer price validation: extraction from HTML, AI guardrails, candidate cross-referencing, and $0 filtering |
| 🔄 **Alternative Sets** | 1-2 alternative cart configurations (budget-friendly, premium, fastest delivery) with per-item swap |
| 🏷️ **Cart Item Explorer** | Tabbed category view showing ALL discovered products with sort controls (Score, Price, Rating, Delivery, Reviews) |
| 📝 **Dynamic Forms** | AI generates context-aware clarification fields — skiing gets "Waterproof rating", hackathons get "Attendee count" |
| 🛒 **Multi-Retailer Checkout** | Simulated checkout flow grouped by retailer with step-by-step progress animation |
| 💾 **Session History** | Auto-saves shopping sessions to localStorage with resume capability |
| 📱 **Responsive Design** | Mobile-first with collapsible sidebar, touch-friendly controls, and adaptive layouts |
| 🌙 **Dark Mode** | Full light/dark theme support via CSS custom properties |

---

## How It Works

```
User Prompt
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. Identify  │────▶│  2. Select   │────▶│  3. Clarify  │
│ Parse intent  │     │ Pick items   │     │ Dynamic form │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  6. Checkout │◀────│  5. Review   │◀────│  4. Research  │
│  Simulation  │     │ Adjust cart  │     │ Firecrawl +  │
│              │     │              │     │ AI ranking   │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## The 6-Stage Lean Workflow

### Stage 1 — Identify
The AI parses the user's natural-language prompt and suggests **8–12 scenario-specific item categories**. Categories are dynamically tailored to the exact situation (e.g., "Ski Jacket", "Goggles", "Base Layer" for skiing vs. "Snack Boxes", "USB-C Adapters", "Trophies" for a hackathon).

**Tool:** `suggest_items` → returns `{ brief_response, items[] }`

### Stage 2 — Select
The user picks which item categories to shop for via a visual checklist UI with emoji icons and toggle selection. No AI call needed — handled entirely by the frontend.

**Component:** `ItemChecklist`

### Stage 3 — Clarify
The AI generates a **context-appropriate form** to gather remaining details. Core fields (budget, location, delivery deadline, preferred retailers) are always present, but 4–8 additional fields are dynamically generated based on the shopping scenario.

**Tool:** `request_clarification` → returns `{ title, fields[] }`  
**Component:** `ClarificationForm`

### Stage 4 — Research
This is where the magic happens:

1. **Firecrawl Search** — Searches up to 10 results per category across the open web, respecting retailer preferences
2. **Context Building** — Raw search results are structured into a prompt with product titles, URLs, descriptions, and markdown content
3. **AI Ranking** — GPT-4o-mini analyzes all search results and builds an optimal cart using weighted scoring
4. **URL Post-Processing** — Fuzzy-matching validates every AI-selected URL against real Firecrawl results
5. **Price Recovery** — $0 prices are cross-referenced with search candidates and filtered if unrecoverable

**Tool:** `build_cart` → returns `{ summary, items[], total_cost, budget, ranking_explanation, alternative_sets[] }`

### Stage 5 — Review
The user reviews their cart with full transparency:
- **Cart Item Explorer** — Tabbed view of ALL discovered products per category with sort controls
- **Alternative Sets** — Toggle between different cart configurations
- **Per-Item Swap** — Replace individual items from alternatives
- **Optimize Budget** — One-click re-rank prioritizing lowest cost
- **Optimize Delivery** — One-click re-rank prioritizing fastest shipping
- **Replace Item** — Search for alternatives for any specific item

### Stage 6 — Checkout
Simulated checkout grouped by retailer with animated step-by-step progress:
1. Collect shipping and payment info (entered once)
2. Generate per-retailer checkout flows (Name → Address → Payment → Confirm)
3. Animated progress with completion summary

**Tool:** `generate_checkout` → returns `{ steps[], grand_total }`

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│                                                         │
│  Index.tsx ─── Landing Page / Chat Interface             │
│     │                                                    │
│     ├── useChat.ts ──── State machine + API calls        │
│     │     └── fetchAndHandle() → Edge Function           │
│     │                                                    │
│     ├── ChatMessage.tsx ──── Message renderer            │
│     │     ├── ItemChecklist ──── Stage 2 UI              │
│     │     ├── ClarificationForm ──── Stage 3 UI          │
│     │     ├── CartRecommendation ──── Stage 5 UI         │
│     │     │     └── CartItemExplorer ──── Product browser │
│     │     ├── CheckoutForm ──── Checkout details          │
│     │     └── CheckoutSimulation ──── Stage 6 UI         │
│     │                                                    │
│     ├── SessionHistory ──── localStorage persistence     │
│     ├── StageIndicator ──── Workflow progress dots        │
│     ├── SearchProgress ──── Animated search phases        │
│     └── ExamplePrompts ──── Scenario quick-starts        │
│                                                         │
└────────────────────┬───────────────────────────────────┘
                     │ POST /functions/v1/ai-shopping-agent
                     ▼
┌────────────────────────────────────────────────────────┐
│               EDGE FUNCTION (Deno/Supabase)             │
│                                                         │
│  ai-shopping-agent/index.ts                             │
│     │                                                    │
│     ├── Input Validation (stage, messages, roles)        │
│     │                                                    │
│     ├── Research Stage:                                  │
│     │     ├── extractContextFromMessages()               │
│     │     ├── searchAllCategories() ─── Firecrawl API    │
│     │     ├── buildResearchPrompt() ─── Dynamic prompt   │
│     │     └── Post-processing:                           │
│     │           ├── fixItemUrls() ─── Fuzzy URL match    │
│     │           └── fixZeroPrices() ─── Price recovery   │
│     │                                                    │
│     ├── Review Stage:                                    │
│     │     └── searchProducts() ─── Replacement search    │
│     │                                                    │
│     ├── OpenAI API ─── GPT-4o-mini with function calling │
│     │                                                    │
│     └── Response: { type, tool, data, searchCandidates } │
│                                                         │
└────────────────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│                  EXTERNAL APIS                          │
│                                                         │
│  🔍 Firecrawl ─── Web search + scraping (10 per cat)    │
│  🤖 OpenAI ────── GPT-4o-mini with function calling     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 18 + TypeScript | Component-based UI with type safety |
| **Build** | Vite | Fast HMR and optimized production builds |
| **Styling** | Tailwind CSS + CSS Custom Properties | Utility-first with semantic design tokens |
| **UI Library** | shadcn/ui (Radix primitives) | Accessible, composable component library |
| **Animations** | Framer Motion | Smooth transitions, mount/unmount animations |
| **Charts** | Recharts | Pie charts and bar charts for cart dashboard |
| **Markdown** | react-markdown | Renders AI responses with formatting |
| **Routing** | React Router v6 | Client-side navigation |
| **State** | React hooks + useRef | Local state machine pattern (no Redux needed) |
| **Persistence** | localStorage | Session history with auto-save |
| **Backend** | Supabase Edge Functions (Deno) | Serverless API endpoint |
| **AI Model** | OpenAI GPT-4o-mini | Function calling for structured outputs |
| **Search** | Firecrawl API | Real-time web search + content extraction |
| **Typography** | Space Grotesk (headings) + Inter (body) | Modern, distinctive type pairing |

---

## Project Structure

```
├── src/
│   ├── pages/
│   │   ├── Index.tsx              # Landing page + chat interface
│   │   ├── Auth.tsx               # Authentication page
│   │   └── NotFound.tsx           # 404 page
│   │
│   ├── components/
│   │   ├── ChatMessage.tsx        # Message bubble with structured UI slots
│   │   ├── ChatInput.tsx          # Auto-resizing textarea with send/cancel
│   │   ├── ItemChecklist.tsx      # Multi-select item category picker (Stage 2)
│   │   ├── ClarificationForm.tsx  # Dynamic form renderer (Stage 3)
│   │   ├── CartRecommendation.tsx # Cart card with items, budget bar, alternatives
│   │   ├── CartItemExplorer.tsx   # Tabbed product explorer with sort controls
│   │   ├── CartDashboard.tsx      # Visual dashboard with pie/bar charts
│   │   ├── CheckoutForm.tsx       # Shipping + payment form (simulated)
│   │   ├── CheckoutSimulation.tsx # Animated per-retailer checkout steps
│   │   ├── ShoppingSpec.tsx       # Collapsible JSON spec display
│   │   ├── ExamplePrompts.tsx     # Quick-start scenario cards
│   │   ├── SearchProgress.tsx     # Animated multi-phase search indicator
│   │   ├── SessionHistory.tsx     # Sidebar session list with CRUD
│   │   ├── StageIndicator.tsx     # Workflow progress dots
│   │   ├── RetailerBadge.tsx      # Dynamic retailer color badges
│   │   ├── TypingIndicator.tsx    # Animated typing dots
│   │   └── ui/                    # shadcn/ui primitives (40+ components)
│   │
│   ├── hooks/
│   │   ├── useChat.ts             # Core state machine: stages, API calls, actions
│   │   ├── useLocalStorage.ts     # Session persistence hook
│   │   ├── useAuth.tsx            # Authentication context
│   │   └── use-mobile.tsx         # Responsive breakpoint detection
│   │
│   ├── config/
│   │   └── agentStages.ts         # Stage definitions, prompts, tool schemas
│   │
│   ├── types/
│   │   └── chat.ts                # TypeScript interfaces for all data structures
│   │
│   ├── index.css                  # Design tokens (HSL), fonts, scrollbar styles
│   ├── App.tsx                    # Router setup with providers
│   └── main.tsx                   # Entry point
│
├── supabase/
│   └── functions/
│       └── ai-shopping-agent/
│           └── index.ts           # Edge function: search + AI + post-processing
│
└── tailwind.config.ts             # Extended theme with custom tokens
```

---

## Component Reference

### Core Flow Components

| Component | File | Stage | Description |
|---|---|---|---|
| `ChatMessageBubble` | `ChatMessage.tsx` | All | Renders user/assistant messages with structured UI slots for checklists, forms, carts, and checkout |
| `ChatInput` | `ChatInput.tsx` | All | Auto-resizing textarea with Enter to send, Shift+Enter for newline, and cancel button during loading |
| `ItemChecklist` | `ItemChecklist.tsx` | 2 | Grid of toggle buttons with emoji + label for selecting item categories |
| `ClarificationForm` | `ClarificationForm.tsx` | 3 | Renders text, number, select, and multiselect fields from AI-generated form spec |
| `SearchProgress` | `SearchProgress.tsx` | 4 | Four-phase animated progress bar (Searching → Comparing → Ranking → Building) |
| `CartRecommendationCard` | `CartRecommendation.tsx` | 5 | Cart items, budget bar, ranking explanation, alternative sets, optimizer buttons, checkout CTA |
| `CartItemExplorer` | `CartItemExplorer.tsx` | 5 | Tabbed category browser with all discovered products, sort dropdown, rank badges, detail expansion |
| `CartDashboard` | `CartDashboard.tsx` | 5 | Pie chart (spend by retailer), bar chart (budget breakdown), item table |
| `CheckoutForm` | `CheckoutForm.tsx` | 6 | One-time shipping + payment form (simulated, no real transactions) |
| `CheckoutSimulation` | `CheckoutSimulation.tsx` | 6 | Animated step-by-step checkout per retailer with completion summary |

### Supporting Components

| Component | Description |
|---|---|
| `ExamplePrompts` | Five scenario quick-start cards: Super Bowl Outfit, Skiing Outfit, Hackathon Kit, Party Supplies, Travel Kit |
| `SessionHistory` | Sidebar with saved sessions, relative timestamps, delete, and "New" button |
| `StageIndicator` | Six progress dots showing current workflow stage |
| `ShoppingSpecCard` | Collapsible JSON view of the structured shopping specification |
| `RetailerBadge` | Dynamic color badge for any retailer (known colors for Amazon/Walmart/Target, hash-based for others) |
| `TypingIndicator` | Three pulsing dots while awaiting AI response |

---

## Backend (Edge Function)

The edge function at `supabase/functions/ai-shopping-agent/index.ts` is the brain of Prima. It handles:

### Input Validation
- Stage must be one of: `identify`, `clarify`, `research`, `review`, `checkout`
- Messages must be a non-empty array (max 100)
- Each message must have a valid role and content under 10,000 characters

### Product Search (Firecrawl)
```
searchProducts(query, location, preferredRetailers, firecrawlKey, buyerContext)
```
- Constructs search queries with buy intent signals (`buy online price reviews shipping`)
- Supports retailer filtering via `site:` operators
- Returns up to 10 results per query with title, URL, description, and markdown content
- Searches all categories in parallel via `Promise.allSettled`

### Retailer Detection
Maps 26+ known domains to display names (Amazon, Walmart, Target, Nike, REI, etc.) with fallback to domain capitalization.

### Price Extraction
Multi-pattern regex matching:
- `$1,234.56` — standard dollar format
- `USD 29.99` — prefixed currency
- `29.99 USD` — suffixed currency
- `price: 29.99` — labeled prices

Returns `null` (never `0`) when no valid price is found.

### URL Preservation
After AI generates cart recommendations, a post-processing step:
1. Builds a set of all known Firecrawl URLs
2. For each AI-selected item, checks if URL exists in the real set
3. If not, fuzzy-matches item name against Firecrawl titles using word-overlap similarity
4. Replaces hallucinated URLs with the best real match (threshold: 0.2)

### Price Recovery
For items with $0 price:
1. Cross-references item name against all search candidates
2. Fuzzy-matches to find the closest candidate with a valid price
3. Replaces $0 with the recovered price (threshold: 0.15)
4. Filters out any remaining $0 items
5. Recalculates cart total

### Stage-Specific Prompts
Each stage has a tailored system prompt that instructs the AI on output format, constraints, and tool usage. The research prompt is dynamically generated with injected search results.

### Ranking Criteria (Research Stage)
| Weight | Criterion | What It Measures |
|---|---|---|
| 25% | **Value** | Price vs budget, active discounts, price-to-quality ratio |
| 20% | **Delivery** | Shipping time, cost (free = bonus), reliability |
| 20% | **Reviews** | Star rating, review count, seller reputation, return policy |
| 15% | **Preference Match** | Colors, style, team/theme, features, must-haves |
| 10% | **Retailer Trust** | Established retailer vs unknown, buyer protection |
| 10% | **Style Coherence** | How well items look together as a set |

---

## Design System

Prima uses a semantic token-based design system with HSL color values supporting light and dark modes.

### Color Tokens
```css
--primary: 220 70% 50%        /* Brand blue */
--success: 150 60% 40%        /* Under budget, free shipping */
--warning: 40 95% 55%         /* Delivery alerts */
--destructive: 0 84% 60%      /* Over budget, errors */
--amazon: 30 100% 50%         /* Amazon brand */
--walmart: 210 100% 40%       /* Walmart brand */
--target: 0 80% 50%           /* Target brand */
```

### Typography
- **Headings:** Space Grotesk (400–700) — geometric, modern display face
- **Body:** Inter (300–700) — clean, highly legible system font

### Component Conventions
- All colors use semantic tokens (`text-foreground`, `bg-card`, `border-border`)
- Rounded corners via `--radius: 0.75rem`
- Consistent shadow depths: `shadow-sm` for cards, `shadow-md` on hover
- Animations via Framer Motion with 0.2s default duration

---

## Example Scenarios

### 🏈 Super Bowl Party Outfit
```
Full Patriots outfit head-to-toe, budget $150, delivered by Friday
```
→ Categories: Team Jersey, Team Cap, Face Paint, Rally Towel, Team Scarf, Sneakers, Sunglasses, Foam Finger  
→ Form: Team name, Jersey size, Color scheme, Hat style  
→ Searches across: Amazon, Nike, Fanatics, Dick's, Walmart

### ⛷️ Skiing Outfit
```
Downhill skiing outfit, warm and waterproof, size M, budget $400, delivery within 5 days
```
→ Categories: Ski Jacket, Ski Pants, Base Layer, Goggles, Gloves, Ski Socks, Helmet, Neck Gaiter  
→ Form: Jacket insulation type, Waterproof rating, Boot size, Preferred colors  
→ Searches across: REI, Backcountry, Amazon, The North Face, Patagonia

### 💻 Hackathon Host Kit
```
I'm hosting a hackathon for 60 people — figure out snacks, badges, adapters, decorations, and prizes at the best price
```
→ Categories: Snack Boxes, Name Badges, USB-C Adapters, Banner/Signage, Trophies/Prizes, Extension Cords, Stickers, Lanyards  
→ Form: Number of attendees, Dietary restrictions, Prize budget, Venue type  
→ Searches across: Amazon, Walmart, Costco, Etsy, Target

### 🎂 Birthday Party
```
Birthday party supplies for 20 people under $100
```
→ Categories: Party Plates & Cups, Balloons, Banner/Decorations, Cake Topper, Party Favors, Tablecloth, Candles, Gift Bags  
→ Form: Age of birthday person, Theme, Indoor or outdoor, Color scheme

### ✈️ Travel Kit
```
Complete travel accessories kit: bag, toiletry set, wallet, and sunglasses under $100
```
→ Tailored categories and dynamic form fields based on travel context

---

## Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- npm or bun package manager

### Local Development
```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd prima

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production
```sh
npm run build
```

### Deploying
The app is deployed via Lovable with automatic builds and edge function deployment. Visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click **Share → Publish**.

**Live URL:** [primacarta.lovable.app](https://primacarta.lovable.app)

---

## Environment Variables

| Variable | Source | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Auto-configured | Backend API base URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-configured | Public API key for authentication |
| `OPENAI_API_KEY` | Edge Function Secret | OpenAI API key for GPT-4o-mini |
| `FIRECRAWL_API_KEY` | Edge Function Secret | Firecrawl API key for product search |

> **Note:** `VITE_*` variables are injected at build time. Edge function secrets (`OPENAI_API_KEY`, `FIRECRAWL_API_KEY`) are configured securely in the backend and never exposed to the client.

---

<p align="center">
  Built with ❤️ using <a href="https://lovable.dev">Lovable</a>
</p>
