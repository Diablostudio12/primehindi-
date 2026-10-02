import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import crypto from 'node:crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
const {Pool}=pg; const app=express();
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || 'https://primordialstreams.up.railway.app')
    .split(',').map((value) => value.trim()).filter(Boolean)
);
allowedOrigins.add('https://primordialstreams.up.railway.app');
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 600
}));
app.use(express.json({limit:'8mb', strict:true}));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});
app.use('/api', apiLimiter);
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/google'], authLimiter);
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:false});
const JWT_SECRET=process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET === 'change-me') {
  throw new Error('JWT_SECRET must be configured with a random secret of at least 32 characters.');
}
async function init(){await pool.query(`
CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,display_name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS anime(id SERIAL PRIMARY KEY,title TEXT NOT NULL,alt_title TEXT DEFAULT '',slug TEXT UNIQUE NOT NULL,description TEXT DEFAULT '',poster_url TEXT DEFAULT '',banner_url TEXT DEFAULT '',year INT,genres TEXT[] DEFAULT '{}',rating NUMERIC(3,1),type TEXT DEFAULT 'series',status TEXT DEFAULT 'ongoing',hindi_dub BOOLEAN DEFAULT false,subtitles BOOLEAN DEFAULT true,is_exclusive BOOLEAN DEFAULT false,characters JSONB DEFAULT '[]'::jsonb,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS episodes(id SERIAL PRIMARY KEY,anime_id INT REFERENCES anime(id) ON DELETE CASCADE,season_number INT NOT NULL DEFAULT 1,episode_number INT NOT NULL,title TEXT DEFAULT '',video_url TEXT NOT NULL,thumbnail_url TEXT DEFAULT '',is_exclusive BOOLEAN DEFAULT false,created_at TIMESTAMPTZ DEFAULT now());
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS season_number INT NOT NULL DEFAULT 1;
ALTER TABLE anime ADD COLUMN IF NOT EXISTS characters JSONB DEFAULT '[]'::jsonb;
ALTER TABLE anime ADD COLUMN IF NOT EXISTS alt_title TEXT DEFAULT '';
CREATE TABLE IF NOT EXISTS watchlist(user_id INT REFERENCES users(id) ON DELETE CASCADE,anime_id INT REFERENCES anime(id) ON DELETE CASCADE,PRIMARY KEY(user_id,anime_id));
CREATE TABLE IF NOT EXISTS progress(user_id INT REFERENCES users(id) ON DELETE CASCADE,episode_id INT REFERENCES episodes(id) ON DELETE CASCADE,seconds INT DEFAULT 0,updated_at TIMESTAMPTZ DEFAULT now(),PRIMARY KEY(user_id,episode_id));
CREATE TABLE IF NOT EXISTS branding(id INT PRIMARY KEY DEFAULT 1,logo_url TEXT DEFAULT '',updated_at TIMESTAMPTZ DEFAULT now());
INSERT INTO branding(id,logo_url) VALUES(1,'/assets/logo.jpg') ON CONFLICT(id) DO NOTHING;`);
const legacyCatalog = [["Dragon's Oath","Fantasy",24,9.2,"#f59e0b","#7c2d12",2022,"completed"],["Midnight Case","Mystery",12,8.9,"#38bdf8","#0f172a",2023,"ongoing"],["Sparkle Stage","Music",13,8.7,"#ec4899","#4c1d95",2024,"ongoing"],["Shadow Ninja","Action",26,8.8,"#6366f1","#0b1020",2025,"ongoing"],["Royal Hearts","Romance",12,8.5,"#f472b6","#581c87",2026,"ongoing"],["Titan Fall","Sci-Fi",25,8.6,"#fb923c","#1e3a8a",2022,"ongoing"],["Tea Time","Slice of Life",12,8.1,"#a16207","#292524",2023,"ongoing"],["Glimmer Woods","Fantasy",13,8.3,"#34d399","#064e3b",2024,"ongoing"],["Ring King","Sports",24,8.4,"#3b82f6","#7f1d1d",2025,"ongoing"],["Crimson Lord","Horror",12,8.7,"#dc2626","#1c0a0a",2026,"ongoing"],["Unit Seven","Sci-Fi",12,8.2,"#2dd4bf","#134e4a",2022,"ongoing"],["Sun Spike","Sports",13,8,"#fbbf24","#0369a1",2023,"ongoing"],["Neon Protocol","Sci-Fi",13,8.9,"#22d3ee","#581c87",2024,"ongoing"],["Starlight Academy","Fantasy",12,8.6,"#c084fc","#1e1b4b",2025,"ongoing"],["Tower of Spells","Fantasy",20,8.5,"#f59e0b","#312e81",2026,"ongoing"]];
for (const [title, genre, legacyEpisodes, rating, colorA, colorB, year, status] of legacyCatalog) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await pool.query(
    "INSERT INTO anime(title,alt_title,slug,description,poster_url,banner_url,year,genres,rating,type,status,hindi_dub,subtitles,is_exclusive,characters) VALUES($1,'',$2,$3,'','',$4,$5,$6,'series',$7,false,true,false,$8::jsonb) ON CONFLICT(slug) DO NOTHING",
    [title, slug, "Anime details can be updated from the Admin Portal.", year, [genre], rating, status, JSON.stringify({legacyEpisodes, colorA, colorB})]
  );
}
if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){const h=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);await pool.query('insert into users(display_name,email,password_hash,role) values($1,$2,$3,$4) on conflict(email) do update set display_name=$1,password_hash=$3,role=$4',['PDI Admin',process.env.ADMIN_EMAIL.toLowerCase(),h,'admin'])}}
function token(u){return jwt.sign({id:u.id,role:u.role},JWT_SECRET,{expiresIn:'7d'})}
function auth(req,res,next){try{req.user=jwt.verify((req.headers.authorization||'').replace(/^Bearer /,''),JWT_SECRET);next()}catch{return res.status(401).json({error:'Unauthorized'})}}
function admin(req,res,next){return auth(req,res,()=>req.user.role==='admin'?next():res.status(403).json({error:'Admin only'}))}
app.get('/api/health',async(req,res)=>{try{await pool.query('select 1');res.json({ok:true})}catch{res.status(503).json({ok:false})}});
app.post('/api/auth/register',async(req,res)=>{const{displayName,email,password}=req.body;if(!displayName||!email||!password)return res.status(400).json({error:'Missing fields'});try{const h=await bcrypt.hash(password,12);const{rows}=await pool.query('insert into users(display_name,email,password_hash) values($1,$2,$3) returning id,display_name,email,role,created_at',[displayName,email.toLowerCase(),h]);res.status(201).json({token:token(rows[0]),user:rows[0]})}catch{res.status(409).json({error:'Email already registered'})}});
app.post('/api/auth/login',async(req,res)=>{const{email,password,mfaCode}=req.body;const{rows}=await pool.query('select * from users where email=$1',[String(email||'').toLowerCase()]);if(!rows[0]||!(await bcrypt.compare(password||'',rows[0].password_hash)))return res.status(401).json({error:'Invalid credentials'});if(rows[0].role==='admin'&&!process.env.ADMIN_MFA_CODE)return res.status(503).json({error:'Admin MFA is not configured. Contact the site administrator.'});if(rows[0].role==='admin'&&String(mfaCode||'')!==String(process.env.ADMIN_MFA_CODE))return res.status(401).json({error:'Invalid MFA / Security Passcode'});const u=rows[0];delete u.password_hash;res.json({token:token(u),user:u})});
app.get('/api/auth/google/config',(req,res)=>res.json({clientId:process.env.GOOGLE_CLIENT_ID||''}));
app.post('/api/auth/google',async(req,res)=>{try{const credential=String(req.body.credential||'');if(!process.env.GOOGLE_CLIENT_ID)return res.status(503).json({error:'Google OAuth Client ID is not configured on the server'});if(!credential)return res.status(400).json({error:'Missing Google credential'});const verify=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential));if(!verify.ok)return res.status(401).json({error:'Google credential could not be verified'});const g=await verify.json();if(g.aud!==process.env.GOOGLE_CLIENT_ID||g.email_verified!=='true'||!g.email)return res.status(401).json({error:'Google account verification failed'});const email=g.email.toLowerCase(),displayName=g.name||g.given_name||email.split('@')[0],avatar=g.picture||'';const hash=await bcrypt.hash(crypto.randomUUID(),12);const result=await pool.query("insert into users(display_name,email,password_hash,avatar_url) values($1,$2,$3,$4) on conflict(email) do update set display_name=excluded.display_name,avatar_url=case when excluded.avatar_url<>'' then excluded.avatar_url else users.avatar_url end returning id,display_name,email,role,created_at,avatar_url",[displayName,email,hash,avatar]);res.json({token:token(result.rows[0]),user:result.rows[0]})}catch(e){console.error('Google sign-in failed',e);res.status(500).json({error:'Google sign-in failed. Please try again.'})}});
app.get('/api/me',auth,async(req,res)=>{const{rows}=await pool.query('select id,display_name,email,role,created_at,avatar_url from users where id=$1',[req.user.id]);res.json(rows[0])});
app.put('/api/me',auth,async(req,res)=>{const displayName=String(req.body.displayName||'').trim();const avatarUrl=req.body.avatarUrl===undefined?null:String(req.body.avatarUrl);if(!displayName)return res.status(400).json({error:'Username is required'});if(avatarUrl&&(!avatarUrl.startsWith('data:image/')||avatarUrl.length>6*1024*1024))return res.status(400).json({error:'Invalid profile image or image is too large'});const{rows}=await pool.query('update users set display_name=$1,avatar_url=coalesce($2,avatar_url) where id=$3 returning id,display_name,email,role,created_at,avatar_url',[displayName,avatarUrl,req.user.id]);res.json(rows[0])});
app.get('/api/anime',async(req,res)=>{const{rows}=await pool.query(`select a.*,(select count(*)::int from episodes e where e.anime_id=a.id) as episode_count,coalesce((select json_agg(json_build_object('id',e.id,'seasonNumber',e.season_number,'episodeNumber',e.episode_number,'title',e.title,'video_url',e.video_url,'thumbnail_url',e.thumbnail_url) order by e.season_number,e.episode_number) from episodes e where e.anime_id=a.id),'[]'::json) as episodes from anime a order by a.is_exclusive desc,a.created_at desc`);res.json(rows)});
app.get('/api/anime/:slug',async(req,res)=>{const a=(await pool.query('select * from anime where slug=$1',[req.params.slug])).rows[0];if(!a)return res.sendStatus(404);a.episodes=(await pool.query('select * from episodes where anime_id=$1 order by season_number,episode_number',[a.id])).rows;res.json(a)});
app.get('/api/branding',async(req,res)=>{const{rows}=await pool.query('select logo_url from branding where id=1');res.json({logoUrl:rows[0]?.logo_url||'/assets/logo.jpg'})});
app.get('/api/admin/anime',admin,async(req,res)=>{const{rows}=await pool.query('select * from anime order by is_exclusive desc,created_at desc');res.json(rows)});
app.get('/api/admin/users',admin,async(req,res)=>{const q=String(req.query.q||'').trim();const{rows}=await pool.query(`select id,display_name,email,role,created_at from users ${q?'where display_name ilike $1 or email ilike $1':''} order by created_at desc`,q?[`%${q}%`]:[]);res.json(rows)});
app.get('/api/admin/users/:id',admin,async(req,res)=>{const{rows}=await pool.query('select id,display_name,email,role,created_at from users where id=$1',[req.params.id]);if(!rows[0])return res.sendStatus(404);res.json(rows[0])});
app.get('/api/admin/users.csv',admin,async(req,res)=>{const{rows}=await pool.query('select id,display_name,email,role,created_at from users order by created_at desc');res.type('text/csv').send('id,display_name,email,role,created_at\\n'+rows.map(r=>[r.id,r.display_name,r.email,r.role,r.created_at.toISOString()].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\\n'))});
app.put('/api/admin/branding',admin,async(req,res)=>{const logoUrl=String(req.body.logoUrl||'');if(!logoUrl)return res.status(400).json({error:'logoUrl required'});await pool.query('update branding set logo_url=$1,updated_at=now() where id=1',[logoUrl]);res.json({logoUrl})});
app.post('/api/admin/anime',admin,async(req,res)=>{const x=req.body;const{rows}=await pool.query('insert into anime(title,alt_title,slug,description,poster_url,banner_url,year,genres,rating,type,status,hindi_dub,subtitles,is_exclusive,characters) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *',[x.title,x.altTitle||'',x.slug,x.description||'',x.posterUrl||'',x.bannerUrl||'',x.year||null,x.genres||[],x.rating||null,x.type||'series',x.status||'ongoing',!!x.hindiDub,x.subtitles!==false,!!x.isExclusive,JSON.stringify(x.characters||[])]);res.status(201).json(rows[0])});
app.put('/api/admin/anime/:id',admin,async(req,res)=>{const x=req.body;const{rows}=await pool.query('update anime set title=$1,alt_title=$2,slug=$3,description=$4,poster_url=$5,banner_url=$6,year=$7,genres=$8,rating=$9,type=$10,status=$11,hindi_dub=$12,subtitles=$13,is_exclusive=$14,characters=$15 where id=$16 returning *',[x.title,x.altTitle||'',x.slug,x.description||'',x.posterUrl||'',x.bannerUrl||'',x.year||null,x.genres||[],x.rating||null,x.type||'series',x.status||'ongoing',!!x.hindiDub,x.subtitles!==false,!!x.isExclusive,JSON.stringify(x.characters||[]),req.params.id]);if(!rows[0])return res.sendStatus(404);res.json(rows[0])});
app.delete('/api/admin/anime/:id',admin,async(req,res)=>{await pool.query('delete from anime where id=$1',[req.params.id]);res.sendStatus(204)});
app.get('/api/admin/analytics',admin,async(req,res)=>{const p=await pool.query('select count(*)::int count from progress');const u=await pool.query('select count(distinct user_id)::int count from progress');res.json({progressCount:p.rows[0].count,activeViewers:u.rows[0].count});});
app.get('/api/admin/schedule',admin,async(req,res)=>{const{rows}=await pool.query("select id,title,year,status,type,created_at from anime order by case status when 'on-air' then 1 when 'ongoing' then 2 when 'upcoming' then 3 else 4 end,created_at desc");res.json(rows)});
app.get('/api/admin/episodes',admin,async(req,res)=>{const{rows}=await pool.query('select e.*,a.title anime_title from episodes e join anime a on a.id=e.anime_id order by a.title,e.season_number,e.episode_number');res.json(rows)});
app.post('/api/admin/episodes',admin,async(req,res)=>{const x=req.body;const{rows}=await pool.query('insert into episodes(anime_id,season_number,episode_number,title,video_url,thumbnail_url,is_exclusive) values($1,$2,$3,$4,$5,$6,$7) returning *',[x.animeId,x.seasonNumber||1,x.episodeNumber,x.title||'',x.videoUrl,x.thumbnailUrl||'',!!x.isExclusive]);res.status(201).json(rows[0])});
app.put('/api/admin/episodes/:id',admin,async(req,res)=>{const x=req.body;const{rows}=await pool.query('update episodes set anime_id=$1,season_number=$2,episode_number=$3,title=$4,video_url=$5,thumbnail_url=$6,is_exclusive=$7 where id=$8 returning *',[x.animeId,x.seasonNumber||1,x.episodeNumber,x.title||'',x.videoUrl,x.thumbnailUrl||'',!!x.isExclusive,req.params.id]);if(!rows[0])return res.sendStatus(404);res.json(rows[0])});
app.delete('/api/admin/episodes/:id',admin,async(req,res)=>{await pool.query('delete from episodes where id=$1',[req.params.id]);res.sendStatus(204)});
app.get('/api/watchlist',auth,async(req,res)=>{const{rows}=await pool.query('select a.* from watchlist w join anime a on a.id=w.anime_id where w.user_id=$1 order by a.title',[req.user.id]);res.json(rows)});
app.post('/api/watchlist/:animeId',auth,async(req,res)=>{await pool.query('insert into watchlist(user_id,anime_id) values($1,$2) on conflict do nothing',[req.user.id,req.params.animeId]);res.sendStatus(204)});
app.delete('/api/watchlist/:animeId',auth,async(req,res)=>{await pool.query('delete from watchlist where user_id=$1 and anime_id=$2',[req.user.id,req.params.animeId]);res.sendStatus(204)});
app.get('/api/progress',auth,async(req,res)=>{const{rows}=await pool.query('select * from progress where user_id=$1',[req.user.id]);res.json(rows)});
app.put('/api/progress/:episodeId',auth,async(req,res)=>{const seconds=Math.max(0,Number(req.body.seconds)||0);const{rows}=await pool.query('insert into progress(user_id,episode_id,seconds) values($1,$2,$3) on conflict(user_id,episode_id) do update set seconds=$3,updated_at=now() returning *',[req.user.id,req.params.episodeId,seconds]);res.json(rows[0])});
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.message === 'Origin not allowed by CORS') return res.status(403).json({error:'Origin not allowed'});
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) return res.status(400).json({error:'Invalid JSON body'});
  console.error('Unhandled request error', { path: req.path, method: req.method, message: err?.message || 'Unknown error' });
  return res.status(500).json({error:'Internal server error'});
});
init().then(()=>app.listen(process.env.PORT||3000,'0.0.0.0')).catch(e=>{console.error('Startup failed',e);process.exit(1)});