# DA.am World Study & Travel

React (Vite) + Supabase дээр ажилладаг аяллын компанийн сайт.

- **Сайт:** нүүр, аяллын хөтөлбөрүүд (`/package`), аяллын дэлгэрэнгүй (`/tour/:slug`), бүртгэл (`/register/:slug`), блог (`/blog`). МН / EN / 中文.
- **Админ (`/admin`):** аялал, бүртгэл, блог, сайтын бүх текст, зураг, утас, улс, асуулт хариултыг засна.
- **Supabase:** Postgres хүснэгтүүд (RLS-тэй), Auth (админ нэвтрэлт), Storage (`media` bucket — зураг).

## Суулгах

```bash
npm install
cp .env.example .env        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY бөглөнө
```

## Supabase тохируулах

```bash
npx supabase login
npx supabase link --project-ref htvovsrgmiwzixtqaolw
npm run db:push             # supabase/migrations доторх хүснэгт, функц, бодлогууд
```

`.env` дотор `SUPABASE_SERVICE_ROLE_KEY`-г нэмээд (Project Settings → API):

```bash
npm run create-admin -- имэйл@жишээ.mn НууцҮг123   # админ хэрэглэгч үүсгэх
npm run import                                     # хуучин server/data өгөгдлийг шилжүүлэх (нэг удаа)
```

## Ажиллуулах

```bash
npm run dev       # http://localhost:5173
npm run build     # dist/ — Vercel, Netlify гэх мэт статик хостинг дээр байршуулна
```

## Өгөгдлийн бүтэц

| Хүснэгт | Агуулга | Хэн уншина / бичнэ |
|---|---|---|
| `tours` | Аяллууд | Бүгд идэвхтэйг уншина, админ бичнэ |
| `registrations` | Бүртгэлүүд | Зөвхөн админ. Олон нийт `submit_registration()` функцээр илгээнэ (цагт 3 удаа, суудлын шалгалттай) |
| `posts` | Блог | Бүгд нийтэлснийг уншина, админ бичнэ |
| `site_settings` | Сайтын текст, зураг, утас, улс, FAQ | Бүгд уншина, админ бичнэ |
| `admins` | Админ хэрэглэгчид | — |
