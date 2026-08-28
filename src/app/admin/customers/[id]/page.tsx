import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const channelLabel: Record<string, string> = { WEB: "เว็บไซต์", POS: "หน้าร้าน" };
const statusLabel: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { store: true },
      },
    },
  });
  if (!customer) notFound();

  const totalSpend = customer.orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{customer.name}</h1>
        <p className="text-sm text-muted">
          {customer.phone}
          {customer.email ? ` · ${customer.email}` : ""}
        </p>
        {customer.address ? <p className="text-sm text-muted">{customer.address}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted">จำนวนออเดอร์</p>
            <p className="text-xl font-bold">{customer.orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted">ยอดใช้จ่ายรวม</p>
            <p className="text-xl font-bold text-brand">฿{baht(totalSpend)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติการสั่งซื้อ</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีออเดอร์</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {customer.orders.map((o) => (
                <li key={o.id} className="py-2">
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between hover:text-brand">
                    <span>
                      <span className="font-medium">{o.code}</span>{" "}
                      <span className="text-muted">
                        · {channelLabel[o.channel]}
                        {o.store ? ` (${o.store.name})` : ""} ·{" "}
                        {o.createdAt.toLocaleDateString("th-TH")}
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
  );
}
