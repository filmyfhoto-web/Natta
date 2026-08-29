import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PosScreen } from "@/components/pos-screen";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pos");

  const stores = await db.store.findMany({ orderBy: { code: "asc" } });
  if (stores.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        ยังไม่มีสาขาในระบบ กรุณาให้ผู้ดูแลระบบเพิ่มสาขาก่อน
      </div>
    );
  }

  const { store: storeParam } = await searchParams;
  const canSwitchStore = user.role === "ADMIN" || !user.storeId;
  const activeStoreId =
    (canSwitchStore ? storeParam : user.storeId) &&
    stores.some((s) => s.id === (canSwitchStore ? storeParam : user.storeId))
      ? (canSwitchStore ? storeParam! : user.storeId!)
      : (user.storeId ?? stores[0].id);

  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <PosScreen
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stockQty: p.stockQty,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      stores={stores.map((s) => ({ id: s.id, name: s.name }))}
      activeStoreId={activeStoreId}
      canSwitchStore={canSwitchStore}
    />
  );
}
