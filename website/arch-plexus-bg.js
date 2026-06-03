/*  LEDT — Architecture Section: Flowing-Water Plexus Background
    =================================================================
    Sibling of earth-plexus-bg.js. Same `earthColor()` mint→teal→
    ocean→navy ramp, same two-canvas depth trick (far blurred, near
    sharp), same node/connection topology — but instead of nodes
    living on a sphere, they live in a 3-D box that flows
    horizontally (left → right) with a gentle vertical sine bob,
    so the whole field reads like a river / current of light
    passing behind the Atmosphere → LEDT → Biosphere diagram.

    Scoped to the `.arch` section (full-bleed, NOT just the inner
    `.arch-diagram` box) so the plexus runs edge-to-edge across the
    section. The cell rows sit on z-index: 2 with semi-transparent
    backgrounds so the plexus glows through and across them. Respects
    `prefers-reduced-motion: reduce` (no animation, but a single
    static frame is still rendered so the section isn't blank).

    Palette references the site's accent colors:
      --accent     #3ee1c8  (teal / bio)
      --accent-2   #7cc7ff  (sky blue / atmosphere)
      --accent-ledt #c794ff (violet / LEDT layer)
    ============================================================ */

(function () {
  'use strict';

  function initArchBg() {
    if (document.getElementById('ledt-arch-bg')) return;

    var host = document.querySelector('.arch');
    if (!host) return;

    /* ── 1. INJECT CSS ──────────────────────────────────────────── */
    var css =
      '#ledt-arch-bg{' +
        'position:absolute;inset:0;z-index:0;' +
        'pointer-events:none;overflow:hidden;' +
        /* very subtle vignette so the plexus reads as belonging to the
           section without putting a hard frame around it */
        'background:radial-gradient(ellipse 110% 90% at 50% 50%,' +
          'rgba(10,18,38,0.18) 0%,rgba(6,10,22,0.10) 65%,rgba(0,0,0,0) 100%);' +
      '}' +

      '#ledt-arch-canvas-far{' +
        'position:absolute;inset:0;z-index:1;' +
        'filter:blur(4px);opacity:.65;' +
      '}' +
      '#ledt-arch-canvas-near{' +
        'position:absolute;inset:0;z-index:2;' +
      '}';

    var styleEl = document.createElement('style');
    styleEl.id  = 'ledt-arch-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ── 2. BUILD DOM ───────────────────────────────────────────── */
    var bg = document.createElement('div');
    bg.id  = 'ledt-arch-bg';
    bg.innerHTML =
      '<canvas id="ledt-arch-canvas-far"></canvas>' +
      '<canvas id="ledt-arch-canvas-near"></canvas>';
    host.insertBefore(bg, host.firstChild);

    /* ── 3. CANVAS HANDLES ──────────────────────────────────────── */
    var cFar    = document.getElementById('ledt-arch-canvas-far');
    var cNear   = document.getElementById('ledt-arch-canvas-near');
    var ctxFar  = cFar.getContext('2d');
    var ctxNear = cNear.getContext('2d');

    /* ── 4. CONFIG ──────────────────────────────────────────────── */
    var NODE_COUNT     = 95;
    var FOV            = 720;
    /* base horizontal drift; gets a per-node multiplier so the field
       has internal current and doesn't all march in lockstep */
    var FLOW_SPEED     = 0.32;   /* px / frame at depth 0 */
    var BOB_AMP        = 14;     /* vertical sine amplitude in px */
    var BOB_FREQ       = 0.0035; /* radians / frame */
    /* depth box: -D/2 ... +D/2 in world units */
    var DEPTH_RANGE    = 220;
    /* connection threshold tuned so the lacework is dense enough to
       read as a "current" without overwhelming the cell rows */
    var CONNECT_DIST   = 130;

    /* ── 5. STATE ───────────────────────────────────────────────── */
    var W, H, dpr;
    var nodes = [];
    var time  = 0;

    /* ── 6. COLOR RAMP (verbatim from earth-plexus-bg.js) ────────
        t    : 0 = front / bright,  1 = back / dim
        heat : per-node variety, 0 = greener,  1 = bluer            */
    function earthColor(t, heat) {
      var blend = t * 0.68 + heat * 0.32;
      var r, g, b;
      if (blend < 0.38) {
        var s = blend / 0.38;
        r = Math.round(210 - 148 * s);
        g = Math.round(250 -  25 * s);
        b = Math.round(240 -  40 * s);
      } else if (blend < 0.72) {
        var s2 = (blend - 0.38) / 0.34;
        r = Math.round( 62 -  30 * s2);
        g = Math.round(225 - 105 * s2);
        b = 200;
      } else {
        var s3 = (blend - 0.72) / 0.28;
        r = Math.round( 32 -  17 * s3);
        g = Math.round(120 -  70 * s3);
        b = Math.round(200 -  90 * s3);
      }
      return [r, g, b];
    }

    /* ── 7. RESIZE ──────────────────────────────────────────────── */
    function resize() {
      dpr = window.devicePixelRatio || 1;
      W   = host.offsetWidth  || 1200;
      H   = host.offsetHeight || 600;

      var cvs  = [cFar, cNear];
      var ctxs = [ctxFar, ctxNear];
      for (var c = 0; c < 2; c++) {
        cvs[c].width        = W * dpr;
        cvs[c].height       = H * dpr;
        cvs[c].style.width  = W + 'px';
        cvs[c].style.height = H + 'px';
        ctxs[c].setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    /* ── 8. INIT NODES ──────────────────────────────────────────── */
    function initNodes() {
      nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        var z = (Math.random() - 0.5) * DEPTH_RANGE;
        nodes.push({
          /* world-space position */
          x      : Math.random() * W,
          y      : Math.random() * H,
          z      : z,
          /* depth-modulated horizontal speed: nearer nodes flow faster,
             which sells the parallax / current illusion */
          vx     : FLOW_SPEED * (0.55 + Math.random() * 0.95) *
                   (1.0 - (z + DEPTH_RANGE * 0.5) / DEPTH_RANGE * 0.55),
          /* gentle per-node bob params */
          bobAmp : BOB_AMP * (0.6 + Math.random() * 0.9),
          bobFreq: BOB_FREQ * (0.7 + Math.random() * 0.8),
          bobPhase: Math.random() * Math.PI * 2,
          baseY  : 0,                 /* set on first frame */
          heat   : Math.random(),
          /* projected coords */
          sx: 0, sy: 0, ps: 1
        });
        nodes[i].baseY = nodes[i].y;
      }
    }

    /* ── 9. DRAW ────────────────────────────────────────────────── */

    function drawConnections() {
      for (var i = 0; i < nodes.length; i++) {
        var ni = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var nj = nodes[j];
          /* 3-D distance so depth-differing nodes connect less */
          var dx = ni.sx - nj.sx;
          var dy = ni.sy - nj.sy;
          var dz = (ni.z - nj.z) * 0.4;
          var d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (d >= CONNECT_DIST) continue;

          var ratio  = 1 - d / CONNECT_DIST;
          var avgZ   = (ni.z + nj.z) * 0.5;
          /* depthT: 0 = near, 1 = far  (matches earthColor convention) */
          var depthT = (avgZ + DEPTH_RANGE * 0.5) / DEPTH_RANGE;
          var depthV = 1 - depthT;

          var alpha = ratio * (0.10 + 0.42 * depthV);
          if (alpha < 0.005) continue;

          var avgHeat = (ni.heat + nj.heat) * 0.5;
          var rgb = earthColor(depthT, avgHeat);

          ctxNear.beginPath();
          ctxNear.moveTo(ni.sx, ni.sy);
          ctxNear.lineTo(nj.sx, nj.sy);
          ctxNear.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
          ctxNear.lineWidth   = 0.55 + 0.55 * depthV;
          ctxNear.stroke();
        }
      }
    }

    function drawDots() {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var depthT = (n.z + DEPTH_RANGE * 0.5) / DEPTH_RANGE; /* 0 near, 1 far */
        var depthV = 1 - depthT;
        var dvPow  = Math.pow(Math.max(0, depthV), 1.1);

        var isFront = (n.z <= 0);
        var ctx     = isFront ? ctxNear : ctxFar;

        var baseR  = isFront ? 2.4 : 1.5;
        var radius = baseR * n.ps * (0.18 + 0.82 * dvPow);
        if (radius < 0.3) continue;

        var dotAlpha = (isFront ? 0.88 : 0.55) * (0.15 + 0.85 * dvPow);
        if (dotAlpha < 0.02) continue;

        var rgb = earthColor(depthT, n.heat);

        if (isFront && depthV > 0.55) {
          var glowR = Math.pow((depthV - 0.55) / 0.45, 1.2);
          ctx.shadowBlur  = radius * 9 * glowR;
          ctx.shadowColor = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.7)';
        }

        ctx.beginPath();
        ctx.arc(n.sx, n.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + dotAlpha + ')';
        ctx.fill();

        if (isFront && depthV > 0.55) {
          ctx.shadowBlur  = 0;
          ctx.shadowColor = 'transparent';
        }
      }
    }

    function tick(advance) {
      ctxFar.clearRect(0, 0, W, H);
      ctxNear.clearRect(0, 0, W, H);

      if (advance) time += 1;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];

        if (advance) {
          n.x += n.vx;
          /* horizontal wrap: when a node sails off the right edge,
             respawn at the left with a fresh y so the river feels
             non-repeating */
          if (n.x > W + 40) {
            n.x     = -40 - Math.random() * 60;
            n.baseY = Math.random() * H;
            n.bobPhase = Math.random() * Math.PI * 2;
          }
        }

        /* gentle vertical bob — this is the "flowing water" cue */
        n.y = n.baseY + Math.sin(time * n.bobFreq + n.bobPhase) * n.bobAmp;

        /* perspective projection: z near 0 ≈ full size, z>0 shrinks */
        var ps = FOV / (FOV + n.z);
        n.sx = n.x;       /* x stays in screen space — flow direction is the */
        n.sy = n.y;       /* whole point, no need to recentre */
        n.ps = ps;
      }

      drawConnections();
      drawDots();
    }

    function loop() {
      tick(true);
      rafId = requestAnimationFrame(loop);
    }

    /* ── 10. BOOT ───────────────────────────────────────────────── */
    var rafId = null;

    function start() {
      if (rafId) return;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    resize();
    initNodes();

    var rTimer;
    window.addEventListener('resize', function () {
      clearTimeout(rTimer);
      rTimer = setTimeout(function () {
        resize();
        initNodes();
      }, 200);
    });

    /* Pause when off-screen so we don't burn cycles for nothing */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) start();
          else stop();
        });
      }, { threshold: 0.05 });
      io.observe(host);
    } else {
      start();
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* honour reduced motion — render one static frame and stop */
      stop();
      tick(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArchBg);
  } else {
    initArchBg();
  }
})();
