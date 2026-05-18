// ==========================================================
// Sunspot — customer auth (frontend)
//
// In production this calls:
// POST /wp-json/jwt-auth/v1/token ← JWT Authentication plugin
// GET /wp-json/wp/v2/users/me ← WP core
// GET /wp-json/sunspot/v1/me/bookings ← our custom endpoint
//
// For the static preview we simulate the same flow with localStorage.
// Token is stored once; user data refreshes on every page load.
// ==========================================================
(function () {
 'use strict';

 const STORAGE_KEY = 'sunspot_customer_session';
 const USERS_KEY = 'sunspot_customers_db';

 // ---------- "Database" (localStorage in preview, WP in prod) ----------
 function loadUsers() {
 const raw = localStorage.getItem(USERS_KEY);
 const seeded = raw ? JSON.parse(raw) : {
 'demo@sunspot.mt': {
 id: 1,
 email: 'demo@sunspot.mt',
 password: 'demo',
 firstName: 'Demo', lastName: 'User',
 phone: '+356 9900 0000',
 marketing: true,
 joinedAt: '2026-01-15',
 favourites: ['noma', 'flo', 'manta'],
 },
 };
 if (!raw) localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
 return seeded;
 }
 function saveUsers(users) {
 localStorage.setItem(USERS_KEY, JSON.stringify(users));
 }
 function registerUser(payload) {
 const users = loadUsers();
 if (users[payload.email.toLowerCase()]) {
 return { ok: false, msg: 'An account with this email already exists.' };
 }
 const id = Date.now();
 users[payload.email.toLowerCase()] = {
 id, email: payload.email,
 password: payload.password,
 firstName: payload.firstName,
 lastName: payload.lastName,
 phone: payload.phone || '',
 marketing: !!payload.marketing,
 joinedAt: new Date().toISOString().slice(0, 10),
 favourites: [],
 };
 saveUsers(users);
 return { ok: true, id };
 }
 function loginUser(email, password) {
 const users = loadUsers();
 const u = users[email.toLowerCase().trim()];
 if (!u) return { ok: false, msg: 'No account with that email.' };
 if (u.password !== password) return { ok: false, msg: 'Wrong password.' };
 // Mock-JWT — in production this is the real JWT from the plugin
 const token = 'sunspot.' + btoa(JSON.stringify({ uid: u.id, email: u.email, iat: Date.now() }));
 return { ok: true, token, user: u };
 }
 function getSession() {
 const raw = localStorage.getItem(STORAGE_KEY);
 return raw ? JSON.parse(raw) : null;
 }
 function setSession(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
 function clearSession() { localStorage.removeItem(STORAGE_KEY); }

 // ---------- Public API ----------
 window.SunspotAuth = {
 currentUser() {
 const s = getSession();
 if (!s) return null;
 const users = loadUsers();
 return users[s.email.toLowerCase()] || null;
 },
 isLoggedIn() { return !!getSession(); },
 getToken() { const s = getSession(); return s ? s.token : null; },
 login(email, password) {
 const res = loginUser(email, password);
 if (res.ok) setSession({ email: email.toLowerCase(), token: res.token });
 return res;
 },
 register(payload) {
 const res = registerUser(payload);
 if (res.ok) {
 // Auto-login after register
 setSession({ email: payload.email.toLowerCase(), token: 'sunspot.' + btoa(JSON.stringify({ uid: res.id, email: payload.email })) });
 }
 return res;
 },
 logout() { clearSession(); },
 updateProfile(patch) {
 const u = this.currentUser();
 if (!u) return { ok: false };
 const users = loadUsers();
 Object.assign(users[u.email.toLowerCase()], patch);
 saveUsers(users);
 return { ok: true };
 },
 toggleFavourite(venueId) {
 const u = this.currentUser();
 if (!u) return false;
 const users = loadUsers();
 const list = users[u.email.toLowerCase()].favourites || [];
 const i = list.indexOf(venueId);
 if (i>= 0) list.splice(i, 1); else list.push(venueId);
 users[u.email.toLowerCase()].favourites = list;
 saveUsers(users);
 return list.indexOf(venueId)>= 0;
 },
 };

 // ---------- Wire signin / signup forms (signin.html) ----------
 const tabs = document.querySelectorAll('.auth-tab');
 function showTab(name) {
 tabs.forEach(t =>t.classList.toggle('active', t.dataset.tab === name));
 document.getElementById('signin-form').hidden = name !== 'signin';
 document.getElementById('signup-form').hidden = name !== 'signup';
 }
 tabs.forEach(t =>t.addEventListener('click', () =>showTab(t.dataset.tab)));
 document.querySelectorAll('[data-switch]').forEach(a =>{
 a.addEventListener('click', e =>{ e.preventDefault(); showTab(a.dataset.switch); });
 });

 const signinForm = document.getElementById('signin-form');
 if (signinForm) {
 signinForm.addEventListener('submit', e =>{
 e.preventDefault();
 const email = document.getElementById('signin-email').value.trim();
 const pw = document.getElementById('signin-password').value;
 const res = window.SunspotAuth.login(email, pw);
 const err = document.getElementById('signin-error');
 if (!res.ok) { err.textContent = res.msg; err.hidden = false; return; }
 window.location = 'account.html';
 });
 }

 const signupForm = document.getElementById('signup-form');
 if (signupForm) {
 signupForm.addEventListener('submit', e =>{
 e.preventDefault();
 const res = window.SunspotAuth.register({
 firstName: document.getElementById('su-first').value.trim(),
 lastName: document.getElementById('su-last').value.trim(),
 email: document.getElementById('su-email').value.trim(),
 password: document.getElementById('su-password').value,
 phone: document.getElementById('su-phone').value.trim(),
 marketing: document.getElementById('su-marketing').checked,
 });
 const err = document.getElementById('signup-error');
 if (!res.ok) { err.textContent = res.msg; err.hidden = false; return; }
 window.location = 'account.html?welcome=1';
 });
 }
})();
