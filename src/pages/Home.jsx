import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { telHref, useLang, useSite, useTours } from '../store.jsx';
import { TYPES, fmtDate, imgUrl, liveDepartures, pic, todayUB } from '../lib.js';
import { Drawer, TourCard } from '../components/TourBits.jsx';
import { PostCard, usePosts } from './Blog.jsx';
import { Logo } from '../components/Layout.jsx';

const PAGE = 9;

/* ---------- Нүүр хуудас ---------- */
export default function Home() {
  const { t, T, lang } = useLang();
  const { tours } = useTours();
  const site = useSite();
  const FB = site.facebook;
  const posts = usePosts();
  const loc = useLocation();
  const all = tours || [];
  const [current, setCurrent] = useState(null);
  const [state, setState] = useState({ type: 'all', country: '', q: '', showAll: false });
  const [lb, setLb] = useState(null);
  const [openFaq, setOpenFaq] = useState({});

  const today = todayUB();
  const programs = useMemo(() => [...all].sort((a, b) => (liveDepartures(a, today)[0] || '9999').localeCompare(liveDepartures(b, today)[0] || '9999') || a.order - b.order), [all, today]);
  const next = useMemo(() => all
    .flatMap(u => liveDepartures(u, today).map(date => ({ tour: u, date })))
    .sort((a, b) => a.date.localeCompare(b.date))[0], [all, today]);

  /* Холбоос #tour/slug → дэлгэрэнгүй нээх; #section → гүйлгэх */
  useEffect(() => {
    if (!tours) return;
    const m = loc.hash.match(/^#tour\/([\w-]+)$/);
    if (m) setCurrent(m[1]);
    else if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView();
  }, [tours, loc.hash]);

  const open = slug => {
    setCurrent(slug);
    try { history.replaceState(history.state, '', location.pathname + location.search + '#tour/' + slug); } catch (e) {}
  };
  const close = () => {
    setCurrent(null);
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) {}
  };
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setLb(null); close(); } };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, []);

  /* Шүүлтүүр */
  const hay = p => [p.title, p.sub, p.to, ...p.countries.map(c => site.countryName(c))].filter(Boolean)
    .flatMap(v => typeof v === 'string' ? [v] : Object.values(v)).join(' ').toLowerCase();
  const list = programs.filter(p => (state.type === 'all' || p.type === state.type)
    && (!state.country || p.countries.includes(state.country))
    && (!state.q || hay(p).includes(state.q)));
  const narrowed = !!(state.country || state.q);
  const shown = state.showAll || narrowed ? list : list.slice(0, PAGE);
  const clear = () => setState({ type: 'all', country: '', q: '', showAll: false });
  const pickCountry = c => { setState({ type: 'all', country: c, q: '', showAll: false }); document.getElementById('programs').scrollIntoView(); };

  const curTour = all.find(x => x.slug === current);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            {next && <button type="button" className="next" onClick={() => open(next.tour.slug)}>
              <b>{t('hero.next')}</b><span><strong>{T(next.tour.to)}</strong>{lang === 'zh' ? '，' : ', '}{fmtDate(next.date, lang)}</span>
            </button>}
            <h1>{t('hero.title').split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h1>
            <p className="lead">{t('hero.lead')}</p>
            <div className="actions">
              <Link to="/package" className="btn">{t('hero.cta1')}</Link>
              <a href={telHref(site.phone)} className="btn line">{t('hero.cta2')}</a>
            </div>
            <div className="trust">
              {site.stats.map((s, i) => <div key={i}><b>{s.n}</b><span>{T(s.label)}</span></div>)}
            </div>
          </div>
          <div className="photos" aria-hidden="true">
            <figure className="pc a"><div style={{ backgroundImage: pic(site.heroImgs[0], 1) }}></div><figcaption>{t('cap.1')}</figcaption></figure>
            <figure className="pc b"><div style={{ backgroundImage: pic(site.heroImgs[1], 0) }}></div><figcaption>{t('cap.2')}</figcaption></figure>
            <div className="stamp"><Logo /><span>Since<br />2016</span></div>
          </div>
        </div>
      </section>

      <section className="sec" id="programs">
        <div className="wrap">
          <div className="sec-head">
            <h2>{t('prog.title')}</h2>
            <p>{t('prog.sub')}</p>
          </div>
          <div className="toolbar">
            <div className="tabs" role="group" aria-label={t('prog.types')}>
              {TYPES.map(k => (
                <button key={k} type="button" aria-pressed={k === state.type} onClick={() => setState(s => ({ ...s, type: k, showAll: false }))}>
                  {t('type.' + k)}<small>{k === 'all' ? programs.length : programs.filter(p => p.type === k).length}</small>
                </button>
              ))}
            </div>
            <div className="finder">
              <label><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input type="search" placeholder={t('prog.search')} aria-label={t('prog.search')} autoComplete="off" value={state.q}
                  onChange={e => setState(s => ({ ...s, q: e.target.value.trim().toLowerCase() }))} /></label>
              <select aria-label={t('prog.country')} value={state.country} onChange={e => setState(s => ({ ...s, country: e.target.value }))}>
                <option value="">{t('prog.allc')}</option>
                {site.countries.map(c => <option key={c.c} value={c.c}>{T(c.name)}</option>)}
              </select>
            </div>
          </div>
          {narrowed && list.length > 0 && <p className="result-note" aria-live="polite">{t('prog.found', { n: list.length })}<button type="button" onClick={clear}>{t('prog.clear')}</button></p>}
          <div className="grid">
            {!tours ? <div className="empty">{t('t.loading')}</div>
              : list.length ? shown.map(p => <TourCard key={p.slug} tour={p} index={all.indexOf(p)} onOpen={open} />)
                : <div className="empty">{t('prog.none')}<br /><button type="button" className="btn ghost" onClick={clear}>{t('prog.clear')}</button></div>}
          </div>
          {!narrowed && list.length > PAGE && <div className="more">
            <button className="btn line" type="button" onClick={() => { setState(s => ({ ...s, showAll: !s.showAll })); if (state.showAll) document.getElementById('programs').scrollIntoView(); }}>
              {state.showAll ? t('prog.less') : t('prog.more', { n: list.length })}
            </button>
          </div>}
          <p className="disclaimer">{t('note.price')}</p>
        </div>
      </section>

      <section className="sec sky" id="countries">
        <div className="wrap">
          <div className="sec-head"><h2>{t('ctry.title')}</h2><p>{t('ctry.sub')}</p></div>
          <div className="ctry">
            {site.countries.map((c, i) => (
              <button type="button" key={c.c} onClick={() => pickCountry(c.c)}>
                <div className="im" style={{ backgroundImage: pic(c.img, i) }}></div>
                <b>{T(c.name)}</b><span>{T(c.note)}</span>
                <span className="n">{t('ctry.n', { n: all.filter(p => p.countries.includes(c.c)).length })}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="about">
        <div className="wrap about">
          <div className="im" role="img" aria-label={t('img.travellers')} style={{ backgroundImage: pic(site.aboutImg, 2) }}></div>
          <div>
            <h2>{t('about.title')}</h2>
            <p className="lead">{t('about.lead')}</p>
            <dl>
              <div><dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01" /></svg><span>{t('f1.t')}</span></dt><dd>{t('f1.d')}</dd></div>
              <div><dt><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg><span>{t('f2.t')}</span></dt><dd>{t('f2.d')}</dd></div>
              <div><dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-3.5 7-9V5l-7-2.5L5 5v7c0 5.5 7 9 7 9z" /><path d="m9 12 2 2 4-4" /></svg><span>{t('f3.t')}</span></dt><dd>{t('f3.d')}</dd></div>
              <div><dt><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.8 3.1 2.6 3.5 5.2" /></svg><span>{t('f4.t')}</span></dt><dd>{t('f4.d')}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <h2>{t('gal.title')}</h2>
            <a className="link" href={FB + '&sk=photos_by'} target="_blank" rel="noopener">{t('gal.fb')}</a>
          </div>
          <div className="gallery">
            {site.gallery.map((g, i) => <button key={g + i} type="button" aria-label={t('gal.zoom')} style={{ backgroundImage: pic(g, i) }} onClick={() => setLb(g)}></button>)}
          </div>
        </div>
      </section>

      {posts?.length > 0 && <section className="sec" id="blog" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <h2>{t('b.title')}</h2>
            <Link className="link" to="/blog">{t('b.all')}</Link>
          </div>
          <div className="post-grid">{posts.slice(0, 3).map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
        </div>
      </section>}

      <section className="sec sky" id="faq">
        <div className="wrap faq">
          <aside>
            <h2>{t('faq.title')}</h2>
            <p>{t('faq.sub').split('{phone}').map((part, i) => <span key={i}>{i > 0 && <a className="link" href={telHref(site.phone)}>{site.phone}</a>}{part}</span>)}</p>
          </aside>
          <div>
            {site.faq.map(({ q, a }, i) => (
              <details key={i} open={!!openFaq[i]} onToggle={e => { const o = e.currentTarget.open; setOpenFaq(s => s[i] === o ? s : { ...s, [i]: o }); }}>
                <summary>{T(q)}</summary><p>{T(a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="contact">
        <div className="wrap contact">
          <div>
            <h2>{t('contact.title')}</h2>
            <p className="lead">{t('contact.lead')}</p>
            <div className="ways">
              {site.email && <a href={'mailto:' + site.email}><span>{t('contact.email')}</span><b>{site.email}</b></a>}
              {FB && <a href={FB} target="_blank" rel="noopener"><span>Facebook</span><b>{site.facebookName}</b></a>}
              {site.website && <a href={site.website} target="_blank" rel="noopener"><span>{t('contact.sch')}</span><b>{site.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</b></a>}
            </div>
          </div>
          <div className="callcard">
            <h3>{t('call.title')}</h3>
            <p>{t('call.text')}</p>
            <div className="nums">
              {site.phones.map(p => <a key={p} href={telHref(p)}>{p}</a>)}
            </div>
          </div>
        </div>
      </section>

      <div className={`lb${lb ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label={t('gal.zoom')} onClick={e => { if (e.target === e.currentTarget) setLb(null); }}>
        <button type="button" aria-label={t('close')} onClick={() => setLb(null)}>&times;</button>
        <div style={lb ? { backgroundImage: `url(${imgUrl(lb, 2000)})` } : undefined}></div>
      </div>
      <Drawer tour={curTour} index={all.indexOf(curTour)} onClose={close} />
    </>
  );
}
