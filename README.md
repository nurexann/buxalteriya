# Shaxsiy Ombor va Buxgalteriya

Next.js asosidagi bitta web app: Telegram Mini App ichida ham, oddiy browser dashboard sifatida ham ishlaydi. Tizim shaxsiy ombor, kirim, sotuv, xarajat, pul balansi, trash va audit log uchun yozilgan.

## Stack

- Frontend va backend: Next.js App Router
- Database: Supabase PostgreSQL
- Storage: Supabase Storage, `product-images` bucket
- Auth: Telegram Mini App initData va browser uchun owner parol
- Deploy: Vercel
- Cron: Vercel Cron, har kuni trash cleanup

## Muhim Qoidalar

- Sotuv, kirim, xarajat, stock movement, money movement va audit log fizik delete qilinmaydi.
- Product/category avval trashga tushadi.
- Trashdagi oddiy entitylar 3 kundan keyin cron orqali purge qilinadi.
- Tovar va pul harakati muhim joylarda Postgres RPC transaction bilan bajariladi.
- Product image permanent delete bo'lmaguncha storage'dan o'chmaydi.

## Project Structure

```txt
src/app
  api/auth/telegram
  api/cron/purge-trash
  api/products/search
  api/reports/csv
  api/storage/product-image
  actions
  products, stock, purchases, sales, expenses, reports, trash, settings pages
src/components
src/lib
  auth, business, supabase, data helpers
scripts
  check-deploy-env.mjs
  configure-telegram-webapp.mjs
supabase/migrations
tests
```

## Local Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell uchun:

```powershell
npm.cmd install
npm.cmd run dev
```

Local browser login default parol: `owner`. Production uchun albatta kuchli `OWNER_PASSWORD` qo'ying.

## Env Variables

Vercel project settings va local `.env.local` uchun kerakli envlar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Legacy Supabase key nomlari ham ishlaydi:
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_ADMIN_ID=
TELEGRAM_WEBAPP_URL=https://YOUR_VERCEL_DOMAIN.vercel.app

CRON_SECRET=
OWNER_PASSWORD=
```

Supabase yangi API Keys sahifasida:

- Publishable key -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Secret key -> `SUPABASE_SECRET_KEY`

Legacy API Keys ishlatsangiz:

- anon key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key -> `SUPABASE_SERVICE_ROLE_KEY`

Secret/service role keyni hech qachon `NEXT_PUBLIC_` bilan boshlamang.

Envlarni tekshirish:

```bash
npm run deploy:check
```

## Supabase Setup

1. Supabase project yarating.
2. Project URL va API keys qiymatlarini `.env.local` yoki Vercel env settingsga qo'ying.
3. Supabase CLI bilan login qiling:

```bash
npx supabase login
```

4. Projectni ulang:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

5. Migrationlarni cloud databasega yuboring:

```bash
npm run deploy:supabase
```

Yoki SQL Editor orqali `supabase/migrations/001_initial_schema.sql` faylini ishga tushiring.

Migration quyidagilarni yaratadi:

- `products`, `categories`
- `sales`, `purchases`, `expenses`
- `stock_movements`, `money_movements`
- `audit_logs`, `app_settings`
- dashboard uchun viewlar
- transaction RPC funksiyalar
- important records delete prevention triggerlari
- `product-images` storage bucket

## Supabase Storage

Bucket:

```txt
product-images
```

Talablar:

- Public: enabled
- File size limit: 5 MB
- MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

Migration bucketni yaratishga yoki yangilashga urinadi. Deploydan keyin Supabase Storage panelida tekshirib chiqing.

## Vercel Deploy

1. GitHub repo'ni Vercelga import qiling.
2. Framework preset: Next.js.
3. Build command default qolishi mumkin: `npm run build`.
4. Env Variables bo'limiga yuqoridagi envlarni qo'ying.
5. Deploy qiling.
6. Production domain chiqqach `TELEGRAM_WEBAPP_URL` ni shu domain bilan yangilang.
7. Redeploy qiling.

CLI orqali production deploy:

```bash
npm run deploy:vercel
```

## Vercel Cron

`vercel.json` ichida trash cleanup cron bor:

```json
{
  "path": "/api/cron/purge-trash",
  "schedule": "0 21 * * *"
}
```

Bu UTC 21:00, Asia/Tashkent bo'yicha taxminan 02:00. Vercel cron production deploymentda ishlaydi.

Cron endpoint `CRON_SECRET` bilan himoyalangan. Vercel project env ichida `CRON_SECRET` qo'yilsa, Vercel cron requestga `Authorization: Bearer <CRON_SECRET>` headerini yuboradi.

Manual test:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://YOUR_DOMAIN/api/cron/purge-trash"
```

## Telegram Mini App

1. BotFather orqali bot yarating yoki mavjud botdan foydalaning.
2. `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_ADMIN_ID` ni sozlang.
3. Vercel production URLni `TELEGRAM_WEBAPP_URL` ga qo'ying.
4. BotFatherda Mini App/Web App URL sifatida Vercel URLni ulang.
5. Telegram menu buttonni avtomatik sozlash:

```bash
npm run telegram:menu
```

`TELEGRAM_ADMIN_ID` faqat owner Telegram user ID bo'lishi kerak. Boshqa Telegram userlar Mini App authdan o'tmaydi.

Token biror chatga yoki logga tushib qolgan bo'lsa, deploydan oldin BotFather orqali tokenni regenerate qiling.

## Business Logic

Kirim:

- purchase create
- product quantity increase
- stock movement create
- money movement expense create
- audit log create

Sotuv:

- stock yetarliligi tekshiriladi
- sale create
- product quantity decrease
- stock movement create
- money movement income create
- profit calculate
- audit log create

Sotuv bekor qilish:

- sale status `cancelled`
- product quantity increase
- reverse stock movement
- reverse money movement
- audit log create

Foyda:

```txt
profit = (sale_price - purchase_price) * quantity - discount
```

## Backup va Restore

Tavsiya:

- Supabase Pro bo'lsa PITR yoqing.
- Daily backup schedule yoqing.
- Haftada bir marta manual SQL dump oling.
- Storage bucket uchun alohida backup strategiya belgilang.

Restore:

1. Supabase backup restore qiling yoki SQL dump import qiling.
2. Storage bucket fayllarini tiklang.
3. Vercel env qiymatlari yangi Supabase projectga mosligini tekshiring.
4. `stock_movements` orqali product quantity audit qiling.

## Test

```bash
npm run typecheck
npm test
npm run build
```

Test qamrovi:

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
- soft delete and restore
- auto purge after 3 days
- important records are not physically deleted
- audit log creation

## Deploy Checklist

- [ ] Supabase project yaratildi
- [ ] `supabase db push` bajarildi
- [ ] `product-images` bucket tekshirildi
- [ ] Vercel project GitHub repo bilan ulandi
- [ ] Vercel env variables to'liq qo'yildi
- [ ] `npm run deploy:check` xatosiz o'tdi
- [ ] Vercel production deploy o'tdi
- [ ] `TELEGRAM_WEBAPP_URL` production URLga yangilandi
- [ ] `npm run telegram:menu` bajarildi
- [ ] Browser login va Telegram Mini App test qilindi
