"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { baht } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQty: number;
  categoryId: string | null;
  imageUrl: string | null;
};
type Category = { id: string; name: string };

export function ProductGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { addItem } = useCart();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [added, setAdded] = useState<string | null>(null);

  const filtered =
    categoryId === "all" ? products : products.filter((p) => p.categoryId === categoryId);

  function handleAdd(productId: string) {
    addItem(productId, 1);
    setAdded(productId);
    setTimeout(() => setAdded((cur) => (cur === productId ? null : cur)), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryId("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            categoryId === "all" ? "bg-brand text-white" : "bg-white text-stone-600 border border-border"
          }`}
        >
          ทั้งหมด
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              categoryId === c.id
                ? "bg-brand text-white"
                : "bg-white text-stone-600 border border-border"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const soldOut = p.stockQty <= 0;
          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  {soldOut && <Badge tone="danger">สินค้าหมด</Badge>}
                </div>
                {p.description && (
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-brand">฿{baht(p.price)}</span>
                <button
                  onClick={() => handleAdd(p.id)}
                  disabled={soldOut}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {added === p.id ? "เพิ่มแล้ว ✓" : "เพิ่มลงตะกร้า"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted">ไม่มีสินค้าในหมวดนี้</p>
        )}
      </div>
    </div>
  );
}
