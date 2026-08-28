"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { FormState } from "@/actions/products";

export function StockAdjustForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="type">ประเภท</Label>
          <Select id="type" name="type" defaultValue="RESTOCK">
            <option value="RESTOCK">รับเข้าสต็อก (+)</option>
            <option value="ADJUSTMENT">ปรับยอด (+/-)</option>
            <option value="RETURN">รับคืนสินค้า (+)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">จำนวน</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            required
            placeholder="เช่น 20 หรือ -5"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reason">หมายเหตุ</Label>
        <Input id="reason" name="reason" placeholder="เช่น รับของจากซัพพลายเออร์" />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกการปรับสต็อก"}
      </Button>
    </form>
  );
}
