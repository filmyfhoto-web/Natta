# Grill Me — ระบบหลังร้าน (Natta)

ระบบหลังร้านสำหรับร้าน Grill Me ที่มี **หน้าร้าน 2 สาขา** แต่ใช้ **สต็อกสินค้าและฐานข้อมูลลูกค้าร่วมกัน** ประกอบด้วย 3 ส่วนหลัก:

- **หน้าเว็บลูกค้า** (`/shop`) — เลือกสินค้า ใส่ตะกร้า สั่งซื้อ และตรวจสอบสถานะออเดอร์
- **POS หน้าร้าน** (`/pos`) — พนักงานขายหน้าร้าน ตัดสต็อกจากคลังกลางทันที ใช้ได้ทั้ง 2 สาขา
- **หลังร้าน/แอดมิน** (`/admin`) — จัดการสินค้า สต็อก (รับเข้า/ปรับยอด/รับคืน) ลูกค้า ออเดอร์ และพนักงาน

## สถาปัตยกรรม

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) ORM บน SQLite (ผ่าน `@prisma/adapter-better-sqlite3`) — เปลี่ยนไปใช้ Postgres/MySQL ได้ในภายหลังโดยแก้ `provider` ใน `prisma/schema.prisma`
- Auth พนักงานแบบ session cookie เซ็นด้วย JWT (`jose`) + `bcryptjs` สำหรับรหัสผ่าน — ไม่มีระบบล็อกอินฝั่งลูกค้า (ลูกค้าอ้างอิงด้วยเบอร์โทรศัพท์)
- สต็อกสินค้าเป็น **คลังเดียวใช้ร่วมกันทั้ง 2 สาขา** ทุกการขาย (POS หรือเว็บ) หักสต็อกจากพูลเดียวกันแบบ atomic transaction พร้อมบันทึกประวัติการเคลื่อนไหว (`StockMovement`) เพื่อตรวจสอบย้อนหลังได้ว่าใครขาย/ปรับที่ไหน

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env   # ตั้งค่า AUTH_SECRET ใหม่ด้วย: openssl rand -base64 32
npm run db:push        # สร้างตาราง SQLite ตาม schema
npm run db:seed        # ข้อมูลตัวอย่าง: 2 สาขา, สินค้า, พนักงาน
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

### บัญชีทดสอบ (จาก `npm run db:seed`)

| บทบาท | ชื่อผู้ใช้ | รหัสผ่าน | สิทธิ์ |
| --- | --- | --- | --- |
| ผู้ดูแลระบบ | `admin` | `admin1234` | เข้าหลังร้านทั้งหมด + POS ทุกสาขา |
| พนักงานสาขา 1 | `staff1` | `staff1234` | ใช้ POS ของสาขา 1 |
| พนักงานสาขา 2 | `staff2` | `staff1234` | ใช้ POS ของสาขา 2 |

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
| --- | --- |
| `npm run dev` | รันเซิร์ฟเวอร์พัฒนา |
| `npm run build` / `npm run start` | build และรันโปรดักชัน |
| `npm run lint` | ตรวจสอบโค้ดด้วย ESLint |
| `npm run db:push` | ซิงก์ schema กับฐานข้อมูล (dev) |
| `npm run db:seed` | ใส่ข้อมูลตัวอย่าง |
| `npm run db:studio` | เปิด Prisma Studio ดู/แก้ข้อมูลตรง ๆ |

## โครงสร้างที่สำคัญ

```
prisma/schema.prisma      โมเดลข้อมูล (Store, Product, StockMovement, Order, ...)
src/lib/orders.ts         ตรรกะ checkout ร่วมของ POS และเว็บ (ตัดสต็อกแบบ atomic)
src/lib/stock.ts          ปรับสต็อกด้วยมือ (รับเข้า/ปรับยอด/รับคืน) พร้อมบันทึกประวัติ
src/lib/auth.ts           session ของพนักงาน (JWT cookie)
src/proxy.ts              ป้องกันเส้นทาง /admin และ /pos (ต้องล็อกอิน + สิทธิ์ตามบทบาท)
src/app/admin/**          หลังร้าน (สินค้า, สต็อก, ออเดอร์, ลูกค้า, พนักงาน)
src/app/pos/**            หน้าจอ POS
src/app/shop/**           หน้าร้านออนไลน์สำหรับลูกค้า
```
