import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSite, useTours } from '../../store.jsx';
import { listTours, saveTour, uploadImages } from '../../data.js';
import { PRICE_KEYS, TYPES, pic } from '../../lib.js';
import { I18N } from '../../i18n.js';

const mn = k => I18N.mn[k] || k;

// Зураг оруулах: амжилтгүй бол анхааруулж null буцаана
export async function uploadOrAlert(files) {
  try { return await uploadImages([...files]); }
  catch (e) {
    alert(e.message === 'bad_type' || e.message === 'too_big' ? 'Зөвхөн jpg, png, webp, gif зураг, 8MB хүртэл.' : 'Зураг оруулж чадсангүй: ' + e.message);
    return null;
  }
}
export const toL = v => v == null ? { mn: '', en: '', zh: '' } : typeof v === 'string' ? { mn: v, en: '', zh: '' } : { mn: v.mn || '', en: v.en || '', zh: v.zh || '' };

const EMPTY = {
  title: '', sub: '', to: '', type: 'leisure', countries: ['cn'], code: '', img: '', days: '', when: '',
  departures: [], end: '', seats: null, prices: [{ k: 'adult', v: '' }, { k: 'kid', v: '' }], phones: [],
  hl: [], program: [], included: [], excluded: [], suitable: [], gallery: [], active: true
};

/* Монгол / Англи / Хятад гурван хэлээр оруулах талбар */
export function LInput({ label, value, onChange, area, required, hint, rows }) {
  const v = toL(value);
  const [more, setMore] = useState(!!(v.en || v.zh));
  const Tag = area ? 'textarea' : 'input';
  const set = (l, x) => onChange({ ...v, [l]: x });
  return (
    <div className="lf">
      {label && <span className="lbl">{label}{required && ' *'}{hint && <small> {hint}</small>}</span>}
      <div className="lrow">
        <span className="lk">МН</span><Tag rows={area ? (rows || 4) : undefined} required={required} value={v.mn} onChange={e => set('mn', e.target.value)} />
        <button type="button" className="lmore" onClick={() => setMore(m => !m)} title="Англи, хятад орчуулга">{more ? '−' : 'EN/中'}</button>
      </div>
      {more && <>
        <div className="lrow"><span className="lk">EN</span><Tag rows={area ? (rows || 3) : undefined} value={v.en} onChange={e => set('en', e.target.value)} placeholder="Хоосон бол монголоор харагдана" /></div>
        <div className="lrow"><span className="lk">中文</span><Tag rows={area ? (rows || 3) : undefined} value={v.zh} onChange={e => set('zh', e.target.value)} placeholder="Хоосон бол монголоор харагдана" /></div>
      </>}
    </div>
  );
}

/* Мөрүүдийн жагсаалт (онцлох, багтсан, багтаагүй…) */
function LList({ label, items, onChange, addText = '+ Нэмэх' }) {
  const set = (i, v) => onChange(items.map((x, n) => n === i ? v : x));
  return (
    <div className="ed-block">
      <h3>{label}</h3>
      {items.map((it, i) => (
        <div className="li" key={i}>
          <LInput value={it} onChange={v => set(i, v)} />
          <button type="button" className="x" title="Хасах" onClick={() => onChange(items.filter((_, n) => n !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="btn ghost sm" onClick={() => onChange([...items, toL('')])}>{addText}</button>
    </div>
  );
}

export default function TourEditor({ id, onAuthFail }) {
  const site = useSite();
  const isNew = id === 'new';
  const nav = useNavigate();
  const { reload } = useTours();
  const [f, setF] = useState(isNew ? EMPTY : null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (isNew) return;
    listTours().then(list => {
      const x = list.find(t => t.id === id);
      if (!x) return setMsg('Аялал олдсонгүй.');
      setF(x);
    }).catch(e => setMsg('Алдаа: ' + e.message));
  }, [id]);

  if (!f) return <p className="adm-muted">{msg || 'Ачаалж байна…'}</p>;
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const upload = async (files, multiple) => {
    setBusy(true);
    const urls = await uploadOrAlert(files);
    setBusy(false);
    return urls && (multiple ? urls : urls[0]);
  };

  const save = async e => {
    e.preventDefault();
    if (!f.countries.length) { setMsg('Дор хаяж нэг улс сонгоно уу.'); return; }
    setBusy(true); setMsg('');
    const body = {
      ...f,
      departures: [...new Set(f.departures.filter(Boolean))].sort(),
      seats: f.seats ? Number(f.seats) : null,
      phones: f.phones.filter(Boolean),
      prices: f.prices.filter(p => toL(p.v).mn)
    };
    try {
      const saved = await saveTour(body);
      reload();
      if (isNew) nav('/admin/tour/' + saved.id, { replace: true });
      else setF(saved);
      setMsg('Хадгаллаа ✓');
    } catch (ex) {
      if (ex.code === 'PGRST301') return onAuthFail();
      setMsg('Хадгалж чадсангүй: ' + ex.message);
    } finally { setBusy(false); }
  };

  const setProg = (i, k, v) => set('program', f.program.map((d, n) => n === i ? { ...d, [k]: v } : d));
  const moveProg = (i, dir) => { const p = [...f.program]; const j = i + dir; if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; set('program', p); };

  return (
    <form className="ed" onSubmit={save}>
      <div className="adm-bar sticky">
        <h2><Link to="/admin" className="adm-muted">Аяллууд /</Link> {isNew ? 'Шинэ аялал' : toL(f.title).mn}</h2>
        <div className="adm-tools">
          {msg && <span className={msg.includes('✓') ? 'ok' : 'adm-err'}>{msg}</span>}
          {!isNew && <a className="btn ghost" href={'/tour/' + f.slug} target="_blank" rel="noopener">Үзэх ↗</a>}
          <button className="btn" disabled={busy}>{busy ? 'Түр хүлээнэ үү…' : 'Хадгалах'}</button>
        </div>
      </div>

      <div className="ed-cols">
        <div>
          <div className="ed-block">
            <h3>Үндсэн мэдээлэл</h3>
            <LInput label="Аяллын нэр" required value={f.title} onChange={v => set('title', v)} />
            <LInput label="Маршрут / товч" hint="ж: Тяньжин – Фукуока – Чэжү" value={f.sub} onChange={v => set('sub', v)} />
            <LInput label="Очих хот" hint="самбар, карт дээр харагдана" value={f.to} onChange={v => set('to', v)} />
            <div className="fgrid">
              <label>Төрөл<select value={f.type} onChange={e => set('type', e.target.value)}>{TYPES.filter(k => k !== 'all').map(k => <option key={k} value={k}>{mn('type.' + k)}</option>)}</select></label>
              <label>Самбарын код<input maxLength={3} placeholder="PVG" value={f.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} /></label>
              {!isNew && <label>Холбоос (slug)<input value={f.slug} onChange={e => set('slug', e.target.value)} /></label>}
            </div>
            <span className="lbl">Улс *</span>
            <div className="chips">
              {site.countries.map(c => <label key={c.c} className="chip"><input type="checkbox" checked={f.countries.includes(c.c)}
                onChange={e => set('countries', e.target.checked ? [...f.countries, c.c] : f.countries.filter(x => x !== c.c))} /><span>{toL(c.name).mn}</span></label>)}
            </div>
            <LInput label="Хугацаа" hint="ж: 7 өдөр 6 шөнө" value={f.days} onChange={v => set('days', v)} />
          </div>

          <div className="ed-block">
            <h3>Гарах өдрүүд</h3>
            <p className="adm-muted">Ирэх огноотой аялал "Удахгүй хөөрөх" самбар дээр гарч, бүртгэл авна. Огноо өнгөрөхөөр "Өмнөх аяллууд" руу шилжинэ.</p>
            <div className="deps">
              {f.departures.map((d, i) => (
                <span className="dep-in" key={i}>
                  <input type="date" value={d} onChange={e => set('departures', f.departures.map((x, n) => n === i ? e.target.value : x))} />
                  <button type="button" className="x" onClick={() => set('departures', f.departures.filter((_, n) => n !== i))}>×</button>
                </span>
              ))}
              <button type="button" className="btn ghost sm" onClick={() => set('departures', [...f.departures, ''])}>+ Огноо нэмэх</button>
            </div>
            <div className="fgrid">
              <label>Аялал дуусах өдөр<small> (заавал биш)</small><input type="date" value={f.end || ''} onChange={e => set('end', e.target.value)} /></label>
              <label>Нийт суудал<small> (хоосон = хязгааргүй)</small><input type="number" min="0" value={f.seats ?? ''} onChange={e => set('seats', e.target.value)} /></label>
            </div>
            <LInput label="Өмнө явсан огноо (текст)" hint="ж: 2024 зун, 2025.03–04" value={f.when} onChange={v => set('when', v)} />
          </div>

          <div className="ed-block">
            <h3>Үнэ</h3>
            {f.prices.map((p, i) => (
              <div className="li" key={i}>
                <select value={p.k} onChange={e => set('prices', f.prices.map((x, n) => n === i ? { ...x, k: e.target.value } : x))}>
                  {PRICE_KEYS.map(k => <option key={k} value={k}>{mn('price.' + k)}</option>)}
                </select>
                <LInput value={p.v} onChange={v => set('prices', f.prices.map((x, n) => n === i ? { ...x, v } : x))} />
                <button type="button" className="x" onClick={() => set('prices', f.prices.filter((_, n) => n !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('prices', [...f.prices, { k: 'p', v: '' }])}>+ Үнэ нэмэх</button>
            <label className="full">Тусгай утас<small> (хоосон бол {site.phone}, таслалаар тусгаарлана)</small>
              <input value={f.phones.join(', ')} onChange={e => set('phones', e.target.value.split(',').map(s => s.trim()))} /></label>
          </div>

          <div className="ed-block">
            <h3>Аяллын хөтөлбөр (өдөр бүрээр)</h3>
            {f.program.map((d, i) => (
              <div className="pday" key={i}>
                <div className="pday-h">
                  <b>{i + 1}-р өдөр</b>
                  <span className="meals-ed">
                    {['Өглөө', 'Өдөр', 'Орой'].map((m, k) => <label key={k}><input type="checkbox" checked={!!d.meals?.[k]}
                      onChange={e => { const ms = [...(d.meals || [0, 0, 0])]; ms[k] = e.target.checked ? 1 : 0; setProg(i, 'meals', ms); }} /> {m}</label>)}
                  </span>
                  <span className="ord-h">
                    <button type="button" onClick={() => moveProg(i, -1)} disabled={i === 0}>▲</button>
                    <button type="button" onClick={() => moveProg(i, 1)} disabled={i === f.program.length - 1}>▼</button>
                    <button type="button" className="x" onClick={() => set('program', f.program.filter((_, n) => n !== i))}>×</button>
                  </span>
                </div>
                <LInput label="Гарчиг" hint="ж: Улаанбаатар – Бээжин" value={d.title} onChange={v => setProg(i, 'title', v)} />
                <LInput label="Тайлбар" area value={d.text} onChange={v => setProg(i, 'text', v)} />
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('program', [...f.program, { title: toL(''), text: toL(''), meals: [1, 1, 1] }])}>+ Өдөр нэмэх</button>
          </div>

          <LList label="Онцлох зүйлс" items={f.hl} onChange={v => set('hl', v)} />
          <LList label="Аяллын үнэд багтсан" items={f.included} onChange={v => set('included', v)} />
          <LList label="Аяллын үнэд багтаагүй" items={f.excluded} onChange={v => set('excluded', v)} />
          <LList label="Хэнд тохиромжтой" items={f.suitable} onChange={v => set('suitable', v)} />
        </div>

        <aside>
          <div className="ed-block">
            <h3>Нүүр зураг</h3>
            <div className="cover-prev" style={{ backgroundImage: pic(f.img, 0, 800) }} />
            <label className="btn ghost sm file">Зураг оруулах<input type="file" accept="image/*" onChange={async e => { const u = e.target.files[0] && await upload(e.target.files); if (u) set('img', u); e.target.value = ''; }} /></label>
            <label className="full">эсвэл зургийн холбоос<input value={f.img} onChange={e => set('img', e.target.value)} placeholder="https://…" /></label>
          </div>
          <div className="ed-block">
            <h3>Зургийн цомог</h3>
            <div className="gal-ed">
              {f.gallery.map((g, i) => <div key={i} style={{ backgroundImage: pic(g, i, 300) }}><button type="button" className="x" onClick={() => set('gallery', f.gallery.filter((_, n) => n !== i))}>×</button></div>)}
            </div>
            <label className="btn ghost sm file">+ Зургууд нэмэх<input type="file" accept="image/*" multiple onChange={async e => { const u = e.target.files.length && await upload(e.target.files, true); if (u) set('gallery', [...f.gallery, ...u]); e.target.value = ''; }} /></label>
          </div>
          <div className="ed-block">
            <h3>Төлөв</h3>
            <label className="sw"><input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} /><span>{f.active ? 'Сайт дээр харагдана' : 'Нуусан'}</span></label>
          </div>
        </aside>
      </div>
    </form>
  );
}
