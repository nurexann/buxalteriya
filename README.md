# Shaxsiy Ombor va Buxgalteriya

Bitta Next.js codebase: Telegram Mini App ichida ham, oddiy browser dashboard sifatida ham ishlaydi. Maqsad katta ERP emas, shaxsiy ombor, sotuv, kirim, chiqim, pul balansi va auditni ishonchli yuritish.

## Arxitektura

- Frontend: Next.js App Router, mobile-first Uzbek UI.
- Backend: Next.js server actions va API routes.
- Database: Supabase PostgreSQL.
- Transaction logic: muhim operatsiyalar Postgres RPC funksiyalarida bajariladi.
- Storage: Supabase Storage `product-images` bucket.
- Auth: Telegram initData verification + browser uchun owner password.
- Deploy: Vercel + Vercel Cron.

Muhim qoida: sotuv, kirim, xarajat, stock movement, money movement va audit log fizik delete qilinmaydi. Xato yozuvlar `cancelled`, `reversed` yoki `archived` orqali tuzatiladi.

## Project Structure

```txt
src/app
  api/
    auth/telegram
    cron/purge-trash
    products/search
    reports/csv
    storage/product-image
  actions/
  products, stock, purchases, sales, expenses, reports, trash, settings pages
src/components
src/lib
  auth, business, supabase, data helpers
supabase/migrations
tests
```

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell’da `npm.ps1` bloklangan bo‘lsa:

```powershell
npm.cmd install
npm.cmd run dev
```

Local browser login default parol: `owner`. Production’da albatta `OWNER_PASSWORD` qo‘ying.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_ADMIN_ID=
TELEGRAM_WEBAPP_URL=
CRON_SECRET=
OWNER_PASSWORD=
```

Supabase'ning yangi API Keys sahifasida `Publishable key` qiymatini
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ga, `Secret keys` dagi default secret
qiymatini `SUPABASE_SECRET_KEY` ga qo'ying. Legacy tab ishlatsangiz,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` va `SUPABASE_SERVICE_ROLE_KEY` ham ishlaydi.

`TELEGRAM_ADMIN_ID` faqat owner Telegram user ID bo‘lishi kerak. Mini App boshqa Telegram userlarga kirishni rad qiladi.

Token chatga yoki logga tushib qolgan bo‘lsa, deploydan oldin BotFather orqali tokenni regenerate qiling.

## Supabase Migration

1. Supabase project yarating.
2. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` ni `.env.local` ga qo'ying. Legacy tab ishlatsangiz `NEXT_PUBLIC_SUPABASE_ANON_KEY` va `SUPABASE_SERVICE_ROLE_KEY` ham qabul qilinadi.
3. Migration ishga tushiring:

```bash
supabase db push
```

Yoki Supabase SQL Editor’da `supabase/migrations/001_initial_schema.sql` faylini ishga tushiring.

Migration quyidagilarni yaratadi:

- `products`, `categories`
- `sales`, `purchases`, `expenses`
- `stock_movements`, `money_movements`
- `audit_logs`, `app_settings`
- dashboard uchun view’lar
- transaction RPC funksiyalar
- important records delete prevention trigger’lari

## Storage

Migration `product-images` bucket yaratishga urinadi. Supabase paneldan tekshiring:

- Bucket name: `product-images`
- Public: enabled
- File size limit: 5 MB
- MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

Product soft delete qilinganda rasm o‘chmaydi. Product permanent delete bo‘lsa va tarixiy yozuvlar bo‘lmasa, storage’dagi rasm ham o‘chiriladi.

## Telegram Mini App

1. BotFather’da bot yarating yoki mavjud botdan foydalaning.
2. `TELEGRAM_BOT_TOKEN` va `TELEGRAM_BOT_USERNAME` ni sozlang.
3. Deploy URL’ni `TELEGRAM_WEBAPP_URL` ga qo‘ying.
4. BotFather’da Mini App/Web App URL sifatida Vercel URL’ni ulang.
5. `TELEGRAM_ADMIN_ID` faqat egasi ID bo‘lsin.

Telegram auth `initData` hash’ini bot token bilan tekshiradi va 7 kundan eski auth data’ni rad qiladi.

## Business Logic

Kirim RPC:

- purchase create
- product quantity increase
- stock movement create
- money movement expense create
- audit log create

Sotuv RPC:

- stock yetarliligi tekshiriladi
- sale create
- product quantity decrease
- stock movement create
- money movement income create
- profit calculate
- audit log create

Sotuv bekor qilish:

- sale `cancelled`
- product quantity increase
- reverse stock movement
- reverse money movement
- audit log

Foyda formulasi:

```txt
foyda = (sotuv narxi - xarid narxi) * sotilgan son - chegirma
```

## Trash va Cron

Soft delete maydonlari:

- `deleted_at`
- `deleted_by`
- `delete_reason`

Vercel cron har kuni ishga tushadi:

```json
{
  "path": "/api/cron/purge-trash",
  "schedule": "0 21 * * *"
}
```

Asia/Tashkent bo‘yicha bu taxminan har kuni tungi 02:00 atrofida. Endpoint `CRON_SECRET` bilan himoyalangan.

Manual tekshirish:

```bash
curl "https://YOUR_DOMAIN/api/cron/purge-trash?secret=YOUR_CRON_SECRET"
```

## Reports

Hisobotlarda filterlar bor:

- sana oralig‘i
- tovar
- kategoriya
- movement type

MVP’da CSV export mavjud:

```txt
/api/reports/csv?type=sales&from=2026-05-01&to=2026-05-13
```

Keyin PDF/Excel qo‘shish uchun report data `src/lib/data.ts` ichida markazlashgan.

## Backup va Restore

Eng yaxshi amaliyot:

- Supabase Pro bo‘lsa PITR yoqing.
- Kamida daily backup schedule yoqing.
- Haftada bir marta manual SQL dump oling.
- Storage bucket uchun ham alohida backup strategiya belgilang.

Restore:

1. Supabase backup restore qiling yoki SQL dump import qiling.
2. Storage bucket fayllarini tiklang.
3. Env qiymatlari eski project URL/key’lariga mos kelishini tekshiring.
4. `stock_movements` orqali product quantity audit qiling.

## Testlar

```bash
npm test
```

Testlar qamrovi:

- product create
- SKU unique validation
- product search by SKU
- purchase increases stock
- sale decreases stock
- sale cannot exceed stock
- sale creates money income
- purchase creates money expense
- expense decreases balance
- profit calculation
- soft delete
- restore
- auto purge after 3 days
- important records are not physically deleted
- audit log creation

## Deploy Vercel

1. GitHub repo’ga push qiling.
2. Vercel’da import qiling.
3. Env variables’ni Vercel project settings’da qo‘ying.
4. Supabase migration bajarilganini tekshiring.
5. `vercel.json` cron konfiguratsiyasi deploy bilan birga ketadi.
6. Telegram Mini App URL’ni Vercel production URL bilan yangilang.

## MVP Chegaralari

Hozircha ataylab qo‘shilmagan:

- xodimlar va rollar
- ko‘p ombor
- mijozlar bazasi
- qarzdorlik
- yetkazib beruvchi bazasi
- barcode/QR
- payment gateway
- murakkab ERP funksiyalar
