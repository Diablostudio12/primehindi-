(function(){
'use strict';
if(window.__primeHindiAdminInsights)return;window.__primeHindiAdminInsights=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v||0).toLocaleString('en-IN');
const cards=[
['Total Anime','total_anime','layers'],['Movies','total_movies','film'],['Episodes','total_episodes','clapperboard'],['Web Series','total_web_series','tv'],
['Ongoing','ongoing_titles','activity'],['Completed','completed_titles','check-circle'],['Coming Soon','coming_soon_titles','calendar-clock'],['Registered Users','registered_users','users'],
['New Users · 7 days','new_users_7d','user-plus'],['Active Viewers · 30 days','active_users_30d','radio'],['Tracked Plays','tracked_plays','play'],['Watchlist Additions','watchlist_additions','bookmark'],
['Pending Comments','pending_comments','message-circle'],['Player Reports','pending_player_reports','circle-alert'],['Unread Notifications','unread_notifications','bell'],['Studios','total_studios','clapperboard']
];
function styles(){if($('phInsightStyles'))return;const s=document.createElement('style');s.id='phInsightStyles';s.textContent='#phInsights{margin:0 0 22px}#phInsights .phMetricGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}#phInsights .phMetric{background:linear-gradient(145deg,#151c2a,#101621);border:1px solid var(--line,#273147);border-radius:14px;padding:15px;min-width:0}#phInsights .phMetricLabel{color:var(--muted,#91a0b8);font-size:12px;font-weight:650}#phInsights .phMetricValue{font:800 24px Sora,Inter,sans-serif;margin-top:8px;overflow-wrap:anywhere}#phInsights .phMeta{color:var(--muted,#91a0b8);font-size:11px;margin-top:12px}#phInsights .phPanel{margin-top:14px;background:linear-gradient(145deg,#151c2a,#101621);border:1px solid var(--line,#273147);border-radius:14px;padding:17px}#phInsights .phActivity{display:grid;gap:0}#phInsights .phRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:11px 0;border-bottom:1px solid var(--line,#273147)}#phInsights .phRow:last-child{border-bottom:0}#phInsights .phSmall{color:var(--muted,#91a0b8);font-size:11px;overflow-wrap:anywhere}#phInsights .phHealth{display:flex;align-items:center;gap:8px;font-weight:700}#phInsights .phDot{width:8px;height:8px;border-radius:50%;background:#54d6a0;display:inline-block}@media(max-width:1050px){#phInsights .phMetricGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){#phInsights .phMetricGrid{grid-template-columns:repeat(2,minmax(0,1fr))}#phInsights .phMetric{padding:12px}#phInsights .phMetricValue{font-size:21px}}';document.head.appendChild(s)}
function getToken(){return sessionStorage.getItem('ps_admin_token')||''}
async function load(){
 const view=$('view-overview');if(!view||!getToken())return;
 styles();let root=$('phInsights');if(!root){root=document.createElement('section');root.id='phInsights';view.prepend(root)}
 root.innerHTML='<div class="panel" style="padding:18px;margin-bottom:12px"><div class="phHealth"><span class="phDot"></span>Live database metrics <span class="muted" style="font-weight:400;margin-left:auto">Loading…</span></div></div>';
 try{
  const res=await fetch('/api/admin/overview',{headers:{Authorization:'Bearer '+getToken()},cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.error||'Metrics could not be loaded.');
  const m=data.metrics||{};
  root.innerHTML='<div class="panelHead" style="margin:0 0 13px"><div><h2 style="margin:0">Live overview</h2><p class="muted" style="margin:4px 0 0">Database-backed counts · refreshed '+new Date(data.generatedAt).toLocaleTimeString()+'</p></div><button class="btn secondary small" id="phRefresh">↻ Refresh</button></div><div class="phMetricGrid">'+cards.map(([label,key])=>'<article class="phMetric"><div class="phMetricLabel">'+esc(label)+'</div><div class="phMetricValue">'+fmt(m[key])+'</div></article>').join('')+'</div><div class="phPanel"><div class="panelHead" style="margin:0 0 7px"><div><h2 style="margin:0">Recent admin activity</h2><p class="muted" style="margin:4px 0 0">Latest successful administrative changes recorded by the backend.</p></div></div><div class="phActivity">'+((data.recentActivity||[]).length?(data.recentActivity||[]).map(a=>'<div class="phRow"><div><strong>'+esc(a.action)+'</strong><div class="phSmall">'+esc(a.actor_email)+' · '+esc(a.actor_role)+' · '+esc(a.method)+' '+esc(a.path)+'</div></div><div style="text-align:right"><div>'+esc(a.status_code)+'</div><div class="phSmall">'+(a.created_at?new Date(a.created_at).toLocaleString():'')+'</div></div></div>').join(''):'<p class="muted">No admin activity has been recorded yet.</p>')+'</div><p class="phMeta">Tracked plays means saved playback-progress records, not verified stream starts. Active viewers are users with playback progress updated in the last 30 days. Favorites and ratings are not shown because the current schema does not expose those datasets.</p></div>';
  $('phRefresh').addEventListener('click',load);
 }catch(e){root.innerHTML='<div class="panel" style="padding:18px"><strong>Dashboard metrics unavailable</strong><p class="muted">'+esc(e.message)+'</p><button class="btn secondary small" id="phRetry">Try again</button></div>';$('phRetry').addEventListener('click',load)}
}
async function loadAnalytics(){
 const root=$('phAnalyticsTrend');if(!root||!getToken())return;
 const days=Number($('phAnalyticsRange')?.value||30);
 root.innerHTML='<p class="phSmall">Loading analytics…</p>';
 try{
  const res=await fetch('/api/admin/analytics/series?days='+encodeURIComponent(days),{headers:{Authorization:'Bearer '+getToken()},cache:'no-store'});
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Analytics unavailable');
  const rows=Array.isArray(data.series)?data.series:[];
  if(!rows.length){root.innerHTML='<p class="phSmall">No analytics data available for this range.</p>';return}
  const max=Math.max(1,...rows.map(x=>Number(x.views||0)),...rows.map(x=>Number(x.signups||0)));
  const W=760,H=160,L=30,R=12,T=12,B=28,iw=W-L-R,ih=H-T-B;
  const pts=key=>rows.map((x,i)=>{const xx=L+(rows.length===1?0:i*iw/(rows.length-1));const yy=T+ih-(Number(x[key]||0)/max)*ih;return xx.toFixed(1)+','+yy.toFixed(1)}).join(' ');
  const labels=[rows[0],rows[Math.floor((rows.length-1)/2)],rows[rows.length-1]].map(x=>new Date(x.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}));
  root.innerHTML='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px"><span class="phSmall"> <span style="color:#70a5ff">●</span> Playback progress updates</span><span class="phSmall"><span style="color:#59d5ad">●</span> New accounts</span><span class="phSmall">'+days+' days</span></div><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Daily playback progress updates and new account registrations" style="width:100%;height:auto;max-height:260px"><line x1="'+L+'" y1="'+(T+ih)+'" x2="'+(W-R)+'" y2="'+(T+ih)+'" stroke="#334155"/><line x1="'+L+'" y1="'+(T+ih/2)+'" x2="'+(W-R)+'" y2="'+(T+ih/2)+'" stroke="#253044" stroke-dasharray="4 5"/><polyline points="'+pts('views')+'" fill="none" stroke="#70a5ff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><polyline points="'+pts('signups')+'" fill="none" stroke="#59d5ad" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><text x="'+L+'" y="'+(H-6)+'" fill="#91a0b8" font-size="11">'+esc(labels[0])+'</text><text x="'+(W/2)+'" y="'+(H-6)+'" text-anchor="middle" fill="#91a0b8" font-size="11">'+esc(labels[1])+'</text><text x="'+(W-R)+'" y="'+(H-6)+'" text-anchor="end" fill="#91a0b8" font-size="11">'+esc(labels[2])+'</text></svg>';
  const top=$('phTopTitles');if(top)top.innerHTML=(data.topStreamed||[]).length?'<div class="phActivity">'+data.topStreamed.map((x,i)=>'<div class="phRow"><div><strong>'+esc(i+1)+'. '+esc(x.title)+'</strong></div><div>'+fmt(x.streams)+' records</div></div>').join('')+'</div>':'<p class="phSmall">No saved playback records for titles yet.</p>';
 }catch(e){root.innerHTML='<p class="phSmall">'+esc(e.message)+' <button class="btn secondary small" id="phAnalyticsRetry">Retry</button></p>';const b=$('phAnalyticsRetry');if(b)b.addEventListener('click',loadAnalytics)}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="overview"]'))setTimeout(load,150);if(e.target.closest('[data-tab="analytics"]'))setTimeout(loadAnalytics,150);if(e.target.closest('#phAnalyticsRefresh'))loadAnalytics()});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='phAnalyticsRange')loadAnalytics()});
setTimeout(load,1000);
})();
