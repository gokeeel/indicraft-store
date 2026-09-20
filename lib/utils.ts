import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string | { toString(): string }) {
  const n = typeof value === "number" ? value : parseFloat(value.toString());
  return `₹${n.toLocaleString("en-IN")}`;
}
