"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AgentPanelContextValue = { open: boolean; setOpen: (open: boolean) => void; toggle: () => void };

const AgentPanelContext = createContext<AgentPanelContextValue | null>(null);

export function AgentPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <AgentPanelContext.Provider value={{ open, setOpen, toggle: () => setOpen((o) => !o) }}>
      {children}
    </AgentPanelContext.Provider>
  );
}

export function useAgentPanel() {
  const ctx = useContext(AgentPanelContext);
  if (!ctx) throw new Error("useAgentPanel must be used within AgentPanelProvider");
  return ctx;
}
