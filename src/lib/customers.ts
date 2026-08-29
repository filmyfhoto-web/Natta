import { db } from "@/lib/db";

export async function upsertCustomerByPhone(input: {
  phone: string;
  name: string;
  email?: string | null;
  address?: string | null;
}) {
  return db.customer.upsert({
    where: { phone: input.phone },
    update: {
      name: input.name,
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
    },
    create: {
      phone: input.phone,
      name: input.name,
      email: input.email ?? null,
      address: input.address ?? null,
    },
  });
}
