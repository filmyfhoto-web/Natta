import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { updateOrderStatusAction } from "@/actions/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const channelLabel: Record<string, string> = { WEB: "เว็บไซต์", POS: "หน้าร้าน" };
const statusLabel: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
};
const paymentLabel: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  QR: "พร้อมเพย์/QR",
};
const statusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "brand"> = {
  PENDING: "warning",
  PAID: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      store: true,
      customer: true,
      user: true,
    },
  });
  if (!order) notFound();

  const markPaid = updateOrderStatusAction.bind(null, order.id, "PAID");
  const markCompleted = updateOrderStatusAction.bind(null, order.id, "COMPLETED");
  const cancel = updateOrderStatusAction.bind(null, order.id, "CANCELLED");

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">ออเดอร์ {order.code}</h1>
          <p className="text-sm text-muted">
            {channelLabel[order.channel]}
            {order.store ? ` · ${order.store.name}` : ""} ·{" "}
            {order.createdAt.toLocaleString("th-TH")}
          </p>
        </div>
        <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
      </div>

      {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
        <div className="flex flex-wrap gap-2">
          {order.status === "PENDING" && (
            <form action={markPaid}>
              <Button type="submit" variant="secondary" size="sm">
                ทำเครื่องหมายว่าชำระแล้ว
              </Button>
            </form>
          )}
          <form action={markCompleted}>
            <Button type="submit" size="sm">
              ทำเครื่องหมายว่าสำเร็จ
            </Button>
          </form>
          <form action={cancel}>
            <Button type="submit" variant="danger" size="sm">
              ยกเลิกออเดอร์ (คืนสต็อก)
            </Button>
          </form>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-muted">฿{baht(item.unitPrice)} x {item.quantity}</td>
                  <td className="py-2 text-right font-medium">฿{baht(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={2} className="py-2 font-medium">
                  รวมทั้งสิ้น
                </td>
                <td className="py-2 text-right text-lg font-bold text-brand">
                  ฿{baht(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            ลูกค้า:{" "}
            {order.customer ? (
              <Link href={`/admin/customers/${order.customer.id}`} className="text-brand hover:underline">
                {order.customer.name} ({order.customer.phone})
              </Link>
            ) : (
              "ลูกค้าทั่วไป"
            )}
          </p>
          {order.user && <p>พนักงานผู้ขาย: {order.user.name}</p>}
          {order.paymentMethod && <p>ช่องทางชำระเงิน: {paymentLabel[order.paymentMethod]}</p>}
          {order.note && <p>หมายเหตุ: {order.note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
