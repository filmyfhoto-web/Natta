"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !user.active) {
    return { error: "ไม่พบผู้ใช้งาน หรือบัญชีถูกระงับ" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
  });

  const fallback = user.role === "ADMIN" ? "/admin" : "/pos";
  redirect(next && next.startsWith("/") ? next : fallback);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
