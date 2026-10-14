import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { telHref, useLang, useSite, useTours } from '../store.jsx';
import { submitRegistration } from '../data.js';
import { liveDepartures, pic, seatsLeft } from '../lib.js';
import { I18N } from '../i18n.js';

const ROOMS = ['share', 'single', 'family', 'extra', 'nobed'];
const WHY = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
// Бидэнд мэдэгдэх зүйлс: 1 = чагтлахад тайлбар бичих талбар гарна
const NEEDS = [['health', 1], ['allergy', 1], ['diet', 1], ['mobility', 1], ['kids', 1], ['seat', 1], ['visa', 1], ['first', 0]];
// Өрөөний сонголтын зураг: хажуугаас харсан ор, аялагчид
function Bed({ x, w, heads = [], kid }) {
  const y = 26;
  return (
    <g>
      <rect className="fr" x={x} y={y - 12} width="3.2" height="25" rx="1.4" />
      <rect className="fr" x={x + w - 2.6} y={y - 2} width="2.6" height="15" rx="1.2" />
      <rect className="mt" x={x + 2} y={y + 1} width={w - 3} height="7" rx="2" />
      <rect className="pl" x={x + 3.5} y={y - 2.6} width="9" height="4.6" rx="2.2" />
      {heads.map((h, i) => <circle key={i} className={h < 3 ? 'hd kid' : 'hd'} cx={x + 8 + i * 8} cy={y - 4.6 - (i % 2) * 1.2} r={h} />)}
      <path className="bl" d={`M${x + 12} ${y - 1.5} h${w - 14.6} a2 2 0 0 1 2 2 v8 h-${w - 12.6} z`} />
      <rect className="fr" x={x} y={y + 8} width={w} height="2.6" rx="1.2" />
      {kid && <circle className="hd kid" cx={x + 8} cy={y - 10} r="2.4" />}
    </g>
  );
}
const scene = children => <svg viewBox="0 0 80 44" aria-hidden="true">{children}</svg>;
const ROOM_ICONS = {
  share: scene(<><Bed x={4} w={34} heads={[3.4]} /><Bed x={42} w={34} heads={[3.4]} /></>),
  single: scene(<Bed x={16} w={48} heads={[3.4]} />),
  family: scene(<Bed x={8} w={64} heads={[3.4, 3.4, 2.5]} />),
  extra: scene(<><Bed x={2} w={48} heads={[3.4, 3.4]} /><Bed x={54} w={24} heads={[2.6]} /><g className="plus"><circle cx="70" cy="9" r="6" /><path d="M70 6v6M67 9h6" /></g></>),
  nobed: scene(<><Bed x={10} w={50} heads={[3.4, 2.5]} /><g className="nobed"><rect x="63" y="20" width="13" height="8" rx="2" /><path d="M61 32 78 16" /></g></>)
};

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
  const [needs, setNeeds] = useState({}); // түлхүүр → тайлбар
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
  const toggleNeed = k => setNeeds(n => { const x = { ...n }; if (k in x) delete x[k]; else x[k] = ''; return x; });
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

  // Чагталсан зүйлсийг админд ойлгомжтой (монголоор) тайлбарын эхэнд нэмнэ
  const fullNote = () => {
    const lines = NEEDS.filter(([k]) => k in needs).map(([k]) => '• ' + I18N.mn['need.' + k] + (needs[k].trim() ? ': ' + needs[k].trim() : ''));
    return [lines.join('\n'), note.trim()].filter(Boolean).join('\n\n');
  };

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const id = await submitRegistration({ tourSlug: x.slug, departure: depVal, contact, travellers: people.map(({ key, reg1, reg2, regNum, passPrefix, passNum, ...p }) => ({ ...p, register: regNum ? (reg1 || '') + (reg2 || '') + regNum : '', passport: passNum ? passPrefix + passNum : '' })), room, reasons, note: fullNote() });
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
              <div className="room-pick" role="radiogroup" aria-label={t('r.room')}>
                {ROOMS.map(r => (
                  <label key={r} className="room-opt">
                    <input type="radio" name="room" checked={room === r} onChange={() => setRoom(r)} />
                    <span className="room-card">
                      <span className="room-ic">{ROOM_ICONS[r]}</span>
                      <span className="room-tx"><b>{t('r.room.' + r)}</b><small>{t('r.room.' + r + '.d')}</small></span>
                      <span className="room-ck" aria-hidden="true" />
                    </span>
                  </label>
                ))}
              </div>
            </Step>

            <Step n={5} title={t('r.extra')} aside={<small className="opt">({t('r.optional')})</small>}>
              <div className="extra-q">
                <div className="extra-h">
                  <b>{t('r.why')}</b>
                  {reasons.length > 0 && <span className="picked">{t('r.picked', { n: reasons.length })}</span>}
                </div>
                <p>{t('r.why.h')}</p>
                <div className="chips why">
                  {WHY.map(w => <label key={w} className="chip"><input type="checkbox" checked={reasons.includes(w)} onChange={() => toggleWhy(w)} /><span>{t('why.' + w)}</span></label>)}
                </div>
              </div>
              <div className="extra-q">
                <div className="extra-h">
                  <b>{t('r.needs')}</b>
                  {Object.keys(needs).length > 0 && <span className="picked">{t('r.picked', { n: Object.keys(needs).length })}</span>}
                </div>
                <p>{t('r.needs.h')}</p>
                <div className="needs">
                  {NEEDS.map(([k, detail]) => {
                    const on = k in needs;
                    return (
                      <div key={k} className={`need${on ? ' on' : ''}`}>
                        <label className="need-h">
                          <input type="checkbox" checked={on} onChange={() => toggleNeed(k)} />
                          <span className="box" aria-hidden="true" />
                          <span>{t('need.' + k)}</span>
                        </label>
                        {on && detail ? <input className="need-in" autoFocus maxLength={200} placeholder={t('need.' + k + '.ph')} aria-label={t('need.' + k)}
                          value={needs[k]} onChange={e => setNeeds(n => ({ ...n, [k]: e.target.value }))} /> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="extra-q">
                <div className="extra-h"><label htmlFor="rgNote"><b>{t('r.noteMore')}</b></label></div>
                <textarea id="rgNote" rows="3" maxLength={1200} placeholder={t('r.notePh')} value={note} onChange={e => setNote(e.target.value)} />
                <span className="chars">{t('r.chars', { n: note.length, max: 1200 })}</span>
              </div>
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
