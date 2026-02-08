import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { ClarificationField, ClarificationRequest } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ClarificationFormProps {
  request: ClarificationRequest;
  onSubmit: (values: Record<string, string>) => void;
  disabled?: boolean;
}

export function ClarificationForm({ request, onSubmit, disabled }: ClarificationFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    request.fields.forEach((f) => {
      init[f.id] = f.value || "";
    });
    return init;
  });

  const update = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const toggleMulti = (fieldId: string, option: string) => {
    setValues((prev) => {
      const current = prev[fieldId] ? prev[fieldId].split(",").filter(Boolean) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [fieldId]: next.join(",") };
    });
  };

  const handleSubmit = () => {
    if (disabled) return;
    onSubmit(values);
  };

  const allRequiredFilled = request.fields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[f.id];
      return typeof v === "string" ? v.trim() !== "" : !!v;
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h4 className="mb-3 font-display text-sm font-semibold text-foreground">
        {request.title}
      </h4>

      <div className="space-y-3">
        {request.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={values[field.id] || ""}
            onChange={(v) => update(field.id, v)}
            onToggleMulti={(opt) => toggleMulti(field.id, opt)}
            selectedMulti={String(values[field.id] || "")
              .split(",")
              .filter(Boolean)}
            disabled={disabled}
          />
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!allRequiredFilled || disabled}
        className="mt-4 w-full rounded-xl font-medium min-h-[44px]"
        size="sm"
      >
        Submit Details
      </Button>
    </motion.div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  onToggleMulti,
  selectedMulti,
  disabled,
}: {
  field: ClarificationField;
  value: string;
  onChange: (v: string) => void;
  onToggleMulti: (opt: string) => void;
  selectedMulti: string[];
  disabled?: boolean;
}) {
  const prefilled = !!field.value;

  return (
    <div className="space-y-1">
      <Label
        htmlFor={field.id}
        className={cn(
          "text-xs font-medium",
          field.required ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
        {prefilled && (
          <span className="ml-1.5 text-[10px] text-muted-foreground">(pre-filled)</span>
        )}
      </Label>

      {field.type === "text" && (
        <Input
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 rounded-lg text-base sm:text-sm"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      )}

      {field.type === "number" && (
        <Input
          id={field.id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 rounded-lg text-base sm:text-sm"
          placeholder="0"
        />
      )}

      {field.type === "select" && field.options && (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="h-10 rounded-lg text-base sm:text-sm">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "multiselect" && field.options && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {field.options.map((opt) => (
            <label
              key={opt}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors min-h-[36px] max-w-full overflow-hidden",
                selectedMulti.includes(opt)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              )}
            >
              <Checkbox
                checked={selectedMulti.includes(opt)}
                onCheckedChange={() => onToggleMulti(opt)}
                disabled={disabled}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
