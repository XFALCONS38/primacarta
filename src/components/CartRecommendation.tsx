import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  CreditCard,
  Lightbulb,
  ArrowRightLeft,
  ChevronDown,
  Star,
  ExternalLink,
  Truck,
  Tag,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  CartRecommendation as CartRecommendationType,
  AlternativeSet,
  CartRecommendationItem,
} from "@/types/chat";
import { CartItemExplorer } from "@/components/CartItemExplorer";
import { cn } from "@/lib/utils";

interface CartRecommendationProps {
  cart: CartRecommendationType;
  onCheckout?: () => void;
  onReplaceItem?: (itemName: string) => void;
  onSelectAlternativeSet?: (alt: AlternativeSet) => void;
  onSwapItem?: (originalItem: CartRecommendationItem, newItem: CartRecommendationItem) => void;
  onOptimizeBudget?: () => void;
  onOptimizeDelivery?: () => void;
  isLatest?: boolean;
}

const RETAILER_PALETTE = [
  "bg-blue-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-lime-500",
];

function getRetailerColor(name: string): string {
  const knownColors: Record<string, string> = {
    Amazon: "bg-[hsl(var(--amazon,35,100%,50%))]",
    Walmart: "bg-[hsl(var(--walmart,210,100%,40%))]",
    Target: "bg-[hsl(var(--target,0,100%,45%))]",
  };
  if (knownColors[name]) return knownColors[name];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return RETAILER_PALETTE[Math.abs(hash) % RETAILER_PALETTE.length];
}

function RatingStars({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {reviewCount != null && <span>({reviewCount.toLocaleString()})</span>}
    </span>
  );
}

function CartItemRow({
  item,
  isLatest,
  onReplaceItem,
}: {
  item: CartRecommendationItem;
  isLatest?: boolean;
  onReplaceItem?: (name: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
      <span className="mt-0.5 text-base">{item.emoji}</span>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary hover:underline inline-flex items-center gap-1 break-words"
            >
              {item.name}
              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
            </a>
          ) : (
            <p className="font-medium text-foreground break-words">{item.name}</p>
          )}
          {item.reason && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 text-muted-foreground hover:text-primary p-1 min-w-[28px] min-h-[28px] flex items-center justify-center">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="max-w-[250px] text-xs p-3">
                {item.reason}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                getRetailerColor(item.retailer)
              )}
            />
            {item.retailer}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-0.5">
            <Truck className="h-3 w-3" />
            {item.delivery_days}d
          </span>
          {item.shipping_cost != null && (
            <>
              <span>•</span>
              <span
                className={cn(
                  item.shipping_cost === 0 && "text-[hsl(var(--success))] font-medium"
                )}
              >
                {item.shipping_cost === 0
                  ? "Free shipping"
                  : `+$${item.shipping_cost.toFixed(2)} ship`}
              </span>
            </>
          )}
          {item.variant && (
            <>
              <span>•</span>
              <span>{item.variant}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <RatingStars rating={item.rating} reviewCount={item.review_count} />
          {item.discount_label && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              <Tag className="h-2.5 w-2.5" />
              {item.discount_label}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="font-medium text-foreground">${item.price.toFixed(2)}</span>
        {item.original_price && item.original_price > item.price && (
          <span className="text-[10px] text-muted-foreground line-through">
            ${item.original_price.toFixed(2)}
          </span>
        )}
        {isLatest && item.replace !== false && onReplaceItem && (
          <button
            onClick={() => onReplaceItem(item.name)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Replace this item"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AlternativeItemRow({
  item,
  mainCartItem,
  isLatest,
  onSwapItem,
}: {
  item: CartRecommendationItem;
  mainCartItem?: CartRecommendationItem;
  isLatest?: boolean;
  onSwapItem?: (originalItem: CartRecommendationItem, newItem: CartRecommendationItem) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs group flex-wrap sm:flex-nowrap">
      <span>{item.emoji}</span>
      <span className="flex-1 min-w-0 text-muted-foreground break-words sm:truncate">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline inline-flex items-center gap-0.5"
          >
            {item.name}
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-40" />
          </a>
        ) : (
          item.name
        )}
      </span>
      <RatingStars rating={item.rating} reviewCount={item.review_count} />
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full shrink-0",
          getRetailerColor(item.retailer)
        )}
      />
      <span className="text-muted-foreground shrink-0">{item.retailer}</span>
      <span className="text-foreground font-medium shrink-0">${item.price.toFixed(2)}</span>
      {isLatest && mainCartItem && onSwapItem && (
        <button
          onClick={() => onSwapItem(mainCartItem, item)}
          className="touch-visible rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary min-w-[28px] min-h-[28px] flex items-center justify-center"
          title={`Swap "${mainCartItem.name}" with "${item.name}"`}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function CartRecommendationCard({
  cart,
  onCheckout,
  onReplaceItem,
  onSelectAlternativeSet,
  onSwapItem,
  onOptimizeBudget,
  onOptimizeDelivery,
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
      className="w-full max-w-full space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm font-semibold text-foreground">Your Cart</h4>
      </div>

      {cart.summary && <p className="text-xs text-muted-foreground">{cart.summary}</p>}

      {cart.rankingExplanation && (
        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 min-h-[44px]">
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

      <div className="space-y-1.5">
        {cart.items.map((item, i) => (
          <CartItemRow key={i} item={item} isLatest={isLatest} onReplaceItem={onReplaceItem} />
        ))}
      </div>

      {/* Budget bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground">${cart.totalCost.toFixed(2)}</span>
          </span>
          <span
            className={cn(
              "font-medium",
              remaining >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
            )}
          >
            {remaining >= 0
              ? `$${remaining.toFixed(2)} left`
              : `$${Math.abs(remaining).toFixed(2)} over`}
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

      {cart.alternativeSets && cart.alternativeSets.length > 0 && (
        <Collapsible open={showAlternatives} onOpenChange={setShowAlternatives}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 min-h-[44px]">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>
                {cart.alternativeSets.length} alternative set
                {cart.alternativeSets.length > 1 ? "s" : ""}
              </span>
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
                <AlternativeSetCard
                  key={ai}
                  alt={alt}
                  mainCartItems={cart.items}
                  isLatest={isLatest}
                  onSelectSet={onSelectAlternativeSet}
                  onSwapItem={onSwapItem}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <CartItemExplorer
        mainItems={cart.items}
        alternativeSets={cart.alternativeSets}
        searchCandidates={cart.searchCandidates}
      />

      {isLatest && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {onOptimizeBudget && (
              <Button
                onClick={onOptimizeBudget}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-12"
              >
                <DollarSign className="mr-1 h-3 w-3" />
                Optimize Budget
              </Button>
            )}
            {onOptimizeDelivery && (
              <Button
                onClick={onOptimizeDelivery}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-12"
              >
                <Clock className="mr-1 h-3 w-3" />
                Optimize Delivery
              </Button>
            )}
          </div>
          {onCheckout && (
            <Button onClick={onCheckout} className="w-full rounded-xl font-medium" size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Confirm & Checkout
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function AlternativeSetCard({
  alt,
  mainCartItems,
  isLatest,
  onSelectSet,
  onSwapItem,
}: {
  alt: AlternativeSet;
  mainCartItems: CartRecommendationItem[];
  isLatest?: boolean;
  onSelectSet?: (alt: AlternativeSet) => void;
  onSwapItem?: (originalItem: CartRecommendationItem, newItem: CartRecommendationItem) => void;
}) {
  const totalCost = alt.items.reduce((sum, item) => sum + item.price, 0);

  const findMainCartMatch = (
    altItem: CartRecommendationItem
  ): CartRecommendationItem | undefined => {
    return mainCartItems.find(
      (mainItem) => mainItem.category?.toLowerCase() === altItem.category?.toLowerCase()
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-foreground">{alt.set_name}</h5>
        <span className="text-xs font-medium text-muted-foreground">
          ${totalCost.toFixed(2)}
        </span>
      </div>
      <div className="space-y-1.5">
        {alt.items.map((item, i) => (
          <AlternativeItemRow
            key={i}
            item={item}
            mainCartItem={findMainCartMatch(item)}
            isLatest={isLatest}
            onSwapItem={onSwapItem}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
        {alt.ranking_explanation}
      </p>
      {isLatest && onSelectSet && (
        <Button
          onClick={() => onSelectSet(alt)}
          variant="outline"
          size="sm"
          className="w-full rounded-lg text-xs h-9"
        >
          <CheckCircle2 className="mr-1.5 h-3 w-3" />
          Use this set instead
        </Button>
      )}
    </div>
  );
}
