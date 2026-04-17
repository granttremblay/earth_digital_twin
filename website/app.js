// ============================================================
// LEDT · Smithsonian Living Earth Digital Twin
// Interactive TEMPO map + hero starfield
// ============================================================

// ---------- Hero starfield ----------
(function starfield() {
  const c = document.getElementById('starfield');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, stars;
  const STAR_COUNT = 220;

  function resize() {
    w = c.width = window.innerWidth * devicePixelRatio;
    h = c.height = (c.parentElement.offsetHeight) * devicePixelRatio;
    c.style.width = window.innerWidth + 'px';
    c.style.height = c.parentElement.offsetHeight + 'px';
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 * devicePixelRatio + 0.3,
      tw: Math.random() * Math.PI * 2,
      sp: 0.005 + Math.random() * 0.02,
      hue: Math.random() < 0.15 ? 'accent' : 'white'
    }));
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.tw += s.sp;
      const a = 0.35 + Math.abs(Math.sin(s.tw)) * 0.65;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      if (s.hue === 'accent') ctx.fillStyle = `rgba(62, 225, 200, ${a})`;
      else ctx.fillStyle = `rgba(231, 236, 247, ${a})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();

// ---------- TEMPO interactive map ----------
(function tempoMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // NASA GIBS serves TEMPO ONLY from its EPSG:4326 (geographic) endpoint.
  //
  // CRITICAL: GIBS's EPSG:4326 TileMatrixSets (1km / 500m / 15.625m …) do NOT
  // follow a strict power-of-2 doubling. Their matrix dims are:
  //     level 0: 2×1   level 1: 3×2   level 2: 5×3
  //     level 3: 10×5  level 4: 20×10  level 5: 40×20  level 6: 80×40  …
  // Leaflet's default L.CRS.EPSG4326 assumes 2^z tiles per world, so at
  // levels 1–2 the tile coordinates don't line up with GIBS at all — marker
  // lat/lon ends up drawn over tile images of a totally different region.
  //
  // Levels ≥ 3 ARE power-of-2 (10×5, 20×10, …) with square pixels, so we
  // custom-build a CRS that matches GIBS exactly at those levels, and lock
  // minZoom to 3.
  const GIBS_CRS = L.extend({}, L.CRS.EPSG4326, {
    // At zoom z: world = (10·2^(z-3)) × (5·2^(z-3)) tiles × 512 px.
    // Since EPSG4326 transformation has x-unit range 2 and y-unit range 1,
    // scale = width / 2 = 320 · 2^z makes the pixel grid match GIBS exactly.
    scale: function (zoom) {
      return 320 * Math.pow(2, zoom);
    },
    zoom: function (scale) {
      return Math.log(scale / 320) / Math.LN2;
    }
  });

  // GCReW — SERC Global Change Research Wetland — is our "home" view.
  const GCREW = [38.8743, -76.5509];

  const map = L.map('map', {
    crs: GIBS_CRS,
    center: GCREW,
    zoom: 6,
    minZoom: 3,
    maxZoom: 7,
    zoomControl: true,
    attributionControl: true,
    worldCopyJump: false
  });

  // ---------- Base layer: NASA VIIRS CityLights (2012) ----------
  // Dramatic dark Earth with yellow metro glow, served as jpeg at 500m.
  // EPSG:4326 so it aligns with TEMPO without reprojection gymnastics.
  const basemap = L.tileLayer(
    'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/' +
      'VIIRS_CityLights_2012/default/500m/{z}/{y}/{x}.jpeg',
    {
      attribution: '© NASA Earthdata GIBS · VIIRS CityLights 2012',
      tileSize: 512,
      noWrap: true,
      maxNativeZoom: 7,   // 500m TMS tops out at z7
      maxZoom: 7
    }
  ).addTo(map);

  // ---------- Reference features (borders, coastlines) on top of TEMPO ----------
  // Per GIBS capabilities, these layers use TileMatrixSet '15.625m'.
  const borders = L.tileLayer(
    'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/' +
      'Reference_Features_15m/default/15.625m/{z}/{y}/{x}.png',
    {
      tileSize: 512,
      noWrap: true,
      maxNativeZoom: 7,
      maxZoom: 7,
      pane: 'shadowPane'
    }
  );

  const labels = L.tileLayer(
    'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/' +
      'Reference_Labels_15m/default/15.625m/{z}/{y}/{x}.png',
    {
      tileSize: 512,
      noWrap: true,
      maxNativeZoom: 7,
      maxZoom: 7,
      pane: 'shadowPane'
    }
  );

  // ---------- NASA GIBS TEMPO layer definitions ----------
  // Verified against GIBS WMTSCapabilities (EPSG:4326, TileMatrixSet 1km).
  //   https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml
  // TEMPO's Time dimension is SUB-DAILY (one scan every ~5 minutes during
  // daylight over N. America). The magic word "default" asks GIBS for the
  // latest available scan; a full ISO8601 timestamp snaps to the closest
  // observation. A bare date (YYYY-MM-DD) will NOT match — don't send that.
  const GIBS_TEMPLATE =
    'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/' +
    '{layer}/default/{time}/1km/{z}/{y}/{x}.png';

  const TEMPO_LAYERS = {
    NO2:  { layer: 'TEMPO_L3_NO2_Vertical_Column_Troposphere',
            label: 'NO₂ tropospheric column' },
    O3:   { layer: 'TEMPO_L3_Ozone_Column_Amount',
            label: 'O₃ total column' },
    HCHO: { layer: 'TEMPO_L3_Formaldehyde_Vertical_Column',
            label: 'HCHO vertical column' },
    AI:   { layer: 'TEMPO_L3_Ozone_UV_Aerosol_Index',
            label: 'UV Aerosol Index' }
  };

  let activeTempo = null;
  let activeSpecies = 'NO2';
  // Time mode:
  //   'latest'  → use GIBS 'default' time (latest scan worldwide)
  //   'custom'  → use activeDate + activeHourUTC
  // TEMPO L3 on GIBS runs ~24–48 h behind real time, so "today" usually
  // returns HTTP 404. Default to yesterday so the time-loop animation has
  // guaranteed data to play.
  function todayUTC()     { return new Date().toISOString().slice(0, 10); }
  function yesterdayUTC() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  let activeTimeMode = 'custom';
  let activeDate = yesterdayUTC();
  let activeHourUTC = 18;  // 18:00 UTC ≈ ~14:00 EDT (peak CONUS scan)

  function buildTimeParam() {
    if (activeTimeMode === 'latest') return 'default';
    const hh = String(activeHourUTC).padStart(2, '0');
    return `${activeDate}T${hh}:00:00Z`;
  }

  // Cross-fade layer manager: when the time or species changes we build the
  // new TEMPO layer at opacity 0, let its tiles fully load underneath the
  // still-visible current layer, then swap opacities and drop the old one.
  // This prevents the on-load flash that would happen if we just removed
  // the old layer before the new one's tiles returned from GIBS.
  const pendingLayers = new Set();
  let layerSerial = 0;

  function setTempoLayer() {
    const mySerial = ++layerSerial;
    // Cancel any earlier in-flight swaps — their tiles are stale now.
    pendingLayers.forEach((l) => { if (l !== activeTempo) map.removeLayer(l); });
    pendingLayers.clear();

    const cfg = TEMPO_LAYERS[activeSpecies];
    if (!cfg) return;

    const url = GIBS_TEMPLATE
      .replace('{layer}', cfg.layer)
      .replace('{time}', buildTimeParam());

    const newLayer = L.tileLayer(url, {
      attribution: 'TEMPO L3 · NASA GIBS · SAO (K. Chance, PI)',
      tileSize: 512,
      noWrap: true,
      maxNativeZoom: 6,   // TEMPO 1km TMS tops out at z6
      maxZoom: 7,
      opacity: 0,          // invisible until loaded; see swapIn()
      // A fully transparent 1×1 PNG for missing-tile slots. Note: GIBS
      // itself returns valid transparent PNGs for times/areas without
      // coverage — this errorTileUrl only fires on true HTTP errors.
      errorTileUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAeImBZsAAAAASUVORK5CYII='
    });

    let swapped = false;
    const swapIn = () => {
      if (swapped) return;
      swapped = true;
      pendingLayers.delete(newLayer);
      // If a newer setTempoLayer call has superseded us, discard silently.
      if (mySerial !== layerSerial) {
        if (map.hasLayer(newLayer)) map.removeLayer(newLayer);
        return;
      }
      if (!map.hasLayer(newLayer)) return;  // was cancelled
      newLayer.setOpacity(0.85);
      if (activeTempo && activeTempo !== newLayer) {
        map.removeLayer(activeTempo);
      }
      activeTempo = newLayer;
      borders.bringToFront();
      labels.bringToFront();
    };

    // Primary path: Leaflet fires 'load' once every visible tile has loaded.
    newLayer.once('load', swapIn);
    // Safety net — if GIBS is slow or 'load' never fires (e.g. all tiles
    // are errorTileUrl), swap anyway after 3 s so we don't stall.
    setTimeout(swapIn, 3000);

    pendingLayers.add(newLayer);
    newLayer.addTo(map);

    // Keep borders/labels above both TEMPO layers during the overlap.
    if (!map.hasLayer(borders)) borders.addTo(map);
    if (!map.hasLayer(labels)) labels.addTo(map);
    borders.bringToFront();
    labels.bringToFront();

    updateTimeBadge();
  }

  function updateTimeBadge() {
    const badge = document.getElementById('time-badge');
    if (!badge) return;
    if (activeTimeMode === 'latest') {
      badge.textContent = 'Showing: latest TEMPO scan (default)';
    } else {
      const hh = String(activeHourUTC).padStart(2, '0');
      badge.textContent = `Showing: ${activeDate} ${hh}:00 UTC`;
    }
  }

  setTempoLayer();

  // ---------- Species segmented control ----------
  const speciesSeg = document.getElementById('species-seg');
  speciesSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-layer]');
    if (!btn) return;
    // userInterrupt is defined below; guard for hoisting via typeof.
    if (typeof userInterrupt === 'function') userInterrupt();
    speciesSeg.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeSpecies = btn.dataset.layer;
    setTempoLayer();
  });

  // ---------- Date picker ----------
  const dateInput = document.getElementById('date-input');
  dateInput.value = activeDate;
  dateInput.min = '2023-08-02';                      // TEMPO first light
  dateInput.max = yesterdayUTC();                    // TEMPO L3 is ~24-48h behind
  dateInput.addEventListener('change', (e) => {
    const v = e.target.value;
    if (!v) {
      activeTimeMode = 'latest';
    } else {
      activeTimeMode = 'custom';
      activeDate = v;
    }
    setTempoLayer();
  });

  // ---------- Hour-of-day slider + auto-animation ----------
  // TEMPO scans North America E→W over its daylight window (≈ 12-23 UTC).
  // A single timestamp only covers a longitude strip. We loop through the
  // 12 daylight hours automatically to show TEMPO's east-to-west sweep as a
  // short movie; any user interaction pauses the loop; 5 s of idle resumes.
  const hourSlider = document.getElementById('hour-slider');
  const hourValue = document.getElementById('hour-value');
  const HOUR_MIN = 12, HOUR_MAX = 23;
  const PLAY_INTERVAL_MS = 900;  // ~1 hour of TEMPO coverage per frame
  const IDLE_RESUME_MS = 5000;

  let playTimer = null;
  let idleTimer = null;

  function stepHour() {
    activeHourUTC = activeHourUTC >= HOUR_MAX ? HOUR_MIN : activeHourUTC + 1;
    activeTimeMode = 'custom';
    if (hourSlider) hourSlider.value = activeHourUTC;
    if (hourValue) hourValue.textContent = `${activeHourUTC}:00 UTC`;
    setTempoLayer();
  }
  function startPlaying() {
    if (playTimer) return;
    // If we're in 'latest' mode, seed from the default daylight hour.
    activeTimeMode = 'custom';
    playTimer = setInterval(stepHour, PLAY_INTERVAL_MS);
    document.body.classList.add('tempo-playing');
  }
  function stopPlaying() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    document.body.classList.remove('tempo-playing');
  }
  function scheduleResume() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(startPlaying, IDLE_RESUME_MS);
  }
  function userInterrupt() {
    stopPlaying();
    scheduleResume();
  }

  if (hourSlider) {
    hourSlider.min = HOUR_MIN;
    hourSlider.max = HOUR_MAX;
    hourSlider.step = 1;
    hourSlider.value = activeHourUTC;
    if (hourValue) hourValue.textContent = `${activeHourUTC}:00 UTC`;

    hourSlider.addEventListener('input', (e) => {
      userInterrupt();
      activeHourUTC = parseInt(e.target.value, 10);
      if (hourValue) hourValue.textContent = `${activeHourUTC}:00 UTC`;
      activeTimeMode = 'custom';
      if (!dateInput.value) dateInput.value = activeDate;
    });
    hourSlider.addEventListener('change', () => setTempoLayer());
  }

  // "Latest" button — jump back to the newest available TEMPO scan.
  const latestBtn = document.getElementById('latest-btn');
  if (latestBtn) {
    latestBtn.addEventListener('click', () => {
      stopPlaying();
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
      activeTimeMode = 'latest';
      dateInput.value = '';
      setTempoLayer();
    });
  }

  // Pause the time-loop whenever the user pans, zooms, or switches species.
  map.on('mousedown touchstart zoomstart dragstart', userInterrupt);
  dateInput.addEventListener('focus', userInterrupt);

  // Only auto-play when the map is actually in the viewport, to avoid
  // chewing through GIBS requests while the user is reading other sections.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) startPlaying();
        else stopPlaying();
      });
    }, { threshold: 0.35 });
    io.observe(mapEl);
  } else {
    startPlaying();
  }

  // ---------- Field network site markers ----------
  // Selected representative SERC & STRI sites (illustrative; not exhaustive).
  const sercSites = [
    {
      name: 'GCReW — Global Change Research Wetland',
      lat: 38.8743,
      lon: -76.5509,
      notes:
        "World's longest-running elevated-CO₂ wetland experiment (est. 1987). Eddy covariance + chamber flux."
    },
    {
      name: 'SERC Main Campus — Chesapeake',
      lat: 38.8886,
      lon: -76.5479,
      notes: 'Chesapeake watershed biogeochemistry. Coastal Carbon Network hub.'
    },
    {
      name: 'Kirkpatrick Marsh',
      lat: 38.874,
      lon: -76.546,
      notes: 'Long-term blue carbon monitoring; tidal brackish marsh.'
    }
  ];

  const striSites = [
    {
      name: 'Barro Colorado Island (BCI)',
      lat: 9.1521,
      lon: -79.8465,
      notes:
        'STRI ForestGEO flagship: 50-ha plot, continuous census since 1981. Seasonal moist tropical forest.'
    },
    {
      name: 'Agua Salud',
      lat: 9.2167,
      lon: -79.7333,
      notes:
        'Reforestation + secondary-forest carbon experiment; hydrological and canopy monitoring.'
    },
    {
      name: 'Bocas del Toro — Mangrove',
      lat: 9.35,
      lon: -82.25,
      notes:
        'Caribbean mangrove stands; target for Methane-to-Mangrove pipeline prototype.'
    }
  ];

  function makeSiteIcon(color) {
    return L.divIcon({
      className: 'site-icon',
      html:
        `<div style="width:14px;height:14px;border-radius:50%;background:${color};` +
        `box-shadow:0 0 0 3px rgba(5,7,13,0.9),0 0 18px ${color};"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  const sercLayer = L.layerGroup();
  const striLayer = L.layerGroup();

  sercSites.forEach((s) => {
    L.marker([s.lat, s.lon], { icon: makeSiteIcon('#3ee1c8') })
      .bindPopup(
        `<div class="site-popup-inner"><span class="src">SERC</span>` +
          `<h4>${s.name}</h4><p>${s.notes}</p></div>`,
        { className: 'site-popup' }
      )
      .addTo(sercLayer);
  });
  striSites.forEach((s) => {
    L.marker([s.lat, s.lon], { icon: makeSiteIcon('#ffb347') })
      .bindPopup(
        `<div class="site-popup-inner"><span class="src">STRI</span>` +
          `<h4>${s.name}</h4><p>${s.notes}</p></div>`,
        { className: 'site-popup' }
      )
      .addTo(striLayer);
  });

  sercLayer.addTo(map);
  striLayer.addTo(map);

  // ---------- Field toggles ----------
  const tSerc = document.getElementById('toggle-serc');
  const tStri = document.getElementById('toggle-stri');

  tSerc.addEventListener('click', () => {
    if (map.hasLayer(sercLayer)) {
      map.removeLayer(sercLayer);
      tSerc.classList.remove('active');
    } else {
      sercLayer.addTo(map);
      tSerc.classList.add('active');
    }
  });
  tStri.addEventListener('click', () => {
    if (map.hasLayer(striLayer)) {
      map.removeLayer(striLayer);
      tStri.classList.remove('active');
    } else {
      striLayer.addTo(map);
      tStri.classList.add('active');
    }
  });

  // A softly glowing bounding box hinting at TEMPO's field of regard.
  L.rectangle(
    [
      [14, -168],
      [67, -40]
    ],
    {
      color: '#7cc7ff',
      weight: 1,
      dashArray: '4,6',
      fillOpacity: 0,
      interactive: false
    }
  ).addTo(map);
})();

// ---------- Simple scroll-reveal for sections ----------
(function reveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = 1;
          e.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.08 }
  );
  document.querySelectorAll('.section .container > *').forEach((el) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .8s ease, transform .8s ease';
    obs.observe(el);
  });
})();
