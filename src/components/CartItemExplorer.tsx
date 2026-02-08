import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Star,
  ExternalLink,
  Truck,
  Tag,
  DollarSign,
  Package,
  BarChart3,
  Info,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { CartRecommendationItem, AlternativeSet } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CartItemExplorerProps {
  mainItems: CartRecommendationItem[];
  alternativeSets?: AlternativeSet[];
}

// Gather ALL items (main + alternatives) and group by category
function gatherAllItems(
  mainItems: CartRecommendationItem[],
  alternativeSets?: AlternativeSet[]
): Record<string, { item: CartRecommendationItem; source: string; rank: number }[]> {
  const grouped: Record<string, { item: CartRecommendationItem; source: string; rank: number }[]> = {};

  const addItem = (item: CartRecommendationItem, source: string) => {
    const category = item.category || "Other";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ item, source, rank: 0 });
  };

  // Main cart items first
  mainItems.forEach((item) => addItem(item, "Selected"));

  // Alternative set items
  alternativeSets?.forEach((alt) => {
    alt.items.forEach((item) => addItem(item, alt.set_name));
  });

  // Rank within each category by a composite score
  Object.values(grouped).forEach((entries) => {
    entries.sort((a, b) => {
      const scoreA = computeScore(a.item);
      const scoreB = computeScore(b.item);
      return scoreB - scoreA;
    });
    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });
  });

  return grouped;
}

function computeScore(item: CartRecommendationItem): number {
  let score = 0;
  // Rating contribution (0-5 scaled to 0-30)
  if (item.rating) score += item.rating * 6;
  // Review volume (log scale, max ~15)
  if (item.review_count) score += Math.min(Math.log10(item.review_count + 1) * 5, 15);
  // Price advantage (lower = better, normalize against a baseline of $100)
  score += Math.max(0, (100 - item.price) / 5);
  // Delivery speed bonus (faster = better)
  score += Math.max(0, (7 - item.delivery_days) * 2);
  // Free shipping bonus
  if (item.shipping_cost === 0) score += 5;
  // Discount bonus
  if (item.discount_label) score += 5;
  return score;
}

const RETAILER_PALETTE = [
  "bg-blue-500", "bg-orange-500", "bg-red-500", "bg-emerald-500",
  "bg-purple-500", "bg-yellow-500", "bg-pink-500", "bg-cyan-500",
];

function getRetailerDot(name: string): string {
  const known: Record<string, string> = {
    Amazon: "bg-orange-500",
    Walmart: "bg-blue-600",
    Target: "bg-red-500",
  };
  if (known[name]) return known[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return RETAILER_PALETTE[Math.abs(hash) % RETAILER_PALETTE.length];
}

function ItemDetailCard({
  item,
  source,
  rank,
}: {
  item: CartRecommendationItem;
  source: string;
  rank: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        {/* Rank badge */}
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            rank === 1
              ? "bg-primary text-primary-foreground"
              : rank === 2
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
          )}
        >
          #{rank}
        </span>

        <span className="text-base">{item.emoji}</span>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("inline-block h-2 w-2 rounded-full", getRetailerDot(item.retailer))} />
            <span>{item.retailer}</span>
            {item.rating && (
              <>
                <span>•</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{item.rating.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-foreground">${item.price.toFixed(2)}</span>
          {source === "Selected" && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
              In Cart
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 py-3 space-y-2.5 bg-muted/20">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <DetailRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Price" value={`$${item.price.toFixed(2)}`} />
                {item.original_price && item.original_price > item.price && (
                  <DetailRow
                    icon={<Tag className="h-3.5 w-3.5" />}
                    label="Original"
                    value={
                      <span className="line-through text-muted-foreground">
                        ${item.original_price.toFixed(2)}
                      </span>
                    }
                  />
                )}
                <DetailRow
                  icon={<Truck className="h-3.5 w-3.5" />}
                  label="Delivery"
                  value={`${item.delivery_days} day${item.delivery_days !== 1 ? "s" : ""}`}
                />
                <DetailRow
                  icon={<Package className="h-3.5 w-3.5" />}
                  label="Shipping"
                  value={
                    item.shipping_cost != null
                      ? item.shipping_cost === 0
                        ? <span className="text-[hsl(var(--success))] font-medium">Free</span>
                        : `$${item.shipping_cost.toFixed(2)}`
                      : "—"
                  }
                />
                {item.variant && (
                  <DetailRow icon={<Info className="h-3.5 w-3.5" />} label="Variant" value={item.variant} />
                )}
                <DetailRow
                  icon={<span className={cn("inline-block h-3 w-3 rounded-full", getRetailerDot(item.retailer))} />}
                  label="Retailer"
                  value={item.retailer}
                />
              </div>

              {/* Rating row */}
              {item.rating && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < Math.round(item.rating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-foreground">{item.rating.toFixed(1)}</span>
                  {item.review_count != null && (
                    <span className="text-muted-foreground">
                      ({item.review_count.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Discount badge */}
              {item.discount_label && (
                <div className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                  <Tag className="h-3 w-3" />
                  {item.discount_label}
                </div>
              )}

              {/* Reason / decision trace */}
              {item.reason && (
                <div className="rounded-md bg-primary/5 border border-primary/10 px-2.5 py-2 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Why this pick: </span>
                  {item.reason}
                </div>
              )}

              {/* Score */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>
                  Composite score:{" "}
                  <span className="font-semibold text-foreground">{computeScore(item).toFixed(1)}</span>
                </span>
                <span className="text-muted-foreground/60">
                  · Source: {source}
                </span>
              </div>

              {/* Link */}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Product Page
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function CartItemExplorer({ mainItems, alternativeSets }: CartItemExplorerProps) {
  const grouped = useMemo(
    () => gatherAllItems(mainItems, alternativeSets),
    [mainItems, alternativeSets]
  );

  const categories = Object.keys(grouped);

  if (categories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm font-semibold text-foreground">
          All Found Items by Category
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Every product discovered, ranked by composite score. Click to expand details.
      </p>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="text-xs px-2.5 py-1.5 data-[state=active]:bg-background"
            >
              {cat}
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4">
                {grouped[cat].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-3 space-y-2">
            {grouped[cat].map((entry, i) => (
              <ItemDetailCard
                key={`${entry.item.name}-${entry.source}-${i}`}
                item={entry.item}
                source={entry.source}
                rank={entry.rank}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
