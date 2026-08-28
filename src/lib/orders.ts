import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderChannel, PaymentMethod } from "@/generated/prisma/enums";

export class InsufficientStockError extends Error {
  constructor(
    public productName: string,
    public available: number,
    public requested: number,
  ) {
    super(
      `สินค้า "${productName}" มีในสต็อกไม่พอ (คงเหลือ ${available}, ต้องการ ${requested})`,
    );
  }
}

export type CheckoutItem = { productId: string; quantity: number };

export type CheckoutInput = {
  channel: OrderChannel;
  storeId?: string | null;
  customerId?: string | null;
  userId?: string | null;
  paymentMethod?: PaymentMethod | null;
  note?: string | null;
  items: CheckoutItem[];
};

function generateOrderCode(channel: OrderChannel) {
  const prefix = channel === "POS" ? "POS" : "WEB";
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${ymd}-${rand}`;
}

/**
 * Shared checkout path for both the POS (in-store) and the web storefront.
 * Both channels draw from the same stock pool, so stock is decremented with
 * an optimistic `stockQty >= quantity` guard inside one transaction to avoid
 * overselling when both branches (or web + POS) sell the last unit at once.
 */
export async function checkout(input: CheckoutInput) {
  const requested = input.items.filter((item) => item.quantity > 0);
  if (requested.length === 0) {
    throw new Error("ไม่มีสินค้าในตะกร้า");
  }

  return db.$transaction(async (tx) => {
    let subtotal = 0;
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
    const movements: {
      productId: string;
      quantityChange: number;
      balanceAfter: number;
    }[] = [];

    for (const item of requested) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || !product.active) {
        throw new Error("ไม่พบสินค้าในระบบ หรือสินค้านี้ถูกปิดการขายแล้ว");
      }
      if (product.stockQty < item.quantity) {
        throw new InsufficientStockError(
          product.name,
          product.stockQty,
          item.quantity,
        );
      }

      const updated = await tx.product.updateMany({
        where: { id: product.id, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        const fresh = await tx.product.findUniqueOrThrow({
          where: { id: product.id },
        });
        throw new InsufficientStockError(
          product.name,
          fresh.stockQty,
          item.quantity,
        );
      }

      const fresh = await tx.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal,
      });
      movements.push({
        productId: product.id,
        quantityChange: -item.quantity,
        balanceAfter: fresh.stockQty,
      });
    }

    const order = await tx.order.create({
      data: {
        code: generateOrderCode(input.channel),
        channel: input.channel,
        status: input.channel === "POS" ? "COMPLETED" : "PENDING",
        storeId: input.storeId ?? null,
        customerId: input.customerId ?? null,
        userId: input.userId ?? null,
        paymentMethod: input.paymentMethod ?? null,
        note: input.note ?? null,
        subtotal,
        total: subtotal,
        items: { createMany: { data: orderItemsData } },
      },
      include: { items: true, store: true, customer: true },
    });

    await tx.stockMovement.createMany({
      data: movements.map((m) => ({
        productId: m.productId,
        type: "SALE" as const,
        quantityChange: m.quantityChange,
        balanceAfter: m.balanceAfter,
        storeId: input.storeId ?? null,
        userId: input.userId ?? null,
        orderId: order.id,
      })),
    });

    return order;
  });
}
