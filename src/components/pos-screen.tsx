"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { posCheckoutAction, type PosCheckoutInput } from "@/actions/pos";
import { baht } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  price: number;
  stockQty: number;
  categoryId: string | null;
  imageUrl: string | null;
};
type Category = { id: string; name: string };
type Store = { id: string; name: string };

type CartLine = { productId: string; quantity: number };

export function PosScreen({
  products,
  categories,
  stores,
  activeStoreId,
  canSwitchStore,
}: {
  products: Product[];
  categories: Category[];
  stores: Store[];
  activeStoreId: string;
  canSwitchStore: boolean;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "QR">("CASH");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const filtered = products.filter((p) => {
    if (categoryId !== "all" && p.categoryId !== categoryId) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cartInCartQty = (productId: string) =>
    cart.find((l) => l.productId === productId)?.quantity ?? 0;

  function addToCart(product: Product) {
    setMessage(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty >= product.stockQty) return prev;
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const product = productsById.get(productId);
          const max = product?.stockQty ?? l.quantity;
          const next = Math.min(max, Math.max(0, l.quantity + delta));
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  const total = cart.reduce((sum, l) => {
    const product = productsById.get(l.productId);
    return sum + (product ? product.price * l.quantity : 0);
  }, 0);

  function handleCheckout() {
    if (cart.length === 0) return;
    setMessage(null);

    const input: PosCheckoutInput = {
      storeId: activeStoreId,
      items: cart,
      paymentMethod,
      customerPhone: customerPhone.trim() || undefined,
      customerName: customerName.trim() || undefined,
    };

    startTransition(async () => {
      const result = await posCheckoutAction(input);
      if (result.ok) {
        setMessage({
          type: "success",
          text: `ขายสำเร็จ! เลขที่ออเดอร์ ${result.orderCode} ยอดรวม ฿${baht(result.total)}`,
        });
        setCart([]);
        setCustomerPhone("");
        setCustomerName("");
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="space-y-3 border-b border-border bg-white p-3">
          {canSwitchStore && (
            <div className="flex flex-wrap gap-2">
              {stores.map((s) => (
                <Link
                  key={s.id}
                  href={`/pos?store=${s.id}`}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    s.id === activeStoreId
                      ? "bg-brand text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setCategoryId("all")}
                className={`rounded-full px-3 py-1 text-sm ${
                  categoryId === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    categoryId === c.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const inCart = cartInCartQty(p.id);
            const soldOut = p.stockQty <= 0;
            const maxedOut = inCart >= p.stockQty;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={soldOut || maxedOut}
                className="flex flex-col items-start rounded-xl border border-border bg-white p-3 text-left shadow-sm transition hover:border-brand hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-brand font-semibold">฿{baht(p.price)}</span>
                <span className="mt-1 text-xs text-muted">คงเหลือ {p.stockQty}</span>
                {inCart > 0 && (
                  <Badge tone="brand" className="mt-1">
                    ในตะกร้า {inCart}
                  </Badge>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-muted">ไม่พบสินค้า</p>
          )}
        </div>
      </div>

      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-white">
        <div className="flex-1 overflow-y-auto p-3">
          <h2 className="mb-2 font-semibold">รายการขาย</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((line) => {
                const product = productsById.get(line.productId);
                if (!product) return null;
                return (
                  <li key={line.productId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-xs text-muted">฿{baht(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeQty(line.productId, -1)}
                        className="h-6 w-6 rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
                      >
                        −
                      </button>
                      <span className="w-6 text-center">{line.quantity}</span>
                      <button
                        onClick={() => changeQty(line.productId, 1)}
                        disabled={line.quantity >= product.stockQty}
                        className="h-6 w-6 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeLine(line.productId)}
                      className="text-xs text-danger hover:underline"
                    >
                      ลบ
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-border p-3">
          <Input
            placeholder="เบอร์โทรลูกค้า (ไม่บังคับ)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          {customerPhone && (
            <Input
              placeholder="ชื่อลูกค้า"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          )}
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "TRANSFER" | "QR")}
          >
            <option value="CASH">เงินสด</option>
            <option value="TRANSFER">โอนเงิน</option>
            <option value="QR">พร้อมเพย์/QR</option>
          </Select>

          <div className="flex items-center justify-between text-lg font-bold">
            <span>รวม</span>
            <span className="text-brand">฿{baht(total)}</span>
          </div>

          {message && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "success" ? "bg-green-50 text-success" : "bg-red-50 text-danger"
              }`}
            >
              {message.text}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || pending}
            onClick={handleCheckout}
          >
            {pending ? "กำลังบันทึก..." : "ชำระเงิน"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
