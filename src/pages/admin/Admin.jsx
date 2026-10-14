import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useSite, useTours } from '../../store.jsx';
import { adminSignIn, adminSignOut, deleteRegistration, deleteTour, isAdmin, listRegistrations, listTours, reorderTours, sb, setRegistrationStatus, setTourActive } from '../../data.js';
import { fmtDate, isUpcoming, liveDepartures, pic } from '../../lib.js';
import { I18N } from '../../i18n.js';
import { Logo, Wordmark } from '../../components/Layout.jsx';
import TourEditor from './TourEditor.jsx';
import { PostEditor, PostsList } from './BlogAdmin.jsx';
import SiteEditor from './SiteEditor.jsx';
import '../../admin.css';

const mn = k => I18N.mn[k] || k;
const Tm = v => v == null ? '' : typeof v === 'string' ? v : (v.mn || v.en || '');
// Нэвтрэлт дууссан бол гаргана, бусад алдааг харуулна
export const failWith = onAuthFail => e => (e?.code === 'PGRST301' || /jwt/i.test(e?.message || '')) ? onAuthFail() : alert('Алдаа: ' + (e?.message || e));

/* ---------- Нэвтрэх ---------- */
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await adminSignIn(email.trim(), pw); onLogin(); }
    catch (ex) { setErr(ex.code === 'not_admin' ? 'Энэ хэрэглэгч админ эрхгүй байна.' : /invalid login/i.test(ex.message) ? 'Имэйл эсвэл нууц үг буруу байна.' : 'Алдаа: ' + ex.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="adm-login">
      <form onSubmit={submit}>
        <div className="adm-brand"><Logo /><Wordmark /></div>
        <h1>Админ</h1>
        <label>Имэйл<input type="email" autoFocus required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Нууц үг<input type="password" required autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></label>
        {err && <p className="adm-err">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Түр хүлээнэ үү…' : 'Нэвтрэх'}</button>
        <Link to="/" className="adm-muted">← Сайт руу буцах</Link>
      </form>
    </div>
  );
}

/* ---------- Аяллын жагсаалт ---------- */
function ToursList({ onAuthFail }) {
  const site = useSite();
  const fail = failWith(onAuthFail);
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const { reload } = useTours();
  const load = useCallback(() => listTours().then(setList).catch(fail), []);
  useEffect(() => { load(); }, [load]);

  const setActive = async (x, active) => {
    await setTourActive(x.id, active).catch(fail);
    load(); reload();
  };
  const remove = async x => {
    if (!confirm(`"${Tm(x.title)}" аяллыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    await deleteTour(x.id).catch(fail);
    load(); reload();
  };
  const move = async (i, dir) => {
    const ids = list.map(x => x.id);
    const j = i + dir; if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setList(ids.map(id => list.find(x => x.id === id)));
    await reorderTours(ids).catch(fail);
    reload();
  };

  if (!list) return <p className="adm-muted">Ачаалж байна…</p>;
  const shown = list.filter(x => (filter === 'all' || (filter === 'up' ? isUpcoming(x) : filter === 'hidden' ? !x.active : !isUpcoming(x)))
    && (!q || JSON.stringify([x.title, x.sub, x.to]).toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <div className="adm-bar">
        <h2>Аяллууд <small>{list.length}</small></h2>
        <div className="adm-tools">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Бүгд</option><option value="up">Гарах огноотой</option><option value="past">Өмнөх</option><option value="hidden">Нуусан</option>
          </select>
          <input type="search" placeholder="Хайх…" value={q} onChange={e => setQ(e.target.value)} />
          <Link className="btn" to="/admin/tour/new">+ Шинэ аялал</Link>
        </div>
      </div>
      <div className="adm-table">
        {shown.map(x => {
          const i = list.indexOf(x);
          const deps = liveDepartures(x);
          return (
            <div className={`adm-row${x.active ? '' : ' off'}`} key={x.id}>
              <div className="ord">
                <button type="button" title="Дээш" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                <button type="button" title="Доош" disabled={i === list.length - 1} onClick={() => move(i, 1)}>▼</button>
              </div>
              <div className="th" style={{ backgroundImage: pic(x.img, i, 300) }} />
              <div className="info">
                <Link to={'/admin/tour/' + x.id}><b>{Tm(x.title)}</b></Link>
                <span>{mn('type.' + x.type)} · {x.countries.map(c => Tm(site.countryName(c))).join(', ')}{Tm(x.days) && ' · ' + Tm(x.days)}</span>
                <span>{deps.length ? <em className="up">Гарах: {deps.map(d => fmtDate(d, 'mn')).join(', ')}</em> : (Tm(x.when) || '—')}{x.seats ? ` · Суудал ${x.booked || 0}/${x.seats}` : ''}</span>
              </div>
              <div className="acts">
                <label className="sw" title="Сайт дээр харуулах"><input type="checkbox" checked={x.active} onChange={e => setActive(x, e.target.checked)} /><span>{x.active ? 'Харагдана' : 'Нуусан'}</span></label>
                <a className="btn ghost sm" href={'/tour/' + x.slug} target="_blank" rel="noopener">Үзэх</a>
                <Link className="btn ghost sm" to={'/admin/tour/' + x.id}>Засах</Link>
                <button type="button" className="btn ghost sm danger" onClick={() => remove(x)}>Устгах</button>
              </div>
            </div>
          );
        })}
        {!shown.length && <p className="adm-muted">Аялал олдсонгүй.</p>}
      </div>
    </>
  );
}

/* ---------- Бүртгэлүүд ---------- */
const STATUS = { new: 'Шинэ', confirmed: 'Баталгаажсан', cancelled: 'Цуцалсан' };
function Registrations({ onAuthFail }) {
  const fail = failWith(onAuthFail);
  const [list, setList] = useState(null);
  const [tour, setTour] = useState('');
  const [open, setOpen] = useState(null);
  const load = useCallback(() => listRegistrations().then(setList).catch(fail), []);
  useEffect(() => { load(); }, [load]);

  if (!list) return <p className="adm-muted">Ачаалж байна…</p>;
  const tours = [...new Map(list.map(r => [r.tourSlug, r.tourTitle])).entries()];
  const shown = list.filter(r => !tour || r.tourSlug === tour);
  const setStatus = async (r, status) => { await setRegistrationStatus(r.id, status).catch(fail); load(); };
  const del = async r => { if (!confirm(`#${r.id} бүртгэлийг устгах уу?`)) return; await deleteRegistration(r.id).catch(fail); load(); };

  const csv = () => {
    const rows = [['Дугаар', 'Огноо', 'Аялал', 'Гарах өдөр', 'Төлөв', 'Холбоо барих', 'Утас', 'Имэйл', 'Төрөл', 'Овог', 'Нэр', 'Хүйс', 'Төрсөн', 'Регистр', 'Паспорт', 'Өрөө', 'Тайлбар']];
    shown.forEach(r => r.travellers.forEach(p => rows.push([r.id, r.createdAt.slice(0, 16).replace('T', ' '), r.tourTitle, r.departure, STATUS[r.status], r.contact.name, r.contact.phone, r.contact.email,
      p.kind === 'kid' ? 'Хүүхэд' : 'Том хүн', p.lastName, p.firstName, p.gender === 'f' ? 'Эм' : 'Эр', p.birth, p.register, p.passport, mn('r.room.' + r.room), r.note])));
    const text = '﻿' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = `burtgel-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <>
      <div className="adm-bar">
        <h2>Бүртгэлүүд <small>{shown.length} · {shown.reduce((n, r) => n + r.travellers.length, 0)} аялагч</small></h2>
        <div className="adm-tools">
          <select value={tour} onChange={e => setTour(e.target.value)}>
            <option value="">Бүх аялал</option>
            {tours.map(([s, title]) => <option key={s} value={s}>{title}</option>)}
          </select>
          <button type="button" className="btn ghost" onClick={csv} disabled={!shown.length}>Excel (CSV) татах</button>
        </div>
      </div>
      <div className="adm-table">
        {shown.map(r => (
          <div className={`adm-reg st-${r.status}`} key={r.id}>
            <button type="button" className="head" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
              <code>#{r.id}</code>
              <span><b>{r.contact.name}</b> · {r.contact.phone}</span>
              <span className="t">{r.tourTitle}{r.departure && ' · ' + r.departure}</span>
              <span>{r.travellers.length} хүн</span>
              <span className="badge">{STATUS[r.status]}</span>
              <span className="adm-muted">{new Date(r.createdAt).toLocaleString('mn-MN')}</span>
            </button>
            {open === r.id && <div className="body">
              <table>
                <thead><tr><th>#</th><th>Төрөл</th><th>Овог</th><th>Нэр</th><th>Хүйс</th><th>Төрсөн</th><th>Регистр</th><th>Паспорт</th></tr></thead>
                <tbody>{r.travellers.map((p, i) => <tr key={i}><td>{i + 1}</td><td>{p.kind === 'kid' ? 'Хүүхэд' : 'Том хүн'}</td><td>{p.lastName}</td><td>{p.firstName}</td><td>{p.gender === 'f' ? 'Эм' : 'Эр'}</td><td>{p.birth}</td><td>{p.register}</td><td>{p.passport}</td></tr>)}</tbody>
              </table>
              <p><b>Өрөө:</b> {mn('r.room.' + r.room)} {r.contact.email && <> · <b>Имэйл:</b> {r.contact.email}</>}</p>
              {r.reasons?.length > 0 && <p><b>Сонгосон шалтгаан:</b> {r.reasons.map(w => mn('why.' + w)).join(', ')}</p>}
              {r.note && <p><b>Тайлбар:</b> {r.note}</p>}
              <div className="acts">
                {Object.entries(STATUS).map(([k, v]) => <button key={k} type="button" className={`btn sm ${r.status === k ? '' : 'ghost'}`} onClick={() => setStatus(r, k)}>{v}</button>)}
                <a className="btn ghost sm" href={'tel:' + String(r.contact.phone).replace(/[^\d+]/g, '')}>Залгах</a>
                <button type="button" className="btn ghost sm danger" onClick={() => del(r)}>Устгах</button>
              </div>
            </div>}
          </div>
        ))}
        {!shown.length && <p className="adm-muted">Бүртгэл алга байна.</p>}
      </div>
    </>
  );
}

function EditRoute({ onAuthFail }) {
  const { id } = useParams();
  return <TourEditor key={id} id={id} onAuthFail={onAuthFail} />;
}
function PostRoute({ onAuthFail }) {
  const { id } = useParams();
  return <PostEditor key={id} id={id} onAuthFail={onAuthFail} />;
}

/* ---------- Админ ---------- */
export default function Admin() {
  const [state, setState] = useState('loading'); // loading | out | in
  const nav = useNavigate();
  useEffect(() => { document.title = 'Админ — DA.am World'; document.documentElement.lang = 'mn'; }, []);
  useEffect(() => {
    const check = async session => setState(session && await isAdmin(session.user.id) ? 'in' : 'out');
    sb.auth.getSession().then(({ data }) => check(data.session));
    const { data } = sb.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_OUT') setState('out'); else if (ev === 'SIGNED_IN') check(session); });
    return () => data.subscription.unsubscribe();
  }, []);
  const logout = async () => { await adminSignOut(); setState('out'); nav('/admin'); };

  if (state === 'loading') return <div className="adm-login"><p style={{ color: '#fff' }}>Ачаалж байна…</p></div>;
  if (state === 'out') return <Login onLogin={() => setState('in')} />;
  const props = { onAuthFail: logout };
  return (
    <div className="adm">
      <header className="adm-top">
        <Link to="/admin" className="adm-brand"><Logo /><Wordmark /><em>Админ</em></Link>
        <nav>
          <Link to="/admin">Аяллууд</Link>
          <Link to="/admin/registrations">Бүртгэлүүд</Link>
          <Link to="/admin/blog">Блог</Link>
          <Link to="/admin/site">Сайтын агуулга</Link>
          <a href="/" target="_blank" rel="noopener">Сайт үзэх ↗</a>
        </nav>
        <button type="button" className="btn ghost sm" onClick={logout}>Гарах</button>
      </header>
      <main className="adm-main">
        <Routes>
          <Route index element={<ToursList {...props} />} />
          <Route path="registrations" element={<Registrations {...props} />} />
          <Route path="tour/:id" element={<EditRoute {...props} />} />
          <Route path="blog" element={<PostsList {...props} />} />
          <Route path="post/:id" element={<PostRoute {...props} />} />
          <Route path="site" element={<SiteEditor {...props} />} />
        </Routes>
      </main>
    </div>
  );
}
