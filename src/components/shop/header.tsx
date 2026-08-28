"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";

export function ShopHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/shop" className="text-lg font-bold text-brand">
          🔥 Grill Me
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/shop/track" className="text-stone-600 hover:text-brand">
            ตรวจสอบออเดอร์
          </Link>
          <Link href="/shop/cart" className="relative text-stone-600 hover:text-brand">
            ตะกร้า
            {count > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
