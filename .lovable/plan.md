

# AI Shopping Agent — Implementation Plan

## Overview
A chat-powered AI shopping assistant that helps users build multi-retailer carts from Amazon, Walmart, and Target. Users type natural language requests, and the AI parses their intent, discovers matching products, ranks complete sets, and simulates checkout — all in a clean, modern interface with data visualizations at key decision points.

---

## Pages & Layout

### 1. Landing / Home Page
- Clean hero section introducing the AI Shopping Agent
- Example prompts users can click to get started (e.g., "Full Patriots outfit under $150", "Birthday party supplies for 20 people under $100")
- "Start Shopping" button that opens the chat

### 2. Chat Interface (Main Experience)
- Full-screen conversational UI with a message input at the bottom
- AI responses rendered with markdown support
- Inline structured data (parsed intent JSON, product cards) displayed as rich UI components within the chat flow
- Typing indicators and streaming responses for a smooth feel

### 3. Cart & Dashboard View
- Triggered when the AI presents a recommended set
- **Combined Cart Table**: Item | Retailer | Price | Estimated Delivery | Replace button
- **Budget Dashboard Panel**: 
  - Donut/pie chart showing spend by retailer
  - Bar chart comparing cost vs. budget
  - Delivery timeline visualization
  - Total cost summary with remaining budget
- Each item has a "Replace" action that asks the AI for alternatives
- "Proceed to Checkout Simulation" button

### 4. Checkout Simulation View
- Step-by-step animated walkthrough per retailer
- Shows simulated form fills: Name → Address → Payment → Confirm
- Summary card with total across all retailers
- "Done" state with a friendly confirmation message

---

## Core Features

### AI-Powered Intent Parsing
- User types a natural language shopping request
- The AI (via Lovable AI gateway + edge function) extracts structured data: scenario, budget, delivery date, preferences (team/theme, style, colors, must-haves, nice-to-haves)
- Parsed intent displayed as a clean summary card for user confirmation

### Product Discovery & Matching
- Broad mock catalog (~80-100 products) across Amazon, Walmart, and Target
- Categories: apparel, electronics, home goods, sports gear, party supplies, accessories
- Each product has: name, price, delivery_days, variants, colors, retailer, category, image placeholder
- AI selects 5-10 matching products per retailer based on parsed preferences

### Set Ranking & Recommendation
- AI combines items into complete sets/bundles
- Scoring criteria: total cost (≤ budget), delivery feasibility, preference match, style/color coherence
- Top-ranked set presented with a plain-language explanation of why it was chosen
- "Why did you pick this?" triggers a detailed friendly explanation

### Cart Management
- Interactive cart where users can swap individual items for alternatives
- Real-time budget and delivery recalculation on changes
- Data visualizations update dynamically

### Checkout Simulation
- Multi-retailer simulated checkout with a single address/payment
- Step-by-step format showing each retailer's checkout flow
- No real purchases — clearly labeled as a simulation

---

## Data & Persistence

### Mock Product Catalog
- JSON-based product data stored in the frontend
- Organized by retailer and category for easy AI retrieval

### Local Storage
- Recent shopping sessions saved in browser
- Users can revisit past carts and results
- Session history accessible from the sidebar or a "Recent" section

---

## Backend (Lovable Cloud)

### Edge Function: `ai-shopping-agent`
- Receives user messages + conversation history
- System prompt instructs the AI to act as the shopping agent (parse intent, select products, rank sets, generate carts)
- Uses tool calling to return structured JSON for carts, checkout steps, and rankings
- Streams responses for real-time chat experience

---

## Design & UX

- **Clean & minimal** base design with white space, subtle shadows, and modern typography
- **Dashboard moments**: When presenting the cart and budget breakdown, switch to a richer data visualization style with charts (using Recharts, already installed) and summary cards
- **Retailer branding**: Subtle color-coded badges for Amazon (orange), Walmart (blue), Target (red)
- **Mobile responsive**: Chat-first layout works on all screen sizes
- **Smooth transitions**: Animated step-by-step checkout simulation

