"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { useAgentPanel } from "@/lib/agent/context";
import { MessageList } from "@/components/agent/MessageList";
import { ChatInput } from "@/components/agent/ChatInput";
import { Button } from "@/components/ui/button";
import type { ChatEntry } from "@/lib/agent/client-types";
import type { Block } from "@/lib/agent/blocks";

const STORAGE_KEY = "venmathi-chat";

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function AgentSidebar() {
  const { open, setOpen, toggle } = useAgentPanel();
  const { data: session, status } = useSession();
  // Lazy init reads sessionStorage synchronously on the client. Safe from hydration
  // mismatches because the panel starts closed, so this content isn't in the initial DOM.
  const [entries, setEntries] = useState<ChatEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries]);

  // Escape closes the panel, matching standard dialog/drawer behavior.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  async function send(text: string) {
    const userEntry: ChatEntry = { id: makeId(), role: "user", content: text };
    const nextEntries = [...entries, userEntry];
    setEntries(nextEntries);
    setPending(true);

    let res: Response;
    try {
      res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextEntries.map((e) => ({ role: e.role, content: e.content })) }),
      });
    } catch {
      setPending(false);
      setEntries((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: "Oops, something glitched on my side. Try again?", blocks: [] },
      ]);
      return;
    }

    if (!res.ok || !res.body) {
      setPending(false);
      const data = await res.json().catch(() => ({}));
      setEntries((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: data.error ?? "Oops, something glitched on my side. Try again?",
          blocks: [],
        },
      ]);
      return;
    }

    // Streamed as newline-delimited JSON (see app/api/agent/chat/route.ts): text deltas append
    // to a fresh assistant entry as they arrive, blocks land once tool results are ready.
    const assistantId = makeId();
    let started = false;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as { type: "text"; delta: string } | { type: "blocks"; blocks: Block[] };

          if (!started) {
            started = true;
            setPending(false);
            setEntries((prev) => [...prev, { id: assistantId, role: "assistant", content: "", blocks: [] }]);
          }

          if (chunk.type === "text") {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === assistantId && e.role === "assistant" ? { ...e, content: e.content + chunk.delta } : e
              )
            );
          } else {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === assistantId && e.role === "assistant"
                  ? { ...e, blocks: chunk.blocks }
                  : e
              )
            );
          }
        }
      }
    } finally {
      setPending(false);
      if (!started) {
        setEntries((prev) => [...prev, { id: assistantId, role: "assistant", content: "", blocks: [] }]);
      }
    }
  }

  // "Add to cart" on a product card is a direct action, not a chat message — it hits the
  // cart API straight away and drops a fresh cart card in, with no model round trip.
  async function addToCart(productId: string) {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEntries((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: data.error ?? "Couldn't add that to your cart.", blocks: [] },
      ]);
      return;
    }

    const cart = await fetch("/api/cart/summary").then((r) => r.json());
    setEntries((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "assistant",
        content: "Added to your cart!",
        blocks: [{ type: "cart", items: cart.items, subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total }],
      },
    ]);
  }

  // Picking an address (saved or newly-created) previews the order directly — a client
  // action, not a chat message, same principle as cart +/-.
  async function selectAddress(addressId: string) {
    const res = await fetch("/api/agent/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEntries((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: data.error ?? "Couldn't preview your order.", blocks: [] },
      ]);
      return;
    }

    const preview = await res.json();
    setEntries((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "assistant",
        content: "Here's your order summary!",
        blocks: [{ type: "order_summary", ...preview }],
      },
    ]);
  }

  // Clicking Confirm in the order summary — the only path that can ever create an order.
  async function confirmOrder(confirmToken: string) {
    const res = await fetch("/api/agent/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEntries((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: data.error ?? "Couldn't confirm your order.", blocks: [] },
      ]);
      return;
    }

    const result = await res.json();
    setEntries((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "assistant",
        content: "Your order is created! It's awaiting payment.",
        blocks: [
          {
            type: "payment_link",
            orderId: result.orderId,
            orderNumber: result.orderNumber,
            amount: result.amount,
            url: result.paymentUrl,
          },
        ],
      },
    ]);
  }

  // "+ Add a new address" is pure UI — no server round trip needed to show the form.
  function requestNewAddress() {
    setEntries((prev) => [
      ...prev,
      { id: makeId(), role: "assistant", content: "Sure, add your address below.", blocks: [{ type: "address_form" }] },
    ]);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
        aria-label="Ask Venmathi"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
          <aside
            role="dialog"
            aria-label="Venmathi, Indicraft shopping assistant"
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-[#f7f5f2] shadow-xl md:w-[400px] md:border-l md:border-border"
          >
            <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Venmathi</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 hover:opacity-70">
                <X className="h-5 w-5" />
              </button>
            </div>

            {status === "loading" ? null : !session ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <Sparkles className="h-8 w-8 text-primary" />
                <p className="text-sm text-muted">Login to chat with Venmathi, your Indicraft shopping assistant.</p>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            ) : (
              <>
                {entries.length === 0 && (
                  <div className="px-4 py-4 text-sm text-muted">
                    Vanakkam! I&apos;m Venmathi 👋 Tell me what you&apos;re looking for — a saree, home decor,
                    spices — and I&apos;ll find it for you.
                  </div>
                )}
                <MessageList
                  entries={entries}
                  pending={pending}
                  onQuickReply={send}
                  onAddToCart={addToCart}
                  onSelectAddress={selectAddress}
                  onRequestNewAddress={requestNewAddress}
                  onConfirmOrder={confirmOrder}
                />
                <ChatInput onSend={send} disabled={pending} />
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
}
