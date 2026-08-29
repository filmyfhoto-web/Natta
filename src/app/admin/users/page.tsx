import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toggleUserActiveAction } from "@/actions/users";
import { UserForm } from "@/components/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const roleLabel: Record<string, string> = { ADMIN: "ผู้ดูแลระบบ", STAFF: "พนักงาน" };

export default async function UsersPage() {
  const [users, stores, me] = await Promise.all([
    db.user.findMany({ include: { store: true }, orderBy: { createdAt: "asc" } }),
    db.store.findMany({ orderBy: { code: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">พนักงาน</h1>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มพนักงานใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm stores={stores} />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-stone-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ชื่อผู้ใช้</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3">บทบาท</th>
              <th className="px-4 py-3">สาขา</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const toggle = toggleUserActiveAction.bind(null, u.id);
              return (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{roleLabel[u.role]}</td>
                  <td className="px-4 py-3 text-muted">{u.store?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? "success" : "neutral"}>
                      {u.active ? "ใช้งานอยู่" : "ระงับแล้ว"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {me?.id !== u.id && (
                      <form action={toggle}>
                        <Button type="submit" variant="outline" size="sm">
                          {u.active ? "ระงับ" : "เปิดใช้งาน"}
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
