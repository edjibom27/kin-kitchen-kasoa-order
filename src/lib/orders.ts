import type { CartLine } from "@/lib/cart-context";

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "cash" | "momo";

export type Order = {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  phone: string;
  orderType: OrderType;
  address?: string;
  landmark?: string;
  paymentMethod: PaymentMethod;
  momoNumber?: string;
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  prepTimeMinutes: number;
};

export const DELIVERY_FEE = 15;

const STORAGE_KEY = "kin-kitchen-last-order";

export function generateOrderNumber() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `KIN-${new Date().getFullYear()}-${random}`;
}

/**
 * Orders are persisted locally for this MVP. Swapping this module for a
 * server function that writes to the database will not change the UI.
 */
export function saveOrder(order: Order) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function loadLastOrder(): Order | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}
