import type { WorkflowStage } from "@/config/agentStages";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  // Structured UI data
  checklist?: ChecklistItem[];
  clarificationRequest?: ClarificationRequest;
  cartData?: CartRecommendation;
  stage?: WorkflowStage;
  checkoutSteps?: CheckoutStep[];
  checkoutGrandTotal?: number;
  shoppingSpec?: ShoppingSpec;
  checkoutInfo?: CheckoutInfo;
}

// Item checklist for stage 1 → 2
export interface ChecklistItem {
  id: string;
  label: string;
  emoji: string;
  selected: boolean;
}

// Clarification form for stage 3
export interface ClarificationField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect";
  value: string;
  options?: string[];
  required: boolean;
}

export interface ClarificationRequest {
  title: string;
  fields: ClarificationField[];
}

// Structured user intent (extracted by agent)
export interface UserSpec {
  scenario: string;
  budget: number;
  delivery_by?: string;
  preferences: {
    team_or_theme?: string;
    style?: string;
    colors?: string[];
    must_haves?: string[];
    nice_to_haves?: string[];
  };
}

// Structured shopping spec (displayed to user)
export interface ShoppingSpec {
  scenario: string;
  budget: number;
  delivery_by?: string;
  location?: string;
  items: string[];
  preferences: Record<string, string>;
}

// Checkout info collected once
export interface CheckoutInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cardLast4: string;
}

// Cart data for stage 4-5
export interface CartRecommendationItem {
  name: string;
  category: string;
  retailer: string;
  price: number;
  delivery_days: number;
  emoji: string;
  variant?: string;
  replace?: boolean;
  url?: string;
  rating?: number;
  review_count?: number;
  shipping_cost?: number;
  original_price?: number;
  discount_label?: string;
  reason?: string;
}

export interface AlternativeSet {
  set_name: string;
  items: CartRecommendationItem[];
  ranking_explanation: string;
}

export interface CartRecommendation {
  summary: string;
  items: CartRecommendationItem[];
  totalCost: number;
  budget: number;
  rankingExplanation?: string;
  alternativeSets?: AlternativeSet[];
}

// Checkout simulation step (stage 6)
export interface CheckoutStep {
  retailer: string;
  items: string[];
  subtotal: number;
  estimated_delivery_days?: number;
  steps: string[];
}

// Session persistence
export interface ShoppingSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  stage?: WorkflowStage;
  createdAt: Date;
  updatedAt: Date;
}
