import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CreditCard, MapPin, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RetailerBadge } from "@/components/RetailerBadge";
import type { CartRecommendationItem } from "@/types/chat";

interface CheckoutSimulationProps {
  items: CartRecommendationItem[];
  onComplete: () => void;
}

interface RetailerGroup {
  retailer: "Amazon" | "Walmart" | "Target";
  items: CartRecommendationItem[];
  subtotal: number;
}

const CHECKOUT_STEPS = [
  { label: "Name filled", icon: User },
  { label: "Address entered", icon: MapPin },
  { label: "Payment entered", icon: CreditCard },
  { label: "Order confirmed", icon: Check },
];

export function CheckoutSimulation({ items, onComplete }: CheckoutSimulationProps) {
  const [currentRetailer, setCurrentRetailer] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const groups: RetailerGroup[] = Object.values(
    items.reduce((acc, item) => {
      const r = item.retailer;
      if (!acc[r]) acc[r] = { retailer: r, items: [], subtotal: 0 };
      acc[r].items.push(item);
      acc[r].subtotal += item.price;
      return acc;
    }, {} as Record<string, RetailerGroup>)
  );

  const totalCost = groups.reduce((sum, g) => sum + g.subtotal, 0);

  useEffect(() => {
    if (isComplete) return;

    const timer = setTimeout(() => {
      if (currentStep < CHECKOUT_STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else if (currentRetailer < groups.length - 1) {
        setCurrentRetailer((r) => r + 1);
        setCurrentStep(0);
      } else {
        setIsComplete(true);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStep, currentRetailer, groups.length, isComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold">Checkout Simulation</h3>
        <p className="text-xs text-muted-foreground">This is a simulation — no real purchase will be made</p>
      </div>

      <div className="space-y-3">
        {groups.map((group, gi) => (
          <Card key={group.retailer} className={`border-border transition-all ${gi < currentRetailer ? "opacity-60" : ""}`}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Step {gi + 1}</CardTitle>
                <RetailerBadge retailer={group.retailer} />
              </div>
              <span className="text-sm font-medium">${group.subtotal.toFixed(2)}</span>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex gap-2">
                {CHECKOUT_STEPS.map((step, si) => {
                  const done = gi < currentRetailer || (gi === currentRetailer && si <= currentStep);
                  const active = gi === currentRetailer && si === currentStep;
                  return (
                    <div key={si} className="flex flex-1 flex-col items-center gap-1.5">
                      <motion.div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                        animate={active ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <step.icon className="h-3.5 w-3.5" />
                      </motion.div>
                      <span className={`text-[10px] text-center ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex flex-col items-center gap-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <h4 className="font-display text-lg font-semibold">All Orders Placed!</h4>
                <p className="text-sm text-muted-foreground">
                  {groups.length} retailers • ${totalCost.toFixed(2)} total
                </p>
                <p className="text-xs text-muted-foreground">
                  (This was a simulation — no real purchases were made)
                </p>
              </CardContent>
            </Card>
            <Button onClick={onComplete} variant="outline" size="sm">
              Back to Chat
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
