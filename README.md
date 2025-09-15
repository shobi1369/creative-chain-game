# 🎮 بازی زنجیرهٔ خلاقیت — Next.js + Supabase

این ریپو یک نمونهٔ کامل و **قابل‌اجرا** از بازی «زنجیرهٔ خلاقیت» است:
- Next.js (App Router + TypeScript + Server Components)
- Supabase (Postgres + RLS سفت‌وسخت + RPC + Edge Functions + Realtime)
- اپ کاربری + پنل مدیریت (ادمین)
- CI برای دیپلوی Edge Functions
- تم تاریک ساده، **RTL**، بدون فریم‌ورک UI سنگین
- هیچ Secret واقعی در کد قرار نگرفته است ✅

> **ایدهٔ بازی**: هر نوبت یک «هدف» می‌بینی (مثلاً «کاغذ») و می‌پرسی: «کاغذ را با چی نابود می‌کنی؟». پاسخ کوتاه است (۱–۲ واژه). اگر پاسخ با گراف امن همخوانی داشت، امتیاز می‌گیری. هدف نوبت بعدی همان پاسخ تو است. پایان وقتی است که پاسخ نامعتبر/ممنوع/دیر باشد.

---

## 0) تنظیمات و اجرا

1) پیش‌نیازها
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (برای Edge Functions/DB)
- یک پروژهٔ Supabase آماده (URL/Anon Key/Service Role)

2) فایل env
- فایل نمونه: **.env.local.example**
- کپی کنید به `.env.local` و مقادیر را پر کنید:
```ini
NEXT_PUBLIC_SUPABASE_URL=<REPLACE_ME>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<REPLACE_ME>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# CI/Deploy (GitHub Actions — فقط Secrets رپو)
SUPABASE_ACCESS_TOKEN=<REPLACE_ME>
SUPABASE_PROJECT_ID=<REPLACE_ME>
SUPABASE_URL=<REPLACE_ME>
SUPABASE_SERVICE_ROLE_KEY=<REPLACE_ME>

# Ads (اختیاری)
GOOGLE_ADS_APP_ID=<REPLACE_OR_EMPTY>
BAZAAR_ADS_APP_ID=<REPLACE_OR_EMPTY>
YEKTANET_API_KEY=<REPLACE_OR_EMPTY>

# LLM (اختیاری)
OPENAI_API_KEY=<REPLACE_OR_EMPTY>
ANTHROPIC_API_KEY=<REPLACE_OR_EMPTY>

```

> **هشدار امنیتی**: `SUPABASE_SERVICE_ROLE_KEY` را **هرگز** در کلاینت نگذارید. فقط روی سرور/Edge Function/CI استفاده کنید.

3) نصب و اجرا
```bash
pnpm i   # یا: npm i / yarn
pnpm dev # http://localhost:3000
```
- از صفحهٔ اصلی با Magic Link وارد شوید.
- سپس به `/play` بروید.

---

## 1) دیتابیس و RLS

### ایجاد دیتابیس و مایگریشن‌ها
- وارد پوشه پروژه شوید:
```bash
supabase link --project-ref $SUPABASE_PROJECT_ID
supabase db push  # اجرای فایل supabase/migrations/0001_init.sql و seed.sql
```
- ری‌فرش لیدربرد با `pg_cron` به صورت زمان‌بندی شده است. اگر خطای دسترسی دریافت کردید، مطمئن شوید PG cron فعال است (در بعضی پلن‌ها محدود است).

### جداول، RLS و RPC
- همه در `supabase/migrations/0001_init.sql` تعریف شده‌اند؛ شامل:
  - توابع: `fa_normalize(text)`, `score_step(numeric,int,int)`
  - RPC: `rpc_play_submit_answer(...)`
  - Publication روی `moves` برای Realtime
  - Materialized View لیدربرد + `pg_cron` برای refresh

---

## 2) Edge Functions

- سه فانکشن در `supabase/functions`:
  - `play-answer`: فراخوانی RPC با کانتکست کاربر (JWT) برای بازی
  - `admin-graph`: CRUD گراف/علیاس/لبه پس از احراز هویت ادمین (Service Role داخلی)
  - `admin-config`: مدیریت فلگ‌ها/کانفیگ/… با لاگ دقیق در `audit_logs`

### اجرای محلی
```bash
# ترمینال ۱ — دیتابیس محلی (اختیاری)
supabase start

# ترمینال ۲ — فانکشن‌ها
supabase functions serve --env-file .env.local
# سپس: http://localhost:54321/functions/v1/play-answer
```

---

## 3) دیپلوی (CI)

- فایل GitHub Actions: `.github/workflows/deploy-functions.yml`
- با هر push به main، Edge Functions به پروژه Supabase شما دیپلوی می‌شوند.
- Secrets لازم را در Settings → Secrets پروژه گیت‌هاب تنظیم کنید:
  - `SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY`

---

## 4) تست و معیار پذیرش (Acceptance)

- [x] اجرای محلی با `pnpm dev` و ورود با ایمیل (Magic Link)
- [x] `POST /api/game/new` بازی می‌سازد و هدف «کاغذ» می‌دهد
- [x] پاسخ «آتش» برای «کاغذ» معتبر و امتیاز مثبت دارد؛ هدف بعدی «آتش»
- [x] روت‌های پنل فقط برای ادمین باز شوند
- [x] CRUD گراف از پنل کار کند و در `audit_logs` ثبت شود
- [x] `.env.local.example` وجود دارد؛ `.env.local` در `.gitignore` است
- [x] CI فانکشن‌ها را دیپلوی می‌کند

### خطاهای رایج
- `UNAUTHENTICATED`: توکن وجود ندارد یا سشن منقضی شده → دوباره لاگین کنید
- `edge error`: آدرس Functions اشتباه یا Env ناقص → `NEXT_PUBLIC_SUPABASE_URL` را چک کنید
- «نود seed نیست»: `supabase db push` سپس `seed.sql` را اجرا کنید (یا `supabase db reset`)
- مجوز Service Role: فقط در سرور/Edge/CI استفاده شود

---

## 5) افزودنی‌های آتی
- Duel Realtime (policy دوطرفه روی بازی‌های 1v1)
- لیدربردهای دوره‌ای و فصلی
- رویدادمحور Analytics
- LLM Router برای validate/explain/synonyms با کش و بودجه‌بندی
- رویدادهای tematic، Marketplace آیتم‌های تزئینی

**موفق باشید!**
