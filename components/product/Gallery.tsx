"use client";

import { useState } from "react";
import Image from "next/image";

type GalleryImage = {
  url: string;
  altText: string | null;
  imageCreator?: string | null;
  imageLicense?: string | null;
  imageSourceUrl?: string | null;
};

export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
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
              <Image src={img.url} alt={img.altText ?? name} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-white">
          {current && (
            <Image
              src={current.url}
              alt={current.altText ?? name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>
      </div>

      {/* CC BY / CC BY-SA licenses legally require this credit wherever the photo is shown --
          not decorative, not optional. Absent for the site's own brand-asset photos. */}
      {current?.imageCreator && (
        <p className="mt-2 text-xs text-muted">
          Photo:{" "}
          {current.imageSourceUrl ? (
            <a
              href={current.imageSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {current.imageCreator}
            </a>
          ) : (
            current.imageCreator
          )}
          {current.imageLicense ? `, ${current.imageLicense}` : ""}
        </p>
      )}
    </div>
  );
}
