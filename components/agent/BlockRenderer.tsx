"use client";

import { ProductCarousel } from "@/components/agent/ProductCarousel";
import { ProductDetailCard } from "@/components/agent/ProductDetailCard";
import { QuickReplies } from "@/components/agent/QuickReplies";
import type { Block } from "@/lib/agent/blocks";

export function BlockRenderer({ block, onQuickReply }: { block: Block; onQuickReply: (value: string) => void }) {
  switch (block.type) {
    case "product_carousel":
      return <ProductCarousel products={block.products} />;
    case "product_detail":
      return <ProductDetailCard product={block.product} />;
    case "quick_replies":
      return <QuickReplies question={block.question} options={block.options} onSelect={onQuickReply} />;
    default:
      return null;
  }
}
