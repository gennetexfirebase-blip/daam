-- DA.am World: аялал, бүртгэл, блог, сайтын тохиргоо, зураг

create extension if not exists pgcrypto;

/* ---------- Админ ---------- */
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins: read own row" on public.admins for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

/* ---------- Аяллууд ---------- */
create table public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  active boolean not null default true,
  sort_order integer not null default 0,
  type text not null default 'leisure' check (type in ('leisure','cruise','health','business','free')),
  countries text[] not null default '{}',
  code text not null default '',
  to_city jsonb not null default '""',
  img text not null default '',
  title jsonb not null,
  sub jsonb not null default '""',
  when_text jsonb not null default '""',
  days jsonb not null default '""',
  departures date[] not null default '{}',
  end_date date,
  seats integer check (seats is null or seats >= 0),
  booked integer not null default 0,
  prices jsonb not null default '[]',
  phones text[] not null default '{}',
  hl jsonb not null default '[]',
  program jsonb not null default '[]',
  included jsonb not null default '[]',
  excluded jsonb not null default '[]',
  suitable jsonb not null default '[]',
  gallery text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tours_sort_idx on public.tours (sort_order);
create trigger tours_touch before update on public.tours for each row execute function public.touch_updated_at();

alter table public.tours enable row level security;
create policy "tours: public read active" on public.tours for select using (active or public.is_admin());
create policy "tours: admin insert" on public.tours for insert to authenticated with check (public.is_admin());
create policy "tours: admin update" on public.tours for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tours: admin delete" on public.tours for delete to authenticated using (public.is_admin());

-- Дарааллыг нэг дор хадгалах
create or replace function public.reorder_tours(ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.tours t set sort_order = x.ord - 1
  from unnest(ids) with ordinality as x(id, ord) where t.id = x.id;
end $$;
revoke all on function public.reorder_tours(uuid[]) from public, anon;
grant execute on function public.reorder_tours(uuid[]) to authenticated;

/* ---------- Бүртгэл ---------- */
create table public.registrations (
  id text primary key default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now(),
  tour_id uuid references public.tours(id) on delete set null,
  tour_slug text not null,
  tour_title text not null default '',
  departure date,
  contact jsonb not null,
  travellers jsonb not null,
  room text not null default '',
  reasons text[] not null default '{}',
  note text not null default '',
  status text not null default 'new' check (status in ('new','confirmed','cancelled')),
  ip text
);
create index registrations_created_idx on public.registrations (created_at desc);
create index registrations_ip_idx on public.registrations (ip, created_at);

alter table public.registrations enable row level security;
create policy "registrations: admin read" on public.registrations for select to authenticated using (public.is_admin());
create policy "registrations: admin update" on public.registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "registrations: admin delete" on public.registrations for delete to authenticated using (public.is_admin());
-- Шууд insert хийх эрхгүй: зөвхөн submit_registration() функцээр

-- Аяллын захиалсан суудлыг автоматаар тоолох
create or replace function public.refresh_booked(p_tour uuid) returns void
language sql security definer set search_path = public as $$
  update public.tours set booked = coalesce((
    select sum(jsonb_array_length(r.travellers)) from public.registrations r
    where r.tour_id = p_tour and r.status <> 'cancelled'), 0)
  where id = p_tour;
$$;
revoke all on function public.refresh_booked(uuid) from public, anon, authenticated;

create or replace function public.registrations_booked_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.tour_id is not null then perform public.refresh_booked(old.tour_id); end if;
  if tg_op in ('INSERT','UPDATE') and new.tour_id is not null then perform public.refresh_booked(new.tour_id); end if;
  return null;
end $$;
create trigger registrations_booked after insert or update or delete on public.registrations
for each row execute function public.registrations_booked_trg();

-- Олон нийтэд нээлттэй бүртгэл илгээх функц: шалгалт, суудал, цагт 3 удаагийн хязгаар
create or replace function public.submit_registration(payload jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_tour public.tours;
  v_ip text;
  v_travellers jsonb;
  v_contact jsonb;
  v_count int;
  v_id text;
begin
  select * into v_tour from public.tours where slug = payload->>'tourSlug' and active for update;
  if not found then raise exception 'tour_not_found' using errcode = 'P0002'; end if;

  v_ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  if v_ip <> '' and (select count(*) from public.registrations where ip = v_ip and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  v_contact := jsonb_build_object(
    'name',  left(trim(coalesce(payload#>>'{contact,name}', '')), 120),
    'phone', left(trim(coalesce(payload#>>'{contact,phone}', '')), 40),
    'email', left(trim(coalesce(payload#>>'{contact,email}', '')), 120));
  if v_contact->>'name' = '' or v_contact->>'phone' = '' then raise exception 'invalid' using errcode = '22023'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'kind',      case when t->>'kind' = 'kid' then 'kid' else 'adult' end,
      'lastName',  left(trim(coalesce(t->>'lastName', '')), 80),
      'firstName', left(trim(coalesce(t->>'firstName', '')), 80),
      'gender',    case when t->>'gender' = 'f' then 'f' else 'm' end,
      'birth',     left(coalesce(t->>'birth', ''), 10),
      'register',  left(coalesce(t->>'register', ''), 12),
      'passport',  left(coalesce(t->>'passport', ''), 30))), '[]'::jsonb)
  into v_travellers
  from (select t from jsonb_array_elements(coalesce(payload->'travellers', '[]'::jsonb)) t limit 40) s
  where trim(coalesce(t->>'firstName', '')) <> '';
  v_count := jsonb_array_length(v_travellers);
  if v_count = 0 then raise exception 'invalid' using errcode = '22023'; end if;
  if v_tour.seats is not null and v_tour.booked + v_count > v_tour.seats then raise exception 'full' using errcode = 'P0001'; end if;

  insert into public.registrations (tour_id, tour_slug, tour_title, departure, contact, travellers, room, reasons, note, ip)
  values (v_tour.id, v_tour.slug, coalesce(v_tour.title->>'mn', v_tour.title #>> '{}', ''),
          nullif(payload->>'departure', '')::date, v_contact, v_travellers,
          left(coalesce(payload->>'room', ''), 20),
          coalesce((select array_agg(left(x, 20)) from (select jsonb_array_elements_text(coalesce(payload->'reasons', '[]'::jsonb)) x limit 12) r), '{}'),
          left(coalesce(payload->>'note', ''), 2000), nullif(v_ip, ''))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_registration(jsonb) from public;
grant execute on function public.submit_registration(jsonb) to anon, authenticated;

/* ---------- Блог ---------- */
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  title jsonb not null,
  excerpt jsonb not null default '""',
  body jsonb not null default '""',
  cover text not null default '',
  images text[] not null default '{}',
  date date not null default current_date,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_date_idx on public.posts (date desc);
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;
create policy "posts: public read published" on public.posts for select using (published or public.is_admin());
create policy "posts: admin insert" on public.posts for insert to authenticated with check (public.is_admin());
create policy "posts: admin update" on public.posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "posts: admin delete" on public.posts for delete to authenticated using (public.is_admin());

/* ---------- Сайтын тохиргоо (текст, зураг, утас, улс, асуулт…) ---------- */
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, content) values (1, '{}');
create trigger site_settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;
create policy "site_settings: public read" on public.site_settings for select using (true);
create policy "site_settings: admin update" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

/* ---------- Зургийн сан (Storage) ---------- */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "media: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
