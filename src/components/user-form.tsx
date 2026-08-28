"use client";

import { useActionState, useRef, useEffect } from "react";
import { createUserAction, type FormState } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

type Store = { id: string; name: string };

export function UserForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createUserAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <Label htmlFor="username">ชื่อผู้ใช้</Label>
        <Input id="username" name="username" required />
      </div>
      <div>
        <Label htmlFor="name">ชื่อ-นามสกุล</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div>
        <Label htmlFor="role">บทบาท</Label>
        <Select id="role" name="role" defaultValue="STAFF">
          <option value="STAFF">พนักงาน</option>
          <option value="ADMIN">ผู้ดูแลระบบ</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="storeId">ประจำสาขา</Label>
        <Select id="storeId" name="storeId" defaultValue="">
          <option value="">— ไม่ระบุ —</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2 lg:col-span-5">
        {state?.error && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "กำลังเพิ่ม..." : "+ เพิ่มพนักงาน"}
        </Button>
      </div>
    </form>
  );
}
