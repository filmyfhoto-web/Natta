import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { ProductForm } from "@/components/product-form";
import { StockAdjustForm } from "@/components/stock-adjust-form";
import { adjustProductStockAction, updateProductAction } from "@/actions/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const movementLabel: Record<string, string> = {
  RESTOCK: "รับเข้า",
  SALE: "ขาย",
  ADJUSTMENT: "ปรับยอด",
  RETURN: "รับคืน",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, movements] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.stockMovement.findMany({
      where: { productId: id },
      include: { store: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  if (!product) notFound();

  const updateAction = updateProductAction.bind(null, product.id);
  const stockAction = adjustProductStockAction.bind(null, product.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">{product.name}</h1>
        <Badge tone={product.active ? "success" : "neutral"}>
          {product.active ? "เปิดขาย" : "ปิดขาย"}
        </Badge>
        <Badge tone={product.stockQty <= product.lowStockThreshold ? "warning" : "neutral"}>
          คงเหลือ {product.stockQty}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              action={updateAction}
              categories={categories}
              mode="edit"
              defaults={{
                sku: product.sku,
                name: product.name,
                slug: product.slug,
                description: product.description,
                price: product.price / 100,
                lowStockThreshold: product.lowStockThreshold,
                categoryId: product.categoryId,
                imageUrl: product.imageUrl,
                active: product.active,
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ปรับสต็อก</CardTitle>
            </CardHeader>
            <CardContent>
              <StockAdjustForm action={stockAction} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ประวัติการเคลื่อนไหวสต็อก</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {movements.length === 0 ? (
                <p className="text-sm text-muted">ยังไม่มีประวัติ</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {movements.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium">{movementLabel[m.type]}</span>
                        {m.store ? (
                          <span className="text-muted"> · {m.store.name}</span>
                        ) : null}
                        {m.user ? <span className="text-muted"> · {m.user.name}</span> : null}
                        {m.reason ? (
                          <div className="text-xs text-muted">{m.reason}</div>
                        ) : null}
                        <div className="text-xs text-muted">
                          {m.createdAt.toLocaleString("th-TH")}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={m.quantityChange >= 0 ? "text-success" : "text-danger"}>
                          {m.quantityChange >= 0 ? "+" : ""}
                          {m.quantityChange}
                        </span>
                        <div className="text-xs text-muted">คงเหลือ {m.balanceAfter}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted">
        ราคาปัจจุบัน: ฿{baht(product.price)} · สร้างเมื่อ{" "}
        {product.createdAt.toLocaleDateString("th-TH")}
      </p>
    </div>
  );
}
