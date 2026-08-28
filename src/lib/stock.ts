import { db } from "@/lib/db";
import type { StockMovementType } from "@/generated/prisma/enums";

export async function adjustStock(input: {
  productId: string;
  type: Extract<StockMovementType, "RESTOCK" | "ADJUSTMENT" | "RETURN">;
  quantityChange: number;
  reason?: string | null;
  storeId?: string | null;
  userId: string;
}) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: input.productId },
    });
    const newQty = product.stockQty + input.quantityChange;
    if (newQty < 0) {
      throw new Error(
        `ปรับสต็อกไม่ได้ เพราะยอดคงเหลือจะติดลบ (คงเหลือปัจจุบัน ${product.stockQty})`,
      );
    }

    const updated = await tx.product.update({
      where: { id: input.productId },
      data: { stockQty: newQty },
    });

    await tx.stockMovement.create({
      data: {
        productId: input.productId,
        type: input.type,
        quantityChange: input.quantityChange,
        balanceAfter: updated.stockQty,
        reason: input.reason ?? null,
        storeId: input.storeId ?? null,
        userId: input.userId,
      },
    });

    return updated;
  });
}
