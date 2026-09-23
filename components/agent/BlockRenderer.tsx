"use client";

import { ProductCarousel } from "@/components/agent/ProductCarousel";
import { ProductDetailCard } from "@/components/agent/ProductDetailCard";
import { QuickReplies } from "@/components/agent/QuickReplies";
import { CartCard } from "@/components/agent/CartCard";
import { AddressPicker } from "@/components/agent/AddressPicker";
import { AddressFormCard } from "@/components/agent/AddressFormCard";
import { OrderSummaryCard } from "@/components/agent/OrderSummaryCard";
import { PaymentCard } from "@/components/agent/PaymentCard";
import { OrdersStatusCard } from "@/components/agent/OrdersStatusCard";
import type { Block } from "@/lib/agent/blocks";

export function BlockRenderer({
  block,
  onQuickReply,
  onAddToCart,
  onSelectAddress,
  onRequestNewAddress,
  onConfirmOrder,
}: {
  block: Block;
  onQuickReply: (value: string) => void;
  onAddToCart: (productId: string) => void;
  onSelectAddress: (addressId: string) => void;
  onRequestNewAddress: () => void;
  onConfirmOrder: (confirmToken: string) => Promise<void>;
}) {
  switch (block.type) {
    case "product_carousel":
      return <ProductCarousel products={block.products} onAddToCart={onAddToCart} />;
    case "product_detail":
      return <ProductDetailCard product={block.product} onAddToCart={onAddToCart} />;
    case "quick_replies":
      return <QuickReplies question={block.question} options={block.options} onSelect={onQuickReply} />;
    case "cart":
      return <CartCard items={block.items} onCheckout={() => onQuickReply("let's checkout")} />;
    case "address_picker":
      return <AddressPicker addresses={block.addresses} onSelect={onSelectAddress} onAddNew={onRequestNewAddress} />;
    case "address_form":
      return <AddressFormCard onCreated={onSelectAddress} />;
    case "order_summary":
      return (
        <OrderSummaryCard
          items={block.items}
          address={block.address}
          subtotal={block.subtotal}
          shipping={block.shipping}
          total={block.total}
          confirmToken={block.confirmToken}
          expiresAt={block.expiresAt}
          onConfirm={onConfirmOrder}
        />
      );
    case "payment_link":
      return <PaymentCard orderId={block.orderId} orderNumber={block.orderNumber} amount={block.amount} url={block.url} />;
    case "orders":
      return <OrdersStatusCard orders={block.orders} />;
    default:
      return null;
  }
}
