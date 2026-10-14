import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deletePost, listPosts, savePost, setPostPublished } from '../../data.js';
import { failWith } from './Admin.jsx';
import { pic } from '../../lib.js';
import { LInput, toL, uploadOrAlert } from './TourEditor.jsx';

const Tm = v => v == null ? '' : typeof v === 'string' ? v : (v.mn || v.en || '');
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Нийтлэлийн жагсаалт ---------- */
export function PostsList({ onAuthFail }) {
  const fail = failWith(onAuthFail);
  const [list, setList] = useState(null);
  const load = useCallback(() => listPosts().then(setList).catch(fail), []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (p, published) => { await setPostPublished(p.id, published).catch(fail); load(); };
  const remove = async p => {
    if (!confirm(`"${Tm(p.title)}" нийтлэлийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    await deletePost(p.id).catch(fail);
    load();
  };

  if (!list) return <p className="adm-muted">Ачаалж байна…</p>;
  return (
    <>
      <div className="adm-bar">
        <h2>Блог <small>{list.length}</small></h2>
        <div className="adm-tools"><Link className="btn" to="/admin/post/new">+ Шинэ нийтлэл</Link></div>
      </div>
      <div className="adm-table">
        {list.map((p, i) => (
          <div className={`adm-row post${p.published ? '' : ' off'}`} key={p.id}>
            <div className="th" style={{ backgroundImage: pic(p.cover, i, 300) }} />
            <div className="info">
              <Link to={'/admin/post/' + p.id}><b>{Tm(p.title) || '(гарчиггүй)'}</b></Link>
              <span>{p.date}</span>
              {Tm(p.excerpt) && <span>{Tm(p.excerpt).slice(0, 110)}</span>}
            </div>
            <div className="acts">
              <label className="sw"><input type="checkbox" checked={p.published} onChange={e => toggle(p, e.target.checked)} /><span>{p.published ? 'Нийтэлсэн' : 'Ноорог'}</span></label>
              {p.published && <a className="btn ghost sm" href={'/blog/' + p.slug} target="_blank" rel="noopener">Үзэх</a>}
              <Link className="btn ghost sm" to={'/admin/post/' + p.id}>Засах</Link>
              <button type="button" className="btn ghost sm danger" onClick={() => remove(p)}>Устгах</button>
            </div>
          </div>
        ))}
        {!list.length && <p className="adm-muted">Нийтлэл алга байна. "+ Шинэ нийтлэл" дээр дарж эхлээрэй.</p>}
      </div>
    </>
  );
}

/* ---------- Нийтлэл засах ---------- */
export function PostEditor({ id, onAuthFail }) {
  const isNew = id === 'new';
  const nav = useNavigate();
  const [f, setF] = useState(isNew ? { title: '', excerpt: '', body: '', cover: '', images: [], date: today(), published: true } : null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (isNew) return;
    listPosts().then(list => {
      const p = list.find(x => x.id === id);
      p ? setF(p) : setMsg('Нийтлэл олдсонгүй.');
    }).catch(e => setMsg('Алдаа: ' + e.message));
  }, [id]);

  if (!f) return <p className="adm-muted">{msg || 'Ачаалж байна…'}</p>;
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const upload = async files => {
    setBusy(true);
    const urls = await uploadOrAlert(files);
    setBusy(false);
    return urls;
  };

  // Текстийн дунд зураг оруулах: монгол текстийн төгсгөлд ![](url) нэмнэ
  const insertImage = async files => {
    const urls = await upload(files);
    if (!urls) return;
    const b = toL(f.body);
    set('body', { ...b, mn: (b.mn.trim() + '\n\n' + urls.map(u => `![](${u})`).join('\n\n') + '\n\n').trimStart() });
  };

  const save = async e => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const saved = await savePost(f);
      if (isNew) nav('/admin/post/' + saved.id, { replace: true });
      else setF(saved);
      setMsg('Хадгаллаа ✓');
    } catch (ex) {
      if (ex.code === 'PGRST301') return onAuthFail();
      setMsg('Хадгалж чадсангүй: ' + ex.message);
    } finally { setBusy(false); }
  };

  return (
    <form className="ed" onSubmit={save}>
      <div className="adm-bar sticky">
        <h2><Link to="/admin/blog" className="adm-muted">Блог /</Link> {isNew ? 'Шинэ нийтлэл' : toL(f.title).mn}</h2>
        <div className="adm-tools">
          {msg && <span className={msg.includes('✓') ? 'ok' : 'adm-err'}>{msg}</span>}
          {!isNew && f.published && <a className="btn ghost" href={'/blog/' + f.slug} target="_blank" rel="noopener">Үзэх ↗</a>}
          <button className="btn" disabled={busy}>{busy ? 'Түр хүлээнэ үү…' : 'Хадгалах'}</button>
        </div>
      </div>

      <div className="ed-cols">
        <div>
          <div className="ed-block">
            <h3>Нийтлэл</h3>
            <LInput label="Гарчиг" required value={f.title} onChange={v => set('title', v)} />
            <LInput label="Товч тайлбар" hint="жагсаалт, карт дээр харагдана" area rows={2} value={f.excerpt} onChange={v => set('excerpt', v)} />
            <LInput label="Үндсэн текст" area rows={16} value={f.body} onChange={v => set('body', v)} />
            <div className="fmt-help">
              <b>Бичих заавар:</b> догол мөр хооронд хоосон мөр үлдээнэ ·
              <code>## Гарчиг</code> дэд гарчиг · <code>- зүйл</code> жагсаалт · <code>![тайлбар](зургийн холбоос)</code> зураг
            </div>
            <label className="btn ghost sm file">Текстэнд зураг оруулах<input type="file" accept="image/*" multiple onChange={async e => { if (e.target.files.length) await insertImage(e.target.files); e.target.value = ''; }} /></label>
          </div>
        </div>

        <aside>
          <div className="ed-block">
            <h3>Нүүр зураг</h3>
            <div className="cover-prev" style={{ backgroundImage: pic(f.cover, 0, 800) }} />
            <label className="btn ghost sm file">Зураг оруулах<input type="file" accept="image/*" onChange={async e => { const u = e.target.files[0] && await upload(e.target.files); if (u) set('cover', u[0]); e.target.value = ''; }} /></label>
            <label className="full">эсвэл зургийн холбоос<input value={f.cover} onChange={e => set('cover', e.target.value)} placeholder="https://…" /></label>
          </div>
          <div className="ed-block">
            <h3>Зургийн цомог</h3>
            <div className="gal-ed">
              {f.images.map((g, i) => <div key={i} style={{ backgroundImage: pic(g, i, 300) }}><button type="button" className="x" onClick={() => set('images', f.images.filter((_, n) => n !== i))}>×</button></div>)}
            </div>
            <label className="btn ghost sm file">+ Зургууд нэмэх<input type="file" accept="image/*" multiple onChange={async e => { const u = e.target.files.length && await upload(e.target.files); if (u) set('images', [...f.images, ...u]); e.target.value = ''; }} /></label>
          </div>
          <div className="ed-block">
            <h3>Тохиргоо</h3>
            <label className="full">Огноо<input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></label>
            {!isNew && <label className="full">Холбоос (slug)<input value={f.slug} onChange={e => set('slug', e.target.value)} /></label>}
            <label className="sw"><input type="checkbox" checked={f.published} onChange={e => set('published', e.target.checked)} /><span>{f.published ? 'Нийтэлсэн' : 'Ноорог (сайтад харагдахгүй)'}</span></label>
          </div>
        </aside>
      </div>
    </form>
  );
}
