import { motion } from "framer-motion";
import { Trophy, Mountain, PartyPopper, Cake, Plane } from "lucide-react";

const prompts = [
  {
    icon: Trophy,
    text: "Full Patriots outfit head-to-toe, budget $150, delivered by Friday",
    label: "Super Bowl Outfit",
  },
  {
    icon: Mountain,
    text: "Downhill skiing outfit, warm and waterproof, size M, budget $400, delivery within 5 days",
    label: "Skiing Outfit",
  },
  {
    icon: PartyPopper,
    text: "I'm hosting a hackathon for 60 people — figure out snacks, badges, adapters, decorations, and prizes at the best price",
    label: "Hackathon Host Kit",
  },
  {
    icon: Cake,
    text: "Birthday party supplies for 20 people under $100",
    label: "Party Supplies",
  },
  {
    icon: Plane,
    text: "Complete travel accessories kit: bag, toiletry set, wallet, and sunglasses under $100",
    label: "Travel Kit",
  },
];

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="grid gap-1.5 sm:gap-2 grid-cols-1 sm:grid-cols-2">
      {prompts.map((prompt, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          onClick={() => onSelect(prompt.text)}
          className="group flex items-start gap-2.5 sm:gap-3 rounded-xl border border-border bg-card p-3 sm:p-3.5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98] min-h-[44px] overflow-hidden"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <prompt.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{prompt.label}</p>
            <p className="mt-0.5 text-xs sm:text-sm text-foreground break-words line-clamp-3">{prompt.text}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
