import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18N, LANGS } from './i18n.js';
import { DEFAULT_SITE } from './lib.js';
import { getSiteContent, listTours } from './data.js';

export const storage = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ---------- Сайтын агуулга (админаас засна) ---------- */
const SiteCtx = createContext(null);
export const telHref = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');

export function SiteProvider({ children }) {
  const [content, setContent] = useState({});
  const reload = useCallback(() => getSiteContent().then(setContent).catch(e => console.error('site_settings', e)), []);
  useEffect(() => { reload(); }, [reload]);
  const value = useMemo(() => {
    const site = { ...DEFAULT_SITE, ...content, text: content.text || {} };
    const byCode = Object.fromEntries(site.countries.map(c => [c.c, c]));
    return { ...site, phone: site.phones[0] || '', countryName: c => byCode[c]?.name || c.toUpperCase(), raw: content, reload };
  }, [content, reload]);
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}
export const useSite = () => useContext(SiteCtx);

/* ---------- Хэл ---------- */
const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const site = useSite();
  const [lang, setLangState] = useState(() => {
    let l = null;
    try { l = new URL(location.href).searchParams.get('lang'); } catch (e) {}
    l = l || storage.get('daam-lang');
    return LANGS.includes(l) ? l : 'mn';
  });
  const setLang = useCallback(l => { setLangState(l); storage.set('daam-lang', l); }, []);

  const value = useMemo(() => {
    // Олон хэлтэй утга: {mn, en, zh} эсвэл энгийн текст. Хоосон бол монголоор.
    const T = v => v == null ? '' : typeof v === 'string' ? v : (v[lang] || v.mn || '');
    const t = (k, vars = {}) => {
      const o = site.text[k];
      let s = (o && T(o)) || (I18N[lang][k] ?? I18N.mn[k] ?? k);
      for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(b);
      return s;
    };
    const sep = lang === 'zh' ? '，' : ', ';
    return { lang, setLang, t, T, sep };
  }, [lang, setLang, site.text]);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    if (!location.pathname.startsWith('/admin')) document.title = value.t('meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', value.t('meta.desc'));
  }, [lang, value]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
export const useLang = () => useContext(LangCtx);

/* ---------- Аяллууд ---------- */
const ToursCtx = createContext(null);
export function ToursProvider({ children }) {
  const [tours, setTours] = useState(null);
  const [error, setError] = useState(null);
  // Админ нэвтэрсэн үед нуусан аяллууд ч ирнэ: сайт дээр зөвхөн идэвхтэйг харуулна
  const reload = useCallback(() => listTours().then(l => setTours(l.filter(x => x.active))).catch(e => { setError(e); setTours([]); }), []);
  useEffect(() => { reload(); }, [reload]);
  return <ToursCtx.Provider value={{ tours, error, reload }}>{children}</ToursCtx.Provider>;
}
export const useTours = () => useContext(ToursCtx);
