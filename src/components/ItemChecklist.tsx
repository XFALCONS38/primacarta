import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChecklistItem } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ItemChecklistProps {
  items: ChecklistItem[];
  onSubmit: (selectedItems: ChecklistItem[]) => void;
  disabled?: boolean;
}

export function ItemChecklist({ items, onSubmit, disabled }: ItemChecklistProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    const selectedItems = items
      .filter((item) => selected.has(item.id))
      .map((item) => ({ ...item, selected: true }));
    if (selectedItems.length > 0) onSubmit(selectedItems);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-3"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const isSelected = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              disabled={disabled}
              className={cn(
                "relative flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-all min-h-[48px]",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="flex-1 font-medium">{item.label}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selected.size === 0 || disabled}
        className="w-full rounded-xl font-medium min-h-[44px]"
        size="sm"
      >
        Find these items ({selected.size})
      </Button>
    </motion.div>
  );
}
