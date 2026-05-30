/*
  Sunspot — client-side i18n (prototype).
  ───────────────────────────────────────────────────────────────────────────
  Mirrors the production WordPress setup (Polylang, free — see PLUGINS.md).
  Every translatable string here has a STABLE KEY (e.g. "nav.beaches").

  In WordPress these keys map 1:1 to things the team edits in wp-admin:
    • chrome / UI strings  → Polylang registered strings (pll_register_string)
    • page body copy        → translated pages/blocks, one per language
  So nothing here is hardcoded-only: each key is a backend-editable string.

  Markup contract (use in the HTML / header_unify.py):
    <a   data-i18n="nav.beaches">Beaches</a>             → translates textContent
    <h1  data-i18n-html="hero.h1">112 ways…</h1>          → translates innerHTML
    <input data-i18n-attr="placeholder:search.placeholder"> → translates an attr
    <meta  data-i18n-attr="content:meta.home.description">

  The English copy stays in the HTML as the source of truth AND the fallback,
  so an untranslated key never blanks out — it just shows English.
  Dictionaries live in /data/i18n/<lang>.json and supply mt + it.
*/
(function () {
  'use strict';

  var SUPPORTED = ['en', 'mt', 'it'];
  var DEFAULT = 'en';
  var dicts = {};        // lang -> { key: string }  (en stays empty: use source)

  function getLang() {
    try {
      var p = new URLSearchParams(location.search).get('lang');
      if (p && SUPPORTED.indexOf(p) !== -1) return p;
      var stored = JSON.parse(localStorage.getItem('sunspot_prefs') || '{}').lang;
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) {}
    return DEFAULT;
  }

  function setLang(code) {
    if (SUPPORTED.indexOf(code) === -1) return;
    try {
      var prefs = JSON.parse(localStorage.getItem('sunspot_prefs') || '{}');
      prefs.lang = code;
      localStorage.setItem('sunspot_prefs', JSON.stringify(prefs));
    } catch (e) {}
    // Keep the URL honest (shareable + SEO hreflang) without a reload.
    try {
      var url = new URL(location.href);
      if (code === DEFAULT) url.searchParams.delete('lang');
      else url.searchParams.set('lang', code);
      history.replaceState(null, '', url.toString());
    } catch (e) {}
    return load(code).then(function () { apply(code); });
  }

  function load(lang) {
    if (lang === DEFAULT) { dicts[lang] = {}; return Promise.resolve({}); }
    if (dicts[lang]) return Promise.resolve(dicts[lang]);
    // Resolve relative to this script so nested pages (/shop/, /operator/) work.
    var base = (document.currentScript && document.currentScript.src) || '';
    var dir = base ? base.slice(0, base.lastIndexOf('/') + 1) : '';
    return fetch(dir + 'data/i18n/' + lang + '.json')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { dicts[lang] = d || {}; return dicts[lang]; })
      .catch(function () { dicts[lang] = {}; return dicts[lang]; });
  }

  // Stash the original English on first touch so we can always fall back / restore.
  function srcText(el) {
    if (el.dataset.i18nSrc === undefined) el.dataset.i18nSrc = el.textContent;
    return el.dataset.i18nSrc;
  }
  function srcHtml(el) {
    if (el.dataset.i18nSrcHtml === undefined) el.dataset.i18nSrcHtml = el.innerHTML;
    return el.dataset.i18nSrcHtml;
  }

  function apply(lang) {
    lang = lang || getLang();
    var dict = dicts[lang] || {};

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      var src = srcText(el);
      el.textContent = dict[key] != null ? dict[key] : src;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.dataset.i18nHtml;
      var src = srcHtml(el);
      el.innerHTML = dict[key] != null ? dict[key] : src;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      // "placeholder:search.placeholder; title:foo.bar"
      el.dataset.i18nAttr.split(';').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length !== 2) return;
        var attr = bits[0].trim(), key = bits[1].trim();
        var store = 'i18nAttr_' + attr;
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) || '';
        el.setAttribute(attr, dict[key] != null ? dict[key] : el.dataset[store]);
      });
    });

    document.documentElement.lang = lang === 'en' ? 'en-MT' : lang + '-MT';
    document.dispatchEvent(new CustomEvent('sunspot:langchange', { detail: { lang: lang } }));
  }

  // Public API — header switcher and any late-injecting script can call these.
  window.SunspotI18n = {
    supported: SUPPORTED,
    getLang: getLang,
    setLang: setLang,
    apply: apply,
    load: load,
    // Re-translate after a script injects new DOM (e.g. features.js, audiences.js).
    refresh: function () { apply(getLang()); }
  };

  // Run as early as possible (this is a deferred script, so the DOM is parsed),
  // then again on load to catch content other deferred scripts inject.
  var initial = getLang();
  load(initial).then(function () { apply(initial); });
  window.addEventListener('load', function () { apply(getLang()); });
})();
