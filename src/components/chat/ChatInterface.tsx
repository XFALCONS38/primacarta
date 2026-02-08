import { useRef, useEffect, useCallback } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import { ChatMessageBubble } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SearchProgress } from "@/components/SearchProgress";
import { ExamplePrompts } from "@/components/ExamplePrompts";
import { SessionHistory } from "@/components/SessionHistory";
import { StageIndicator } from "@/components/StageIndicator";
import type { DeviceInfo } from "@/hooks/useDeviceType";
import type { ShoppingSession } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  chat: ReturnType<typeof import("@/hooks/useChat").useChat>;
  device: DeviceInfo;
  sessions: ShoppingSession[];
  activeSessionId: string | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  onSelectSession: (session: ShoppingSession) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
}

export function ChatInterface({
  chat,
  device,
  sessions,
  activeSessionId,
  showSidebar,
  setShowSidebar,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  // Swipe-to-close sidebar on touch devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
      // Swipe left more than 80px and mostly horizontal
      if (dx < -80 && dy < 60) {
        setShowSidebar(false);
      }
      touchStartRef.current = null;
    },
    [setShowSidebar]
  );

  const showSearchProgress = chat.isLoading && chat.stage === "research";
  const showTypingIndicator =
    chat.isLoading &&
    !showSearchProgress &&
    chat.messages[chat.messages.length - 1]?.role !== "assistant";

  const sidebarWidth = device.isTablet ? "w-72" : "w-64";

  return (
    <div className="flex h-dvh bg-background">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed left-3 z-50 rounded-lg border border-border bg-card p-3 shadow-sm md:hidden safe-top"
        style={{ top: "max(0.75rem, env(safe-area-inset-top, 0.75rem))" }}
      >
        {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform border-r border-border bg-card transition-transform will-change-transform md:relative md:translate-x-0",
          sidebarWidth,
          showSidebar ? "translate-x-0" : "-translate-x-full"
        )}
        onTouchStart={device.isTouch ? handleTouchStart : undefined}
        onTouchEnd={device.isTouch ? handleTouchEnd : undefined}
      >
        <SessionHistory
          sessions={sessions}
          activeSessionId={activeSessionId || undefined}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
          onNew={onNewSession}
        />
      </div>

      {/* Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6 safe-top landscape-compact">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 md:flex">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 pl-10 md:pl-0">
            <h2 className="font-display text-sm font-semibold">Prima</h2>
            <p className="text-[11px] text-muted-foreground">Searching all online stores</p>
          </div>
          <StageIndicator currentStage={chat.stage} />
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-4 md:p-6">
          <div className={cn("mx-auto space-y-4", device.isDesktop ? "max-w-3xl" : "max-w-2xl")}>
            {chat.messages.length === 0 && (
              <div className="space-y-6 py-8">
                <div className="text-center">
                  <h3 className="font-display text-lg font-semibold">What are you shopping for?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Describe what you need and Prima will build the perfect multi-retailer cart for you.
                  </p>
                </div>
                <ExamplePrompts onSelect={chat.sendMessage} />
              </div>
            )}

            {chat.messages.map((msg, i) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onChecklistSubmit={chat.submitChecklist}
                onClarificationSubmit={chat.submitClarification}
                onCheckout={chat.confirmCheckout}
                onCheckoutFormSubmit={chat.submitCheckoutForm}
                onReplaceItem={(name) => chat.sendMessage(`Replace "${name}" with an alternative`)}
                onSelectAlternativeSet={chat.selectAlternativeSet}
                onSwapItem={chat.swapAlternativeItem}
                onOptimizeBudget={chat.optimizeBudget}
                onOptimizeDelivery={chat.optimizeDelivery}
                isLatest={i === chat.messages.length - 1}
              />
            ))}

            {showSearchProgress && <SearchProgress />}
            {showTypingIndicator && <TypingIndicator />}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 md:p-4 safe-bottom landscape-compact">
          <div className={cn("mx-auto", device.isDesktop ? "max-w-3xl" : "max-w-2xl")}>
            <ChatInput onSend={chat.sendMessage} onCancel={chat.cancelStream} isLoading={chat.isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
