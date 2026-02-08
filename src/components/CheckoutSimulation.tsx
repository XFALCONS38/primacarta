import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RetailerBadge } from "@/components/RetailerBadge";
import type { CheckoutStep } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CheckoutSimulationProps {
  checkoutSteps: CheckoutStep[];
  grandTotal: number;
  onComplete?: () => void;
}

export function CheckoutSimulation({
  checkoutSteps,
  grandTotal,
  onComplete,
}: CheckoutSimulationProps) {
  const [currentRetailer, setCurrentRetailer] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    const currentGroup = checkoutSteps[currentRetailer];
    if (!currentGroup) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      if (currentStep < currentGroup.steps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else if (currentRetailer < checkoutSteps.length - 1) {
        setCurrentRetailer((r) => r + 1);
        setCurrentStep(0);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStep, currentRetailer, checkoutSteps.length, isComplete, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-4"
    >
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Checkout Simulation
        </h3>
        <p className="text-xs text-muted-foreground">
          This is a simulation — no real purchase will be made
        </p>
      </div>

      <div className="space-y-3">
        {checkoutSteps.map((group, gi) => (
          <Card
            key={group.retailer}
            className={cn(
              "border-border transition-all",
              gi < currentRetailer ? "opacity-60" : ""
            )}
          >
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Step {gi + 1}
                </CardTitle>
                <RetailerBadge retailer={group.retailer as "Amazon" | "Walmart" | "Target"} />
              </div>
              <span className="text-sm font-medium text-foreground">
                ${group.subtotal.toFixed(2)}
              </span>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {/* Items in this order */}
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item, ii) => (
                  <span
                    key={ii}
                    className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Checkout steps */}
              <div className="space-y-2">
                {group.steps.map((stepLabel, si) => {
                  const done =
                    gi < currentRetailer ||
                    (gi === currentRetailer && si <= currentStep);
                  const active =
                    gi === currentRetailer && si === currentStep;

                  return (
                    <div key={si} className="flex items-center gap-2.5">
                      <motion.div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                        animate={active ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {done ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <span className="text-[10px] font-medium">
                            {si + 1}
                          </span>
                        )}
                      </motion.div>
                      <span
                        className={cn(
                          "text-sm",
                          done
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Delivery estimate */}
              {group.estimated_delivery_days && (
                <p className="text-[11px] text-muted-foreground">
                  Est. delivery: {group.estimated_delivery_days} days
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex flex-col items-center gap-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <h4 className="font-display text-lg font-semibold text-foreground">
                  All Orders Placed!
                </h4>
                <p className="text-sm text-muted-foreground">
                  {checkoutSteps.length} retailer{checkoutSteps.length > 1 ? "s" : ""} •{" "}
                  ${grandTotal.toFixed(2)} total
                </p>
                <p className="text-xs text-muted-foreground">
                  (This was a simulation — no real purchases were made)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
