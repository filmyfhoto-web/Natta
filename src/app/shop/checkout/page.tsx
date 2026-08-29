import { db } from "@/lib/db";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const stores = await db.store.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">ยืนยันคำสั่งซื้อ</h1>
      <CheckoutForm stores={stores.map((s) => ({ id: s.id, name: s.name, address: s.address }))} />
    </div>
  );
}
