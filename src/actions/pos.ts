"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { checkout, InsufficientStockError } from "@/lib/orders";
import { upsertCustomerByPhone } from "@/lib/customers";

export type PosCheckoutInput = {
  storeId: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: "CASH" | "TRANSFER" | "QR";
  customerPhone?: string;
  customerName?: string;
  note?: string;
};

export type PosCheckoutResult =
  | { ok: true; orderCode: string; total: number }
  | { ok: false; error: string };

export async function posCheckoutAction(
  input: PosCheckoutInput,
): Promise<PosCheckoutResult> {
  const user = await requireUser();

  if (user.role === "STAFF" && user.storeId && user.storeId !== input.storeId) {
    return { ok: false, error: "คุณไม่มีสิทธิ์ขายให้สาขานี้" };
  }
  if (!input.items.length) {
    return { ok: false, error: "ไม่มีสินค้าในตะกร้า" };
  }

  let customerId: string | undefined;
  const phone = input.customerPhone?.trim();
  if (phone) {
    const customer = await upsertCustomerByPhone({
      phone,
      name: input.customerName?.trim() || phone,
    });
    customerId = customer.id;
  }

  try {
    const order = await checkout({
      channel: "POS",
      storeId: input.storeId,
      customerId,
      userId: user.id,
      paymentMethod: input.paymentMethod,
      note: input.note?.trim() || null,
      items: input.items,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/orders");
    revalidatePath("/pos");
    revalidatePath("/shop");

    return { ok: true, orderCode: order.code, total: order.total };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { ok: false, error: err.message };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการขาย",
    };
  }
}
