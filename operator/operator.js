/* ============================================================
   Sunspot Operator — bookings + sunbed/pool setup.

   In production:   reads window.SUNSPOT_API_BASE (e.g. https://sunspot.mt/wp-json)
                    + a JWT from localStorage (sunspot_op_jwt).
   In demo mode:    falls back to deterministic sample data so the
                    app is browsable on github.io without a backend.
   ============================================================ */
(function () {
  'use strict';

  // Honor demo override BEFORE we capture API/TOKEN. Without this, clicking
  // "Open demo" reloaded the page but DEMO was already computed against the
  // pre-override values, so the demo never actually kicked in.
  if (sessionStorage.getItem('sunspot_op_demo') === '1') {
    window.SUNSPOT_API_BASE = null;
  }

  const API   = window.SUNSPOT_API_BASE || null;
  const TOKEN = (() => { try { return localStorage.getItem('sunspot_op_jwt'); } catch { return null; } })();
  const DEMO  = !API || !TOKEN;

  // ----- DEMO DATA (used when no real backend is wired) -----
  // In demo mode we simulate ONE operator account — "AX Resorts Group" —
  // who owns just 2 venues. Critically: they DO NOT see Aqualuna or Noma
  // (competitors). In production, /sunspot/v1/operator/venues already
  // returns only the logged-in operator's own venues (server-side scoped
  // by sunspot_my_venue_slugs in operator-rest.php). This demo mirrors
  // that isolation so what you see here = what a real operator would see.
  const DEMO_OPERATOR = { name: 'AX Resorts Group', initial: 'A' };
  const DEMO_VENUES = [
    { id: 'bonita-beach-club', name: 'Bonita Beach Club', rating: 4.5, spots_left: 28, sunbed_from: 15, today_bookings: 11, capacity: 80, location: 'Mellieha Bay' },
    { id: 'solas-rooftop',     name: 'Solas Rooftop',     rating: 4.4, spots_left: 14, sunbed_from: 22, today_bookings:  7, capacity: 40, location: 'Qawra' },
  ];
  function demoBookings(venueId) {
    // First — surface any REAL customer bookings the user just made via the
    // customer funnel (booking.html → checkout.html). Same browser, same
    // localStorage, so an end-to-end demo story works.
    let real = [];
    try {
      const stored = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
      real = stored
        .filter(b => !venueId || b.clubId === venueId || (b.clubName || '').toLowerCase().includes((venueId || '').replace(/-/g, ' ')))
        .map(b => ({
          id:              b.ref,
          ref:             b.ref,
          venue:           b.clubId || venueId,
          date:            b.date,
          spots:           (b.seats || []).map(s => s.id),
          total:           +b.total || 0,
          currency:        'EUR',
          guest_name:      b.guest ? (b.guest.firstName + ' ' + b.guest.lastName).trim() : 'Guest',
          guest_email:     b.guest ? b.guest.email : '',
          status:          'confirmed',
          operator_action: b.operator_action || 'pending',  // every new booking starts pending operator-side
          created_at:      b.createdAt || new Date().toISOString(),
          isReal:          true,
        }));
    } catch (e) {}

    // Then add seeded demo bookings (so the panel feels populated)
    const guests = ['Anya Schmidt','James Walsh','Marco Rossi','Lara Mifsud','Sven Eriksson','Sophie Laurent','David Kim','Tara Nolan'];
    const seeded = Array.from({ length: 10 }, (_, i) => {
      const states = ['pending','pending','accept','accept','accept','arrived','arrived','accept','arrived','pending'];
      const total = [40, 50, 25, 80, 30, 130, 25, 50, 280, 40][i];
      // Same friendly BJ-#### format the customer sees on confirmation
      const refNum = 1000 + ((i * 137) % 9000);
      const refTail = (i.toString(36) + 'X').slice(0, 2).toUpperCase();
      return {
        id: 'demo-' + i,
        ref: 'BJ-' + refNum + '-' + refTail,
        venue: venueId,
        date: new Date().toISOString().slice(0,10),
        spots: ['A' + (i+3), 'A' + (i+4)].slice(0, (i%3)+1),
        total,
        currency: 'EUR',
        guest_name: guests[i % guests.length],
        guest_email: guests[i % guests.length].toLowerCase().replace(/\s+/g, '.') + '@example.com',
        status: 'confirmed',
        operator_action: states[i],
        created_at: new Date(Date.now() - (i+1)*900000).toISOString(),
      };
    });
    // Real bookings first (newest)
    return real.concat(seeded);
  }
  function demoSeatmap(venueId) {
    // Deterministic per-venue "taken" pattern
    const seed = venueId.charCodeAt(0) + venueId.length;
    function r(n) { return (Math.sin(seed * (n+1)) + 1) / 2; }
    const taken = [];
    for (let i = 0; i < 40; i++) if (r(i) > 0.65) taken.push('A' + (i+1));
    return {
      venue_id: venueId,
      date: new Date().toISOString().slice(0,10),
      capacity: { sunbeds: 40, cabanas: 8, vip: 3 },
      taken_spots: taken,
      inactive_spots: [],
    };
  }

  // ----- DOM helpers -----
  const $  = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));

  let state = {
    venue:    null,
    venues:   [],
    bookings: [],
    seatmap:  null,
    filter:   'all',
    inactive: new Set(),
    operator: DEMO_OPERATOR,  // exposed for the header/greeting
  };
  // Expose so other modules (operator-polish, operator-live) can read
  // the same source of truth without re-querying.
  window.opState = state;
  function emitStateChange() {
    document.dispatchEvent(new CustomEvent('op:state-change', { detail: state }));
  }

  // ----- API layer (real OR demo) -----
  async function apiGet(path) {
    if (DEMO) return demoFor(path);
    const r = await fetch(API + path, {
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/json' },
    });
    if (!r.ok) throw new Error('API ' + r.status);
    return r.json();
  }
  async function apiPost(path, body) {
    if (DEMO) return { ok: true };
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  }
  async function apiPut(path, body) {
    if (DEMO) return { ok: true };
    const r = await fetch(API + path, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  }
  function demoFor(path) {
    if (path === '/sunspot/v1/operator/venues') return Promise.resolve(DEMO_VENUES);
    if (/operator\/bookings/.test(path)) return Promise.resolve(demoBookings(state.venue || 'aqualuna'));
    if (/operator\/venues\/[^/]+\/seatmap/.test(path)) {
      const id = path.match(/venues\/([^/]+)\/seatmap/)[1];
      return Promise.resolve(demoSeatmap(id));
    }
    return Promise.resolve(null);
  }

  // ----- Rendering -----
  function renderVenues() {
    const sel = $('#op-venue');
    sel.innerHTML = state.venues.map(v =>
      '<option value="' + v.id + '"' + (v.id === state.venue ? ' selected' : '') + '>' + v.name + '</option>'
    ).join('');
  }

  function renderBookings() {
    const filtered = state.bookings.filter(b =>
      state.filter === 'all' ? true : (b.operator_action || 'pending') === state.filter
    );
    const list = $('#op-bookings-list');
    if (!filtered.length) {
      list.innerHTML = '<div class="op-empty"><h3>Nothing for this filter</h3><p>Try another tab above.</p></div>';
      return;
    }
    list.innerHTML = filtered.map(b => {
      const action = b.operator_action || 'pending';
      const spots = (b.spots || []).join(' · ') || '—';
      const time = new Date(b.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      let actionsHtml;
      if (action === 'pending') {
        actionsHtml = '<div class="op-booking-actions">' +
          '<button class="decline" data-action="decline" data-id="' + b.id + '">Decline</button>' +
          '<button class="accept"  data-action="accept"  data-id="' + b.id + '">Accept</button>' +
        '</div>';
      } else if (action === 'accept') {
        actionsHtml = '<div class="op-booking-actions">' +
          '<button data-action="noshow"  data-id="' + b.id + '">No-show</button>' +
          '<button class="scan" data-action="arrived" data-id="' + b.id + '">Mark arrived</button>' +
        '</div>';
      } else {
        actionsHtml = '<div class="op-booking-actions done">' +
          (action === 'arrived'  ? 'Arrived' :
           action === 'decline'  ? 'Declined' :
           action === 'noshow'   ? 'No-show recorded' : '') +
        '</div>';
      }

      const realTag = b.isReal ? ' <span class="op-booking-tag real" title="From customer funnel">new</span>' : '';
      const labels = { pending: 'Pending', accept: 'Accepted', arrived: 'Arrived', decline: 'Declined', noshow: 'No-show' };
      return '<article class="op-booking ' + (b.isReal ? 'is-real' : '') + '" data-status="' + action + '">' +
        '<div class="op-booking-head">' +
          '<div class="op-booking-meta">' +
            '<strong>' + b.guest_name + '</strong>' +
            '<span class="ref">' + b.ref + ' · ' + time + '</span>' +
            '<span class="op-booking-tag ' + action + '">' + (labels[action] || action) + '</span>' + realTag +
          '</div>' +
          '<div class="op-booking-amount">€' + Math.round(b.total) + '</div>' +
        '</div>' +
        '<div class="op-booking-body">' +
          '<span>' + spots + '</span>' +
          '<span>' + (b.guest_email || '—') + '</span>' +
        '</div>' +
        actionsHtml +
      '</article>';
    }).join('');

    list.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const act = btn.dataset.action;
        const target = state.bookings.find(x => x.id == id);
        if (!target) return;
        // Destructive actions use the friendly bottom sheet instead of confirm()
        if ((act === 'decline' || act === 'noshow') && window.opConfirm) {
          const ok = await window.opConfirm({
            title: act === 'decline' ? 'Decline this booking?' : 'Mark as no-show?',
            body:  act === 'decline'
              ? 'The guest will be refunded in 3-5 business days and the spot returns to inventory.'
              : 'The booking will be recorded as a no-show. The spot returns to inventory.',
            ok: act === 'decline' ? 'Yes, decline' : 'Yes, no-show',
            cancel: 'Keep it',
            danger: true,
          });
          if (!ok) return;
        }
        target.operator_action = act;
        renderBookings();
        renderStats();
        renderChipCounts();
        // Friendly per-action toast
        if (window.opToast) {
          const messages = {
            accept:  'Booking accepted',
            decline: 'Booking declined · refund issued',
            arrived: 'Guest checked in',
            noshow:  'Recorded as no-show',
            refund:  'Refund issued',
          };
          const kinds = { decline: 'warn', noshow: 'warn', refund: 'warn' };
          window.opToast(messages[act] || 'Updated', kinds[act] || 'success');
        }
        // If this is a REAL customer booking (came via the customer funnel),
        // persist the operator action back into sunspot_bookings so the
        // customer sees it too (their Bookings page reflects the status).
        if (target.isReal) {
          try {
            const list = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
            const idx = list.findIndex(b => b.ref === target.ref);
            if (idx >= 0) {
              list[idx].operator_action = act;
              list[idx].operator_action_at = new Date().toISOString();
              localStorage.setItem('sunspot_bookings', JSON.stringify(list));
            }
          } catch (e) {}
        }
        // Always send to backend if wired
        await apiPost('/sunspot/v1/operator/bookings/' + id + '/action', { action: act });
        emitStateChange();
      });
    });
  }

  function renderStats() {
    $('#op-stat-bookings').textContent = state.bookings.length;
    $('#op-stat-revenue').textContent = '€' +
      Math.round(state.bookings.reduce((s, b) => s + (b.total || 0), 0));
    $('#op-stat-arrived').textContent =
      state.bookings.filter(b => b.operator_action === 'arrived').length;

    // Week panel (synthesized from demo)
    const weekBookings = state.bookings.length * 6;
    const weekRev = state.bookings.reduce((s, b) => s + (b.total || 0), 0) * 6;
    $('#op-week-bookings').textContent = weekBookings;
    $('#op-week-revenue').textContent = '€' + weekRev.toLocaleString('en-GB');
    $('#op-week-occupancy').textContent = '87%';
    $('#op-payout-amount').textContent = '€' + Math.round(weekRev * 0.92).toLocaleString('en-GB');
    $('#op-top-days').innerHTML = ['Saturday','Sunday','Friday','Wednesday','Thursday'].map(d =>
      '<div style="display:flex;justify-content:space-between"><span>' + d + '</span><strong>' + Math.round(Math.random() * 40 + 30) + ' bookings</strong></div>'
    ).join('');
  }

  function renderChipCounts() {
    $('#cnt-all').textContent      = state.bookings.length;
    $('#cnt-pending').textContent  = state.bookings.filter(b => (b.operator_action||'pending') === 'pending').length;
    $('#cnt-accept').textContent   = state.bookings.filter(b => b.operator_action === 'accept').length;
    $('#cnt-arrived').textContent  = state.bookings.filter(b => b.operator_action === 'arrived').length;
  }

  function renderSeatmap() {
    const s = state.seatmap;
    if (!s) return;
    // Layout is now driven by the aerial map (operator-aerial.js). The grid
    // below only renders if its container is visible (fallback case).
    const grid = $('#op-seatmap-grid');
    if (!grid) return;
    const dateEl = $('#op-seatmap-date');
    if (dateEl) dateEl.textContent = new Date(s.date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'short' });
    const taken = new Set(s.taken_spots);
    const inactive = new Set(s.inactive_spots);
    state.inactive = inactive;

    function cell(id) {
      let st = 'free';
      if (taken.has(id)) st = 'taken';
      else if (inactive.has(id)) st = 'inactive';
      return '<button class="op-seat" data-spot="' + id + '" data-state="' + st + '">' + id + '</button>';
    }
    grid.innerHTML = Array.from({ length: s.capacity.sunbeds }, (_, i) => cell('A' + (i+1))).join('');
    const cab = $('#op-cabana-grid'); if (cab) cab.innerHTML = Array.from({ length: s.capacity.cabanas }, (_, i) => cell('C' + (i+1))).join('');
    const vip = $('#op-vip-grid');    if (vip) vip.innerHTML = Array.from({ length: s.capacity.vip },     (_, i) => cell('V' + (i+1))).join('');

    document.querySelectorAll('.op-seat').forEach(seat => {
      seat.addEventListener('click', async () => {
        const id = seat.dataset.spot;
        if (taken.has(id)) return;   // can't toggle a booked spot
        const wasInactive = inactive.has(id);
        if (wasInactive) inactive.delete(id); else inactive.add(id);
        seat.dataset.state = wasInactive ? 'free' : 'inactive';
        await apiPut('/sunspot/v1/operator/venues/' + state.venue + '/spots/' + id, { active: wasInactive });
      });
    });
  }

  // ----- Tab + bottom-nav wiring -----
  function showPanel(name) {
    $$('.op-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
    $$('.op-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
    $$('.op-bottom-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
  }
  $$('.op-tab').forEach(t => t.addEventListener('click', () => showPanel(t.dataset.panel)));
  $$('.op-bottom-nav a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    showPanel(a.dataset.nav);
  }));
  $('#op-scan-btn').addEventListener('click', () => {
    if (!('mediaDevices' in navigator)) {
      alert('Camera not available. Open the booking and ask the guest to read out the ref.');
      return;
    }
    alert('Demo: this opens the phone camera and looks for a Sunspot QR. On scan the booking is flipped to "arrived" instantly. (Real implementation uses BarcodeDetector API.)');
  });
  $$('.op-chip').forEach(chip => chip.addEventListener('click', () => {
    state.filter = chip.dataset.filter;
    $$('.op-chip').forEach(c => c.classList.toggle('active', c === chip));
    renderBookings();
  }));
  $('#op-venue').addEventListener('change', async () => {
    state.venue = $('#op-venue').value;
    await loadVenueData();
  });

  // ----- Boot -----
  async function boot() {
    try { state.venues = await apiGet('/sunspot/v1/operator/venues') || []; }
    catch (e) { state.venues = []; }
    if (!state.venues.length) {
      document.body.innerHTML =
        '<div class="op-setup">' +
          '<h2>Connect your venue</h2>' +
          '<p>This is the Sunspot Operator console. You need a venue assigned to your account before you can take bookings.</p>' +
          '<label>WP site URL</label>' +
          '<input id="op-api-url" placeholder="https://sunspot.mt" type="url">' +
          '<label>Operator app password</label>' +
          '<input id="op-api-key" placeholder="xxxx xxxx xxxx xxxx" type="text">' +
          '<button id="op-connect-btn">Connect</button>' +
          '<div class="demo-row">No backend yet? Try the demo with sample bookings — see how the flow works before going live.' +
            '<button id="op-demo-btn">Open demo</button>' +
          '</div>' +
        '</div>';
      document.getElementById('op-demo-btn').addEventListener('click', () => {
        // Force demo mode for one tab
        sessionStorage.setItem('sunspot_op_demo', '1');
        location.reload();
      });
      document.getElementById('op-connect-btn').addEventListener('click', () => {
        const url = document.getElementById('op-api-url').value.trim().replace(/\/$/, '');
        const key = document.getElementById('op-api-key').value.trim();
        if (!url || !key) { alert('Both fields required'); return; }
        // In production we'd POST /jwt-auth/v1/token. For now stash and reload.
        localStorage.setItem('sunspot_op_api', url + '/wp-json');
        localStorage.setItem('sunspot_op_jwt', key);
        location.reload();
      });
      return;
    }
    state.venue = state.venues[0].id;
    renderVenues();
    await loadVenueData();
  }

  async function loadVenueData() {
    try {
      state.bookings = await apiGet('/sunspot/v1/operator/bookings?venue=' + state.venue) || [];
      state.seatmap  = await apiGet('/sunspot/v1/operator/venues/' + state.venue + '/seatmap');
    } catch (e) {
      state.bookings = []; state.seatmap = null;
    }
    // Show today's date prominently in the section title
    const today = new Date();
    const el = document.getElementById('op-today-date');
    if (el) el.textContent = today.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    renderBookings();
    renderStats();
    renderChipCounts();
    renderSeatmap();
    emitStateChange();
  }

  boot();
})();
