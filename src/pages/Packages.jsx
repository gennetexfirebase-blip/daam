import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang, useSite, useTours } from '../store.jsx';
import { TYPES, fmtMonth, liveDepartures } from '../lib.js';
import { TourCard } from '../components/TourBits.jsx';

/* Аяллын хөтөлбөрүүд: гарах сар, төрөл, улсаар шүүнэ */
export default function Packages() {
  const { t, T, lang } = useLang();
  const { tours } = useTours();
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const type = params.get('type') || 'all';
  const country = params.get('country') || '';
  const month = params.get('month') || '';
  const setParam = (k, v) => { const p = new URLSearchParams(params); v && v !== 'all' ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  const all = tours || [];
  // Ирэх огноотойг эхэнд, ойрын огноогоор эрэмбэлнэ
  const sorted = useMemo(() => all.map((x, i) => ({ x, i, next: liveDepartures(x)[0] || '9999' }))
    .sort((a, b) => a.next.localeCompare(b.next) || a.x.order - b.x.order), [all]);
  const months = useMemo(() => [...new Set(all.flatMap(x => liveDepartures(x).map(d => d.slice(0, 7))))].sort(), [all]);

  const hay = p => [p.title, p.sub, p.to, ...p.countries.map(c => site.countryName(c))].filter(Boolean)
    .flatMap(v => typeof v === 'string' ? [v] : Object.values(v)).join(' ').toLowerCase();
  const list = sorted.filter(({ x }) => (type === 'all' || x.type === type)
    && (!country || x.countries.includes(country))
    && (!month || liveDepartures(x).some(d => d.startsWith(month)))
    && (!q || hay(x).includes(q)));

  return (
    <section className="sec pk-page">
      <div className="wrap">
        <div className="sec-head">
          <h2>{t('pk.title')}</h2>
          <p>{t('pk.sub')}</p>
        </div>

        {months.length > 0 && <div className="months" role="group" aria-label={t('pk.month')}>
          <button type="button" aria-pressed={!month} onClick={() => setParam('month', '')}>{t('pk.allm')}</button>
          {months.map(m => <button key={m} type="button" aria-pressed={month === m} onClick={() => setParam('month', m)}>{fmtMonth(m, lang)}</button>)}
        </div>}

        <div className="toolbar">
          <div className="tabs" role="group" aria-label={t('prog.types')}>
            {TYPES.map(k => (
              <button key={k} type="button" aria-pressed={k === type} onClick={() => setParam('type', k)}>
                {t('type.' + k)}<small>{k === 'all' ? all.length : all.filter(p => p.type === k).length}</small>
              </button>
            ))}
          </div>
          <div className="finder">
            <label><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" placeholder={t('prog.search')} aria-label={t('prog.search')} autoComplete="off" onChange={e => setQ(e.target.value.trim().toLowerCase())} /></label>
            <select aria-label={t('prog.country')} value={country} onChange={e => setParam('country', e.target.value)}>
              <option value="">{t('prog.allc')}</option>
              {site.countries.map(c => <option key={c.c} value={c.c}>{T(c.name)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid">
          {!tours ? <div className="empty">{t('t.loading')}</div>
            : list.length ? list.map(({ x, i }) => <TourCard key={x.slug} tour={x} index={i} to={`/tour/${x.slug}`} />)
              : <div className="empty">{t('prog.none')}<br /><button type="button" className="btn ghost" onClick={() => { setParams({}, { replace: true }); }}>{t('prog.clear')}</button></div>}
        </div>
        <p className="disclaimer">{t('note.price')}</p>
      </div>
    </section>
  );
}
