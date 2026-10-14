import { useEffect, useId, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { telHref, useLang, useSite } from '../store.jsx';

/* DA.am World лого (D тэмдэг) */
export function Logo({ className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="14 11 66 60" aria-hidden="true">
      <defs>
        <linearGradient id={'g' + id} gradientUnits="userSpaceOnUse" x1="30" y1="13" x2="52" y2="68">
          <stop offset="0" stopColor="#f4a64c" /><stop offset="1" stopColor="#df6420" />
        </linearGradient>
        <clipPath id={'c' + id}><circle cx="50" cy="40.7" r="25.2" /></clipPath>
      </defs>
      <g fill="none" stroke={`url(#g${id})`} strokeWidth="4.6" strokeMiterlimit="12">
        <path d="M62 29.4 C57 28.3 53 28 48 28 C31 28 24.5 23.8 18.6 15.5 H50 A25.2 25.2 0 0 1 50 65.9 H31.5 V48.6 H18.4" />
        <path clipPath={`url(#c${id})`} d="M48 28 C53 28 57 28.3 62 29.4 C67.5 30.6 72 34.5 77 41" />
        <path d="M29.8 40 H44.6 V52.6 H51 C59.5 52.6 63.6 47 63.6 40.4 C63.6 34.6 61 30 56 28.6 L51 28.1" />
      </g>
    </svg>
  );
}
export const Wordmark = () => <strong className="wordmark">DA.am <span>World</span></strong>;

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label="Language">
      {[['mn', 'МН'], ['en', 'EN'], ['zh', '中文']].map(([l, label]) => (
        <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{label}</button>
      ))}
    </div>
  );
}

// Нүүр хуудсан дээр бол #хэсэг, бусад хуудаснаас /#хэсэг
function SecLink({ id, children, className, onClick }) {
  const { pathname } = useLocation();
  return pathname === '/'
    ? <a href={'#' + id} className={className} onClick={onClick}>{children}</a>
    : <Link to={'/#' + id} className={className} onClick={onClick}>{children}</Link>;
}

export default function Layout() {
  const { t } = useLang();
  const site = useSite();
  const FB = site.facebook;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  // Идэвхтэй хэсгийг тодруулах
  useEffect(() => {
    if (pathname !== '/') { setActive(pathname.startsWith('/package') ? 'package' : pathname.startsWith('/blog') ? 'blog' : ''); return; }
    const spy = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) setActive(en.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    const t = setTimeout(() => ['countries', 'about', 'contact'].forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); }), 50);
    return () => { clearTimeout(t); spy.disconnect(); };
  }, [pathname]);

  const close = () => setOpen(false);
  const cls = id => active === id ? 'active' : undefined;

  return (
    <>
      <header className={`nav${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}>
        <div className="wrap">
          <Link to="/" className="logo" aria-label="DA.am World">
            <Logo />
            <div><Wordmark /><small>Since 2016 · Study &amp; Travel</small></div>
          </Link>
          <nav id="links">
            <Link to="/package" className={cls('package')} onClick={close}>{t('nav.packages')}</Link>
            <SecLink id="countries" className={cls('countries')} onClick={close}>{t('nav.countries')}</SecLink>
            <Link to="/blog" className={cls('blog')} onClick={close}>{t('nav.blog')}</Link>
            <SecLink id="about" className={cls('about')} onClick={close}>{t('nav.about')}</SecLink>
            <SecLink id="contact" className={cls('contact')} onClick={close}>{t('nav.contact')}</SecLink>
          </nav>
          <LangSwitch />
          {site.phone && <a href={telHref(site.phone)} className="phone">{site.phone}</a>}
          <button className="menu" aria-label={t('menu')} aria-expanded={open} onClick={() => setOpen(o => !o)}><span></span><span></span><span></span></button>
        </div>
      </header>

      <main><Outlet /></main>

      <footer>
        <div className="wrap">
          <div className="top">
            <div className="f-brand"><Logo /><div><Wordmark /><small>Since 2016 · Study &amp; Travel</small></div></div>
            <nav>
              <Link to="/package">{t('nav.packages')}</Link>
              <SecLink id="countries">{t('nav.countries')}</SecLink>
              <Link to="/blog">{t('nav.blog')}</Link>
              <SecLink id="faq">{t('faq.title')}</SecLink>
              <a href={FB} target="_blank" rel="noopener">Facebook</a>
            </nav>
            <LangSwitch />
          </div>
          <div className="bottom"><span>© {new Date().getFullYear()} DA.am World Study &amp; Travel &nbsp; {site.phones.map((p, i) => <span key={p}>{i > 0 && ' / '}<a href={telHref(p)}>{p}</a></span>)}</span><span>{t('foot.note')}</span></div>
        </div>
      </footer>

      <div className="float">
        <a className="fb" href={FB} target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="#fff"><path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.2C16.7 2.1 15.7 2 14.6 2 12.2 2 10.6 3.4 10.6 6.1v2.4H8V12h2.6v10H14V12h2.7l.4-3.5z" /></svg></a>
        <a className="call" href={telHref(site.phone)} aria-label={t('call.aria')}><svg viewBox="0 0 24 24" fill="#14213d"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" /></svg></a>
      </div>
      <div className="mbar">
        <a className="btn" href={telHref(site.phone)}>{t('mbar.call')}</a>
        <a className="btn line" href={FB} target="_blank" rel="noopener">Facebook</a>
      </div>
    </>
  );
}
