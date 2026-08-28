import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pos");

  return (
    <div className="flex h-screen flex-col bg-stone-100">
      <header className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-brand">Grill Me POS</span>
          <span className="text-sm text-muted">
            {user.name} {user.store ? `· ${user.store.name}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <Link href="/admin" className="text-sm font-medium text-brand hover:underline">
              ไปหน้าหลังร้าน
            </Link>
          )}
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              ออกจากระบบ
            </Button>
          </form>
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
