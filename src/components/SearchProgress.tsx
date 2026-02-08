import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BarChart3, ShoppingCart, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PHASES = [
  { icon: Search, text: "Searching 50+ retailers...", duration: 4000 },
  { icon: Zap, text: "Comparing prices & shipping...", duration: 3500 },
  { icon: BarChart3, text: "Ranking by value & reviews...", duration: 3500 },
  { icon: ShoppingCart, text: "Building your cart...", duration: 4000 },
];

const TOTAL_DURATION = PHASES.reduce((sum, p) => sum + p.duration, 0);

export function SearchProgress() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / TOTAL_DURATION) * 100, 95);
      setProgress(pct);

      let accumulated = 0;
      for (let i = 0; i < PHASES.length; i++) {
        accumulated += PHASES[i].duration;
        if (elapsed < accumulated) {
          setPhaseIndex(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const phase = PHASES[phaseIndex];

  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-w-0 max-w-sm rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm space-y-2 sm:space-y-3 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-foreground"
          >
            <phase.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse shrink-0" />
            <span className="font-medium truncate">{phase.text}</span>
          </motion.div>
        </AnimatePresence>

        <Progress value={progress} className="h-1 sm:h-1.5" />

        <p className="text-[9px] sm:text-[10px] text-muted-foreground">
          Finding best deals in real-time
        </p>
      </motion.div>
    </div>
  );
}
