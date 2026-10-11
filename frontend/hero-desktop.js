/* Desktop hero (>=800px): full-bleed banner, left info block, right poster card, arrows, counter. Mobile untouched. */
(function(){
var css='@media(min-width:800px){'+
'#hero .hero{min-height:560px;border-radius:0;margin:0 -18px;padding:0;align-items:stretch}'+
'#hero .hero>b,#hero .hero>div:not(.hx){display:none}'+
'#hero .hero:after{background:linear-gradient(90deg,var(--bg) 2%,rgba(10,13,20,.78) 38%,rgba(10,13,20,.15) 75%),linear-gradient(to top,var(--bg) 2%,transparent 40%)}'+
'.hx{position:relative;z-index:2;width:100%;max-width:1400px;margin:0 auto;padding:64px 56px 70px;display:flex;align-items:flex-end;justify-content:space-between;gap:40px}'+
'.hx-l{max-width:640px}'+
'.hx-chips{display:flex;gap:8px;margin-bottom:16px}.hx-chips span{font:700 11px Inter;letter-spacing:.04em;padding:4px 10px;border-radius:999px;border:1px solid}'+
'.hx-on{color:#34d399;background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.4)}.hx-hd{color:#a78bfa;background:rgba(167,139,250,.14);border-color:rgba(167,139,250,.4)}.hx-sub{color:#60a5fa;background:rgba(96,165,250,.14);border-color:rgba(96,165,250,.4)}.hx-dub{color:#fbbf24;background:rgba(251,191,36,.14);border-color:rgba(251,191,36,.4)}'+
'.hx h1{font:800 clamp(38px,4.4vw,64px)/1.05 Sora,Inter,sans-serif;margin:0 0 14px;letter-spacing:-.01em;text-shadow:0 2px 24px rgba(0,0,0,.5)}'+
'.hx-meta{display:flex;flex-wrap:wrap;gap:20px;color:var(--sv);font-size:14px;margin-bottom:16px}'+
'.hx-d{color:var(--sv);font-size:15px;line-height:1.6;max-width:560px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin:0 0 18px}'+
'.hx-g{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}.hx-g span{background:rgba(124,92,255,.16);border:1px solid rgba(124,92,255,.35);color:#c4b5fd;border-radius:999px;padding:5px 14px;font-size:12.5px}'+
'.hx-b{display:flex;gap:12px;flex-wrap:wrap}.hx-b a{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;border-radius:999px;font:600 15px Inter;color:#fff;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);backdrop-filter:blur(8px);cursor:pointer}'+
'.hx-b a:hover{border-color:#a78bfa}.hx-b a.p{background:linear-gradient(90deg,#8b5cf6,#d946ef);border:0;box-shadow:0 8px 28px rgba(139,92,246,.4)}'+
'.hx-p{flex:0 0 auto;width:240px;aspect-ratio:2/3;border-radius:16px;overflow:hidden;border:2px solid rgba(167,139,250,.55);box-shadow:0 18px 50px rgba(0,0,0,.6);background:var(--cd) center/cover no-repeat;margin-right:40px}'+
'.hx-a{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(10,13,20,.65);color:#fff;font-size:22px;cursor:pointer;display:grid;place-items:center;backdrop-filter:blur(6px)}.hx-a:hover{background:#8b5cf6}.hx-a.l{left:18px}.hx-a.r{right:18px}'+
'.hx-n{position:absolute;right:56px;bottom:26px;z-index:3;color:var(--mu);font-size:13px}.hx-n b{color:#fff}'+
'}@media(max-width:799px){.hx,.hx-a,.hx-n{display:none!important}}';
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function enhance(){
 var h=document.querySelector('#hero .hero');if(!h||h.dataset.fx)return;
 var dots=h.querySelectorAll('[data-h]');if(!dots.length)return;
 var cur=0;dots.forEach(function(d,i){if(d.classList.contains('on'))cur=i});
 var a;try{a=A[cur]}catch(e){}if(!a)return;h.dataset.fx='1';
 var st=a.s==='Completed'?'COMPLETED':a.s==='Upcoming'?'UPCOMING':'ONGOING';
 var meta=[];if(a.type)meta.push(String(a.type).toUpperCase());
 if(a.n)meta.push(a.n+' Episodes');if(a.y)meta.push(a.y);if(a.studioName)meta.push(a.studioName);
 var poster=a.posterUrl||a.bannerUrl||'';
 var go=function(i){dots[(i+dots.length)%dots.length].click()};
 var x=document.createElement('div');x.className='hx';
 x.innerHTML='<div class="hx-l"><div class="hx-chips"><span class="hx-on">'+st+'</span><span class="hx-hd">HD</span><span class="hx-sub">SUB</span>'+(a.hindiDub?'<span class="hx-dub">HINDI DUB</span>':'')+'</div>'+
 '<h1>'+esc(a.t)+'</h1><div class="hx-meta">'+meta.map(function(m){return'<span>'+esc(m)+'</span>'}).join('')+'</div>'+
 '<p class="hx-d">'+esc(a.description||'')+'</p>'+
 '<div class="hx-g">'+(a.genres||[]).slice(0,5).map(function(g){return'<span>'+esc(g)+'</span>'}).join('')+'</div>'+
 '<div class="hx-b"><a class="p" href="#/watch/'+a.i+'/1">&#9654; Watch Now</a><a href="#/anime/'+a.i+'">&#9432; More Info</a><a href="#/watchlist">&#128278; Watchlist</a></div></div>'+
 (poster?'<div class="hx-p" style="background-image:url(\''+esc(poster).replace(/'/g,'%27')+'\')"></div>':'');
 h.appendChild(x);
 var l=document.createElement('button'),r=document.createElement('button'),n=document.createElement('div');
 l.className='hx-a l';l.innerHTML='&#8249;';l.setAttribute('aria-label','Previous');l.onclick=function(){go(cur-1)};
 r.className='hx-a r';r.innerHTML='&#8250;';r.setAttribute('aria-label','Next');r.onclick=function(){go(cur+1)};
 n.className='hx-n';n.innerHTML='<b>'+(cur+1)+'</b> / '+dots.length;
 h.appendChild(l);h.appendChild(r);h.appendChild(n);
}
function boot(){var m=document.getElementById('hero');if(m)new MutationObserver(enhance).observe(m,{childList:true});enhance()}
new MutationObserver(function(){var m=document.getElementById('hero');if(m&&!m.dataset.obs){m.dataset.obs='1';new MutationObserver(enhance).observe(m,{childList:true});enhance()}}).observe(document.body,{childList:true,subtree:true});
if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
})();
