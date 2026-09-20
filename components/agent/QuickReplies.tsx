"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function QuickReplies({
  question,
  options,
  onSelect,
}: {
  question: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="mt-2">
      <p className="mb-2 text-sm text-muted">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt}
            type="button"
            variant="outline"
            size="sm"
            disabled={picked !== null}
            onClick={() => {
              setPicked(opt);
              onSelect(opt);
            }}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}
