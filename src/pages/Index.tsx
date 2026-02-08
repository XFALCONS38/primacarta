import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ExamplePrompts } from "@/components/ExamplePrompts";
import { SessionHistory } from "@/components/SessionHistory";
import { StageIndicator } from "@/components/StageIndicator";
import { useChat } from "@/hooks/useChat";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { ShoppingSession } from "@/types/chat";

const Index = () => {
  const {
    messages,
    isLoading,
    stage,
    sendMessage,
    submitChecklist,
    submitClarification,
    confirmCheckout,
    cancelStream,
    clearMessages,
  } = useChat();
  const { sessions, saveSession, deleteSession } = useLocalStorage();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const session: ShoppingSession = {
        id: activeSessionId || crypto.randomUUID(),
        title: messages[0]?.content.slice(0, 50) || "New Session",
        messages,
        stage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!activeSessionId) setActiveSessionId(session.id);
      saveSession(session);
    }
  }, [messages]);

  const handleStartShopping = () => setShowChat(true);

  const handleExampleSelect = (prompt: string) => {
    setShowChat(true);
    setTimeout(() => sendMessage(prompt), 100);
  };

  const handleNewSession = () => {
    clearMessages();
    setActiveSessionId(null);
  };

  const handleSelectSession = (session: ShoppingSession) => {
    setActiveSessionId(session.id);
    clearMessages();
    setShowSidebar(false);
  };

  // Landing page
  if (!showChat) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl space-y-8 text-center"
        >
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              AI Shopping Agent
            </h1>
            <p className="mx-auto max-w-md text-lg text-muted-foreground">
              Tell me what you need, and I'll find the best deals across Amazon,
              Walmart, and Target — all in one cart.
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleStartShopping}
            className="rounded-xl px-8 font-display text-base"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Start Shopping
          </Button>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Or try an example:
            </p>
            <ExamplePrompts onSelect={handleExampleSelect} />
          </div>

          {sessions.length > 0 && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                You have {sessions.length} recent session
                {sessions.length > 1 ? "s" : ""}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setShowChat(true);
                  setShowSidebar(true);
                }}
                className="text-sm"
              >
                View history →
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed left-3 top-3 z-50 rounded-lg border border-border bg-card p-2 shadow-sm md:hidden"
      >
        {showSidebar ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform md:relative md:translate-x-0 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SessionHistory
          sessions={sessions}
          activeSessionId={activeSessionId || undefined}
          onSelect={handleSelectSession}
          onDelete={deleteSession}
          onNew={handleNewSession}
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
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-sm font-semibold">
              AI Shopping Agent
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Amazon • Walmart • Target
            </p>
          </div>
          <StageIndicator currentStage={stage} />
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="chat-scroll flex-1 overflow-y-auto p-4 md:p-6"
        >
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.length === 0 && (
              <div className="space-y-6 py-8">
                <div className="text-center">
                  <h3 className="font-display text-lg font-semibold">
                    What are you shopping for?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Describe what you need and I'll build the perfect
                    multi-retailer cart for you.
                  </p>
                </div>
                <ExamplePrompts onSelect={sendMessage} />
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onChecklistSubmit={submitChecklist}
                onClarificationSubmit={submitClarification}
                onCheckout={confirmCheckout}
                isLatest={i === messages.length - 1}
              />
            ))}

            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <TypingIndicator />
              )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 md:p-4">
          <div className="mx-auto max-w-2xl">
            <ChatInput
              onSend={sendMessage}
              onCancel={cancelStream}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
