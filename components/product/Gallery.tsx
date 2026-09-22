"use client";

import { useState } from "react";
import Image from "next/image";

export function Gallery({ images, name }: { images: { url: string; altText: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="flex gap-2 sm:flex-col">
        {images.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => setActive(i)}
            aria-current={i === active}
            className={`relative h-16 w-16 overflow-hidden rounded-md border ${
              i === active ? "border-primary" : "border-border"
            }`}
          >
            <Image src={img.url} alt={img.altText ?? name} fill className="object-cover" />
          </button>
        ))}
      </div>
      <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-white">
        {current && <Image src={current.url} alt={current.altText ?? name} fill className="object-cover" priority />}
      </div>
    </div>
  );
}
