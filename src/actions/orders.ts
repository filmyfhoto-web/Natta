"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function revalidateOrderPaths(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "PAID" | "COMPLETED" | "CANCELLED",
) {
  const user = await requireUser();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("ไม่พบออเดอร์");
  if (order.status === "CANCELLED") throw new Error("ออเดอร์นี้ถูกยกเลิกไปแล้ว");
  if (order.status === status) return;

  if (status === "CANCELLED") {
    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "RETURN",
            quantityChange: item.quantity,
            balanceAfter: updated.stockQty,
            reason: `ยกเลิกออเดอร์ ${order.code}`,
            storeId: order.storeId,
            userId: user.id,
            orderId: order.id,
          },
        });
      }
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    });
  } else {
    await db.order.update({ where: { id: orderId }, data: { status } });
  }

  revalidateOrderPaths(orderId);
}
