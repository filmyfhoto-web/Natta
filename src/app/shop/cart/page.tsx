"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { getCartDetailsAction } from "@/actions/shop";
import { baht } from "@/lib/money";
import { Button } from "@/components/ui/button";

type ProductDetail = {
  id: string;
  name: string;
  price: number;
  stockQty: number;
  active: boolean;
  imageUrl: string | null;
};

export default function CartPage() {
  const router = useRouter();
  const { items, setQty, removeItem } = useCart();
  const [details, setDetails] = useState<Map<string, ProductDetail>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCartDetailsAction(items.map((i) => i.productId)).then((products) => {
      if (cancelled) return;
      setDetails(new Map(products.map((p) => [p.id, p])));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.productId).join(",")]);

  const total = items.reduce((sum, i) => {
    const product = details.get(i.productId);
    return sum + (product ? product.price * i.quantity : 0);
  }, 0);

  const hasIssue = items.some((i) => {
    const product = details.get(i.productId);
    return !product || !product.active || product.stockQty < i.quantity;
  });

  if (loading) {
    return <p className="py-10 text-center text-muted">กำลังโหลดตะกร้า...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">ยังไม่มีสินค้าในตะกร้า</p>
        <Link href="/shop" className="mt-4 inline-block text-brand hover:underline">
          ไปเลือกสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">ตะกร้าสินค้า</h1>

      <ul className="divide-y divide-border rounded-xl border border-border bg-white">
        {items.map((line) => {
          const product = details.get(line.productId);
          if (!product) {
            return (
              <li key={line.productId} className="flex items-center justify-between p-4 text-sm text-danger">
                <span>สินค้านี้ไม่พร้อมขายแล้ว</span>
                <button onClick={() => removeItem(line.productId)} className="hover:underline">
                  ลบ
                </button>
              </li>
            );
          }
          const overStock = product.stockQty < line.quantity;
          return (
            <li key={line.productId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted">฿{baht(product.price)}</p>
                {overStock && (
                  <p className="text-xs text-danger">
                    มีสินค้าคงเหลือ {product.stockQty} ชิ้น กรุณาปรับจำนวน
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQty(line.productId, line.quantity - 1)}
                  className="h-7 w-7 rounded bg-stone-100 hover:bg-stone-200"
                >
                  −
                </button>
                <span className="w-6 text-center">{line.quantity}</span>
                <button
                  onClick={() => setQty(line.productId, line.quantity + 1)}
                  className="h-7 w-7 rounded bg-stone-100 hover:bg-stone-200"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(line.productId)}
                className="text-sm text-danger hover:underline"
              >
                ลบ
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
        <span className="text-lg font-semibold">รวมทั้งสิ้น</span>
        <span className="text-xl font-bold text-brand">฿{baht(total)}</span>
      </div>

      {hasIssue && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          กรุณาปรับจำนวนสินค้าให้ไม่เกินสต็อกคงเหลือ ก่อนดำเนินการสั่งซื้อ
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/shop")}>
          เลือกซื้อเพิ่ม
        </Button>
        <Button disabled={hasIssue} onClick={() => router.push("/shop/checkout")}>
          ไปชำระเงิน
        </Button>
      </div>
    </div>
  );
}
