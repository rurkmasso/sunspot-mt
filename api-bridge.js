/* ============================================================
   Sunspot — API bridge
   If window.SUNSPOT_API_BASE is set, replace the static catalog
   arrays with live data from WordPress REST.

   Set in production via inline <script> before clubs-data.js:
     <script>window.SUNSPOT_API_BASE = "https://sunspot.mt/wp-json";</script>

   In demo / github.io mode (no API base), the static arrays
   in clubs-data.js + experiences-data.js are used unchanged.
   ============================================================ */
(function () {
  'use strict';

  const API = window.SUNSPOT_API_BASE;
  if (!API) return;   // demo mode — bail out, let static files load

  // ----- Fetch helpers -----
  async function fetchAll(path) {
    const r = await fetch(API.replace(/\/$/, '') + path, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('API ' + r.status);
    return r.json();
  }

  function mapVenue(p) {
    // Translate a sunspot_venue post into the static schema our JS expects.
    const m = p.venue_meta || {};
    return {
      id:                  p.slug,
      name:                p.title?.rendered || p.title,
      category:            (p.venue_category?.[0] && (p._embedded?.['wp:term']?.[0]?.[0]?.slug)) || p.category || 'beach-club',
      region:              (p.venue_region?.[0]   && (p._embedded?.['wp:term']?.[1]?.[0]?.slug)) || p.region   || 'central',
      location:            m.location || '',
      regionLabel:         m.region_label || '',
      coords:              { lat: parseFloat(m.lat) || 0, lng: parseFloat(m.lng) || 0 },
      hasBookableSunbeds:  m.has_bookable_sunbeds == '1' || m.has_bookable_sunbeds === true,
      sunbedFrom:          +m.sunbed_from || null,
      cabanaFrom:          +m.cabana_from || null,
      vipFrom:             +m.vip_from    || null,
      spotsLeft:           +m.spots_left  || 0,
      rating:              +m.rating || 4.5,
      reviews:             +m.reviews || 0,
      summary:             m.summary || (p.excerpt?.rendered || '').replace(/<[^>]+>/g,'').trim(),
      description:         (p.content?.rendered || '').replace(/<[^>]+>/g,'').trim(),
      amenities:           m.amenities  || [],
      features:            m.features   || [],
      bestFor:             m.best_for   || [],
      socials:             { instagram: m.ig || '', facebook: m.fb || '' },
      website:             m.website || '',
      phone:               m.phone   || '',
      email:               m.email   || '',
      hours:               m.hours   || '',
      season:              m.season  || '',
      dressCode:           m.dress_code || '',
      parking:             m.parking || '',
      photos:              [p.featured_image_url].concat(m.photos || []).filter(Boolean),
    };
  }

  function mapExperience(p) {
    return {
      id:           p.slug,
      name:         p.title?.rendered || p.title,
      cat:          (p._embedded?.['wp:term']?.[0]?.[0]?.slug) || 'boat-tour',
      departs_from: p._sunspot_exp_departs_from || '',
      region:       p._sunspot_exp_region || '',
      hub:          p._sunspot_exp_hub || '',
      duration_h:   parseFloat(p._sunspot_exp_duration_h) || 0,
      price:        parseInt(p._sunspot_exp_price, 10) || 0,
      max_pax:      parseInt(p._sunspot_exp_max_pax, 10) || 0,
      summary:      (p.excerpt?.rendered || '').replace(/<[^>]+>/g,'').trim(),
      operator:     p._sunspot_exp_operator_name || '',
      vibe:         p._sunspot_exp_vibe || [],
      photo:        p.featured_image_url || '',
    };
  }

  // ----- Replace the static catalog before consumer code reads it -----
  // We override the IIFE assignment in clubs-data.js by waiting for it,
  // then refreshing both globals from the API.
  let triedAt = 0;
  async function refreshFromApi() {
    try {
      const venues = await fetchAll('/wp/v2/sunspot_venue?per_page=200&_embed=wp:term');
      window.SUNSPOT_CLUBS = venues.map(mapVenue);
      document.dispatchEvent(new Event('sunspot:clubs-updated'));
    } catch (e) { console.warn('SUNSPOT API venues fetch failed', e); }

    try {
      const exp = await fetchAll('/wp/v2/sunspot_experience?per_page=100&_embed=wp:term');
      window.SUNSPOT_EXPERIENCES = exp.map(mapExperience);
      document.dispatchEvent(new Event('sunspot:experiences-updated'));
    } catch (e) { console.warn('SUNSPOT API experiences fetch failed', e); }
  }
  document.addEventListener('DOMContentLoaded', refreshFromApi);
})();
