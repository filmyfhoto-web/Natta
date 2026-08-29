import Link from "next/link";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const channelLabel: Record<string, string> = { WEB: "เว็บไซต์", POS: "หน้าร้าน" };
const statusLabel: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
};

export default async function AdminDashboardPage() {
  const [stores, todaySales, activeProducts, recentOrders] = await Promise.all([
    db.store.findMany({ orderBy: { code: "asc" } }),
    db.order.findMany({
      where: {
        createdAt: { gte: startOfToday() },
        status: { in: ["PAID", "COMPLETED"] },
      },
      select: { total: true, storeId: true, channel: true },
    }),
    db.product.findMany({ where: { active: true } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { store: true, customer: true },
    }),
  ]);

  const totalToday = todaySales.reduce((sum, o) => sum + o.total, 0);
  const salesByStore = new Map<string, number>();
  for (const o of todaySales) {
    const key = o.storeId ?? "web";
    salesByStore.set(key, (salesByStore.get(key) ?? 0) + o.total);
  }

  const lowStock = activeProducts
    .filter((p) => p.stockQty <= p.lowStockThreshold)
    .sort((a, b) => a.stockQty - b.stockQty);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">ภาพรวมวันนี้</h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString("th-TH", { dateStyle: "full" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted">ยอดขายวันนี้ (ทุกสาขา)</p>
            <p className="mt-1 text-2xl font-bold text-brand">
              ฿{baht(totalToday)}
            </p>
            <p className="text-xs text-muted">{todaySales.length} ออเดอร์</p>
          </CardContent>
        </Card>
        {stores.map((s) => (
          <Card key={s.id}>
            <CardContent className="py-5">
              <p className="text-sm text-muted">{s.name}</p>
              <p className="mt-1 text-2xl font-bold">
                ฿{baht(salesByStore.get(s.id) ?? 0)}
              </p>
              <p className="text-xs text-muted">ยอดขายวันนี้ (หน้าร้าน+ออนไลน์รับที่สาขานี้)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>สินค้าใกล้หมดสต็อก</CardTitle>
            <Link href="/admin/stock" className="text-sm text-brand hover:underline">
              จัดการสต็อก
            </Link>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted">ไม่มีสินค้าใกล้หมดสต็อก</p>
            ) : (
              <ul className="divide-y divide-border">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{p.name}</span>
                    <Badge tone={p.stockQty === 0 ? "danger" : "warning"}>
                      คงเหลือ {p.stockQty}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ออเดอร์ล่าสุด</CardTitle>
            <Link href="/admin/orders" className="text-sm text-brand hover:underline">
              ดูทั้งหมด
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มีออเดอร์</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((o) => (
                  <li key={o.id} className="py-2 text-sm">
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between hover:text-brand">
                      <span>
                        <span className="font-medium">{o.code}</span>{" "}
                        <span className="text-muted">
                          · {channelLabel[o.channel]}
                          {o.store ? ` (${o.store.name})` : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge>{statusLabel[o.status]}</Badge>
                        <span className="font-medium">฿{baht(o.total)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
