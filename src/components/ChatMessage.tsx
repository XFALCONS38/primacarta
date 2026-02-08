import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ShoppingCart, User } from "lucide-react";
import type {
  ChatMessage as ChatMessageType,
  ChecklistItem,
  AlternativeSet,
  CartRecommendationItem,
  CheckoutInfo,
} from "@/types/chat";
import { ItemChecklist } from "@/components/ItemChecklist";
import { ClarificationForm } from "@/components/ClarificationForm";
import { CartRecommendationCard } from "@/components/CartRecommendation";
import { CheckoutSimulation } from "@/components/CheckoutSimulation";
import { ShoppingSpecCard } from "@/components/ShoppingSpec";
import { CheckoutForm } from "@/components/CheckoutForm";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onChecklistSubmit?: (items: ChecklistItem[]) => void;
  onClarificationSubmit?: (values: Record<string, string>) => void;
  onCheckout?: () => void;
  onReplaceItem?: (itemName: string) => void;
  onSelectAlternativeSet?: (alt: AlternativeSet) => void;
  onSwapItem?: (originalItem: CartRecommendationItem, newItem: CartRecommendationItem) => void;
  onCheckoutFormSubmit?: (info: CheckoutInfo) => void;
  onOptimizeBudget?: () => void;
  onOptimizeDelivery?: () => void;
  isLatest?: boolean;
}

export function ChatMessageBubble({
  message,
  onChecklistSubmit,
  onClarificationSubmit,
  onCheckout,
  onReplaceItem,
  onSelectAlternativeSet,
  onSwapItem,
  onCheckoutFormSubmit,
  onOptimizeBudget,
  onOptimizeDelivery,
  isLatest,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  // Check if this message has interactive (wide) content that needs full width
  const hasInteractiveContent =
    !isUser &&
    (message.checklist?.length ||
      message.clarificationRequest ||
      message.cartData ||
      message.checkoutSteps?.length ||
      message.checkoutInfo === null ||
      message.shoppingSpec);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-2 sm:gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      </div>

      <div
        className={cn(
          "min-w-0 overflow-hidden space-y-3",
          // User messages: constrained width bubble
          // Assistant with interactive content: use all available space
          // Assistant text-only: constrained width
          isUser
            ? "max-w-[80%] sm:max-w-[85%]"
            : hasInteractiveContent
              ? "flex-1 max-w-full"
              : "max-w-[80%] sm:max-w-[85%]"
        )}
      >
        {/* Text content */}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border rounded-bl-md shadow-sm"
            )}
          >
            {isUser ? (
              <p className="break-words">{message.content}</p>
            ) : (
              <div className="prose-chat break-words">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Shopping spec */}
        {message.shoppingSpec && (
          <ShoppingSpecCard spec={message.shoppingSpec} />
        )}

        {/* Checklist UI */}
        {message.checklist && message.checklist.length > 0 && (
          <ItemChecklist
            items={message.checklist}
            onSubmit={onChecklistSubmit || (() => {})}
            disabled={!isLatest}
          />
        )}

        {/* Clarification form UI */}
        {message.clarificationRequest && (
          <ClarificationForm
            request={message.clarificationRequest}
            onSubmit={onClarificationSubmit || (() => {})}
            disabled={!isLatest}
          />
        )}

        {/* Cart recommendation UI */}
        {message.cartData && (
          <CartRecommendationCard
            cart={message.cartData}
            onCheckout={onCheckout}
            onReplaceItem={onReplaceItem}
            onSelectAlternativeSet={onSelectAlternativeSet}
            onSwapItem={onSwapItem}
            onOptimizeBudget={onOptimizeBudget}
            onOptimizeDelivery={onOptimizeDelivery}
            isLatest={isLatest}
          />
        )}

        {/* Checkout form (enter once) */}
        {message.checkoutInfo === null && isLatest && onCheckoutFormSubmit && (
          <CheckoutForm onSubmit={onCheckoutFormSubmit} />
        )}

        {/* Checkout simulation UI */}
        {message.checkoutSteps && message.checkoutSteps.length > 0 && (
          <CheckoutSimulation
            checkoutSteps={message.checkoutSteps}
            grandTotal={message.checkoutGrandTotal || 0}
            checkoutInfo={message.checkoutInfo || undefined}
          />
        )}
      </div>
    </motion.div>
  );
}
