import { db } from "@/lib/db";
import { ProductForm } from "@/components/product-form";
import { createProductAction } from "@/actions/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">เพิ่มสินค้าใหม่</h1>
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm action={createProductAction} categories={categories} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
