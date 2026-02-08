import { motion } from "framer-motion";
import { ShoppingBag, PartyPopper, Monitor, Home, Shirt } from "lucide-react";

const prompts = [
  {
    icon: Shirt,
    text: "Full Patriots outfit under $150, delivered by Friday",
    label: "Sports Fan Outfit",
  },
  {
    icon: PartyPopper,
    text: "Birthday party supplies for 20 people under $100",
    label: "Party Supplies",
  },
  {
    icon: Monitor,
    text: "Home office starter kit: earbuds, charger, and desk accessories under $120",
    label: "Office Setup",
  },
  {
    icon: Home,
    text: "Cozy living room refresh: throw pillows, blanket, and candles under $80",
    label: "Home Refresh",
  },
  {
    icon: ShoppingBag,
    text: "Complete travel accessories kit: bag, toiletry set, wallet, and sunglasses under $100",
    label: "Travel Kit",
  },
];

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {prompts.map((prompt, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          onClick={() => onSelect(prompt.text)}
          className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <prompt.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{prompt.label}</p>
            <p className="mt-0.5 text-sm text-foreground">{prompt.text}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
