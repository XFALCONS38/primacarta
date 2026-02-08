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

// Cart data for stage 4-5
export interface CartRecommendationItem {
  name: string;
  category: string;
  retailer: "Amazon" | "Walmart" | "Target";
  price: number;
  delivery_days: number;
  emoji: string;
  variant?: string;
}

export interface CartRecommendation {
  summary: string;
  items: CartRecommendationItem[];
  totalCost: number;
  budget: number;
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
