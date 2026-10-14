import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { telHref, useLang, useSite, useTours } from '../store.jsx';
import { fmtDate, imgUrl, liveDepartures, pic, seatsLeft } from '../lib.js';
import { PriceBox } from '../components/TourBits.jsx';

const Meal = ({ on, label }) => <span className={`meal${on ? ' on' : ''}`} title={label}>{label}</span>;

/* Аяллын дэлгэрэнгүй хуудас: /tour/:slug */
export default function TourPage() {
  const { slug } = useParams();
  const { t, T, lang } = useLang();
  const { tours } = useTours();
  const site = useSite();
  const [lb, setLb] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!tours) return <div className="wrap tp-msg">{t('t.loading')}</div>;
  const x = tours.find(p => p.slug === slug);
  if (!x) return <div className="wrap tp-msg">{t('t.notfound')} <Link className="link" to="/package">{t('nav.packages')}</Link></div>;

  const deps = liveDepartures(x);
  const up = deps.length > 0;
  const left = seatsLeft(x);
  const phone = x.phones?.length ? x.phones[0] : site.phone;
  const idx = tours.indexOf(x);
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {} };

  return (
    <article className="tpage">
      <header className="tp-hero" style={{ backgroundImage: `linear-gradient(180deg,rgba(20,33,61,.15),rgba(20,33,61,.82)), ${pic(x.img, idx)}` }}>
        <div className="wrap">
          <Link to="/package" className="tp-back">← {t('nav.packages')}</Link>
          <div className="kicker">{x.countries.map(c => T(site.countryName(c))).join(lang === 'zh' ? '、' : ', ')} / {t('type.' + x.type)}</div>
          <h1>{T(x.title)}</h1>
          {T(x.sub) && <p className="tp-sub">{T(x.sub)}</p>}
          <div className="tp-facts">
            {T(x.days) && <div><span>{t('d.days')}</span><b>{T(x.days)}</b></div>}
            {T(x.to) && <div><span>{t('board.h2')}</span><b>{T(x.to)}</b></div>}
            {!up && T(x.when) && <div><span>{t('d.ran')}</span><b>{T(x.when)}</b></div>}
            {up && left != null && <div><span>{t('t.seats')}</span><b>{left || t('t.full')}</b></div>}
          </div>
        </div>
      </header>

      <div className="wrap tp-body">
        <div className="tp-main">
          {x.hl?.length > 0 && <section>
            <h2>{t('d.hl')}</h2>
            <ul className="hl">{x.hl.map((h, i) => <li key={i}>{T(h)}</li>)}</ul>
          </section>}

          <section>
            <h2>{t('t.program')}</h2>
            {x.program?.length ? <ol className="days">
              {x.program.map((d, i) => (
                <li key={i}>
                  <div className="dn">{t('t.day', { n: i + 1 })}</div>
                  <div className="dc">
                    <h3>{T(d.title)}</h3>
                    {T(d.text) && <p>{T(d.text)}</p>}
                    {d.meals && <div className="meals"><Meal on={d.meals[0]} label={t('t.b')} /><Meal on={d.meals[1]} label={t('t.l')} /><Meal on={d.meals[2]} label={t('t.d')} /></div>}
                  </div>
                </li>
              ))}
            </ol> : <p className="muted">{t('d.nohl')}</p>}
          </section>

          <section className={`ie${x.excluded?.length ? " two" : ""}`}>
            <div>
              <h2>{t('t.incl')}</h2>
              <ul className="hl">{(x.included?.length ? x.included : site.typical).map((i, n) => <li key={n}>{T(i)}</li>)}</ul>
            </div>
            {x.excluded?.length > 0 && <div>
              <h2>{t('t.excl')}</h2>
              <ul className="xl">{x.excluded.map((i, n) => <li key={n}>{T(i)}</li>)}</ul>
            </div>}
          </section>

          {x.suitable?.length > 0 && <section>
            <h2>{t('t.suit')}</h2>
            <div className="incl">{x.suitable.map((s, i) => <span key={i}>{T(s)}</span>)}</div>
          </section>}

          {x.gallery?.length > 0 && <section>
            <h2>{t('t.gallery')}</h2>
            <div className="tp-gal">{x.gallery.map((g, i) => <button key={i} type="button" aria-label={t('gal.zoom')} style={{ backgroundImage: pic(g, i, 800) }} onClick={() => setLb(g)} />)}</div>
          </section>}
        </div>

        <aside className="tp-side">
          <div className="tp-card">
            <h3>{t('pk.deps')}</h3>
            {up ? <div className="dep-list">{deps.map(d => (
              <Link key={d} to={`/register/${x.slug}?d=${d}`} className="dep">
                <b>{fmtDate(d, lang)}</b><span>{d.slice(0, 4)}</span>
              </Link>
            ))}</div> : <p className="muted">{t('t.nodep')}</p>}
            <PriceBox tour={x} />
            <div className="tp-acts">
              {up && left !== 0 && <Link className="btn" to={`/register/${x.slug}`}>{t('t.register')}</Link>}
              <a className="btn line" href={telHref(phone)}>{t('d.call', { p: phone })}</a>
              <div className="two">
                <a className="btn ghost" href={site.facebook} target="_blank" rel="noopener">Facebook</a>
                <button type="button" className="btn ghost" onClick={copy}>{copied ? t('d.copied') : t('d.copy')}</button>
              </div>
            </div>
            <p className="note">{t('note.price')} {t('d.group')}</p>
          </div>
        </aside>
      </div>

      <div className={`lb${lb ? ' on' : ''}`} role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) setLb(null); }}>
        <button type="button" aria-label={t('close')} onClick={() => setLb(null)}>&times;</button>
        <div style={lb ? { backgroundImage: `url(${imgUrl(lb, 2000)})` } : undefined}></div>
      </div>
    </article>
  );
}
