import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const movementLabel: Record<string, string> = {
  RESTOCK: "รับเข้า",
  SALE: "ขาย",
  ADJUSTMENT: "ปรับยอด",
  RETURN: "รับคืน",
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; storeId?: string }>;
}) {
  const { type, storeId } = await searchParams;
  const validTypes = ["RESTOCK", "SALE", "ADJUSTMENT", "RETURN"] as const;
  const typeFilter = validTypes.find((t) => t === type);

  const [movements, stores] = await Promise.all([
    db.stockMovement.findMany({
      where: {
        type: typeFilter,
        storeId: storeId || undefined,
      },
      include: { product: true, store: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.store.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ประวัติการเคลื่อนไหวสต็อก</h1>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ประเภท</label>
          <Select name="type" defaultValue={type ?? ""} className="w-48">
            <option value="">ทั้งหมด</option>
            <option value="RESTOCK">รับเข้า</option>
            <option value="SALE">ขาย</option>
            <option value="ADJUSTMENT">ปรับยอด</option>
            <option value="RETURN">รับคืน</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">สาขา</label>
          <Select name="storeId" defaultValue={storeId ?? ""} className="w-48">
            <option value="">ทั้งหมด</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">
          กรอง
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-stone-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">เวลา</th>
              <th className="px-4 py-3">สินค้า</th>
              <th className="px-4 py-3">ประเภท</th>
              <th className="px-4 py-3">สาขา</th>
              <th className="px-4 py-3">จำนวน</th>
              <th className="px-4 py-3">คงเหลือ</th>
              <th className="px-4 py-3">โดย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 text-muted">{m.createdAt.toLocaleString("th-TH")}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${m.productId}`} className="hover:text-brand">
                    {m.product.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={m.type === "SALE" ? "brand" : "neutral"}>
                    {movementLabel[m.type]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">{m.store?.name ?? "—"}</td>
                <td className={`px-4 py-3 font-medium ${m.quantityChange >= 0 ? "text-success" : "text-danger"}`}>
                  {m.quantityChange >= 0 ? "+" : ""}
                  {m.quantityChange}
                </td>
                <td className="px-4 py-3">{m.balanceAfter}</td>
                <td className="px-4 py-3 text-muted">{m.user?.name ?? "—"}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
