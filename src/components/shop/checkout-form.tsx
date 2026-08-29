"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { getCartDetailsAction, webCheckoutAction } from "@/actions/shop";
import { baht } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

type Store = { id: string; name: string; address: string | null };
type ProductDetail = { id: string; name: string; price: number; stockQty: number };

export function CheckoutForm({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [details, setDetails] = useState<Map<string, ProductDetail>>(new Map());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getCartDetailsAction(items.map((i) => i.productId)).then((products) => {
      setDetails(new Map(products.map((p) => [p.id, p])));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = items.reduce((sum, i) => {
    const product = details.get(i.productId);
    return sum + (product ? product.price * i.quantity : 0);
  }, 0);

  if (items.length === 0) {
    return <p className="text-muted">ตะกร้าของคุณว่างเปล่า กรุณาเลือกสินค้าก่อน</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!storeId) {
      setError("กรุณาเลือกสาขาที่รับสินค้า");
      return;
    }

    startTransition(async () => {
      const result = await webCheckoutAction({
        name,
        phone,
        address,
        storeId,
        note,
        items,
      });
      if (result.ok) {
        clear();
        router.push(`/shop/order/${result.orderCode}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="mb-2 font-semibold">สรุปรายการ</h2>
        <ul className="divide-y divide-border text-sm">
          {items.map((line) => {
            const product = details.get(line.productId);
            if (!product) return null;
            return (
              <li key={line.productId} className="flex justify-between py-1.5">
                <span>
                  {product.name} x {line.quantity}
                </span>
                <span>฿{baht(product.price * line.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
          <span>รวม</span>
          <span className="text-brand">฿{baht(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">ชื่อผู้รับ</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            inputMode="tel"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="storeId">รับสินค้าที่สาขา</Label>
        <Select id="storeId" value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.address ? ` — ${s.address}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="address">ที่อยู่ (ถ้าต้องการจัดส่ง)</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="note">หมายเหตุถึงร้าน</Label>
        <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "กำลังส่งคำสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
      </Button>
      <p className="text-center text-xs text-muted">
        ชำระเงินที่หน้าร้านเมื่อรับสินค้า ทางร้านจะติดต่อยืนยันคำสั่งซื้อของคุณ
      </p>
    </form>
  );
}
