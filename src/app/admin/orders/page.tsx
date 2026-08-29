import Link from "next/link";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const channelLabel: Record<string, string> = { WEB: "เว็บไซต์", POS: "หน้าร้าน" };
const statusLabel: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
};
const statusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "brand"> = {
  PENDING: "warning",
  PAID: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string }>;
}) {
  const { channel, status } = await searchParams;
  const validChannels = ["WEB", "POS"] as const;
  const validStatuses = ["PENDING", "PAID", "COMPLETED", "CANCELLED"] as const;

  const orders = await db.order.findMany({
    where: {
      channel: validChannels.find((c) => c === channel),
      status: validStatuses.find((s) => s === status),
    },
    include: { store: true, customer: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ออเดอร์</h1>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ช่องทาง</label>
          <Select name="channel" defaultValue={channel ?? ""} className="w-40">
            <option value="">ทั้งหมด</option>
            <option value="WEB">เว็บไซต์</option>
            <option value="POS">หน้าร้าน</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">สถานะ</label>
          <Select name="status" defaultValue={status ?? ""} className="w-40">
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="PAID">ชำระแล้ว</option>
            <option value="COMPLETED">สำเร็จ</option>
            <option value="CANCELLED">ยกเลิก</option>
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
              <th className="px-4 py-3">รหัสออเดอร์</th>
              <th className="px-4 py-3">เวลา</th>
              <th className="px-4 py-3">ช่องทาง</th>
              <th className="px-4 py-3">ลูกค้า</th>
              <th className="px-4 py-3">ยอดรวม</th>
              <th className="px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-brand">
                    {o.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{o.createdAt.toLocaleString("th-TH")}</td>
                <td className="px-4 py-3 text-muted">
                  {channelLabel[o.channel]}
                  {o.store ? ` (${o.store.name})` : ""}
                </td>
                <td className="px-4 py-3 text-muted">{o.customer?.name ?? "ลูกค้าทั่วไป"}</td>
                <td className="px-4 py-3 font-medium">฿{baht(o.total)}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  ไม่พบออเดอร์
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
