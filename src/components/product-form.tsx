"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { FormState } from "@/actions/products";

type Category = { id: string; name: string };

type ProductDefaults = {
  sku?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number; // baht
  lowStockThreshold?: number;
  categoryId?: string | null;
  imageUrl?: string | null;
  active?: boolean;
};

export function ProductForm({
  action,
  categories,
  defaults,
  mode,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: Category[];
  defaults?: ProductDefaults;
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sku">รหัสสินค้า (SKU)</Label>
          <Input id="sku" name="sku" defaultValue={defaults?.sku} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug (สำหรับหน้าเว็บ)</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={defaults?.slug}
            placeholder="moo-ping"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="name">ชื่อสินค้า</Label>
        <Input id="name" name="name" defaultValue={defaults?.name} required />
      </div>

      <div>
        <Label htmlFor="description">รายละเอียด</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">ราคา (บาท)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.price}
            required
          />
        </div>
        <div>
          <Label htmlFor="categoryId">หมวดหมู่</Label>
          <Select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId ?? ""}>
            <option value="">— ไม่ระบุ —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode === "create" ? (
          <div>
            <Label htmlFor="initialStock">จำนวนสต็อกเริ่มต้น</Label>
            <Input
              id="initialStock"
              name="initialStock"
              type="number"
              min="0"
              defaultValue={0}
            />
          </div>
        ) : null}
        <div>
          <Label htmlFor="lowStockThreshold">แจ้งเตือนเมื่อคงเหลือต่ำกว่า</Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={defaults?.lowStockThreshold ?? 5}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="imageUrl">ลิงก์รูปภาพ (ถ้ามี)</Label>
        <Input id="imageUrl" name="imageUrl" defaultValue={defaults?.imageUrl ?? ""} />
      </div>

      {mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults?.active ?? true}
            className="h-4 w-4 rounded border-border"
          />
          เปิดขายสินค้านี้
        </label>
      ) : null}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}
