// Хуучин JSON өгөгдлийг (server/data) Supabase руу нэг удаа шилжүүлэх.
// Ажиллуулах: npm run import  (.env дотор SUPABASE_SERVICE_ROLE_KEY шаардлагатай)
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SEED } from './seed-data.js';

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('.env дотор VITE_SUPABASE_URL болон SUPABASE_SERVICE_ROLE_KEY хэрэгтэй.'); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const DATA = path.resolve('server/data');
const read = (f, fb) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return fb; } };
const must = ({ data, error }, what) => { if (error) { console.error(what, error); process.exit(1); } return data; };

/* 1. Зургуудыг Storage руу */
const urlMap = {};
const upDir = path.join(DATA, 'uploads');
if (fs.existsSync(upDir)) {
  for (const name of fs.readdirSync(upDir)) {
    const ext = path.extname(name).slice(1).toLowerCase();
    const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext];
    if (!type) continue;
    const dest = 'uploads/' + name;
    const { error } = await sb.storage.from('media').upload(dest, fs.readFileSync(path.join(upDir, name)), { contentType: type, upsert: true, cacheControl: '2592000' });
    if (error) { console.error('upload', name, error.message); process.exit(1); }
    urlMap['/uploads/' + name] = sb.storage.from('media').getPublicUrl(dest).data.publicUrl;
  }
  console.log(`✓ ${Object.keys(urlMap).length} зураг`);
}
// "/uploads/x.png" холбоосуудыг шинэ URL-ээр солих
const fix = v => JSON.parse(JSON.stringify(v ?? null).replace(/\/uploads\/[\w.-]+/g, m => urlMap[m] || m));

/* 2. Аяллууд */
const tours = fix(read('tours.json', null) || SEED);
const tourRows = tours.map((t, i) => ({
  slug: t.slug, active: t.active !== false, sort_order: t.order ?? i, type: t.type, countries: t.countries || [], code: t.code || '',
  to_city: t.to ?? '', img: t.img || '', title: t.title, sub: t.sub ?? '', when_text: t.when ?? '', days: t.days ?? '',
  departures: (t.departures || []).filter(Boolean), end_date: t.end || null, seats: t.seats ?? null,
  prices: (t.prices || []).map(p => Array.isArray(p) ? { k: p[0], v: p[1] } : p), phones: t.phones || [],
  hl: t.hl || [], program: t.program || [], included: t.included || [], excluded: t.excluded || [], suitable: t.suitable || [], gallery: t.gallery || []
}));
const savedTours = must(await sb.from('tours').upsert(tourRows, { onConflict: 'slug' }).select('id, slug'), 'tours');
const idBySlug = Object.fromEntries(savedTours.map(t => [t.slug, t.id]));
console.log(`✓ ${savedTours.length} аялал`);

/* 3. Блог */
const posts = fix(read('posts.json', []));
if (posts.length) {
  const rows = posts.map(p => ({ slug: p.slug, title: p.title, excerpt: p.excerpt ?? '', body: p.body ?? '', cover: p.cover || '', images: p.images || [], date: p.date, published: p.published !== false }));
  must(await sb.from('posts').upsert(rows, { onConflict: 'slug' }), 'posts');
}
console.log(`✓ ${posts.length} нийтлэл`);

/* 4. Бүртгэлүүд */
const regs = read('registrations.json', []);
if (regs.length) {
  const rows = regs.map(r => ({
    id: r.id, created_at: r.createdAt, tour_id: idBySlug[r.tourSlug] || null, tour_slug: r.tourSlug, tour_title: r.tourTitle || '',
    departure: r.departure || null, contact: r.contact, travellers: r.travellers, room: r.room || '', reasons: r.reasons || [], note: r.note || '', status: r.status || 'new'
  }));
  must(await sb.from('registrations').upsert(rows, { onConflict: 'id' }), 'registrations');
}
console.log(`✓ ${regs.length} бүртгэл`);
console.log('Дууслаа.');
