import { cn } from "@/lib/utils";

interface RetailerBadgeProps {
  retailer: string;
  className?: string;
}

// Known retailer colors
const KNOWN_STYLES: Record<string, string> = {
  Amazon: "bg-amazon/10 text-amazon border-amazon/20",
  Walmart: "bg-walmart/10 text-walmart border-walmart/20",
  Target: "bg-target/10 text-target border-target/20",
};

// Color palette for dynamic retailers
const DYNAMIC_PALETTE = [
  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
];

function getRetailerStyle(name: string): string {
  if (KNOWN_STYLES[name]) return KNOWN_STYLES[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DYNAMIC_PALETTE[Math.abs(hash) % DYNAMIC_PALETTE.length];
}

export function RetailerBadge({ retailer, className }: RetailerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        getRetailerStyle(retailer),
        className
      )}
    >
      {retailer}
    </span>
  );
}
