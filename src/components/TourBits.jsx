import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { telHref, useLang, useSite } from '../store.jsx';
import { fmtDate, isUpcoming, liveDepartures, pic, seatsLeft } from '../lib.js';

export function usePrice() {
  const { t, T } = useLang();
  return {
    label: k => t('price.' + k),
    rows: x => x.prices?.length ? x.prices.map(p => [t('price.' + p.k), T(p.v)]) : null,
    T
  };
}

/* Тасалбар хэлбэрийн карт */
export function TourCard({ tour: p, index = 0, onOpen, to }) {
  const { t, T, sep, lang } = useLang();
  const pr = usePrice();
  const deps = liveDepartures(p);
  const body = (
    <>
      <span className="phw"><span className="ph" style={{ display: 'block', backgroundImage: pic(p.img, index) }}></span><span className="tag">{t('type.' + p.type)}</span></span>
      <span className="bd">
        <span className="where">{t('city.ub')} <i></i> {T(p.to)}</span>
        <strong className="h">{T(p.title)}</strong>
        {T(p.sub) && <span className="when">{T(p.sub)}</span>}
        {deps.length > 0
          ? <span className="when deps">{deps.slice(0, 4).map(d => <span key={d} className="dchip">{fmtDate(d, lang)}</span>)}{deps.length > 4 && <span className="dchip">+{deps.length - 4}</span>}</span>
          : (T(p.when) || T(p.days)) && <span className="when">{[T(p.when), T(p.days)].filter(Boolean).join(sep)}</span>}
      </span>
      <span className="ft">
        {p.prices?.length
          ? <><div><span>{pr.label(p.prices[0].k)}</span><b>{T(p.prices[0].v)}</b></div>
              {p.prices[1] && <em>{pr.label(p.prices[1].k)}<br />{T(p.prices[1].v)}</em>}</>
          : <div><span>{t('price.p')}</span><b className="ask">{t('price.ask')}</b></div>}
      </span>
    </>
  );
  return to
    ? <Link to={to} className="tk">{body}</Link>
    : <button type="button" className="tk" onClick={() => onOpen(p.slug)}>{body}</button>;
}

export function PriceBox({ tour }) {
  const { t } = useLang();
  const rows = usePrice().rows(tour);
  return (
    <div className="pricebox">
      {rows ? rows.map(([k, v], i) => <div key={i}><span>{k}</span><b>{v}</b></div>)
        : <div><span>{t('price.p')}</span><b className="ask">{t('price.ask')}</b></div>}
    </div>
  );
}

/* Хажуугаас гарч ирэх дэлгэрэнгүй цонх */
export function Drawer({ tour: x, index, onClose }) {
  const { t, T, lang } = useLang();
  const site = useSite();
  const closeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (x) closeRef.current?.focus(); }, [x]);
  const on = !!x;
  const up = x && isUpcoming(x);
  const phone = x?.phones?.length ? x.phones[0] : site.phone;
  const left = x && seatsLeft(x);
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.origin + '/tour/' + x.slug); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  };
  return (
    <>
      <div className={`scrim${on ? ' on' : ''}`} onClick={onClose}></div>
      <aside className={`drawer${on ? ' on' : ''}`} aria-hidden={!on} aria-label={t('d.label')} aria-labelledby={on ? 'dTitle' : undefined}>
        {x && <>
          <div className="cover" style={{ backgroundImage: pic(x.img, index) }}><button className="close" ref={closeRef} aria-label={t('close')} onClick={onClose}>&times;</button></div>
          <div className="in">
            <div className="kicker">{x.countries.map(c => T(site.countryName(c))).join(lang === 'zh' ? '、' : ', ')} / {t('type.' + x.type)}</div>
            <h3 id="dTitle">{T(x.title)}</h3>
            <div className="meta">
              {up && <div><span>{t('d.when')}</span><b>{liveDepartures(x).map(d => fmtDate(d, lang)).join(', ')}</b></div>}
              {!up && T(x.when) && <div><span>{t('d.ran')}</span><b>{T(x.when)}</b></div>}
              {T(x.days) && <div><span>{t('d.days')}</span><b>{T(x.days)}</b></div>}
              {left != null && up && <div><span>{t('t.seats')}</span><b>{left || t('t.full')}</b></div>}
            </div>
            <h4>{t('d.hl')}</h4>
            {x.hl?.length ? <ul className="hl">{x.hl.map((h, i) => <li key={i}>{T(h)}</li>)}</ul> : <p style={{ color: 'var(--slate)' }}>{t('d.nohl')}</p>}
            <h4>{t('d.incl')}</h4>
            <div className="incl">{(x.included?.length ? x.included : site.typical).map((i, n) => <span key={n}>{T(i)}</span>)}</div>
            <PriceBox tour={x} />
            <div className="acts">
              {up && left !== 0 && <Link className="btn" to={`/register/${x.slug}`}>{t('t.register')}</Link>}
              <Link className="btn line wide" to={`/tour/${x.slug}`}>{t('pk.view')}</Link>
              <a className="btn ghost" href={telHref(phone)}>{t('d.call', { p: phone })}</a>
              <button type="button" className="btn ghost" onClick={copy}>{copied ? t('d.copied') : t('d.copy')}</button>
            </div>
            {x.phones?.length > 0 && <p className="note">{t('d.phone', { p: x.phones.join(', ') })}</p>}
            <p className="note">{up ? '' : t('d.past') + ' '}{t('note.price')} {t('d.group')} <a className="link" href={site.facebook} target="_blank" rel="noopener">Facebook</a></p>
          </div>
        </>}
      </aside>
    </>
  );
}
