import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabel: Record<string, string> = {
  PENDING: "รอทางร้านยืนยัน",
  PAID: "ชำระเงินแล้ว",
  COMPLETED: "รับสินค้าเรียบร้อย",
  CANCELLED: "ยกเลิกแล้ว",
};
const statusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "brand"> = {
  PENDING: "warning",
  PAID: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await db.order.findUnique({
    where: { code: code.toUpperCase() },
    include: { items: true, store: true },
  });
  if (!order) notFound();

  return (
    <div className="max-w-xl space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted">เลขที่ออเดอร์</p>
        <h1 className="text-2xl font-bold">{order.code}</h1>
        <Badge tone={statusTone[order.status]} className="mt-2">
          {statusLabel[order.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-1.5">
                <span>
                  {item.productName} x {item.quantity}
                </span>
                <span>฿{baht(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
            <span>รวม</span>
            <span className="text-brand">฿{baht(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 py-4 text-sm">
          {order.store && (
            <p>
              รับสินค้าที่: {order.store.name}
              {order.store.address ? ` (${order.store.address})` : ""}
            </p>
          )}
          <p>สั่งซื้อเมื่อ: {order.createdAt.toLocaleString("th-TH")}</p>
          {order.note && <p>หมายเหตุ: {order.note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
