import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, Lightbulb, ArrowRightLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CartRecommendation as CartRecommendationType, AlternativeSet } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CartRecommendationProps {
  cart: CartRecommendationType;
  onCheckout?: () => void;
  onReplaceItem?: (itemName: string) => void;
  isLatest?: boolean;
}

const retailerColors: Record<string, string> = {
  Amazon: "bg-[hsl(var(--amazon))]",
  Walmart: "bg-[hsl(var(--walmart))]",
  Target: "bg-[hsl(var(--target))]",
};

export function CartRecommendationCard({
  cart,
  onCheckout,
  onReplaceItem,
  isLatest,
}: CartRecommendationProps) {
  const remaining = cart.budget - cart.totalCost;
  const pct = Math.min((cart.totalCost / cart.budget) * 100, 100);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

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

      {/* Ranking explanation */}
      {cart.rankingExplanation && (
        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Why this set?</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 transition-transform",
                  showExplanation && "rotate-180"
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
              {cart.rankingExplanation}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Cart items */}
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
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                ${item.price.toFixed(2)}
              </span>
              {isLatest && item.replace !== false && onReplaceItem && (
                <button
                  onClick={() => onReplaceItem(item.name)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Replace this item"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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

      {/* Alternative sets */}
      {cart.alternativeSets && cart.alternativeSets.length > 0 && (
        <Collapsible open={showAlternatives} onOpenChange={setShowAlternatives}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>{cart.alternativeSets.length} alternative set{cart.alternativeSets.length > 1 ? "s" : ""}</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 transition-transform",
                  showAlternatives && "rotate-180"
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3">
              {cart.alternativeSets.map((alt, ai) => (
                <AlternativeSetCard key={ai} alt={alt} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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

function AlternativeSetCard({ alt }: { alt: AlternativeSet }) {
  const totalCost = alt.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-foreground">{alt.set_name}</h5>
        <span className="text-xs font-medium text-muted-foreground">
          ${totalCost.toFixed(2)}
        </span>
      </div>
      <div className="space-y-1">
        {alt.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span>{item.emoji}</span>
            <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                retailerColors[item.retailer] || "bg-muted"
              )}
            />
            <span className="text-foreground font-medium">${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
        {alt.ranking_explanation}
      </p>
    </div>
  );
}
