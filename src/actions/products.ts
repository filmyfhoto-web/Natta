"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { bahtToSatang } from "@/lib/money";
import { adjustStock } from "@/lib/stock";

export type FormState = { error?: string } | undefined;

const productSchema = z.object({
  sku: z.string().trim().min(1, { error: "กรุณากรอกรหัสสินค้า (SKU)" }),
  name: z.string().trim().min(1, { error: "กรุณากรอกชื่อสินค้า" }),
  slug: z
    .string()
    .trim()
    .min(1, { error: "กรุณากรอก slug" })
    .regex(/^[a-z0-9-]+$/, { error: "slug ใช้ได้เฉพาะ a-z, 0-9 และ -" }),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0, { error: "ราคาต้องไม่ติดลบ" }),
  lowStockThreshold: z.coerce.number().int().min(0),
  categoryId: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    categoryId: formData.get("categoryId"),
    imageUrl: formData.get("imageUrl"),
  });
}

export async function createProductAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const data = parsed.data;
  const initialStock = Number(formData.get("initialStock") ?? 0);

  try {
    await db.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: bahtToSatang(data.price),
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl || null,
        stockQty: Math.max(0, initialStock),
      },
    });
  } catch {
    return { error: "บันทึกไม่สำเร็จ SKU หรือ slug นี้อาจถูกใช้แล้ว" };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  productId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const data = parsed.data;
  const active = formData.get("active") === "on";

  try {
    await db.product.update({
      where: { id: productId },
      data: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: bahtToSatang(data.price),
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl || null,
        active,
      },
    });
  } catch {
    return { error: "บันทึกไม่สำเร็จ SKU หรือ slug นี้อาจถูกใช้แล้ว" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}`);
}

const stockAdjustSchema = z.object({
  type: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().int(),
  reason: z.string().trim().optional(),
});

export async function adjustProductStockAction(
  productId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();

  const parsed = stockAdjustSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }
  const { type, quantity, reason } = parsed.data;
  if (quantity === 0) {
    return { error: "กรุณากรอกจำนวนที่ไม่เป็นศูนย์" };
  }

  const quantityChange = type === "RESTOCK" ? Math.abs(quantity) : quantity;

  try {
    await adjustStock({
      productId,
      type,
      quantityChange,
      reason: reason || null,
      userId: user.id,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "ปรับสต็อกไม่สำเร็จ" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return undefined;
}
