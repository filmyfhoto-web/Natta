"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { checkout, InsufficientStockError } from "@/lib/orders";
import { upsertCustomerByPhone } from "@/lib/customers";

export async function getCartDetailsAction(productIds: string[]) {
  if (productIds.length === 0) return [];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stockQty: p.stockQty,
    active: p.active,
    imageUrl: p.imageUrl,
  }));
}

const checkoutSchema = z.object({
  name: z.string().trim().min(1, { error: "กรุณากรอกชื่อผู้รับ" }),
  phone: z
    .string()
    .trim()
    .min(9, { error: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" }),
  address: z.string().trim().optional(),
  storeId: z.string().trim().min(1, { error: "กรุณาเลือกสาขาที่รับสินค้า" }),
  note: z.string().trim().optional(),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .min(1, { error: "ไม่มีสินค้าในตะกร้า" }),
});

export type WebCheckoutInput = z.infer<typeof checkoutSchema>;

export type WebCheckoutResult =
  | { ok: true; orderCode: string; total: number }
  | { ok: false; error: string };

export async function webCheckoutAction(
  input: WebCheckoutInput,
): Promise<WebCheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const data = parsed.data;

  const customer = await upsertCustomerByPhone({
    phone: data.phone,
    name: data.name,
    address: data.address || null,
  });

  try {
    const order = await checkout({
      channel: "WEB",
      storeId: data.storeId,
      customerId: customer.id,
      note: data.note || null,
      items: data.items,
    });
    return { ok: true, orderCode: order.code, total: order.total };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { ok: false, error: err.message };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่",
    };
  }
}

const trackSchema = z.object({
  code: z.string().trim().min(1),
  phone: z.string().trim().min(1),
});

export async function trackOrderAction(input: { code: string; phone: string }) {
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "กรุณากรอกข้อมูลให้ครบ" };

  const order = await db.order.findFirst({
    where: {
      code: parsed.data.code.trim().toUpperCase(),
      customer: { phone: parsed.data.phone.trim() },
    },
  });
  if (!order) return { ok: false as const, error: "ไม่พบออเดอร์ กรุณาตรวจสอบเลขที่ออเดอร์และเบอร์โทรศัพท์" };
  return { ok: true as const, code: order.code };
}
