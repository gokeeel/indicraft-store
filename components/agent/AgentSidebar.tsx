"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Sparkles, RotateCcw } from "lucide-react";
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

// API error responses are documented as plain strings, but a malformed one (e.g. a raw Zod
// error object) would otherwise get set directly as message content and crash the render —
// React can't display an object as a child.
function errorText(data: unknown, fallback: string): string {
  const value = (data as { message?: unknown; error?: unknown } | null)?.message ?? (data as { error?: unknown } | null)?.error;
  return typeof value === "string" ? value : fallback;
}

// The header's cart count is server-rendered per page load, not client state -- without this,
// nothing in the agent panel (text, voice, or direct card actions) ever updates it, so the
// badge sits stale until the user does a hard navigation (Section 21.5: cart count must update
// when the agent adds an item).
function hasCartBlock(blocks: Block[]): boolean {
  return blocks.some((b) => b.type === "cart" || b.type === "payment_link");
}

export function AgentSidebar() {
  const { open, setOpen, toggle, pendingMessage, clearPendingMessage } = useAgentPanel();
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const [processingVoice, setProcessingVoice] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries]);

  function resetChat() {
    setEntries([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // WCAG dialog pattern: return focus to whatever triggered the panel once it closes.
  // ChatInput's autoFocus handles the other half (moving focus in on open).
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => previouslyFocused?.focus?.();
  }, [open]);

  // Escape closes the panel, matching standard dialog/drawer behavior.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  // A homepage "quick prompt" button (askVenmathi()) opens the panel with a message already
  // queued -- send it once we're open and actually logged in (the login gate below blocks
  // send() otherwise, and the message would silently vanish).
  useEffect(() => {
    if (open && pendingMessage && session) {
      const message = pendingMessage;
      clearPendingMessage();
      send(message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingMessage, session]);

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
          content: errorText(data, "Oops, something glitched on my side. Try again?"),
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
            if (hasCartBlock(chunk.blocks)) router.refresh();
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

  // Push-to-talk: sends the recorded clip to the voice route (STT -> agent loop -> TTS in one
  // round trip, unlike text which streams). The user bubble shows the transcript once it comes
  // back, since we don't have it up front. Audio auto-plays — the mic tap is the interaction
  // that unlocks autoplay for this response.
  async function sendVoice(audioBlob: Blob) {
    setProcessingVoice(true);
    const form = new FormData();
    form.append("audio", audioBlob, "voice.webm");
    form.append("history", JSON.stringify(entries.map((e) => ({ role: e.role, content: e.content }))));

    let res: Response;
    try {
      res = await fetch("/api/agent/voice", { method: "POST", body: form });
    } catch {
      setProcessingVoice(false);
      setEntries((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: "Oops, something glitched on my side. Try again?", blocks: [] },
      ]);
      return;
    }

    setProcessingVoice(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setEntries((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: errorText(data, "Couldn't process your voice. Try again or type instead."), blocks: [] },
      ]);
      return;
    }

    setEntries((prev) => [
      ...prev,
      { id: makeId(), role: "user", content: data.userTranscript },
      { id: makeId(), role: "assistant", content: data.assistantText ?? "", blocks: data.blocks ?? [], audio: data.assistantAudio ?? undefined },
    ]);
    if (hasCartBlock(data.blocks ?? [])) router.refresh();

    if (data.assistantAudio) {
      new Audio(`data:audio/mp3;base64,${data.assistantAudio}`).play().catch(() => {});
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
        { id: makeId(), role: "assistant", content: errorText(data, "Couldn't add that to your cart."), blocks: [] },
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
    router.refresh();
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
        { id: makeId(), role: "assistant", content: errorText(data, "Couldn't preview your order."), blocks: [] },
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
        { id: makeId(), role: "assistant", content: errorText(data, "Couldn't confirm your order."), blocks: [] },
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
    router.refresh(); // order creation clears the cart server-side; reflect that in the header
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
              <div className="flex items-center gap-1">
                {entries.length > 0 && (
                  <button onClick={resetChat} aria-label="Start a new chat" title="Start a new chat" className="p-1 hover:opacity-70">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 hover:opacity-70">
                  <X className="h-5 w-5" />
                </button>
              </div>
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
                <ChatInput onSend={send} onSendVoice={sendVoice} disabled={pending || processingVoice} isProcessingVoice={processingVoice} />
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
}
