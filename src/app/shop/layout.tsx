import { CartProvider } from "@/context/cart-context";
import { ShopHeader } from "@/components/shop/header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-stone-50">
        <ShopHeader />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mt-10 border-t border-border py-6 text-center text-sm text-muted">
          Grill Me — สาขา 1 และสาขา 2 · สต็อกและข้อมูลลูกค้าใช้ร่วมกันทุกสาขา
        </footer>
      </div>
    </CartProvider>
  );
}
