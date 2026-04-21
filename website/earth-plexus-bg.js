/*  LEDT — Animated 3-D Earth Plexus Background
    =================================================
    Slowly-rotating sphere of connected nodes rendered in a
    blue-green gradient, evoking a plexus "Earth". Two canvases
    (far-blurred, near-sharp) give depth; breathing corona haloes
    simulate atmospheric glow.

    Scoped to the `.hero` element — not global. Drops in as a
    replacement for the prior starfield + CSS globe.

    Palette references the site's accent colors:
      --accent    #3ee1c8  (teal / bio)
      --accent-2  #7cc7ff  (sky blue / atmosphere)
    ============================================================ */

(function () {
  'use strict';

  function initEarthBg() {
    if (document.getElementById('ledt-earth-bg')) return;

    var hero = document.querySelector('.hero');
    if (!hero) return;

    /* ── 1. INJECT CSS ──────────────────────────────────────────── */
    var css =
      /* container: absolute within hero, cool-dark gradient */
      '#ledt-earth-bg{' +
        'position:absolute;inset:0;z-index:0;' +
        'pointer-events:none;overflow:hidden;' +
        'background:radial-gradient(ellipse 60% 55% at 50% 50%,' +
          '#061828 0%,#040a18 48%,#02040a 100%);' +
      '}' +

      /* shared atmosphere orb base */
      '.ledt-atm{' +
        'position:absolute;border-radius:50%;' +
        'left:50%;top:50%;' +
        'transform:translate(-50%,-50%);' +
        'pointer-events:none;will-change:transform,opacity;' +
      '}' +

      /* outer haze — wide cool-blue envelope */
      '.ledt-atm-outer{' +
        'width:88vmin;height:88vmin;' +
        'background:radial-gradient(circle,' +
          'rgba(80,170,230,0.10) 0%,' +
          'rgba(40,120,200,0.05) 45%,' +
          'rgba(0,0,0,0) 72%);' +
        'filter:blur(50px);' +
        'animation:ledt-breathe-a 15s ease-in-out infinite alternate;' +
      '}' +

      /* mid halo — teal / cyan ring */
      '.ledt-atm-mid{' +
        'width:62vmin;height:62vmin;' +
        'background:radial-gradient(circle,' +
          'rgba(62,225,200,0.16) 0%,' +
          'rgba(62,200,220,0.08) 40%,' +
          'rgba(0,0,0,0) 70%);' +
        'filter:blur(32px);' +
        'animation:ledt-breathe-b 9s ease-in-out infinite alternate-reverse;' +
      '}' +

      /* core glow — bright mint-white center */
      '.ledt-atm-core{' +
        'width:30vmin;height:30vmin;' +
        'background:radial-gradient(circle,' +
          'rgba(210,255,240,0.28) 0%,' +
          'rgba(120,240,220,0.16) 35%,' +
          'rgba(40,160,220,0.07) 65%,' +
          'rgba(0,0,0,0) 100%);' +
        'filter:blur(18px);' +
        'animation:ledt-breathe-c 6s ease-in-out infinite alternate;' +
      '}' +

      /* breathing keyframes */
      '@keyframes ledt-breathe-a{' +
        'from{transform:translate(-50%,-50%) scale(.89);opacity:.55;}' +
        'to{transform:translate(-50%,-50%) scale(1.11);opacity:1;}' +
      '}' +
      '@keyframes ledt-breathe-b{' +
        'from{transform:translate(-50%,-50%) scale(.86);opacity:.60;}' +
        'to{transform:translate(-50%,-50%) scale(1.14);opacity:1;}' +
      '}' +
      '@keyframes ledt-breathe-c{' +
        'from{transform:translate(-50%,-50%) scale(.91);opacity:.72;}' +
        'to{transform:translate(-50%,-50%) scale(1.09);opacity:1;}' +
      '}' +

      /* far canvas — blurred, back-hemisphere dots */
      '#ledt-canvas-far{' +
        'position:absolute;inset:0;z-index:1;' +
        'filter:blur(4px);opacity:.72;' +
      '}' +

      /* near canvas — sharp, front-hemisphere + all connections */
      '#ledt-canvas-near{' +
        'position:absolute;inset:0;z-index:2;' +
      '}' +

      /* respect reduced-motion */
      '@media(prefers-reduced-motion:reduce){' +
        '.ledt-atm{animation:none;}' +
      '}';

    var styleEl = document.createElement('style');
    styleEl.id  = 'ledt-earth-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ── 2. BUILD DOM ───────────────────────────────────────────── */
    var bg = document.createElement('div');
    bg.id  = 'ledt-earth-bg';
    bg.innerHTML =
      '<div class="ledt-atm ledt-atm-outer"></div>' +
      '<div class="ledt-atm ledt-atm-mid"></div>'   +
      '<div class="ledt-atm ledt-atm-core"></div>'  +
      '<canvas id="ledt-canvas-far"></canvas>'      +
      '<canvas id="ledt-canvas-near"></canvas>';
    hero.insertBefore(bg, hero.firstChild);

    /* ── 3. CANVAS HANDLES ──────────────────────────────────────── */
    var cFar    = document.getElementById('ledt-canvas-far');
    var cNear   = document.getElementById('ledt-canvas-near');
    var ctxFar  = cFar.getContext('2d');
    var ctxNear = cNear.getContext('2d');

    /* ── 4. CONFIG ──────────────────────────────────────────────── */
    var NODE_COUNT   = 200;
    var FLARE_COUNT  = 18;
    var FOV          = 950;
    var ROT_SPEED_Y  = 0.0014;   /* a touch slower than the Sun — Earth-like */
    var TILT_X       = 0.40;     /* ~23° axial tilt feel (a bit exaggerated) */
    var BREATHE_FREQ = 0.0090;
    var BREATHE_AMP  = 0.065;
    var NODE_DRIFT   = 0.00070;
    var CONN_FACTOR  = 0.46;

    /* ── 5. STATE ───────────────────────────────────────────────── */
    var W, H, dpr, SPHERE_R, CONNECT_DIST;
    var nodes = [];
    var worldAngleY = 0;
    var time        = 0;

    /* ── 6. HELPERS ─────────────────────────────────────────────── */

    function rotY(x, y, z, a) {
      var c = Math.cos(a), s = Math.sin(a);
      return { x: x * c + z * s,  y: y,  z: -x * s + z * c };
    }
    function rotX(x, y, z, a) {
      var c = Math.cos(a), s = Math.sin(a);
      return { x: x,  y: y * c - z * s,  z: y * s + z * c };
    }

    /*  earthColor(t, heat)
        t    : 0 = front / bright,  1 = back / dim
        heat : per-node variety, 0 = greener,  1 = bluer
        Returns [r, g, b] in an Earth-like palette:
          front → mint-white → teal → ocean blue → deep navy ← back         */
    function earthColor(t, heat) {
      var blend = t * 0.68 + heat * 0.32;   /* depth drives 68% of colour */
      var r, g, b;
      if (blend < 0.38) {
        /* mint-white → teal */
        var s = blend / 0.38;
        r = Math.round(210 - 148 * s);    /* 210 → 62  */
        g = Math.round(250 -  25 * s);    /* 250 → 225 */
        b = Math.round(240 -  40 * s);    /* 240 → 200 */
      } else if (blend < 0.72) {
        /* teal → ocean blue */
        var s2 = (blend - 0.38) / 0.34;
        r = Math.round( 62 -  30 * s2);   /*  62 →  32 */
        g = Math.round(225 - 105 * s2);   /* 225 → 120 */
        b = 200;
      } else {
        /* ocean blue → deep navy */
        var s3 = (blend - 0.72) / 0.28;
        r = Math.round( 32 -  17 * s3);   /*  32 →  15 */
        g = Math.round(120 -  70 * s3);   /* 120 →  50 */
        b = Math.round(200 -  90 * s3);   /* 200 → 110 */
      }
      return [r, g, b];
    }

    /* ── 7. RESIZE ──────────────────────────────────────────────── */
    function resize() {
      dpr      = window.devicePixelRatio || 1;
      W        = hero.offsetWidth  || window.innerWidth;
      H        = hero.offsetHeight || window.innerHeight;
      SPHERE_R = Math.min(W, H) * 0.40;
      CONNECT_DIST = SPHERE_R * CONN_FACTOR;

      var cvs  = [cFar, cNear];
      var ctxs = [ctxFar, ctxNear];
      for (var c = 0; c < 2; c++) {
        cvs[c].width         = W * dpr;
        cvs[c].height        = H * dpr;
        cvs[c].style.width   = W + 'px';
        cvs[c].style.height  = H + 'px';
        ctxs[c].setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    /* ── 8. INIT NODES ──────────────────────────────────────────── */
    function initNodes() {
      nodes = [];

      /* Surface nodes — tight on the sphere */
      for (var i = 0; i < NODE_COUNT; i++) {
        var theta = Math.random() * Math.PI * 2;
        var phi   = Math.acos(1 - 2 * Math.random());
        nodes.push({
          theta  : theta,
          phi    : phi,
          rFac   : 0.975 + Math.random() * 0.05,
          dTheta : (Math.random() - 0.5) * NODE_DRIFT * 2,
          dPhi   : (Math.random() - 0.5) * NODE_DRIFT * 1.4,
          heat   : Math.random(),
          isFlare: false,
          x3: 0, y3: 0, z3: 0,
          sx: 0, sy: 0, ps: 1
        });
      }

      /* Flare nodes — atmospheric wisps just beyond the limb */
      for (var j = 0; j < FLARE_COUNT; j++) {
        var fPhi   = Math.PI * 0.5 + (Math.random() - 0.5) * 0.55;
        var fTheta = Math.random() * Math.PI * 2;
        nodes.push({
          theta  : fTheta,
          phi    : fPhi,
          rFac   : 1.18 + Math.random() * 0.45,
          dTheta : (Math.random() - 0.5) * NODE_DRIFT * 1.4,
          dPhi   : (Math.random() - 0.5) * NODE_DRIFT * 0.8,
          heat   : Math.random() * 0.5,   /* brighter → more cyan/green */
          isFlare: true,
          x3: 0, y3: 0, z3: 0,
          sx: 0, sy: 0, ps: 1
        });
      }
    }

    /* ── 9. DRAW ────────────────────────────────────────────────── */

    function drawConnections() {
      for (var i = 0; i < nodes.length; i++) {
        var ni = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var nj = nodes[j];
          var dx = ni.x3 - nj.x3;
          var dy = ni.y3 - nj.y3;
          var dz = ni.z3 - nj.z3;
          var d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (d >= CONNECT_DIST) continue;
          if (ni.isFlare && nj.isFlare) continue;

          var ratio  = 1 - d / CONNECT_DIST;
          var midZ   = (ni.z3 + nj.z3) * 0.5;
          var depthT = 1 - (midZ + SPHERE_R) / (2 * SPHERE_R);
          var depthV = (midZ + SPHERE_R) / (2 * SPHERE_R);

          var alpha = ratio * (0.13 + 0.40 * depthV);
          if (alpha < 0.005) continue;
          if (ni.isFlare || nj.isFlare) alpha *= 0.65;

          var avgHeat = (ni.heat + nj.heat) * 0.5;
          var rgb = earthColor(depthT, avgHeat);

          ctxNear.beginPath();
          ctxNear.moveTo(ni.sx, ni.sy);
          ctxNear.lineTo(nj.sx, nj.sy);
          ctxNear.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
          ctxNear.lineWidth   = 0.6 + 0.55 * depthV;
          ctxNear.stroke();
        }
      }
    }

    function drawDots() {
      var FRONT_THRESH = -0.08 * SPHERE_R;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var depthT = 1 - (n.z3 + SPHERE_R) / (2 * SPHERE_R);
        var depthV = 1 - depthT;
        var dvPow  = Math.pow(Math.max(0, depthV), 1.1);

        var isFront = (n.z3 >= FRONT_THRESH);
        var ctx     = isFront ? ctxNear : ctxFar;

        var baseR   = isFront ? 2.8 : 1.6;
        if (n.isFlare) baseR *= 0.75;
        var radius  = baseR * n.ps * (0.15 + 0.85 * dvPow);
        if (radius < 0.3) continue;

        var dotAlpha = (isFront ? 0.92 : 0.62) * (0.12 + 0.88 * dvPow);
        if (n.isFlare) dotAlpha *= 0.80;
        if (dotAlpha < 0.02) continue;

        var rgb = earthColor(depthT, n.heat);

        if (isFront && depthV > 0.52) {
          var glowR = Math.pow((depthV - 0.52) / 0.48, 1.2);
          ctx.shadowBlur  = radius * 11 * glowR;
          ctx.shadowColor = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.75)';
        }

        ctx.beginPath();
        ctx.arc(n.sx, n.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + dotAlpha + ')';
        ctx.fill();

        if (isFront && depthV > 0.52) {
          ctx.shadowBlur  = 0;
          ctx.shadowColor = 'transparent';
        }
      }
    }

    /* ── 10. ANIMATION LOOP ─────────────────────────────────────── */
    function draw() {
      ctxFar.clearRect(0, 0, W, H);
      ctxNear.clearRect(0, 0, W, H);

      time        += BREATHE_FREQ;
      worldAngleY += ROT_SPEED_Y;

      var breathe = 1
        + BREATHE_AMP * Math.sin(time * 0.58)
        + 0.026       * Math.sin(time * 1.35 + 1.1);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];

        n.theta += n.dTheta;
        n.phi   += n.dPhi;

        if (!n.isFlare) {
          if (n.phi < 0.04)          { n.phi = 0.04;           n.dPhi  = Math.abs(n.dPhi);  }
          if (n.phi > Math.PI - 0.04){ n.phi = Math.PI - 0.04; n.dPhi  = -Math.abs(n.dPhi); }
        }

        var r      = SPHERE_R * n.rFac * breathe;
        var sinPhi = Math.sin(n.phi);
        var x = r * sinPhi * Math.cos(n.theta);
        var y = r * Math.cos(n.phi);
        var z = r * sinPhi * Math.sin(n.theta);

        var ry = rotY(x, y, z, worldAngleY);
        var rx = rotX(ry.x, ry.y, ry.z, TILT_X);

        n.x3 = rx.x;
        n.y3 = rx.y;
        n.z3 = rx.z;

        var ps = FOV / (FOV + n.z3);
        n.sx   = W * 0.5 + n.x3 * ps;
        n.sy   = H * 0.5 + n.y3 * ps;
        n.ps   = ps;
      }

      drawConnections();
      drawDots();

      requestAnimationFrame(draw);
    }

    /* ── 11. BOOT ───────────────────────────────────────────────── */
    resize();
    initNodes();

    var rTimer;
    window.addEventListener('resize', function () {
      clearTimeout(rTimer);
      rTimer = setTimeout(function () { resize(); initNodes(); }, 200);
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(draw);
    }

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEarthBg);
  } else {
    initEarthBg();
  }

})();
