// Additive Manga Reading feature. Files are stored in PostgreSQL as small data URLs because this Railway project has no object-storage bucket configured.
// For large volumes, configure durable object storage before raising the per-file limits.
import pg from 'pg';
import jwt from 'jsonwebtoken';

const OWNER_EMAIL = 'primordialdubbers@gmail.com';
const MAX_FILE_CHARS = 6 * 1024 * 1024;
const slugify = (v) => String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,100) || 'manga';

export function registerManga(app) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false, max: 3 });
  pool.on('error', e => console.error('[manga] pool error', e.message));
  const ready = pool.query(`
    CREATE TABLE IF NOT EXISTS manga_titles(
      id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ongoing', is_premium BOOLEAN NOT NULL DEFAULT false,
      reading_mode TEXT NOT NULL DEFAULT 'vertical' CHECK(reading_mode IN ('vertical','page')),
      is_published BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS manga_chapters(
      id BIGSERIAL PRIMARY KEY, manga_id BIGINT NOT NULL REFERENCES manga_titles(id) ON DELETE CASCADE,
      chapter_number NUMERIC(8,2) NOT NULL DEFAULT 1, title TEXT NOT NULL DEFAULT '', source_type TEXT NOT NULL DEFAULT 'images' CHECK(source_type IN ('images','pdf')),
      pdf_data TEXT NOT NULL DEFAULT '', is_premium BOOLEAN NOT NULL DEFAULT false, is_published BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(manga_id,chapter_number)
    );
    CREATE TABLE IF NOT EXISTS manga_pages(
      id BIGSERIAL PRIMARY KEY, chapter_id BIGINT NOT NULL REFERENCES manga_chapters(id) ON DELETE CASCADE,
      page_number INT NOT NULL, image_data TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(chapter_id,page_number)
    );
    CREATE INDEX IF NOT EXISTS manga_titles_public_idx ON manga_titles(is_published,updated_at DESC);
    CREATE INDEX IF NOT EXISTS manga_chapters_idx ON manga_chapters(manga_id,is_published,chapter_number);
    CREATE INDEX IF NOT EXISTS manga_pages_idx ON manga_pages(chapter_id,page_number);
  `).catch(e => { console.error('[manga] schema init failed:', e.message); throw e; });

  async function userFrom(req) {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token || !process.env.JWT_SECRET) return null;
    try {
      const p = jwt.verify(token, process.env.JWT_SECRET);
      const u = (await pool.query('SELECT id,email,role,is_banned FROM users WHERE id=$1', [p.id])).rows[0];
      if (!u || u.is_banned) return null;
      return u;
    } catch { return null; }
  }
  async function staff(req) {
    const u = await userFrom(req);
    if (!u) return false;
    const email = String(u.email || '').toLowerCase();
    if (email === OWNER_EMAIL || u.role === 'admin') return true;
    const row = (await pool.query("SELECT role,status FROM admin_team WHERE email=$1", [email])).rows[0];
    return !!row && row.status === 'active' && ['admin','editor'].includes(row.role);
  }
  const wrap = fn => async (req,res) => {
    try { await ready; await fn(req,res); }
    catch(e) { console.error('[manga] route error:', e.message); if(!res.headersSent) res.status(500).json({error:'Manga service temporarily unavailable'}); }
  };
  const cleanFile = (value, types) => {
    const s = String(value || '');
    if (!s || s.length > MAX_FILE_CHARS || !types.some(t => s.startsWith(t))) return null;
    return s;
  };

  app.get('/api/manga', wrap(async (req,res) => {
    const {rows} = await pool.query(`SELECT m.id,m.title,m.slug,m.description,m.cover_url,m.status,m.is_premium,m.reading_mode,m.updated_at,
      (SELECT count(*)::int FROM manga_chapters c WHERE c.manga_id=m.id AND c.is_published=true) chapter_count
      FROM manga_titles m WHERE m.is_published=true ORDER BY m.updated_at DESC`);
    res.json(rows);
  }));
  app.get('/api/manga/:slug', wrap(async (req,res) => {
    const manga = (await pool.query('SELECT id,title,slug,description,cover_url,status,is_premium,reading_mode FROM manga_titles WHERE slug=$1 AND is_published=true',[req.params.slug])).rows[0];
    if(!manga) return res.status(404).json({error:'Manga not found'});
    const {rows: chapters} = await pool.query('SELECT id,chapter_number,title,source_type,is_premium FROM manga_chapters WHERE manga_id=$1 AND is_published=true ORDER BY chapter_number',[manga.id]);
    res.json({...manga,chapters});
  }));
  app.get('/api/manga/chapters/:id', wrap(async (req,res) => {
    const chapter = (await pool.query(`SELECT c.id,c.manga_id,c.chapter_number,c.title,c.source_type,c.pdf_data,c.is_premium,m.title manga_title,m.slug,m.reading_mode,m.is_premium manga_premium
      FROM manga_chapters c JOIN manga_titles m ON m.id=c.manga_id WHERE c.id=$1 AND c.is_published=true AND m.is_published=true`,[req.params.id])).rows[0];
    if(!chapter) return res.status(404).json({error:'Chapter not found'});
    const user = await userFrom(req);
    const premium = chapter.is_premium || chapter.manga_premium;
    const allowed = user && (String(user.email).toLowerCase()===OWNER_EMAIL || user.role==='admin' || user.role==='premium');
    if(premium && !allowed) return res.status(403).json({error:'Premium chapter',premium:true,message:'This chapter is premium. Sign in with an account that has premium access.'});
    delete chapter.manga_premium;
    if(chapter.source_type==='images') {
      const {rows} = await pool.query('SELECT id,page_number,image_data FROM manga_pages WHERE chapter_id=$1 ORDER BY page_number',[chapter.id]);
      chapter.pages=rows;
    } else chapter.pages=undefined;
    res.json(chapter);
  }));

  app.get('/api/admin/manga', wrap(async (req,res) => {
    if(!await staff(req)) return res.status(403).json({error:'Staff access required'});
    const {rows}=await pool.query(`SELECT m.*,(SELECT count(*)::int FROM manga_chapters c WHERE c.manga_id=m.id) chapter_count FROM manga_titles m ORDER BY m.updated_at DESC`);
    res.json(rows);
  }));
  app.post('/api/admin/manga', wrap(async (req,res) => {
    if(!await staff(req)) return res.status(403).json({error:'Staff access required'});
    const title=String(req.body?.title||'').trim(); if(!title||title.length>180) return res.status(400).json({error:'Title is required (max 180 characters)'});
    const description=String(req.body?.description||'').slice(0,8000);
    const cover=String(req.body?.coverUrl||'').trim(); if(cover.length>MAX_FILE_CHARS|| (cover && !/^(https?:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(cover))) return res.status(400).json({error:'Cover must be an image URL or PNG/JPG/WebP image'});
    const slugBase=slugify(req.body?.slug||title); let slug=slugBase,n=2;
    while((await pool.query('SELECT 1 FROM manga_titles WHERE slug=$1',[slug])).rowCount) slug=slugBase+'-'+n++;
    const mode=req.body?.readingMode==='page'?'page':'vertical';
    const {rows}=await pool.query('INSERT INTO manga_titles(title,slug,description,cover_url,status,is_premium,reading_mode,is_published) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [title,slug,description,cover,String(req.body?.status||'ongoing').slice(0,30),!!req.body?.isPremium,mode,!!req.body?.isPublished]);
    res.status(201).json(rows[0]);
  }));
  app.put('/api/admin/manga/:id', wrap(async (req,res) => {
    if(!await staff(req)) return res.status(403).json({error:'Staff access required'});
    const id=Number(req.params.id); if(!Number.isSafeInteger(id)||id<1) return res.status(400).json({error:'Invalid manga id'});
    const old=(await pool.query('SELECT * FROM manga_titles WHERE id=$1',[id])).rows[0]; if(!old) return res.status(404).json({error:'Manga not found'});
    const title=String(req.body?.title??old.title).trim(); if(!title||title.length>180) return res.status(400).json({error:'Invalid title'});
    const cover=String(req.body?.coverUrl??old.cover_url); if(cover.length>MAX_FILE_CHARS || (cover && !/^(https?:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(cover))) return res.status(400).json({error:'Invalid cover image'});
    const {rows}=await pool.query('UPDATE manga_titles SET title=$1,description=$2,cover_url=$3,status=$4,is_premium=$5,reading_mode=$6,is_published=$7,updated_at=now() WHERE id=$8 RETURNING *',
      [title,String(req.body?.description??old.description).slice(0,8000),cover,String(req.body?.status??old.status).slice(0,30),req.body?.isPremium===undefined?old.is_premium:!!req.body.isPremium,req.body?.readingMode==='page'?'page':req.body?.readingMode==='vertical'?'vertical':old.reading_mode,req.body?.isPublished===undefined?old.is_published:!!req.body.isPublished,id]);
    res.json(rows[0]);
  }));
  app.post('/api/admin/manga/:id/chapters', wrap(async (req,res) => {
    if(!await staff(req)) return res.status(403).json({error:'Staff access required'});
    const mangaId=Number(req.params.id); if(!Number.isSafeInteger(mangaId)||mangaId<1) return res.status(400).json({error:'Invalid manga id'});
    if(!(await pool.query('SELECT 1 FROM manga_titles WHERE id=$1',[mangaId])).rowCount) return res.status(404).json({error:'Manga not found'});
    const num=Number(req.body?.chapterNumber); if(!Number.isFinite(num)||num<0||num>999999) return res.status(400).json({error:'Enter a valid chapter number'});
    const type=req.body?.sourceType==='pdf'?'pdf':'images';
    let pdf='';
    const pages=Array.isArray(req.body?.pages)?req.body.pages:[];
    if(type==='pdf') { pdf=cleanFile(req.body?.pdfData,['data:application/pdf;base64,']); if(!pdf) return res.status(400).json({error:'PDF must be a valid PDF data URL under 4.5 MB'}); }
    else {
      if(!pages.length||pages.length>40) return res.status(400).json({error:'Add between 1 and 40 page images per chapter'});
      for(const p of pages) if(!cleanFile(p?.data,['data:image/jpeg;base64,','data:image/png;base64,','data:image/webp;base64,'])) return res.status(400).json({error:'Each page must be JPG, PNG or WebP and under the upload limit'});
      if(pages.reduce((s,p)=>s+p.data.length,0)>6*1024*1024) return res.status(400).json({error:'Total page images must be under 6 MB per request. Upload pages in smaller groups.'});
    }
    const client=await pool.connect();
    try {
      await client.query('BEGIN');
      const {rows}=await client.query('INSERT INTO manga_chapters(manga_id,chapter_number,title,source_type,pdf_data,is_premium,is_published) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [mangaId,num,String(req.body?.title||'').slice(0,180),type,pdf,!!req.body?.isPremium,!!req.body?.isPublished]);
      if(type==='images') for(let i=0;i<pages.length;i++) await client.query('INSERT INTO manga_pages(chapter_id,page_number,image_data) VALUES($1,$2,$3)',[rows[0].id,Number(pages[i].pageNumber)||i+1,pages[i].data]);
      await client.query('COMMIT'); res.status(201).json({chapter:rows[0],pages:pages.length});
    } catch(e) { await client.query('ROLLBACK'); if(e.code==='23505') return res.status(409).json({error:'That chapter number already exists for this manga'}); throw e; }
    finally { client.release(); }
  }));
  app.patch('/api/admin/manga/chapters/:id/publish', wrap(async (req,res) => {
    if(!await staff(req)) return res.status(403).json({error:'Staff access required'});
    const id=Number(req.params.id); const published=!!req.body?.isPublished;
    const r=await pool.query('UPDATE manga_chapters SET is_published=$1 WHERE id=$2 RETURNING id,is_published',[published,id]);
    if(!r.rowCount) return res.status(404).json({error:'Chapter not found'}); res.json(r.rows[0]);
  }));
  app.delete('/api/admin/manga/chapters/:id', wrap(async (req,res) => {
    if(!await staff(req)) return res.status(403).json({error:'Staff access required'});
    const r=await pool.query('DELETE FROM manga_chapters WHERE id=$1 RETURNING id',[Number(req.params.id)]);
    if(!r.rowCount) return res.status(404).json({error:'Chapter not found'}); res.json({ok:true});
  }));
}
