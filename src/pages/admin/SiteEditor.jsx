import { useState } from 'react';
import { useSite } from '../../store.jsx';
import { saveSiteContent } from '../../data.js';
import { DEFAULT_SITE, galItem, pic } from '../../lib.js';
import { I18N } from '../../i18n.js';
import { LInput, toL, uploadOrAlert } from './TourEditor.jsx';
import { failWith } from './Admin.jsx';

const L3 = k => ({ mn: I18N.mn[k] || '', en: I18N.en[k] || '', zh: I18N.zh[k] || '' });
const clone = x => JSON.parse(JSON.stringify(x));

/* Хэсэг бүрийн засварлах текстүүд: [түлхүүр, нэр, {area, hint}] */
const SECTIONS = [
  { id: 'hero', title: 'Нүүр хэсэг', keys: [['hero.title', 'Том гарчиг', { area: 2, hint: 'шинэ мөр = мөр шилжинэ' }], ['hero.lead', 'Тайлбар', { area: 3 }], ['hero.cta1', 'Улбар шар товч'], ['hero.cta2', 'Хоёр дахь товч'], ['hero.next', '"Дараагийн аялал" шошго'], ['cap.1', 'Том зургийн бичиг'], ['cap.2', 'Жижиг зургийн бичиг']] },
  { id: 'programs', title: 'Аяллын хөтөлбөрүүд', keys: [['prog.title', 'Гарчиг'], ['prog.sub', 'Тайлбар', { area: 2 }], ['pk.title', '"Аяллын хөтөлбөр" хуудасны гарчиг'], ['pk.sub', 'Хуудасны тайлбар', { area: 2 }], ['note.price', 'Үнийн анхааруулга'], ['d.group', 'Хөнгөлөлтийн тайлбар']] },
  { id: 'countries', title: 'Улсууд', keys: [['ctry.title', 'Гарчиг'], ['ctry.sub', 'Тайлбар']] },
  { id: 'about', title: 'Бидний тухай', keys: [['about.title', 'Гарчиг'], ['about.lead', 'Тайлбар', { area: 3 }], ['f1.t', '1-р онцлог'], ['f1.d', '1-р онцлогийн тайлбар'], ['f2.t', '2-р онцлог'], ['f2.d', '2-р онцлогийн тайлбар'], ['f3.t', '3-р онцлог'], ['f3.d', '3-р онцлогийн тайлбар'], ['f4.t', '4-р онцлог'], ['f4.d', '4-р онцлогийн тайлбар']] },
  { id: 'gallery', title: 'Зургийн цомог', keys: [['gal.title', 'Гарчиг'], ['gal.fb', 'Facebook холбоосын бичиг']] },
  { id: 'blog', title: 'Блог', keys: [['b.title', 'Гарчиг'], ['b.sub', 'Тайлбар']] },
  { id: 'faq', title: 'Асуулт хариулт', keys: [['faq.title', 'Гарчиг'], ['faq.sub', 'Тайлбар', { hint: '{phone} = утасны дугаар' }]] },
  { id: 'contact', title: 'Холбоо барих хэсэг', keys: [['contact.title', 'Гарчиг'], ['contact.lead', 'Тайлбар', { area: 2 }], ['contact.sch', 'Вэбсайтын шошго'], ['call.title', 'Улбар шар картын гарчиг'], ['call.text', 'Улбар шар картын тайлбар']] },
  { id: 'footer', title: 'Хөл хэсэг, хайлтын систем', keys: [['foot.note', 'Хөлийн бичиг'], ['meta.title', 'Хөтчийн табын нэр (SEO)'], ['meta.desc', 'Google-д харагдах тайлбар', { area: 2 }]] }
];
const ALL_KEYS = SECTIONS.flatMap(s => s.keys.map(k => k[0]));

/* Нэг зураг сонгох */
function ImgPick({ value, onChange, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="img-pick">
      {label && <span className="lbl">{label}</span>}
      <div className="cover-prev" style={{ backgroundImage: pic(value, 0, 600) }} />
      <div className="img-acts">
        <label className="btn ghost sm file">{busy ? 'Оруулж байна…' : 'Зураг солих'}<input type="file" accept="image/*" disabled={busy}
          onChange={async e => { const f = e.target.files; if (!f.length) return; setBusy(true); const u = await uploadOrAlert(f); setBusy(false); if (u) onChange(u[0]); e.target.value = ''; }} /></label>
        <input className="url" value={value} onChange={e => onChange(e.target.value)} placeholder="эсвэл холбоос" />
      </div>
    </div>
  );
}

/* Жагсаалтын мөр: дээш, доош, хасах */
function RowTools({ i, n, onMove, onRemove }) {
  return (
    <span className="ord-h">
      <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0}>▲</button>
      <button type="button" onClick={() => onMove(i, 1)} disabled={i === n - 1}>▼</button>
      <button type="button" className="x" onClick={() => onRemove(i)}>×</button>
    </span>
  );
}
const moved = (arr, i, d) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

export default function SiteEditor({ onAuthFail }) {
  const site = useSite();
  const [f, setF] = useState(() => {
    const base = clone({ ...DEFAULT_SITE, ...site.raw });
    base.gallery = base.gallery.map(galItem);
    base.text = { ...Object.fromEntries(ALL_KEYS.map(k => [k, L3(k)])), ...(site.raw.text || {}) };
    return base;
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [galBusy, setGalBusy] = useState(false);

  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setMsg(''); };
  const setText = (k, v) => set('text', { ...f.text, [k]: v });
  const setItem = (k, i, patch) => set(k, f[k].map((x, n) => n === i ? { ...x, ...patch } : x));
  const removeItem = k => i => set(k, f[k].filter((_, n) => n !== i));
  const moveItem = k => (i, d) => set(k, moved(f[k], i, d));

  const save = async e => {
    e.preventDefault();
    const codes = f.countries.map(c => c.c);
    if (codes.some(c => !/^[a-z]{2,3}$/.test(c))) { setMsg('Улсын код 2–3 латин жижиг үсэг байна (ж: cn, kr).'); return; }
    if (new Set(codes).size !== codes.length) { setMsg('Улсын код давхардсан байна.'); return; }
    setBusy(true); setMsg('');
    try {
      await saveSiteContent({ ...f, phones: f.phones.map(p => p.trim()).filter(Boolean) });
      await site.reload();
      setMsg('Хадгаллаа ✓');
    } catch (ex) {
      if (ex.code === 'PGRST301') return onAuthFail();
      failWith(onAuthFail)(ex);
    } finally { setBusy(false); }
  };

  const texts = keys => keys.map(([k, label, o = {}]) => (
    <LInput key={k} label={label} hint={o.hint} area={!!o.area} rows={o.area || undefined} value={f.text[k]} onChange={v => setText(k, v)} />
  ));
  const sec = id => SECTIONS.find(s => s.id === id);

  return (
    <form className="ed site-ed" onSubmit={save}>
      <div className="adm-bar sticky">
        <h2>Сайтын агуулга</h2>
        <div className="adm-tools">
          {msg && <span className={msg.includes('✓') ? 'ok' : 'adm-err'}>{msg}</span>}
          <a className="btn ghost" href="/" target="_blank" rel="noopener">Сайт үзэх ↗</a>
          <button className="btn" disabled={busy}>{busy ? 'Хадгалж байна…' : 'Хадгалах'}</button>
        </div>
      </div>

      <div className="site-cols">
        <nav className="site-nav">
          <a href="#s-contactinfo">Холбоо барих мэдээлэл</a>
          {SECTIONS.map(s => <a key={s.id} href={'#s-' + s.id}>{s.title}</a>)}
          <a href="#s-typical">Аялалд багтдаг зүйлс</a>
        </nav>

        <div>
          <section className="ed-block" id="s-contactinfo">
            <h3>Холбоо барих мэдээлэл</h3>
            <p className="adm-muted">Эхний утас нь цэс, "Залгах" товч, аялал бүрт харагдана.</p>
            <span className="lbl">Утасны дугаарууд</span>
            {f.phones.map((p, i) => (
              <div className="li" key={i}>
                <input className="plain" value={p} onChange={e => set('phones', f.phones.map((x, n) => n === i ? e.target.value : x))} placeholder="7210-0248" />
                <RowTools i={i} n={f.phones.length} onMove={(i, d) => set('phones', moved(f.phones, i, d))} onRemove={i => set('phones', f.phones.filter((_, n) => n !== i))} />
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('phones', [...f.phones, ''])}>+ Утас нэмэх</button>
            <div className="fgrid">
              <label>Имэйл<input type="email" value={f.email} onChange={e => set('email', e.target.value)} /></label>
              <label>Facebook холбоос<input value={f.facebook} onChange={e => set('facebook', e.target.value)} /></label>
              <label>Facebook хуудасны нэр<input value={f.facebookName} onChange={e => set('facebookName', e.target.value)} /></label>
              <label>Вэбсайт<input value={f.website} onChange={e => set('website', e.target.value)} placeholder="https://…" /></label>
            </div>
          </section>

          <section className="ed-block" id="s-hero">
            <h3>{sec('hero').title}</h3>
            {texts(sec('hero').keys)}
            <div className="img-row">
              <ImgPick label="Том зураг" value={f.heroImgs[0] || ''} onChange={v => set('heroImgs', [v, f.heroImgs[1] || ''])} />
              <ImgPick label="Жижиг зураг" value={f.heroImgs[1] || ''} onChange={v => set('heroImgs', [f.heroImgs[0] || '', v])} />
            </div>
            <span className="lbl">Тоон үзүүлэлтүүд</span>
            {f.stats.map((s, i) => (
              <div className="li" key={i}>
                <input className="plain num" value={s.n} onChange={e => setItem('stats', i, { n: e.target.value })} placeholder="90" />
                <LInput value={s.label} onChange={v => setItem('stats', i, { label: v })} />
                <RowTools i={i} n={f.stats.length} onMove={moveItem('stats')} onRemove={removeItem('stats')} />
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('stats', [...f.stats, { n: '', label: toL('') }])}>+ Үзүүлэлт нэмэх</button>
          </section>

          <section className="ed-block" id="s-programs">
            <h3>{sec('programs').title}</h3>
            {texts(sec('programs').keys)}
          </section>

          <section className="ed-block" id="s-countries">
            <h3>{sec('countries').title}</h3>
            {texts(sec('countries').keys)}
            <p className="adm-muted">Код нь аяллыг улстай холбоно (ж: cn, kr). Аялалд ашиглагдаж буй улсын кодыг солихгүй байхыг анхаарна уу.</p>
            {f.countries.map((c, i) => (
              <div className="pday" key={i}>
                <div className="pday-h">
                  <b>{toL(c.name).mn || 'Шинэ улс'}</b>
                  <label className="code">Код<input className="plain" value={c.c} maxLength={3} onChange={e => setItem('countries', i, { c: e.target.value.toLowerCase().replace(/[^a-z]/g, '') })} /></label>
                  <span style={{ marginLeft: 'auto' }}><RowTools i={i} n={f.countries.length} onMove={moveItem('countries')} onRemove={removeItem('countries')} /></span>
                </div>
                <div className="ctry-ed">
                  <ImgPick value={c.img} onChange={v => setItem('countries', i, { img: v })} />
                  <div>
                    <LInput label="Нэр" value={c.name} onChange={v => setItem('countries', i, { name: v })} />
                    <LInput label="Товч тайлбар" value={c.note} onChange={v => setItem('countries', i, { note: v })} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('countries', [...f.countries, { c: '', name: toL(''), note: toL(''), img: '' }])}>+ Улс нэмэх</button>
          </section>

          <section className="ed-block" id="s-about">
            <h3>{sec('about').title}</h3>
            <ImgPick label="Зураг" value={f.aboutImg} onChange={v => set('aboutImg', v)} />
            {texts(sec('about').keys)}
          </section>

          <section className="ed-block" id="s-typical">
            <h3>Аялалд ихэвчлэн багтдаг зүйлс</h3>
            <p className="adm-muted">Аялалд "Үнэд багтсан" жагсаалт бөглөөгүй бол эдгээр харагдана.</p>
            {f.typical.map((x, i) => (
              <div className="li" key={i}>
                <LInput value={x} onChange={v => set('typical', f.typical.map((y, n) => n === i ? v : y))} />
                <RowTools i={i} n={f.typical.length} onMove={(i, d) => set('typical', moved(f.typical, i, d))} onRemove={i => set('typical', f.typical.filter((_, n) => n !== i))} />
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('typical', [...f.typical, toL('')])}>+ Нэмэх</button>
          </section>

          <section className="ed-block" id="s-gallery">
            <h3>{sec('gallery').title}</h3>
            {texts(sec('gallery').keys)}
            <p className="adm-muted">Эхний 5 зураг шууд харагдана (эхнийх нь хамгийн том), бусад нь "Бүх зургийг үзэх" дээр дарахад гарна. Зураг бүрт газрын нэр бичвэл зургийн доор харагдана.</p>
            <div className="gal-ed big">
              {f.gallery.map((g, i) => (
                <div key={i} className="gal-card">
                  <div className="gal-im" style={{ backgroundImage: pic(g.src, i, 400) }}>
                  <span className="gal-tools">
                    <button type="button" onClick={() => set('gallery', moved(f.gallery, i, -1))} disabled={i === 0}>◀</button>
                    <button type="button" onClick={() => set('gallery', moved(f.gallery, i, 1))} disabled={i === f.gallery.length - 1}>▶</button>
                    <button type="button" className="x" onClick={() => set('gallery', f.gallery.filter((_, n) => n !== i))}>×</button>
                  </span>
                  </div>
                  <LInput value={g.cap} onChange={v => setItem('gallery', i, { cap: v })} />
                </div>
              ))}
            </div>
            <label className="btn ghost sm file">{galBusy ? 'Оруулж байна…' : '+ Зургууд нэмэх'}<input type="file" accept="image/*" multiple disabled={galBusy}
              onChange={async e => { const fl = e.target.files; if (!fl.length) return; setGalBusy(true); const u = await uploadOrAlert(fl); setGalBusy(false); if (u) set('gallery', [...f.gallery, ...u.map(src => ({ src, cap: toL('') }))]); e.target.value = ''; }} /></label>
          </section>

          <section className="ed-block" id="s-blog">
            <h3>{sec('blog').title}</h3>
            {texts(sec('blog').keys)}
          </section>

          <section className="ed-block" id="s-faq">
            <h3>{sec('faq').title}</h3>
            {texts(sec('faq').keys)}
            {f.faq.map((x, i) => (
              <div className="pday" key={i}>
                <div className="pday-h"><b>{i + 1}-р асуулт</b><span style={{ marginLeft: 'auto' }}><RowTools i={i} n={f.faq.length} onMove={moveItem('faq')} onRemove={removeItem('faq')} /></span></div>
                <LInput label="Асуулт" value={x.q} onChange={v => setItem('faq', i, { q: v })} />
                <LInput label="Хариулт" area rows={3} value={x.a} onChange={v => setItem('faq', i, { a: v })} />
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={() => set('faq', [...f.faq, { q: toL(''), a: toL('') }])}>+ Асуулт нэмэх</button>
          </section>

          <section className="ed-block" id="s-contact">
            <h3>{sec('contact').title}</h3>
            {texts(sec('contact').keys)}
          </section>

          <section className="ed-block" id="s-footer">
            <h3>{sec('footer').title}</h3>
            {texts(sec('footer').keys)}
          </section>
        </div>
      </div>
    </form>
  );
}
