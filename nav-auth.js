// ==========================================================
// Sunspot — drop-in nav auth toggle
// Replaces "Sign in" link with a user chip when logged in.
// Include AFTER auth.js on any page.
// ==========================================================
(function () {
 if (!window.SunspotAuth) return;
 const user = window.SunspotAuth.currentUser();
 const navs = document.querySelectorAll('.site-header nav');
 navs.forEach(nav =>{
 // Remove existing signin/account/btn-ghost duplicates
 nav.querySelectorAll('a[href="signin.html"], a[href="account.html"], .user-chip, .btn-ghost').forEach(n =>n.remove());
 if (user) {
 const a = document.createElement('a');
 a.href = 'account.html';
 a.className = 'user-chip';
 const initial = (user.firstName || '?').charAt(0).toUpperCase();
 a.innerHTML = '<span class="user-chip-avatar">' + initial + '</span><span>' + user.firstName + '</span>';
 nav.appendChild(a);
 } else {
 const a = document.createElement('a');
 a.href = 'signin.html';
 a.className = 'btn-ghost';
 a.style.cssText = 'text-decoration:none;line-height:1.4';
 a.textContent = 'Sign in';
 nav.appendChild(a);
 }
 });
})();
