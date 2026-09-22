"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AgentPanelContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  // Set by askVenmathi() (e.g. a homepage quick-prompt button), consumed once by
  // AgentSidebar to auto-send that message when the panel opens.
  pendingMessage: string | null;
  clearPendingMessage: () => void;
  askVenmathi: (message: string) => void;
};

const AgentPanelContext = createContext<AgentPanelContextValue | null>(null);

export function AgentPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  return (
    <AgentPanelContext.Provider
      value={{
        open,
        setOpen,
        toggle: () => setOpen((o) => !o),
        pendingMessage,
        clearPendingMessage: () => setPendingMessage(null),
        askVenmathi: (message: string) => {
          setPendingMessage(message);
          setOpen(true);
        },
      }}
    >
      {children}
    </AgentPanelContext.Provider>
  );
}

export function useAgentPanel() {
  const ctx = useContext(AgentPanelContext);
  if (!ctx) throw new Error("useAgentPanel must be used within AgentPanelProvider");
  return ctx;
}
