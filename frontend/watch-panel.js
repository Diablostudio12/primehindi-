/* Watch page: tabbed Episodes / Comments / Reviews / Related panel under the player */
(function(){
var css='.wpn{margin-top:22px}.wtabs{display:flex;gap:10px;overflow-x:auto;padding-bottom:14px;border-bottom:1px solid var(--ln,#232540);margin-bottom:22px;scrollbar-width:none}.wtabs::-webkit-scrollbar{display:none}.wtabs button{flex:none;padding:12px 20px;border-radius:999px;border:1px solid var(--ln,#232540);background:var(--cd,#141629);color:#c9cce0;font-weight:600;font-size:15px;cursor:pointer}.wtabs button.on{background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;border-color:transparent}.wtool input{width:100%;max-width:420px;padding:14px 18px;border-radius:14px;background:var(--cd,#141629);border:1px solid var(--ln,#232540);color:#fff;font-size:16px;box-sizing:border-box}.wtool2{display:flex;justify-content:space-between;align-items:center;margin:20px 0}.wlang,.wview{display:flex;gap:8px}.wlang button{padding:10px 20px;border-radius:999px;border:1px solid var(--ln,#232540);background:var(--cd,#141629);color:#c9cce0;font-weight:600;cursor:pointer}.wlang button.on{background:linear-gradient(90deg,#8b5cf6,#ec4899);color:#fff;border-color:transparent}.wview button{width:50px;height:50px;border-radius:50%;border:1px solid var(--ln,#232540);background:var(--cd,#141629);color:#fff;font-size:20px;cursor:pointer}.wview button.on{border-color:#8b5cf6}.wgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.wep{display:block;background:var(--cd,#141629);border:1px solid var(--ln,#232540);border-radius:16px;overflow:hidden;color:inherit;text-decoration:none}.wep.on,.wep:hover{border-color:#8b5cf6}.wth{position:relative;aspect-ratio:16/9;background:#0e1020;display:flex;align-items:center;justify-content:center}.wth img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.wni{font-size:26px;font-weight:700;color:#7c4dff}.wb1,.wb2{position:absolute;bottom:8px;padding:5px 12px;border-radius:999px;font-size:13px}.wb1{left:8px;background:#000c;color:#fff}.wb2{right:8px;background:#3b2a78cc;color:#a78bfa}.wtx{padding:12px 14px}.wtx strong{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wtx small{color:#7d819f;font-size:14px}.wgrid.list{grid-template-columns:1fr}.wgrid.list .wep{display:flex}.wgrid.list .wth{width:160px;flex:none;aspect-ratio:16/10}.wgrid.list .wtx{align-self:center;min-width:0}@media(min-width:800px){.wgrid{grid-template-columns:repeat(4,1fr)}.wgrid.list{grid-template-columns:1fr 1fr}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fd(v){if(!v)return '';var d=new Date(v);return isNaN(d)?'':d.toLocaleDateString('en',{month:'short',day:'numeric'})}
function build(a,cur){
 var list=Array.isArray(a.episodes)?a.episodes:[];
 var cards=list.length?list.map(function(x){
  var n=Number(x.episodeNumber!=null?x.episodeNumber:x.episode_number)||1;
  var dur=x.duration?(/^[\d.]+$/.test(String(x.duration))?x.duration+'min':x.duration):'';
  var meta=[dur,fd(x.release_date||x.air_date||x.created_at)].filter(Boolean).join(' \u2022 ');
  var lang=String(x.audio||x.language||'').toLowerCase();
  var img=x.thumbnail_url||'';
  return '<a href="#/watch/'+a.i+'/'+n+'" class="wep'+(n==cur?' on':'')+'" data-n="'+n+'" data-lang="'+esc(lang)+'" data-t="'+esc(String(x.title||'').toLowerCase())+'"><div class="wth">'+(img?'<img src="'+esc(img)+'" alt="" loading="lazy">':'<span class="wni">No Image</span>')+'<b class="wb1">EP '+n+'</b><b class="wb2">HD</b></div><div class="wtx"><strong>'+esc(x.title||'Episode '+n)+'</strong><small>'+esc(meta)+'</small></div></a>';
 }).join(''):'<p class="mu">No episodes added yet.</p>';
 var rel='';try{rel=rib(A.filter(function(x){return x.i!=a.i}).slice(0,8))}catch(e){rel='<p class="mu">No related titles.</p>'}
 return '<div class="wpn"><div class="wtabs"><button class="on" data-wt="e">Episodes ('+list.length+')</button><button data-wt="c">Comments</button><button data-wt="r">Reviews</button><button data-wt="l">Related</button></div>'+
 '<div data-wp="e"><div class="wtool"><input id="wsq" placeholder="Search episode..." aria-label="Search episode"></div><div class="wtool2"><div class="wlang"><button class="on" data-wl="">All</button><button data-wl="sub">Sub</button><button data-wl="dub">Dub</button></div><div class="wview"><button class="on" data-wv="grid" aria-label="Grid view">&#9638;</button><button data-wv="list" aria-label="List view">&#9776;</button></div></div><div class="wgrid" id="wgrid">'+cards+'</div><p class="mu" id="wnone" hidden>No episodes found.</p></div>'+
 '<div data-wp="c" hidden><p class="mu" style="margin-bottom:12px">Comments are on the anime page.</p><a class="btn" href="#/anime/'+a.i+'">Open comments</a></div><div data-wp="r" hidden><p class="mu">No reviews yet.</p></div><div data-wp="l" hidden>'+rel+'</div></div>';
}
function wire(root){
 var q=root.querySelector('#wsq'),g=root.querySelector('#wgrid'),none=root.querySelector('#wnone'),lang='';
 function apply(){var t=(q.value||'').toLowerCase().trim(),c=0;g.querySelectorAll('.wep').forEach(function(e){var ok=(!t||e.dataset.t.indexOf(t)>-1||('ep '+e.dataset.n).indexOf(t)>-1)&&(!lang||!e.dataset.lang||e.dataset.lang.indexOf(lang)>-1);e.style.display=ok?'':'none';if(ok)c++});none.hidden=c>0}
 q.addEventListener('input',apply);
 root.querySelectorAll('.wlang button').forEach(function(b){b.onclick=function(){root.querySelectorAll('.wlang button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');lang=b.dataset.wl;apply()}});
 root.querySelectorAll('.wview button').forEach(function(b){b.onclick=function(){root.querySelectorAll('.wview button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');g.classList.toggle('list',b.dataset.wv==='list')}});
 root.querySelectorAll('.wtabs button').forEach(function(b){b.onclick=function(){root.querySelectorAll('.wtabs button').forEach(function(x){x.classList.remove('on')});b.classList.add('on');root.querySelectorAll('[data-wp]').forEach(function(p){p.hidden=p.dataset.wp!==b.dataset.wt})}});
}
function run(){
 var m=location.hash.match(/^#\/watch\/([^\/]+)\/?(\d+)?/);if(!m)return;
 var wt=document.querySelector('.wt');if(!wt||wt.dataset.wp==='1')return;
 var a;try{a=A.find(function(x){return String(x.i)===String(m[1])})||A[+m[1]||0]}catch(e){return}
 if(!a)return;
 wt.dataset.wp='1';
 var side=wt.querySelector('.eps');side=side&&side.parentNode;
 if(side&&side.parentNode===wt)side.remove();
 wt.style.gridTemplateColumns='1fr';
 var box=document.createElement('div');box.innerHTML=build(a,+m[2]||1);
 var p=box.firstChild;wt.insertAdjacentElement('afterend',p);wire(p);
}
new MutationObserver(function(){run()}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',function(){setTimeout(run,50)});
run();
})();
