/* Supabase-тэй харилцах бүх query энд */
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!URL || !KEY) console.error('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY .env файлд тохируулаагүй байна.');
export const sb = createClient(URL, KEY);

const must = ({ data, error }) => { if (error) throw error; return data; };

/* ---------- Мөр ↔ объект ---------- */
export const tourFromRow = r => ({
  id: r.id, slug: r.slug, active: r.active, order: r.sort_order, type: r.type, countries: r.countries || [],
  code: r.code, to: r.to_city, img: r.img, title: r.title, sub: r.sub, when: r.when_text, days: r.days,
  departures: r.departures || [], end: r.end_date || '', seats: r.seats, booked: r.booked,
  prices: r.prices || [], phones: r.phones || [], hl: r.hl || [], program: r.program || [],
  included: r.included || [], excluded: r.excluded || [], suitable: r.suitable || [], gallery: r.gallery || []
});
export const tourToRow = t => ({
  slug: t.slug, active: t.active !== false, type: t.type, countries: t.countries || [], code: t.code || '',
  to_city: t.to ?? '', img: t.img || '', title: t.title, sub: t.sub ?? '', when_text: t.when ?? '', days: t.days ?? '',
  departures: (t.departures || []).filter(Boolean), end_date: t.end || null,
  seats: t.seats === '' || t.seats == null ? null : Number(t.seats),
  prices: t.prices || [], phones: (t.phones || []).filter(Boolean), hl: t.hl || [], program: t.program || [],
  included: t.included || [], excluded: t.excluded || [], suitable: t.suitable || [], gallery: t.gallery || []
});

export const slugify = s => String(s || '').toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

async function uniqueSlug(table, base, ignoreId) {
  const root = slugify(base) || table.slice(0, -1) + '-' + Math.random().toString(36).slice(2, 7);
  const rows = must(await sb.from(table).select('id, slug').like('slug', root + '%'));
  const taken = new Set(rows.filter(r => r.id !== ignoreId).map(r => r.slug));
  let s = root, n = 2;
  while (taken.has(s)) s = `${root}-${n++}`;
  return s;
}

/* ---------- Аяллууд ---------- */
export const listTours = async () =>
  must(await sb.from('tours').select('*').order('sort_order').order('created_at')).map(tourFromRow);

export async function saveTour(t) {
  const row = tourToRow(t);
  if (t.id) {
    row.slug = await uniqueSlug('tours', t.slug, t.id);
    return tourFromRow(must(await sb.from('tours').update(row).eq('id', t.id).select().single()));
  }
  row.slug = await uniqueSlug('tours', t.slug || t.title?.en || t.title?.mn);
  const first = must(await sb.from('tours').select('sort_order').order('sort_order').limit(1));
  row.sort_order = (first[0]?.sort_order ?? 1) - 1;
  return tourFromRow(must(await sb.from('tours').insert(row).select().single()));
}
export const setTourActive = async (id, active) => must(await sb.from('tours').update({ active }).eq('id', id));
export const deleteTour = async id => must(await sb.from('tours').delete().eq('id', id));
export const reorderTours = async ids => must(await sb.rpc('reorder_tours', { ids }));

/* ---------- Бүртгэл ---------- */
export async function submitRegistration(payload) {
  const { data, error } = await sb.rpc('submit_registration', { payload });
  if (error) { const e = new Error(error.message); e.code = error.message; throw e; }
  return data;
}
const regFromRow = r => ({
  id: r.id, createdAt: r.created_at, tourSlug: r.tour_slug, tourTitle: r.tour_title, departure: r.departure || '',
  contact: r.contact, travellers: r.travellers, room: r.room, reasons: r.reasons, note: r.note, status: r.status
});
export const listRegistrations = async () =>
  must(await sb.from('registrations').select('*').order('created_at', { ascending: false })).map(regFromRow);
export const setRegistrationStatus = async (id, status) => must(await sb.from('registrations').update({ status }).eq('id', id));
export const deleteRegistration = async id => must(await sb.from('registrations').delete().eq('id', id));

/* ---------- Блог ---------- */
export const listPosts = async () =>
  must(await sb.from('posts').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }));
export async function savePost(p) {
  const row = { title: p.title, excerpt: p.excerpt ?? '', body: p.body ?? '', cover: p.cover || '', images: p.images || [], date: p.date, published: p.published !== false };
  if (p.id) {
    row.slug = await uniquePostSlug(p.slug, p.id);
    return must(await sb.from('posts').update(row).eq('id', p.id).select().single());
  }
  row.slug = await uniquePostSlug(p.slug || p.title?.en || p.title?.mn);
  return must(await sb.from('posts').insert(row).select().single());
}
const uniquePostSlug = (base, id) => uniqueSlug('posts', base, id);
export const setPostPublished = async (id, published) => must(await sb.from('posts').update({ published }).eq('id', id));
export const deletePost = async id => must(await sb.from('posts').delete().eq('id', id));

/* ---------- Сайтын тохиргоо ---------- */
export const getSiteContent = async () =>
  (must(await sb.from('site_settings').select('content').eq('id', 1).maybeSingle()))?.content || {};
export const saveSiteContent = async content =>
  must(await sb.from('site_settings').update({ content }).eq('id', 1));

/* ---------- Зураг ---------- */
export async function uploadImages(files) {
  const urls = [];
  for (const file of files) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('bad_type');
    if (file.size > 8 * 1024 * 1024) throw new Error('too_big');
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type];
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    must(await sb.storage.from('media').upload(path, file, { cacheControl: '2592000', contentType: file.type }));
    urls.push(sb.storage.from('media').getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

/* ---------- Админ нэвтрэлт ---------- */
export async function adminSignIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!(await isAdmin(data.user.id))) { await sb.auth.signOut(); const e = new Error('not_admin'); e.code = 'not_admin'; throw e; }
  return data.session;
}
export async function isAdmin(uid) {
  const { data } = await sb.from('admins').select('user_id').eq('user_id', uid).maybeSingle();
  return !!data;
}
export const adminSignOut = () => sb.auth.signOut();
