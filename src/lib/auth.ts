import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

const COOKIE_NAME = "grillme_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to your environment (see .env.example).",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  username: string;
  name: string;
  role: Role;
  storeId: string | null;
};

export async function createSession(user: {
  id: string;
  username: string;
  name: string;
  role: Role;
  storeId: string | null;
}) {
  const token = await new SignJWT({
    username: user.username,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as Role,
      storeId: (payload.storeId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Re-reads the user from the database so role/store/active changes apply immediately. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { store: true },
  });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}
