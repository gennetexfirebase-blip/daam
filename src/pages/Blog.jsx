import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../store.jsx';
import { listPosts } from '../data.js';
import { imgUrl, pic } from '../lib.js';

export function usePosts() {
  const [posts, setPosts] = useState(null);
  useEffect(() => { listPosts().then(l => setPosts(l.filter(p => p.published))).catch(() => setPosts([])); }, []);
  return posts;
}

export const fmtPostDate = (iso, lang) => {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'en' ? new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : lang === 'zh' ? `${y}年${m}月${d}日` : `${y} оны ${m} сарын ${d}`;
};

/* Нийтлэлийн карт */
export function PostCard({ post: p, index = 0 }) {
  const { t, T, lang } = useLang();
  return (
    <Link to={`/blog/${p.slug}`} className="post-card">
      <span className="pc-im" style={{ backgroundImage: pic(p.cover, index, 900) }} />
      <span className="pc-bd">
        <time dateTime={p.date}>{fmtPostDate(p.date, lang)}</time>
        <strong>{T(p.title)}</strong>
        {T(p.excerpt) && <span className="ex">{T(p.excerpt)}</span>}
        <span className="rd">{t('b.read')} →</span>
      </span>
    </Link>
  );
}

/* Энгийн текстийг хэлбэржүүлэх: хоосон мөрөөр догол мөр, "## " гарчиг, "- " жагсаалт, "![](url)" зураг */
function Body({ text }) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    if (b.startsWith('## ')) return <h2 key={i}>{b.slice(3)}</h2>;
    const img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) return <figure key={i}><img src={imgUrl(img[2])} alt={img[1]} loading="lazy" />{img[1] && <figcaption>{img[1]}</figcaption>}</figure>;
    const lines = b.split('\n');
    if (lines.every(l => /^[-•]\s/.test(l))) return <ul key={i} className="hl">{lines.map((l, n) => <li key={n}>{l.replace(/^[-•]\s/, '')}</li>)}</ul>;
    return <p key={i}>{lines.map((l, n) => <span key={n}>{n > 0 && <br />}{l}</span>)}</p>;
  });
}

export function BlogList() {
  const { t } = useLang();
  const posts = usePosts();
  return (
    <section className="sec pk-page">
      <div className="wrap">
        <div className="sec-head"><h2>{t('b.title')}</h2><p>{t('b.sub')}</p></div>
        {!posts ? <div className="empty">{t('t.loading')}</div>
          : posts.length ? <div className="post-grid">{posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}</div>
            : <div className="empty">{t('b.empty')}</div>}
      </div>
    </section>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const { t, T, lang } = useLang();
  const posts = usePosts();
  const [lb, setLb] = useState(null);
  if (!posts) return <div className="wrap tp-msg">{t('t.loading')}</div>;
  const p = posts.find(x => x.slug === slug);
  if (!p) return <div className="wrap tp-msg">{t('t.notfound')} <Link className="link" to="/blog">{t('b.back')}</Link></div>;
  const others = posts.filter(x => x !== p).slice(0, 3);

  return (
    <article className="post">
      <div className="wrap post-head">
        <Link to="/blog" className="tp-back dark">← {t('b.back')}</Link>
        <time dateTime={p.date}>{fmtPostDate(p.date, lang)}</time>
        <h1>{T(p.title)}</h1>
        {T(p.excerpt) && <p className="lead">{T(p.excerpt)}</p>}
      </div>
      {p.cover && <div className="wrap"><div className="post-cover" style={{ backgroundImage: pic(p.cover, 0, 1800) }} /></div>}
      <div className="wrap post-body"><Body text={T(p.body)} /></div>
      {p.images?.length > 0 && <div className="wrap post-body">
        <div className="tp-gal">{p.images.map((g, i) => <button key={i} type="button" aria-label={t('gal.zoom')} style={{ backgroundImage: pic(g, i, 800) }} onClick={() => setLb(g)} />)}</div>
      </div>}
      {others.length > 0 && <section className="sec sky">
        <div className="wrap">
          <div className="sec-head"><h2>{t('b.more')}</h2><Link className="link" to="/blog">{t('b.all')}</Link></div>
          <div className="post-grid">{others.map((x, i) => <PostCard key={x.id} post={x} index={i + 1} />)}</div>
        </div>
      </section>}
      <div className={`lb${lb ? ' on' : ''}`} role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) setLb(null); }}>
        <button type="button" aria-label={t('close')} onClick={() => setLb(null)}>&times;</button>
        <div style={lb ? { backgroundImage: `url(${imgUrl(lb, 2000)})` } : undefined}></div>
      </div>
    </article>
  );
}
