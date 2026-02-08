import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { DollarSign, Truck, ShoppingCart as CartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RetailerBadge } from "@/components/RetailerBadge";
import type { CartRecommendationItem } from "@/types/chat";

interface CartDashboardProps {
  items: CartRecommendationItem[];
  budget: number;
  rankingExplanation?: string;
}

const RETAILER_COLORS: Record<string, string> = {
  Amazon: "hsl(30, 100%, 50%)",
  Walmart: "hsl(210, 100%, 40%)",
  Target: "hsl(0, 80%, 50%)",
};

export function CartDashboard({ items, budget, rankingExplanation }: CartDashboardProps) {
  const totalCost = items.reduce((sum, item) => sum + item.price, 0);
  const remaining = budget - totalCost;

  const retailerSpend = items.reduce((acc, item) => {
    const r = item.retailer;
    acc[r] = (acc[r] || 0) + item.price;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(retailerSpend).map(([name, value]) => ({
    name,
    value: +value.toFixed(2),
  }));
  const barData = [
    { name: "Spent", value: +totalCost.toFixed(2), fill: "hsl(220, 70%, 50%)" },
    { name: "Remaining", value: +Math.max(0, remaining).toFixed(2), fill: "hsl(150, 60%, 40%)" },
  ];

  const maxDelivery = Math.max(...items.map((i) => i.delivery_days));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {rankingExplanation && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Why this set?</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {rankingExplanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="font-display text-lg font-bold">${totalCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                remaining >= 0 ? "bg-success/10" : "bg-destructive/10"
              }`}
            >
              <CartIcon
                className={`h-5 w-5 ${remaining >= 0 ? "text-success" : "text-destructive"}`}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {remaining >= 0 ? "Under Budget" : "Over Budget"}
              </p>
              <p className="font-display text-lg font-bold">${Math.abs(remaining).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Truck className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Delivery</p>
              <p className="font-display text-lg font-bold">{maxDelivery} days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spend by Retailer</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-40 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={RETAILER_COLORS[entry.name] || "#888"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: RETAILER_COLORS[entry.name] }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-40 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" hide domain={[0, budget]} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Budget: ${budget.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Item
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Retailer
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Delivery
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.emoji}</span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">{item.variant}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <RetailerBadge retailer={item.retailer} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {item.delivery_days}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
