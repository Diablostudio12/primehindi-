import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';

const app = express();
const d = path.dirname(fileURLToPath(import.meta.url));
const backend = process.env.BACKEND_URL || 'https://primordial-streaming-backend-production.up.railway.app';

app.use(express.json({limit:'2mb'}));

app.use('/api', async (req,res) => {
  try {
    const u = backend + req.originalUrl;
    const headers = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    const r = await fetch(u, {
      method:req.method,
      headers,
      body:['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {})
    });
    res.status(r.status);
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json(await r.json());
    return res.send(await r.text());
  } catch {
    return res.status(502).json({error:'Backend unavailable'});
  }
});

app.use(express.static(d));
app.listen(process.env.PORT || 3000,'0.0.0.0');
