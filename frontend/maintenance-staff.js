/* Maintenance bypass for staff (owner/admin/editor).
   When maintenance_mode is ON, a signed-in active staff member still sees the normal site. */
(function () {
  var TOKEN_KEY = 'pdi_stream_token';
  var realFetch = window.fetch.bind(window);
  var maintenanceActive = false;

  async function isStaff() {
    try {
      var tk = localStorage.getItem(TOKEN_KEY);
      if (!tk) return false;
      var r = await realFetch('/api/admin/whoami', { headers: { Authorization: 'Bearer ' + tk }, cache: 'no-store' });
      return r.ok;
    } catch (e) { return false; }
  }

  function addStaffLink() {
    setTimeout(function () {
      if (!maintenanceActive || document.getElementById('pdiStaffLink')) return;
      var ph = Array.prototype.find.call(document.querySelectorAll('.ph'), function (n) {
        return /under maintenance/i.test(n.textContent || '');
      });
      if (!ph || !ph.parentNode) return;
      var p = document.createElement('p');
      p.id = 'pdiStaffLink';
      p.className = 'mu';
      p.innerHTML = '<a href="#/signin" style="color:inherit;opacity:.7;text-decoration:underline">Staff sign in</a>';
      ph.parentNode.appendChild(p);
    }, 700);
  }

  window.fetch = async function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var res = await realFetch(input, init);
    if (!/\/api\/site-settings(\?|$)/.test(url)) return res;
    try {
      var cfg = await res.clone().json();
      if (!cfg || !cfg.maintenance_mode) return res;
      if (await isStaff()) {
        cfg.maintenance_mode = false;
        return new Response(JSON.stringify(cfg), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      maintenanceActive = true;
      addStaffLink();
    } catch (e) { /* fall through to original response */ }
    return res;
  };

  // After a staff member signs in on the maintenance screen, reload so the normal site opens.
  window.addEventListener('hashchange', async function () {
    if (!maintenanceActive) return;
    if (await isStaff()) location.reload();
  });
})();
