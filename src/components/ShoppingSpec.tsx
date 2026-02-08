import { useState } from "react";
import { motion } from "framer-motion";
import { FileJson, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ShoppingSpec as ShoppingSpecType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ShoppingSpecProps {
  spec: ShoppingSpecType;
}

export function ShoppingSpecCard({ spec }: ShoppingSpecProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-full overflow-hidden"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50">
            <FileJson className="h-4 w-4 text-primary" />
            <span>Shopping Spec</span>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 overflow-x-auto">
            <pre className="text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
