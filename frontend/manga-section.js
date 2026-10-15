(() => {
  const $ = (id) => document.getElementById(id);
  let titles = [], activeManga = null, activeChapter = null, page = 0, mode = 'vertical';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api = async (url, options={}) => {
    const token = localStorage.getItem('pdi_stream_token');
    const headers = {'Content-Type':'application/json', ...(options.headers||{})};
    if (token) headers.Authorization = 'Bearer ' + token;
    const r = await fetch(url, {...options, headers});
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.message || data.error || 'Manga request failed');
    return data;
  };
  const visible = (id) => { const el=$(id); if(el) el.hidden=false; };
  const hide = (id) => { const el=$(id); if(el) el.hidden=true; };
  async function loadCatalog() {
    const box=$('mangaCatalog'), status=$('mangaStatus');
    if(!box || !status) return;
    status.textContent='Loading manga…';
    try {
      titles=await api('/api/manga');
      renderCatalog();
      status.textContent=titles.length ? '' : 'No manga published yet. New manga will appear here when the team publishes it.';
    } catch(e) { status.textContent='Manga could not load right now: '+e.message; }
  }
  function renderCatalog() {
    const box=$('mangaCatalog'); if(!box) return;
    const q=($('mangaSearch')?.value||'').trim().toLowerCase(), access=$('mangaAccess')?.value||'all';
    const list=titles.filter(x=>(!q||x.title.toLowerCase().includes(q))&&(access==='all'||(access==='premium')===!!x.is_premium));
    box.innerHTML=list.map(x=>'<article class="cd" style="cursor:pointer" data-manga="'+esc(x.slug)+'"><div class="po">'+(x.cover_url?'<img src="'+esc(x.cover_url)+'" alt="'+esc(x.title)+'" loading="lazy" style="width:100%;height:100%;object-fit:cover">':'<b>'+esc(x.title.slice(0,1))+'</b>')+(x.is_premium?'<i>PREMIUM</i>':'<i>FREE</i>')+'</div><p>'+esc(x.title)+'</p><small>'+Number(x.chapter_count||0)+' chapters · '+esc(x.status||'ongoing')+'</small></article>').join('') || '<p class="mu">No titles match this search.</p>';
    box.querySelectorAll('[data-manga]').forEach(el=>el.onclick=()=>openManga(el.dataset.manga));
  }
  async function openManga(slug) {
    try {
      activeManga=await api('/api/manga/'+encodeURIComponent(slug));
      hide('mangaCatalog'); hide('mangaStatus'); visible('mangaDetail'); hide('mangaReader');
      $('mangaDetail').innerHTML='<button class="btn g" id="mangaBack">← All manga</button><div class="hero" style="margin-top:16px"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+(activeManga.cover_url?'<img src="'+esc(activeManga.cover_url)+'" alt="" style="width:120px;max-width:35%;border-radius:12px">':'')+'<div><span class="tag">'+(activeManga.is_premium?'PREMIUM':'FREE')+'</span><h1>'+esc(activeManga.title)+'</h1><p>'+esc(activeManga.description||'')+'</p><small>'+esc(activeManga.status||'ongoing')+' · '+esc(activeManga.reading_mode==='page'?'Page-turn reading':'Vertical reading')+'</small></div></div></div><h2 class="ph">Chapters</h2><div class="eps">'+(activeManga.chapters||[]).map(ch=>'<button class="ep-r" style="width:100%;text-align:left" data-chapter="'+ch.id+'"><span>Chapter '+esc(ch.chapter_number)+(ch.title?' · '+esc(ch.title):'')+'</span><span>'+(ch.is_premium||activeManga.is_premium?'✦ Premium':'Read →')+'</span></button>').join('')+'</div>';
      $('mangaBack').onclick=backCatalog;
      $('mangaDetail').querySelectorAll('[data-chapter]').forEach(el=>el.onclick=()=>openChapter(el.dataset.chapter));
    } catch(e) { alert(e.message); }
  }
  function backCatalog(){activeManga=null;activeChapter=null;visible('mangaCatalog');visible('mangaStatus');hide('mangaDetail');hide('mangaReader');}
  async function openChapter(id) {
    try {
      activeChapter=await api('/api/manga/chapters/'+id); page=0; mode=activeChapter.reading_mode||activeManga.reading_mode||'vertical';
      hide('mangaDetail'); visible('mangaReader'); drawReader();
    } catch(e) { alert(e.message); }
  }
  function drawReader() {
    const r=$('mangaReader'), pages=activeChapter.pages||[];
    const pdf=activeChapter.source_type==='pdf';
    r.innerHTML='<div class="row" style="justify-content:space-between"><button class="btn g" id="readerBack">← Chapters</button><strong>'+esc(activeManga.title)+' · Chapter '+esc(activeChapter.chapter_number)+'</strong><div class="row"><button class="btn g" id="mangaVertical">Vertical</button><button class="btn g" id="mangaPage">Page turn</button></div></div><div class="row" style="justify-content:center"><button class="btn g" id="mangaPrev">← Previous</button><span class="mu">'+(pdf?'PDF reader':(page+1)+' / '+pages.length)+'</span><button class="btn g" id="mangaNext">Next →</button></div><div id="mangaReaderPages" class="wt"></div>';
    $('readerBack').onclick=()=>{hide('mangaReader');visible('mangaDetail')};
    $('mangaVertical').onclick=()=>{mode='vertical';drawReader()};
    $('mangaPage').onclick=()=>{mode='page';drawReader()};
    $('mangaPrev').onclick=()=>{page=Math.max(0,page-1);drawReader()};
    $('mangaNext').onclick=()=>{page=Math.min(Math.max(0,pages.length-1),page+1);drawReader()};
    const host=$('mangaReaderPages');
    if(pdf) {
      host.innerHTML='<p class="mu">PDF chapter</p><iframe title="Manga PDF" style="width:100%;height:80vh;background:white;border:0" src="'+esc(activeChapter.pdf_data||'')+'"></iframe>';
    } else if(!pages.length) host.innerHTML='<p class="mu">This chapter has no pages yet.</p>';
    else if(mode==='page') host.innerHTML='<div style="display:flex;justify-content:center"><img alt="Manga page '+(page+1)+'" style="max-height:75vh;max-width:100%;object-fit:contain" src="'+esc(pages[page].image_data)+'"></div>';
    else host.innerHTML=pages.map((p,i)=>'<img loading="lazy" alt="Page '+(i+1)+'" style="display:block;width:100%;max-width:900px;height:auto;margin:0 auto 8px;background:#fff" src="'+esc(p.image_data)+'">').join('');
  }
  function init() {
    if(location.hash.replace(/^#\/?/,'').split('/')[0]!=='manga') return;
    if(!$('mangaSection')) return;
    loadCatalog();
    $('mangaSearch')?.addEventListener('input',renderCatalog);
    $('mangaAccess')?.addEventListener('change',renderCatalog);
  }
  window.addEventListener('hashchange',()=>setTimeout(init,0));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));
  const oldRoute=window.route;
  if(typeof oldRoute==='function') window.route=new Proxy(oldRoute,{apply(target,thisArg,args){const out=Reflect.apply(target,thisArg,args);setTimeout(init,0);return out;}});
})();