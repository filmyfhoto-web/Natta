import Link from "next/link";
import { db } from "@/lib/db";
import { baht } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await db.customer.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] }
      : undefined,
    include: { orders: { select: { total: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ลูกค้า</h1>
      <p className="text-sm text-muted">
        ฐานข้อมูลลูกค้าใช้ร่วมกันทั้ง 2 สาขา ผูกด้วยเบอร์โทรศัพท์
      </p>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="ค้นหาชื่อหรือเบอร์โทร..." className="max-w-xs" />
        <Button type="submit" variant="outline">
          ค้นหา
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-stone-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">เบอร์โทร</th>
              <th className="px-4 py-3">จำนวนออเดอร์</th>
              <th className="px-4 py-3">ยอดใช้จ่ายรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => {
              const completed = c.orders.filter((o) => o.status !== "CANCELLED");
              const totalSpend = completed.reduce((sum, o) => sum + o.total, 0);
              return (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-brand">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.phone}</td>
                  <td className="px-4 py-3">{c.orders.length}</td>
                  <td className="px-4 py-3">฿{baht(totalSpend)}</td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  ไม่พบลูกค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
