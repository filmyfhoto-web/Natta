"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { error: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" })
    .regex(/^[a-zA-Z0-9._-]+$/, { error: "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข . _ -" }),
  name: z.string().trim().min(1, { error: "กรุณากรอกชื่อ-นามสกุล" }),
  password: z.string().min(6, { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }),
  role: z.enum(["ADMIN", "STAFF"]),
  storeId: z.string().trim().optional(),
});

export async function createUserAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
    storeId: formData.get("storeId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { username: data.username } });
  if (existing) {
    return { error: "มีชื่อผู้ใช้นี้อยู่แล้ว" };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.user.create({
    data: {
      username: data.username,
      name: data.name,
      passwordHash,
      role: data.role,
      storeId: data.storeId || null,
    },
  });

  revalidatePath("/admin/users");
  return undefined;
}

export async function toggleUserActiveAction(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    throw new Error("ไม่สามารถระงับบัญชีของตัวเองได้");
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await db.user.update({ where: { id: userId }, data: { active: !user.active } });

  revalidatePath("/admin/users");
}
