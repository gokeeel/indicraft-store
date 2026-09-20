"use client";

import { SessionProvider } from "next-auth/react";
import { AgentPanelProvider } from "@/lib/agent/context";
import { AgentSidebar } from "@/components/agent/AgentSidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AgentPanelProvider>
        {children}
        <AgentSidebar />
      </AgentPanelProvider>
    </SessionProvider>
  );
}
