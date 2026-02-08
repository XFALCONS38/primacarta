import type { Product } from "@/data/products";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  structuredData?: StructuredData;
}

export interface StructuredData {
  type: "intent" | "cart" | "checkout" | "explanation";
  data: ParsedIntent | CartData | CheckoutData | string;
}

export interface ParsedIntent {
  scenario: string;
  budget: number;
  delivery_by: string;
  preferences: {
    team?: string;
    theme?: string;
    style?: string;
    colors?: string[];
    must_haves?: string[];
    nice_to_haves?: string[];
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  selectedColor?: string;
}

export interface CartData {
  items: CartItem[];
  totalCost: number;
  budget: number;
  explanation: string;
}

export interface CheckoutStep {
  retailer: "Amazon" | "Walmart" | "Target";
  items: CartItem[];
  subtotal: number;
  steps: string[];
}

export interface CheckoutData {
  steps: CheckoutStep[];
  totalCost: number;
  address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface ShoppingSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  cart?: CartData;
  createdAt: Date;
  updatedAt: Date;
}
