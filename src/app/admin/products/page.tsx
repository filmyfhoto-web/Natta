import Link from "next/link";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const products = await db.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
          ],
        }
      : undefined,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">สินค้า</h1>
        <Link href="/admin/products/new">
          <Button>+ เพิ่มสินค้า</Button>
        </Link>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          ค้นหา
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-stone-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">สินค้า</th>
              <th className="px-4 py-3">หมวดหมู่</th>
              <th className="px-4 py-3">ราคา</th>
              <th className="px-4 py-3">คงเหลือ</th>
              <th className="px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium text-foreground hover:text-brand"
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs text-muted">{p.sku}</div>
                </td>
                <td className="px-4 py-3 text-muted">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3">฿{baht(p.price)}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.stockQty <= p.lowStockThreshold ? "warning" : "neutral"}>
                    {p.stockQty}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.active ? "success" : "neutral"}>
                    {p.active ? "เปิดขาย" : "ปิดขาย"}
                  </Badge>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  ไม่พบสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
