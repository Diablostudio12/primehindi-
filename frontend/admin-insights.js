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
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="overview"]'))setTimeout(load,150);});
setTimeout(load,1000);
})();
