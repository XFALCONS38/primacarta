import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, MapPin, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import type { CheckoutInfo } from "@/types/chat";

interface CheckoutFormProps {
  onSubmit: (info: CheckoutInfo) => void;
  disabled?: boolean;
}

const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  address: z.string().trim().min(1, "Address is required").max(200, "Address too long"),
  city: z.string().trim().min(1, "City is required").max(100, "City too long"),
  state: z.string().trim().min(1, "State is required").max(2, "Use 2-letter code"),
  zip: z.string().trim().min(5, "ZIP too short").max(10, "ZIP too long").regex(/^[0-9\-]+$/, "Invalid ZIP"),
  cardLast4: z.string().length(4, "Must be 4 digits").regex(/^\d{4}$/, "Digits only"),
});

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof CheckoutInfo, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data as CheckoutInfo);
  };

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
      className="w-full max-w-full space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm overflow-hidden"
    >
      <div className="text-center space-y-1">
        <h3 className="font-display text-lg font-semibold text-foreground">Checkout Details</h3>
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
            className="h-10 rounded-lg text-base sm:text-sm"
          />
          {errors.fullName && (
            <p className="text-[10px] text-destructive">{errors.fullName}</p>
          )}
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
            className="h-10 rounded-lg text-base sm:text-sm"
          />
          {errors.email && <p className="text-[10px] text-destructive">{errors.email}</p>}
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
          className="h-10 rounded-lg text-base sm:text-sm"
        />
        {errors.address && <p className="text-[10px] text-destructive">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">City</Label>
          <Input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            disabled={disabled}
            placeholder="Boston"
            className="h-10 rounded-lg text-base sm:text-sm"
          />
          {errors.city && <p className="text-[10px] text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State</Label>
          <Input
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            disabled={disabled}
            placeholder="MA"
            className="h-10 rounded-lg text-base sm:text-sm"
            maxLength={2}
          />
          {errors.state && <p className="text-[10px] text-destructive">{errors.state}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">ZIP</Label>
          <Input
            value={form.zip}
            onChange={(e) => update("zip", e.target.value)}
            disabled={disabled}
            placeholder="02101"
            className="h-10 rounded-lg text-base sm:text-sm"
            maxLength={10}
          />
          {errors.zip && <p className="text-[10px] text-destructive">{errors.zip}</p>}
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
          className="h-10 rounded-lg text-base sm:text-sm"
          maxLength={4}
        />
        {errors.cardLast4 && (
          <p className="text-[10px] text-destructive">{errors.cardLast4}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          No real payment will be processed — this is a sandbox demo
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid || disabled}
        className="w-full rounded-xl font-medium min-h-[44px]"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Place All Orders
      </Button>
    </motion.div>
  );
}
