"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trackOrderAction } from "@/actions/shop";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function TrackOrderPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await trackOrderAction({ code, phone });
      if (result.ok) {
        router.push(`/shop/order/${result.code}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">ตรวจสอบออเดอร์</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="code">เลขที่ออเดอร์</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="phone">เบอร์โทรศัพท์ที่ใช้สั่งซื้อ</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "กำลังค้นหา..." : "ตรวจสอบ"}
        </Button>
      </form>
    </div>
  );
}
