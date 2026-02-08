import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X, Search, BarChart3, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SearchProgress } from "@/components/SearchProgress";
import { ExamplePrompts } from "@/components/ExamplePrompts";
import { SessionHistory } from "@/components/SessionHistory";
import { StageIndicator } from "@/components/StageIndicator";
import { useChat } from "@/hooks/useChat";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { ShoppingSession } from "@/types/chat";
import { cn } from "@/lib/utils";

import { LandingPage } from "@/components/landing/LandingPage";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  const chat = useChat();
  const { sessions, saveSession, deleteSession } = useLocalStorage();
  const device = useDeviceType();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (chat.messages.length > 0) {
      const session: ShoppingSession = {
        id: activeSessionId || crypto.randomUUID(),
        title: chat.messages[0]?.content.slice(0, 50) || "New Session",
        messages: chat.messages,
        stage: chat.stage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!activeSessionId) setActiveSessionId(session.id);
      saveSession(session);
    }
  }, [chat.messages]);

  const handleStartShopping = () => setShowChat(true);
  const handleExampleSelect = (prompt: string) => {
    setShowChat(true);
    setTimeout(() => chat.sendMessage(prompt), 100);
  };
  const handleNewSession = () => {
    chat.clearMessages();
    setActiveSessionId(null);
  };
  const handleSelectSession = (session: ShoppingSession) => {
    setActiveSessionId(session.id);
    chat.restoreSession(session.messages, session.stage);
    setShowSidebar(false);
    if (!showChat) setShowChat(true);
  };

  if (!showChat) {
    return (
      <LandingPage
        device={device}
        sessions={sessions}
        onStartShopping={handleStartShopping}
        onExampleSelect={handleExampleSelect}
        onViewHistory={() => {
          setShowChat(true);
          setShowSidebar(true);
        }}
      />
    );
  }

  return (
    <ChatInterface
      chat={chat}
      device={device}
      sessions={sessions}
      activeSessionId={activeSessionId}
      showSidebar={showSidebar}
      setShowSidebar={setShowSidebar}
      onSelectSession={handleSelectSession}
      onDeleteSession={deleteSession}
      onNewSession={handleNewSession}
    />
  );
};

export default Index;
