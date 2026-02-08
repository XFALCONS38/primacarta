import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, MapPin, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckoutInfo } from "@/types/chat";

interface CheckoutFormProps {
  onSubmit: (info: CheckoutInfo) => void;
  disabled?: boolean;
}

export function CheckoutForm({ onSubmit, disabled }: CheckoutFormProps) {
  const [form, setForm] = useState<CheckoutInfo>({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardLast4: "",
  });

  const update = (key: keyof CheckoutInfo, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isValid =
    form.fullName.trim() &&
    form.email.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.zip.trim() &&
    form.cardLast4.trim().length === 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="text-center space-y-1">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Checkout Details
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter once — Prima handles checkout at every retailer
        </p>
      </div>

      {/* Name + Email */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            <User className="h-3 w-3" /> Full Name
          </Label>
          <Input
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            disabled={disabled}
            placeholder="John Doe"
            className="h-8 rounded-lg text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            <Mail className="h-3 w-3" /> Email
          </Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            disabled={disabled}
            placeholder="john@example.com"
            className="h-8 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1">
        <Label className="text-xs font-medium flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Street Address
        </Label>
        <Input
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          disabled={disabled}
          placeholder="123 Main St, Apt 4"
          className="h-8 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">City</Label>
          <Input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            disabled={disabled}
            placeholder="Boston"
            className="h-8 rounded-lg text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State</Label>
          <Input
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            disabled={disabled}
            placeholder="MA"
            className="h-8 rounded-lg text-sm"
            maxLength={2}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">ZIP</Label>
          <Input
            value={form.zip}
            onChange={(e) => update("zip", e.target.value)}
            disabled={disabled}
            placeholder="02101"
            className="h-8 rounded-lg text-sm"
            maxLength={10}
          />
        </div>
      </div>

      {/* Payment (simulated) */}
      <div className="space-y-1">
        <Label className="text-xs font-medium flex items-center gap-1">
          <CreditCard className="h-3 w-3" /> Card Last 4 Digits (simulated)
        </Label>
        <Input
          value={form.cardLast4}
          onChange={(e) => update("cardLast4", e.target.value.replace(/\D/g, "").slice(0, 4))}
          disabled={disabled}
          placeholder="4242"
          className="h-8 rounded-lg text-sm"
          maxLength={4}
        />
        <p className="text-[10px] text-muted-foreground">
          No real payment will be processed — this is a sandbox demo
        </p>
      </div>

      <Button
        onClick={() => onSubmit(form)}
        disabled={!isValid || disabled}
        className="w-full rounded-xl font-medium"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Place All Orders
      </Button>
    </motion.div>
  );
}
