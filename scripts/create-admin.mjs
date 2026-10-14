// Админ хэрэглэгч үүсгэх (эсвэл байгаа хэрэглэгчид админ эрх өгөх)
// Ажиллуулах: npm run create-admin -- имэйл нууц_үг
import { createClient } from '@supabase/supabase-js';

const [email, password] = process.argv.slice(2);
if (!email || !password) { console.error('Хэрэглээ: npm run create-admin -- имэйл нууц_үг'); process.exit(1); }
if (password.length < 8) { console.error('Нууц үг дор хаяж 8 тэмдэгт байна.'); process.exit(1); }

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let user;
const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  if (!/already/i.test(error.message)) { console.error(error.message); process.exit(1); }
  // Хэрэглэгч байгаа бол олж, нууц үгийг шинэчилнэ
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  user = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  await sb.auth.admin.updateUserById(user.id, { password });
} else user = data.user;

const { error: e2 } = await sb.from('admins').upsert({ user_id: user.id });
if (e2) { console.error(e2.message); process.exit(1); }
console.log(`✓ ${email} админ боллоо.`);
