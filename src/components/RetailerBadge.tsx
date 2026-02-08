import { cn } from "@/lib/utils";

interface RetailerBadgeProps {
  retailer: "Amazon" | "Walmart" | "Target";
  className?: string;
}

export function RetailerBadge({ retailer, className }: RetailerBadgeProps) {
  const styles = {
    Amazon: "bg-amazon/10 text-amazon border-amazon/20",
    Walmart: "bg-walmart/10 text-walmart border-walmart/20",
    Target: "bg-target/10 text-target border-target/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[retailer],
        className
      )}
    >
      {retailer}
    </span>
  );
}
