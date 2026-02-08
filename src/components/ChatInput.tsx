import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onCancel, isLoading, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Describe what you're shopping for..."}
        rows={1}
        className="flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      {isLoading ? (
        <Button size="icon" variant="ghost" onClick={onCancel} className="h-8 w-8 shrink-0">
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="h-8 w-8 shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
