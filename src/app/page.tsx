import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-stone-100 px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold text-brand">🔥 Grill Me</h1>
        <p className="mt-2 text-muted">ระบบหลังร้าน สต็อกและลูกค้าใช้ร่วมกันทุกสาขา</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/shop"
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
        >
          สั่งซื้อสินค้า (ลูกค้า)
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border bg-white px-6 py-3 font-medium text-foreground hover:bg-stone-50"
        >
          เข้าสู่ระบบพนักงาน
        </Link>
      </div>
    </div>
  );
}
