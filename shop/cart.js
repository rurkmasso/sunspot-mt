// Sunspot Shop — cart state in localStorage
(function () {
 'use strict';
 const KEY = 'sunspot_cart_v1';

 function read() {
 try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
 }
 function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

 function add(item) {
 const items = read();
 // Same product + colour + size = increment qty
 const match = items.find(i =>i.id === item.id && i.color === item.color && i.size === item.size);
 if (match) { match.qty += (item.qty || 1); }
 else { items.push(Object.assign({ qty: 1 }, item)); }
 write(items);
 refreshHeader();
 toast('Added to cart');
 }
 function remove(idx) {
 const items = read();
 items.splice(idx, 1);
 write(items);
 refreshHeader();
 }
 function setQty(idx, qty) {
 const items = read();
 if (qty <= 0) { items.splice(idx, 1); }
 else { items[idx].qty = qty; }
 write(items);
 refreshHeader();
 }
 function clear() { write([]); refreshHeader(); }
 function count() { return read().reduce((s, i) =>s + i.qty, 0); }
 function subtotal() { return read().reduce((s, i) =>s + (i.price * i.qty), 0); }

 function refreshHeader() {
 const n = count();
 const el = document.getElementById('cart-count');
 if (el) {
 el.textContent = n;
 el.classList.toggle('has', n>0);
 }
 }

 function toast(msg) {
 let t = document.querySelector('.shop-toast');
 if (!t) {
 t = document.createElement('div');
 t.className = 'shop-toast';
 document.body.appendChild(t);
 }
 t.textContent = msg;
 t.classList.add('show');
 clearTimeout(t._t);
 t._t = setTimeout(() =>t.classList.remove('show'), 1800);
 }

 window.SunspotCart = { read, add, remove, setQty, clear, count, subtotal, refreshHeader };
})();
