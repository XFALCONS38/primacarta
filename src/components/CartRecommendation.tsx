import { motion } from "framer-motion";
import { ShoppingCart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartRecommendation as CartRecommendationType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CartRecommendationProps {
  cart: CartRecommendationType;
  onCheckout?: () => void;
  isLatest?: boolean;
}

const retailerColors: Record<string, string> = {
  Amazon: "bg-[hsl(var(--amazon))]",
  Walmart: "bg-[hsl(var(--walmart))]",
  Target: "bg-[hsl(var(--target))]",
};

export function CartRecommendationCard({ cart, onCheckout, isLatest }: CartRecommendationProps) {
  const remaining = cart.budget - cart.totalCost;
  const pct = Math.min((cart.totalCost / cart.budget) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm font-semibold text-foreground">Your Cart</h4>
      </div>

      {cart.summary && (
        <p className="text-xs text-muted-foreground">{cart.summary}</p>
      )}

      <div className="space-y-1.5">
        {cart.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="text-base">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-foreground">{item.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    retailerColors[item.retailer] || "bg-muted"
                  )}
                />
                <span>{item.retailer}</span>
                <span>•</span>
                <span>{item.delivery_days}d delivery</span>
                {item.variant && (
                  <>
                    <span>•</span>
                    <span>{item.variant}</span>
                  </>
                )}
              </div>
            </div>
            <span className="font-medium text-foreground">
              ${item.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">${cart.totalCost.toFixed(2)}</span>
          </span>
          <span className={cn("font-medium", remaining >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
            {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              remaining >= 0 ? "bg-primary" : "bg-destructive"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-[10px] text-muted-foreground">
          Budget: ${cart.budget.toFixed(2)}
        </p>
      </div>

      {/* Checkout button - only on latest cart */}
      {isLatest && onCheckout && (
        <Button
          onClick={onCheckout}
          className="w-full rounded-xl font-medium"
          size="sm"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Confirm & Checkout
        </Button>
      )}
    </motion.div>
  );
}
