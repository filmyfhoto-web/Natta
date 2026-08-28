import { db } from "@/lib/db";
import { ProductGrid } from "@/components/shop/product-grid";

// Stock changes constantly from POS sales at both branches, so this page
// must always read fresh data instead of being statically prerendered.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">เมนูของเรา</h1>
        <p className="text-sm text-muted">
          เลือกสินค้าแล้วไปที่ตะกร้าเพื่อสั่งซื้อ รับสินค้าได้ทั้งสาขา 1 และสาขา 2
        </p>
      </div>
      <ProductGrid
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stockQty: p.stockQty,
          categoryId: p.categoryId,
          imageUrl: p.imageUrl,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
