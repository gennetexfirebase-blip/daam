import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { telHref, useLang, useSite, useTours } from '../store.jsx';
import { submitRegistration } from '../data.js';
import { liveDepartures, pic, seatsLeft } from '../lib.js';

const ROOMS = ['share', 'single', 'family', 'extra', 'nobed'];
const WHY = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
let uid = 0;
const blank = () => ({ key: ++uid, kind: 'adult', lastName: '', firstName: '', gender: 'm', birth: '', reg1: '', reg2: '', regNum: '', passPrefix: 'PE', passNum: '' });
const LOCALE = { mn: 'mn-MN', en: 'en-GB', zh: 'zh-CN' };
const LETTERS = 'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'.split('');
const PASS_PREFIX = ['PE', 'E'];
const todayISO = () => new Date().toISOString().slice(0, 10);

// Регистрийн 8 оронгоос төрсөн огноо, хүйсийг гаргах: ЖЖССӨӨ.. (2000 оноос хойш төрсөн бол сар +20),
// сүүлээсээ 2 дахь орон сондгой бол эр, тэгш бол эм
function fromRegister(num) {
  if (!/^\d{8}$/.test(num)) return null;
  let yy = +num.slice(0, 2), mm = +num.slice(2, 4);
  const dd = +num.slice(4, 6);
  let year = 1900 + yy;
  if (mm > 20) { mm -= 20; year = 2000 + yy; }
  const date = new Date(year, mm - 1, dd);
  if (mm < 1 || mm > 12 || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  const birth = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  return { birth, gender: +num[6] % 2 ? 'm' : 'f' };
}

// "3,490,000₮" → 3490000. Хүрээтэй үнэ ("2,390,000 – 2,990,000₮") эсвэл текст бол null
const priceNum = s => {
  const nums = String(s || '').match(/\d[\d,.\s]*/g);
  if (!nums || nums.length !== 1) return null;
  const n = Number(nums[0].replace(/[^\d]/g, ''));
  return n >= 1000 ? n : null;
};
const money = n => n.toLocaleString('en-US') + '₮';

/* Хоёр сонголттой товч (Том хүн/Хүүхэд, Эр/Эм) */
function Seg({ value, onChange, options, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

/* Регистрийн үсэг сонгох (кирилл үсгийн самбар) */
function LetterPick({ value, onChange, label, open, setOpen }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="lp" ref={ref}>
      <button type="button" className={`lp-btn${value ? ' set' : ''}`} aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>{value || '-'}</button>
      {open && <div className="lp-pop" role="listbox" aria-label={label}>
        <button type="button" onClick={() => onChange('')} aria-selected={!value}>-</button>
        {LETTERS.map(l => <button key={l} type="button" aria-selected={value === l} className={value === l ? 'on' : ''} onClick={() => onChange(l)}>{l}</button>)}
      </div>}
    </div>
  );
}

/* Регистрийн дугаар: 2 үсэг + 8 орон */
function RegisterInput({ p, set, t }) {
  const [open, setOpen] = useState(0); // 0 хаалттай, 1 эхний үсэг, 2 хоёр дахь үсэг
  const numRef = useRef(null);
  return (
    <div className="reg-in">
      <LetterPick label={t('r.regL1')} value={p.reg1} open={open === 1} setOpen={o => setOpen(o ? 1 : 0)}
        onChange={l => { set('reg1', l); setOpen(l ? 2 : 0); }} />
      <LetterPick label={t('r.regL2')} value={p.reg2} open={open === 2} setOpen={o => setOpen(o ? 2 : 0)}
        onChange={l => { set('reg2', l); setOpen(0); if (l) numRef.current?.focus(); }} />
      <input ref={numRef} inputMode="numeric" maxLength={8} placeholder="00000000" aria-label={t('r.register')}
        value={p.regNum} onChange={e => set('regNum', e.target.value.replace(/\D/g, '').slice(0, 8))} />
    </div>
  );
}

function Step({ n, title, hint, children, aside }) {
  return (
    <fieldset className="rg-step">
      <legend className="sr-only">{title}</legend>
      <div className="rg-step-h">
        <span className="num">{n}</span>
        <div><h2>{title}{aside}</h2>{hint && <p>{hint}</p>}</div>
      </div>
      {children}
    </fieldset>
  );
}

/* Аялалд бүртгүүлэх: /register/:slug */
export default function Register() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { t, T, lang } = useLang();
  const { tours, reload } = useTours();
  const site = useSite();
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [people, setPeople] = useState([blank()]);
  const [room, setRoom] = useState('share');
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');
  const [dep, setDep] = useState(params.get('d') || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  if (!tours) return <div className="wrap tp-msg">{t('t.loading')}</div>;
  const x = tours.find(p => p.slug === slug);
  if (!x) return <div className="wrap tp-msg">{t('t.notfound')} <Link className="link" to="/package">{t('nav.packages')}</Link></div>;
  const deps = liveDepartures(x);
  const left = seatsLeft(x);
  const closed = !deps.length || left === 0;
  const depVal = deps.includes(dep) ? dep : deps[0] || '';

  const setP = (i, k, v) => setPeople(ps => ps.map((p, n) => {
    if (n !== i) return p;
    const next = { ...p, [k]: v };
    if (k === 'regNum') { const r = fromRegister(v); if (r) Object.assign(next, r); }
    return next;
  }));
  const toggleWhy = w => setReasons(r => r.includes(w) ? r.filter(z => z !== w) : [...r, w]);

  /* Үнийн тооцоо */
  const adults = people.filter(p => p.kind === 'adult').length;
  const kids = people.length - adults;
  const priceOf = k => priceNum(T(x.prices?.find(p => p.k === k)?.v));
  const adultPrice = priceOf('adult') ?? priceOf('p') ?? priceOf('s4');
  const kidPrice = priceOf('kid') ?? adultPrice;
  const total = adultPrice ? adults * adultPrice + kids * kidPrice : null;

  const depParts = d => {
    const date = new Date(d + 'T00:00:00');
    if (lang === 'mn') return {
      day: date.getDate(), year: date.getFullYear(),
      month: `${date.getMonth() + 1}-р сар`,
      wd: ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'][date.getDay()]
    };
    const loc = LOCALE[lang];
    return {
      day: date.getDate(), year: date.getFullYear(),
      month: date.toLocaleDateString(loc, { month: 'long' }),
      wd: date.toLocaleDateString(loc, { weekday: 'short' })
    };
  };

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const id = await submitRegistration({ tourSlug: x.slug, departure: depVal, contact, travellers: people.map(({ key, reg1, reg2, regNum, passPrefix, passNum, ...p }) => ({ ...p, register: regNum ? (reg1 || '') + (reg2 || '') + regNum : '', passport: passNum ? passPrefix + passNum : '' })), room, reasons, note });
      setDone(id); reload(); scrollTo(0, 0);
    } catch (ex) {
      setErr(ex.code === 'rate_limited' ? t('r.limit') : ex.code === 'full' ? t('t.full') : t('r.err'));
    } finally { setBusy(false); }
  };

  const summary = (
    <aside className="tp-side">
      <div className="tp-card rg-sum">
        <div className="rg-im" style={{ backgroundImage: pic(x.img, tours.indexOf(x), 800) }} />
        <h3><Link to={`/tour/${x.slug}`}>{T(x.title)}</Link></h3>
        {T(x.days) && <p className="muted">{T(x.days)}</p>}
        {!done && !closed && <>
          <dl className="rg-lines">
            {depVal && <div><dt>{t('r.dep')}</dt><dd>{(p => lang === 'en' ? `${p.day} ${p.month} ${p.year}` : lang === 'zh' ? `${p.year}年${p.month}${p.day}日` : `${p.year} оны ${p.month}ын ${p.day}`)(depParts(depVal))}</dd></div>}
            <div><dt>{t('price.adult')}</dt><dd>{adults}{adultPrice ? ` × ${money(adultPrice)}` : ''}</dd></div>
            {kids > 0 && <div><dt>{t('price.kid')}</dt><dd>{kids}{kidPrice ? ` × ${money(kidPrice)}` : ''}</dd></div>}
            <div><dt>{t('r.room')}</dt><dd>{t('r.room.' + room)}</dd></div>
          </dl>
          {total
            ? <div className="rg-total"><span>{t('r.est')}</span><b>{money(total)}</b></div>
            : <div className="rg-total"><span>{t('price.p')}</span><b>{t('price.ask')}</b></div>}
          <p className="note">{t('r.estNote')}</p>
          <button className="btn rg-submit" form="rgForm" disabled={busy}>{busy ? t('r.sending') : t('r.submit')}</button>
          {err && <p className="rg-err" role="alert">{err}</p>}
        </>}
      </div>
    </aside>
  );

  if (done) return (
    <section className="sec"><div className="wrap tp-body">
      <div className="tp-main rg-done">
        <div className="ok">✓</div>
        <h1>{t('r.done')}</h1>
        <p>{t('r.doneText', { id: done })}</p>
        <div className="actions"><Link className="btn" to={`/tour/${x.slug}`}>{t('t.back')}</Link><a className="btn line" href={telHref(site.phone)}>{site.phone}</a></div>
      </div>
      {summary}
    </div></section>
  );

  return (
    <section className="sec rg">
      <div className="wrap">
        <Link to={`/tour/${x.slug}`} className="tp-back dark">← {T(x.title)}</Link>
        <h1 className="rg-title">{t('r.title')}</h1>
      </div>
      <div className="wrap tp-body">
        {closed ? <div className="tp-main"><p className="rg-closed">{t('r.closed')} <a className="link" href={telHref(site.phone)}>{site.phone}</a></p></div> :
          <form id="rgForm" className="tp-main rg-form" onSubmit={submit}>
            <Step n={1} title={t('r.dep')} hint={t('r.dep.h')}>
              <div className="dep-pick">
                {deps.map(d => {
                  const p = depParts(d);
                  return (
                    <label key={d} className="dep-opt">
                      <input type="radio" name="dep" checked={depVal === d} onChange={() => setDep(d)} />
                      <span><small>{p.wd}</small><b>{p.day}</b><em>{p.month} {p.year}</em></span>
                    </label>
                  );
                })}
              </div>
            </Step>

            <Step n={2} title={t('r.contact')} hint={t('r.contact.h')}>
              <div className="fgrid">
                <label>{t('r.name')} *<input required value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} autoComplete="name" /></label>
                <label>{t('r.phone')} *<input required type="tel" inputMode="tel" pattern={'[\\d\\s+\\-]{8,}'} placeholder={t('r.phonePh')} value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} autoComplete="tel" /></label>
                <label><span>{t('r.email')} <small>({t('r.optional')})</small></span><input type="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} autoComplete="email" /></label>
              </div>
            </Step>

            <Step n={3} title={t('r.travellers')} hint={t('r.trav.h')} aside={<span className="cnt">{people.length}</span>}>
              {people.map((p, i) => (
                <div className="person" key={p.key}>
                  <div className="person-h">
                    <b>{t('r.traveller', { n: i + 1 })}</b>
                    <Seg label={t('r.ttype')} value={p.kind} onChange={v => setP(i, 'kind', v)} options={[['adult', t('price.adult')], ['kid', t('price.kid')]]} />
                    {people.length > 1 && <button type="button" className="rm" onClick={() => setPeople(ps => ps.filter((_, n) => n !== i))}>{t('r.remove')}</button>}
                  </div>
                  <div className="fgrid">
                    <label>{t('r.last')}<input value={p.lastName} onChange={e => setP(i, 'lastName', e.target.value)} autoComplete={i === 0 ? 'family-name' : 'off'} /></label>
                    <label>{t('r.first')} *<input required value={p.firstName} onChange={e => setP(i, 'firstName', e.target.value)} autoComplete={i === 0 ? 'given-name' : 'off'} /></label>
                    <div className="fld"><span>{t('r.gender')}</span><Seg label={t('r.gender')} value={p.gender} onChange={v => setP(i, 'gender', v)} options={[['m', t('r.male')], ['f', t('r.female')]]} /></div>
                    <div className="fld wide"><span>{t('r.register')}</span><RegisterInput p={p} set={(k, v) => setP(i, k, v)} t={t} /></div>
                    <label>{t('r.birth')}<input type="date" max={todayISO()} min="1920-01-01" value={p.birth} onChange={e => setP(i, 'birth', e.target.value)} /></label>
                    <div className="fld wide"><span>{t('r.passport')}</span>
                      <div className="pass-in">
                        <select aria-label={t('r.passPrefix')} value={p.passPrefix} onChange={e => setP(i, 'passPrefix', e.target.value)}>
                          {PASS_PREFIX.map(x => <option key={x} value={x}>{x}</option>)}
                        </select>
                        <input inputMode="numeric" placeholder="00000000" aria-label={t('r.passport')} value={p.passNum}
                          onChange={e => setP(i, 'passNum', e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12))} autoComplete="off" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(left == null || people.length < left) && <button type="button" className="add-person" onClick={() => setPeople(ps => [...ps, blank()])}>{t('r.add')}</button>}
            </Step>

            <Step n={4} title={t('r.room')} hint={t('r.room.h')}>
              <div className="room-pick">
                {ROOMS.map(r => <label key={r} className="room-opt"><input type="radio" name="room" checked={room === r} onChange={() => setRoom(r)} /><span>{t('r.room.' + r)}</span></label>)}
              </div>
            </Step>

            <Step n={5} title={t('r.extra')} aside={<small className="opt">({t('r.optional')})</small>}>
              <p className="sub-l">{t('r.why')}</p>
              <div className="chips">
                {WHY.map(w => <label key={w} className="chip"><input type="checkbox" checked={reasons.includes(w)} onChange={() => toggleWhy(w)} /><span>{t('why.' + w)}</span></label>)}
              </div>
              <p className="sub-l">{t('r.note')}</p>
              <textarea rows="3" placeholder={t('r.notePh')} value={note} onChange={e => setNote(e.target.value)} />
            </Step>

            {err && <p className="rg-err" role="alert">{err}</p>}
            <button className="btn rg-submit rg-submit-main" disabled={busy}>{busy ? t('r.sending') : t('r.submit')}{total ? ` · ${money(total)}` : ''}</button>
            <p className="rg-secure">🔒 {t('r.secure')}</p>
          </form>}
        {summary}
      </div>
    </section>
  );
}
