"use client";

import { useEffect, useState } from "react";

const PHRASES = ["Venmathi yosikkiraa… 💭", "Ek minute, thedi paakuren…", "Kadaila paathutu irukken…"];

export function TypingIndicator() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % PHRASES.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
      </span>
      {PHRASES[i]}
    </div>
  );
}
