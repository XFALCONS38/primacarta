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
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CartRecommendationItem, AlternativeSet, SearchCandidate } from "@/types/chat";
import { cn } from "@/lib/utils";

type SortOption = "score" | "price_asc" | "price_desc" | "rating" | "delivery" | "reviews";

interface CartItemExplorerProps {
  mainItems: CartRecommendationItem[];
  alternativeSets?: AlternativeSet[];
  searchCandidates?: Record<string, SearchCandidate[]>;
}

interface ExplorerEntry {
  item: CartRecommendationItem;
  source: string;
  rank: number;
  isCandidate?: boolean;
}

function gatherAllItems(
  mainItems: CartRecommendationItem[],
  alternativeSets?: AlternativeSet[],
  searchCandidates?: Record<string, SearchCandidate[]>
): Record<string, ExplorerEntry[]> {
  const grouped: Record<string, ExplorerEntry[]> = {};
  const seenUrls = new Set<string>();
  const seenNames = new Set<string>();

  const addItem = (item: CartRecommendationItem, source: string, isCandidate = false) => {
    const category = item.category || "Other";
    if (!grouped[category]) grouped[category] = [];

    const key = item.url || item.name;
    if (seenUrls.has(key) || seenNames.has(item.name.toLowerCase())) return;
    if (item.url) seenUrls.add(item.url);
    seenNames.add(item.name.toLowerCase());

    grouped[category].push({ item, source, rank: 0, isCandidate });
  };

  mainItems.forEach((item) => addItem(item, "Selected"));

  alternativeSets?.forEach((alt) => {
    alt.items.forEach((item) => addItem(item, alt.set_name));
  });

  if (searchCandidates) {
    for (const [category, candidates] of Object.entries(searchCandidates)) {
      for (const candidate of candidates) {
        if (!candidate.price || candidate.price <= 0) continue;
        const asItem: CartRecommendationItem = {
          name: candidate.name,
          category: category,
          retailer: candidate.retailer,
          price: candidate.price,
          delivery_days: 5,
          emoji: "📦",
          url: candidate.url,
        };
        addItem(asItem, "Search Result", true);
      }
    }
  }

  Object.values(grouped).forEach((entries) => {
    entries.sort((a, b) => computeScore(b.item) - computeScore(a.item));
    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });
  });

  return grouped;
}

function computeScore(item: CartRecommendationItem): number {
  let score = 0;
  if (item.rating) score += item.rating * 6;
  if (item.review_count) score += Math.min(Math.log10(item.review_count + 1) * 5, 15);
  score += Math.max(0, (100 - item.price) / 5);
  score += Math.max(0, (7 - item.delivery_days) * 2);
  if (item.shipping_cost === 0) score += 5;
  if (item.discount_label) score += 5;
  return score;
}

function sortEntries(entries: ExplorerEntry[], sortBy: SortOption): ExplorerEntry[] {
  const sorted = [...entries];
  switch (sortBy) {
    case "score":
      sorted.sort((a, b) => computeScore(b.item) - computeScore(a.item));
      break;
    case "price_asc":
      sorted.sort((a, b) => a.item.price - b.item.price);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.item.price - a.item.price);
      break;
    case "rating":
      sorted.sort((a, b) => (b.item.rating || 0) - (a.item.rating || 0));
      break;
    case "delivery":
      sorted.sort((a, b) => a.item.delivery_days - b.item.delivery_days);
      break;
    case "reviews":
      sorted.sort((a, b) => (b.item.review_count || 0) - (a.item.review_count || 0));
      break;
  }
  sorted.forEach((entry, i) => {
    entry.rank = i + 1;
  });
  return sorted;
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
  isCandidate,
}: {
  item: CartRecommendationItem;
  source: string;
  rank: number;
  isCandidate?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors min-h-[48px] active:scale-[0.98]"
      >
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
          {item.price > 0 && (
            <span className="text-sm font-semibold text-foreground">${item.price.toFixed(2)}</span>
          )}
          {source === "Selected" && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
              In Cart
            </Badge>
          )}
          {isCandidate && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary"
            >
              <Search className="h-2.5 w-2.5 mr-0.5" />
              Found
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
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                {item.price > 0 && (
                  <DetailRow
                    icon={<DollarSign className="h-3.5 w-3.5" />}
                    label="Price"
                    value={`$${item.price.toFixed(2)}`}
                  />
                )}
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
                        ? (
                            <span className="text-[hsl(var(--success))] font-medium">Free</span>
                          )
                        : `$${item.shipping_cost.toFixed(2)}`
                      : "—"
                  }
                />
                {item.variant && (
                  <DetailRow
                    icon={<Info className="h-3.5 w-3.5" />}
                    label="Variant"
                    value={item.variant}
                  />
                )}
                <DetailRow
                  icon={
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full",
                        getRetailerDot(item.retailer)
                      )}
                    />
                  }
                  label="Retailer"
                  value={item.retailer}
                />
              </div>

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

              {item.discount_label && (
                <div className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                  <Tag className="h-3 w-3" />
                  {item.discount_label}
                </div>
              )}

              {item.reason && (
                <div className="rounded-md bg-primary/5 border border-primary/10 px-2.5 py-2 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Why this pick: </span>
                  {item.reason}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>
                  Composite score:{" "}
                  <span className="font-semibold text-foreground">
                    {computeScore(item).toFixed(1)}
                  </span>
                </span>
                <span className="text-muted-foreground/60">· Source: {source}</span>
              </div>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[36px]"
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

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "score", label: "Score" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Rating: Best First" },
  { value: "delivery", label: "Delivery: Fastest" },
  { value: "reviews", label: "Reviews: Most" },
];

export function CartItemExplorer({
  mainItems,
  alternativeSets,
  searchCandidates,
}: CartItemExplorerProps) {
  const grouped = useMemo(
    () => gatherAllItems(mainItems, alternativeSets, searchCandidates),
    [mainItems, alternativeSets, searchCandidates]
  );

  const categories = Object.keys(grouped);
  const [sortPerCategory, setSortPerCategory] = useState<Record<string, SortOption>>({});

  if (categories.length === 0) return null;

  const getSort = (cat: string) => sortPerCategory[cat] || "score";
  const setSort = (cat: string, sort: SortOption) => {
    setSortPerCategory((prev) => ({ ...prev, [cat]: sort }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-full rounded-xl border border-border bg-card p-4 shadow-sm space-y-3 overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm font-semibold text-foreground">
          All Found Items by Category
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Every product discovered across retailers, ranked by composite score. Click to expand
        details.
      </p>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="w-full overflow-x-auto flex-nowrap scrollbar-hide h-auto gap-1 bg-muted/50 p-1 justify-start">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="text-xs px-2.5 py-2 data-[state=active]:bg-background whitespace-nowrap shrink-0 min-h-[44px]"
            >
              {cat}
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4">
                {grouped[cat].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => {
          const sortedEntries = sortEntries(grouped[cat], getSort(cat));
          return (
            <TabsContent key={cat} value={cat} className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <Select
                  value={getSort(cat)}
                  onValueChange={(val) => setSort(cat, val as SortOption)}
                >
                  <SelectTrigger className="h-9 w-auto min-w-[160px] text-xs bg-background border-border">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {sortedEntries.length} item{sortedEntries.length !== 1 ? "s" : ""}
                </span>
              </div>

              {sortedEntries.map((entry, i) => (
                <ItemDetailCard
                  key={`${entry.item.name}-${entry.source}-${i}`}
                  item={entry.item}
                  source={entry.source}
                  rank={entry.rank}
                  isCandidate={entry.isCandidate}
                />
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </motion.div>
  );
}
