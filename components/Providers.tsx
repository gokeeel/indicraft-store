"use client";

import { SessionProvider } from "next-auth/react";
import { AgentPanelProvider } from "@/lib/agent/context";
import { AgentSidebar } from "@/components/agent/AgentSidebar";
import { ToastProvider } from "@/lib/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AgentPanelProvider>
          {children}
          <AgentSidebar />
        </AgentPanelProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
