"use client";

import { ProductCarousel } from "@/components/agent/ProductCarousel";
import { ProductDetailCard } from "@/components/agent/ProductDetailCard";
import { QuickReplies } from "@/components/agent/QuickReplies";
import { CartCard } from "@/components/agent/CartCard";
import type { Block } from "@/lib/agent/blocks";

export function BlockRenderer({
  block,
  onQuickReply,
  onAddToCart,
}: {
  block: Block;
  onQuickReply: (value: string) => void;
  onAddToCart: (productId: string) => void;
}) {
  switch (block.type) {
    case "product_carousel":
      return <ProductCarousel products={block.products} onAddToCart={onAddToCart} />;
    case "product_detail":
      return <ProductDetailCard product={block.product} onAddToCart={onAddToCart} />;
    case "quick_replies":
      return <QuickReplies question={block.question} options={block.options} onSelect={onQuickReply} />;
    case "cart":
      return <CartCard items={block.items} />;
    default:
      return null;
  }
}
