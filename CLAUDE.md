# CLAUDE.md

Working notes for Claude Code on the **Smithsonian Living Earth Digital Twin** (LEDT) repository.

---

## What this repository is

A seed-award prototype for the LEDT — a proposed **ecological feedback layer** designed to plug into existing planetary digital twins (NVIDIA Earth-2, NASA ESDT, EU DestinE). Funded by a **$150K OUSSR Innovation Concept** award (FY26). PI: Grant Tremblay (SAO).

The authoritative scope is in [`proposal/Smithsonian Living Earth Digital Twin.pdf`](proposal/Smithsonian%20Living%20Earth%20Digital%20Twin.pdf) — **read that first** before making any substantive changes.

Headline idea: Earth-2 / DestinE / ESDT model atmospheric physics at km scale, but treat the biosphere as a static boundary condition. LEDT closes the loop by linking what the atmosphere *delivers* (TEMPO chemistry, MethaneSAT flux) to how ecosystems *respond* (STRI ForestGEO canopy dynamics, SERC GCReW wetland flux, Coastal Carbon Network observations).

---

## Repository layout

```
earth_digital_twin/
├── CLAUDE.md                      # this file
├── README.md                      # human-facing project README
├── pyproject.toml                 # Python deps (managed with uv)
├── uv.lock                        # pinned resolution — commit this
├── .python-version                # pinned interpreter (3.12) — commit this
├── .github/workflows/pages.yml    # auto-deploys website/ to GitHub Pages
├── proposal/
│   └── Smithsonian Living Earth Digital Twin.pdf
├── website/                       # sophisticated landing page + live TEMPO map
│   ├── index.html
│   ├── styles.css
│   ├── app.js                     # TEMPO map + misc interactivity
│   ├── earth-plexus-bg.js         # animated 3-D plexus-Earth hero background
│   ├── arch-plexus-bg.js          # flowing-water plexus behind the architecture diagram
│   └── assets/
│       ├── digital_earth_logo_primary.svg # globe mark (source for the inline <symbol>)
│       └── og-card.png            # social-share card (generated; see scripts/)
├── scripts/
│   └── make_og_card.py            # bakes website/assets/og-card.png (Pillow, build-time)
└── notebooks/
    └── tempo_earth2_integration.ipynb   # CPU-only TEMPO → earth2studio demo
```

External repository used but not vendored: NVIDIA's `earth2studio` lives at
`/Users/grant/Repositories/earth2studio/` on this machine.

---

## The website (`website/`)

Single-page site, **no build step**, pure HTML/CSS/JS + Leaflet 1.9. Serve with:

```bash
cd website && python -m http.server 8000
```

### What it contains

- **Hero** with animated plexus-Earth background, emblem + Ropa-Sans Smithsonian logo, the `living_earth_wordmark.svg` (animated gradient via CSS mask) and `digital_twin_wordmark.svg` (white). Kicker reads `INNOVATION WORKSHOP · SEPT 14–16, 2026 · SAO CAMBRIDGE, MA`. CTAs go to `#register` and `#tempo`.
- **Workshop banner** — full-width section right under the hero with `assets/earth_backdrop.png` as the backdrop (positioned right-of-center, with a left-side gradient overlay for text contrast) and the `join_us.svg` / `innovation_workshop.svg` / `cambrige.svg` wordmarks stacked on the left. Confirms the venue (**SAO, Cambridge MA**), dates (**Sept 14–16, 2026**), the **Sunday Sept 13 welcome reception**, full Smithsonian travel funding, and the hard **July 25, 2026 booking deadline**. CTA links to `#register`.
- **Mission / Gap** — 01 · the "biologically inert" framing from proposal §1
- **Our Idea** — 02 · bridge between §1 (problem) and §3 (workshop). Names LEDT as the ecological feedback layer, sets up the animating question as a violet-bordered blockquote (`.idea-quote`), and walks through the SAO→LEDT→SERC/STRI asset pipeline (TEMPO/MethaneSAT → ForestGEO/GCReW/Coastal Carbon Network). Ends with the line "The work begins this September." which segues directly into the workshop section's H2. Added 2026-06-03 because the prior 01→02 transition jumped straight from "the problem" to "we're convening to fix it" without ever naming the solution. The proposal language is lifted verbatim from §2 — keep it that way unless Grant rewords the proposal itself.
- **Innovation Workshop** — 03 · detail block for the SAO+SERC+STRI Innovation Workshop. Venue is **Smithsonian Astrophysical Observatory, 60 Garden Street, Cambridge, MA**; dates are **Sept 14–16, 2026** (Mon–Wed); welcome reception is **Sunday evening Sept 13**; hotel block + lodging info forthcoming. Travel for all Smithsonian scientists can be fully funded by the OUSSR seed award. Per funding restrictions, **all travel must be booked by July 25, 2026** — the `.lab-deadline` call-out at the bottom of the section spells this out and links to `TremblayG@si.edu`. Don't soften that deadline language without asking.
- **Early Registration** — 04 · Formspree-backed form (name / email / affiliation / comments / preferred travel details / acknowledgment checkbox). Posts to `https://formspree.io/f/xdabeeow` → emails `granttremblay@gmail.com`. Includes a `_gotcha` honeypot for spam. If spam gets through, enable reCAPTCHA in the Formspree dashboard, or layer Cloudflare Turnstile. The email field is intentionally lower-cased (`name="email"`) so Formspree auto-populates Reply-To. The lede + `form-note` both repeat the July 25 booking deadline and the `TremblayG@si.edu` contact.
  - **Preferred travel details** (`name="Preferred travel details"`, textarea, optional but "strongly preferred") — freeform itinerary box (airports / dates / lodging needs, e.g. "PTY → BOS, depart Sept 13, return Sept 17, govt-rate room needed"). Its `.field-hint` makes clear this is only for **cost estimation / budgeting** and does **not** book anything — to actually book, the registrant must email `TremblayG@si.edu` (SAO's travel office helps), and all travel must be booked (funding encumbered) by **July 25, 2026**. Don't soften that.
  - **Acknowledgment** (`name="Acknowledgment"`, checkbox, **required**) — `.field-check` / `.check-label` styled checkbox labelled "I acknowledge 🫡" warning that the workshop is a working sprint/hackathon, not three days of talks, with a little pre-work homework and **2–3 virtual mini-prep meetings in July and August**. The custom check uses a visually-hidden `<input>` + `.check-box` square (teal when `:checked`); don't restyle it back to a native checkbox.
- **Live TEMPO map** — 05 · interactive, tiled from NASA GIBS
- **Integration Target (Earth-2)** — 06 · NVIDIA cBottle / earth2studio integration story
- **Architecture diagram** — 07 · Atmosphere → LEDT → Biosphere. The three rows of cells sit on top of a horizontally-flowing plexus background (`arch-plexus-bg.js`) that uses the same `earthColor()` mint→teal→ocean→navy ramp as the hero. Nodes drift left-to-right with a gentle vertical sine bob and wrap when they exit the right edge, reading as a "current of light" rather than a sphere. The old SVG `.arch-connector` dashed lines between rows were removed on 2026-06-02 in favour of this plexus.
- **Field Network** — 08 · SAO / SERC / STRI cards
- **Footer disclaimer** — a `.foot-disclaimer` line (centered, dim, divider rule
  above) at the bottom of the `<footer>`: states LEDT is a *real* Smithsonian
  project but that this is **not** an official Smithsonian-approved site and the
  content doesn't necessarily represent the Smithsonian's position. Added
  2026-06-24 at Grant's request — keep the "not official / doesn't represent the
  Smithsonian" language; don't drop or soften it.

### Social sharing card (Open Graph / Twitter)

- `<head>` carries `og:*` + `twitter:card` (`summary_large_image`) tags pointing
  at `assets/og-card.png`. **The `og:image` / `twitter:image` URLs are absolute**
  (`https://granttremblay.github.io/earth_digital_twin/assets/og-card.png`) —
  social crawlers won't follow relative paths. If the Pages URL ever changes,
  update those two absolute URLs.
- The card (1200×630) is **generated**, not hand-drawn:
  `python3 scripts/make_og_card.py` bakes it from `earth_backdrop.png` (cover-fit,
  darkened) + `digital_earth_logo_white-01.png` (tinted with the teal→blue→violet
  brand gradient) + the local **Inter** variable font. It's currently
  *event-focused* (title + "Innovation Workshop · Sept 14–16, 2026 · SAO
  Cambridge MA"). Re-run the script after editing it and commit the new PNG.
- This is a **build-time asset script**, not a website or notebook dependency.
  It runs on the system `python3` that has Pillow (not the uv env) — do **not**
  `uv add pillow`; the lockfile stays clean. No build step is introduced for the
  site itself (the PNG is committed and served verbatim, like every other asset).
- **Note:** the old "Methane-to-Mangrove pipeline" section was removed on 2026-04-21 during the pivot to Innovation-Workshop framing. Don't resurrect it without asking. The Principals/Team + Engaged partners block was also removed on 2026-06-02 — Grant will add a final cohort list later; don't re-add a placeholder grid in the meantime.

### NASA GIBS / TEMPO integration — CRITICAL FACTS

These are hard-won and easy to re-break. Consult this section *before* touching
the map code:

1. **TEMPO is ONLY available in the `epsg4326` GIBS endpoint.** There is no
   `epsg3857` (Web Mercator) version. The Leaflet map must use
   `crs: L.CRS.EPSG4326` and `tileSize: 512` to align with GIBS tiles.

2. **Exact layer IDs** (verified against `WMTSCapabilities.xml`):
   | Species | Layer ID |
   |---|---|
   | NO₂ tropospheric | `TEMPO_L3_NO2_Vertical_Column_Troposphere` |
   | O₃ total column | `TEMPO_L3_Ozone_Column_Amount` |
   | HCHO | `TEMPO_L3_Formaldehyde_Vertical_Column` |
   | UV Aerosol Index | `TEMPO_L3_Ozone_UV_Aerosol_Index` |

   Note the naming quirks: "Ozone" (not "O3"), "Formaldehyde" (not "HCHO").

3. **TileMatrixSets**:
   - TEMPO L3 layers: `1km`
   - `VIIRS_CityLights_2012` basemap: `500m` (jpeg)
   - `Reference_Features_15m` / `Reference_Labels_15m`: `15.625m` (png)

4. **TEMPO's Time dimension is SUB-DAILY**: a new scan every ~5 minutes during
   North-America daylight (approximately 12–23 UTC). A single timestamp only
   covers a **longitude strip** — the instrument sweeps E→W across the day.
   - A date-only request (`YYYY-MM-DD`) will NOT match and returns an empty
     tile. Always send either the literal `default` (latest) or a full ISO
     timestamp (`YYYY-MM-DDTHH:MM:SSZ`).
   - UX consequence: the map exposes a **date picker + hour-of-day slider**
     (12–23 UTC) so users can sweep through the day and see TEMPO's scan
     pattern. A "⟲ Latest scan" button resets to `default`.

5. **URL template** used by the site:
   ```
   https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{LAYER}/default/{TIME}/1km/{z}/{y}/{x}.png
   ```

6. **Smoke tests** (run before and after touching the map):
   ```bash
   curl -sI 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/TEMPO_L3_NO2_Vertical_Column_Troposphere/default/default/1km/3/1/2.png' | head -3
   ```
   Expect `HTTP/2 200` and Content-Length >> 1382 bytes. A 1382-byte response
   is the standard GIBS empty/transparent PNG and means the tile you requested
   has no data at that time (likely outside TEMPO's current scan strip — pick
   a different tile or hour).

### GitHub Pages deploy

The site is published at **https://granttremblay.github.io/earth_digital_twin/**
via [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Trigger:
push to `main` touching `website/` (or manual `workflow_dispatch`). The
workflow uploads `website/` as-is with `actions/upload-pages-artifact@v3` —
no build step.

Hard rules for keeping Pages working:

- **Never use root-relative paths** (`/styles.css`, `/app.js`) in the website.
  Pages serves from `/earth_digital_twin/`, so root-rooted links 404. Always
  use relative (`styles.css`) or absolute-URL externals. The current site is
  clean — keep it that way.
- **Don't introduce a build step.** The workflow uploads the directory
  verbatim. If you reach for Vite/webpack/etc., pause — the whole site is
  ~1300 lines of HTML/CSS/JS and a bundler would be net-negative.
- **Don't rename `website/` → `docs/`.** The workflow points at `website/`
  and the repo's docs do too. If you rename, update the workflow's
  `path:` field, the README, and this file in the same commit.
- **One-time GitHub setting** (already done if the site is live): Settings →
  Pages → Source: GitHub Actions. If Pages stops deploying, check that first.

### Hero background — `earth-plexus-bg.js`

The hero's animated 3-D "plexus Earth" is its own self-contained module. It
was ported from the SolarSMA site's `solar-sma-bg.js` (at
`~/Repositories/ngSMA_Website/`) with a blue-green palette instead of
solar yellow/orange, and scoped to the `.hero` element (not fixed full-page)
so the rest of the site's section backgrounds are unaffected.

Key facts:

- **Injects its own DOM and CSS** into `.hero`. Don't try to style its
  internals from `styles.css` — edit `earth-plexus-bg.js` directly.
- **Uses two canvases**: `#ledt-canvas-far` (blurred, back hemisphere) and
  `#ledt-canvas-near` (sharp, front hemisphere + all connecting lines).
  This is what gives the depth illusion — don't "simplify" to one canvas.
- **Color ramp** in `earthColor(t, heat)` goes mint-white → teal
  (`#3ee1c8`, the site's `--accent`) → ocean blue → deep navy with depth.
  Keep it blue-green; this is explicitly the Earth counterpart to the
  solar/yellow original. If adding another accent, stay within the site's
  palette (`--accent`, `--accent-2`).
- **Replaced** the previous hero: old `<canvas id="starfield">`,
  `.hero-globe`, `.orbit-*`, `.globe*` CSS, and the starfield IIFE in
  `app.js` are all gone. Don't resurrect them — the plexus supersedes
  the CSS globe.
- **Respects `prefers-reduced-motion: reduce`** — rotation + breathing
  halos freeze. Any new effects here should do the same.
- **Do NOT move this to a fixed full-page background** without also
  making the sections below the hero transparent or semi-transparent —
  sections currently use opaque `var(--bg-1)`/`var(--bg-2)` backgrounds
  that would cover a fixed plexus anyway.

### Architecture-section flow — `arch-plexus-bg.js`

Sibling module to the hero plexus, scoped to the **`.arch` section**
(full-bleed — not the inner `.arch-diagram` box, which would clip at the
container's max-width and read as "in a frame"). Same `earthColor()`
ramp, same two-canvas depth trick (`#ledt-arch-canvas-far` blurred +
`#ledt-arch-canvas-near` sharp), but nodes live in a 3-D box that
flows left → right (positive `vx`, with a per-node depth-modulated
multiplier so the field has internal current) and gently bob vertically
on per-node sine phases. Wraps around the right edge.

- `.arch` is the positioning context (`position: relative; isolation: isolate; overflow: hidden`).
  `.arch > .container` (which holds the heading, lede, and diagram) sits at
  `z-index: 2` so all of it floats above the canvas. Cell `.atm` / `.bio`
  / `.ledt` backgrounds are intentionally low-alpha so the plexus glows
  through and across them.
- The old SVG `.arch-connector` dashed flow-lines between rows were
  removed when this landed (2026-06-02). Don't reintroduce them — the
  plexus replaces that affordance.
- `IntersectionObserver` pauses the loop when the section scrolls
  off-screen so it doesn't burn CPU. Respects `prefers-reduced-motion`
  (renders a single static frame and stops).
- If you tune density: `NODE_COUNT`, `CONNECT_DIST`, and `FLOW_SPEED`
  are the three knobs. Don't push density so high that the cell text
  becomes hard to read against the lacework.

### Field-site markers

Representative SERC + STRI sites hardcoded in `app.js`:
- SERC: GCReW (38.8743, -76.5509), Kirkpatrick Marsh, SERC main campus
- STRI: Barro Colorado Island, Agua Salud, Bocas del Toro mangrove

These are illustrative. Keep the SERC sites inside TEMPO's FOV (continental
N. America); STRI sites are intentionally *outside* the FOV as a visual hint
for the Year-2 TEMPO + MethaneSAT + DestinE fusion roadmap.

### Styling notes

- Dark theme, Inter / Space Grotesk / JetBrains Mono stack, with **Ropa Sans**
  (single-weight sans-serif, weight 400) used for the hero title only. CSS var
  is `--font-serif` (name kept for continuity); don't bleed it into other
  section headings — the section rhythm uses Space Grotesk (`--font-disp`) by
  design. Grant switched from Cormorant Garamond to Ropa Sans on 2026-04-30.
- Hero title: the first line is the **Smithsonian logo SVG**
  (`assets/si_logo-primary-white.svg`, class `.hero-si-logo`) replacing the
  plain "The Smithsonian" text. The SVG has a tightly-cropped viewBox
  (`58 158 238 42`) and explicit `width="238" height="42"` attributes so
  browsers use the correct 238:42 aspect ratio. Below it are two stacked
  block elements (no `<br/>`): "Living Earth" is a `.hero-living-earth`
  `<span>` that paints `var(--grad-hero)` through a CSS `mask` of
  `assets/living_earth_wordmark.svg` (animated via `gradShift`), and
  "Digital Twin" is a plain `<img class="hero-digital-twin">` of
  `assets/digital_twin_wordmark.svg`. Don't swap the logo back to text
  without asking.
  - **Mask SVGs must carry explicit `width`/`height` attributes**, not just a
    `viewBox`. `living_earth_wordmark.svg` originally had only `viewBox`,
    which Chrome tolerates as a `mask` source but Safari/Firefox can't size
    with `mask-size: contain` — so the wordmark rendered as an invisible gap
    in those browsers (fixed 2026-06-20 by adding `width="859.55"
    height="201.53"`). Any future SVG used as a CSS `mask`/`-webkit-mask`
    source needs the same explicit dimensions. (The hero emblem is exempt —
    it's an *inline* `<svg>` in the markup, not an external mask file.)
- **The LEDT globe mark is defined ONCE** as a hidden `<symbol id="ledt-mark">`
  at the very top of `<body>` (along with the shared `<linearGradient
  id="ledt-grad">`, which ramps teal → blue → violet → blue → teal and is
  animated by an `<animateTransform>` for the 8s gradient slide). The hero
  emblem, the nav brand logo, and the footer logo are all just
  `<svg ...><use href="#ledt-mark" /></svg>` instances — edit the paths in the
  one `<symbol>`, never in three places. The symbol's paths carry **no `fill`
  attribute**, so each instance's fill is controlled from CSS (white by
  default; `fill: url(#ledt-grad)` where we want the animated gradient).
  - **Why `<use>` and not a CSS `mask`:** Chrome (and Safari/Firefox) block an
    external SVG used as `mask`/`mask-image` when the page is opened over
    `file://` — the masked element renders blank. The old hero `::after`
    mask-image and the old `.brand-logo` `mask: url(...)` both broke this way
    when Grant opened `index.html` directly. The inline `<symbol>` + `<use>`
    approach has no external reference and works identically over `http://`
    **and** `file://`. Don't reintroduce `mask: url('assets/...svg')` for the
    logo. (Adding `fill="..."` to the symbol paths would also break per-instance
    coloring — leave them fill-less.)
  - **Hero emblem** (`.hero-emblem svg`) is always `fill: url(#ledt-grad)`
    (gradient runs continuously). The class is **`.hero-emblem`**, NOT
    `.brand-mark` — colliding classes once caused the nav icon to render the
    whole emblem. Keep them separate.
  - **Nav + footer brand logos** (`.brand-logo`) are white by default and
    transition to `fill: url(#ledt-grad)` on hover/focus
    (`.brand:hover .brand-logo`, `.footer-brand:hover .footer-logo`), with a
    teal `drop-shadow` glow — i.e. the animated gradient "comes in" on hover.
  - `prefers-reduced-motion: reduce` freezes the sweep via
    `#ledt-grad animateTransform { display: none; }`.
- Accent palette: `--accent` teal (#3ee1c8, "bio"), `--accent-2` blue (#7cc7ff,
  "atmosphere"), `--accent-ledt` violet (#c794ff, "LEDT layer"),
  `--accent-3` amber (#ffb347, "methane/sun"), `--accent-4` pink (#ff5e87,
  "tipping point").
- Section rhythm: `eyebrow → h2 → lede → content grid`. Follow this when
  adding sections.
- No framework, no bundler, no Tailwind — if you find yourself reaching for
  one, pause and reconsider. The whole site is ~1300 lines across 3 files.

---

## Python environment (`uv`)

This repo uses **uv** (not conda, not plain venv). Dependencies in
`pyproject.toml`, pinned via `uv.lock`, interpreter pinned via
`.python-version` (3.12).

```bash
uv sync                                                       # install everything
uv run jupyter lab notebooks/tempo_earth2_integration.ipynb   # run notebook
uv run python -c "import xarray; print(xarray.__version__)"   # one-off python
uv add <pkg>         # add a dep (also updates pyproject.toml + uv.lock)
uv remove <pkg>      # remove one
```

Rules when modifying deps:

- **Always go through `uv add` / `uv remove`**, never hand-edit
  `pyproject.toml` without running `uv sync` afterward — the lockfile must stay
  consistent.
- **Commit `pyproject.toml`, `uv.lock`, and `.python-version`** together in
  the same commit. These three files are one unit of reproducibility.
- **Do NOT pin `earth2studio` here.** It's GPU-only and intentionally gated
  behind the "needs GPU" cell at the end of the notebook. It will be
  installed separately on a GPU host when needed.
- **Do NOT switch to conda / pip / poetry.** Grant moved off conda
  specifically; stay on uv.
- When you add a Python dependency for the notebook, update both this file's
  dependency list mentions (if any) and the README's deps section if the
  change is user-visible.

---

## The notebook (`notebooks/tempo_earth2_integration.ipynb`)

A CPU-only, runnable prototype demonstrating:

1. **Fetching** a real TEMPO L3 NO₂ granule via `earthaccess` (falls back to a
   **synthetic TEMPO-like field** if Earthdata auth / network is unavailable —
   this is important, do not remove the fallback; it keeps the notebook
   runnable offline and in CI).
2. **Normalizing** to a minimal LEDT schema (`no2_troposphere(lat, lon)`).
3. **Wrapping TEMPO as an earth2studio `DiagnosticModel`** —
   `TEMPONO2Diagnostic` subclasses `torch.nn.Module` and implements
   `input_coords()`, `output_coords()`, `__call__()`. The API follows
   `earth2studio/examples/08_extend/02_custom_diagnostic.py` exactly, so the
   class drops into `earth2studio.run.diagnostic(...)` alongside
   `PrecipitationAFNO` / `CorrDiff`.
4. **Regridding** TEMPO to the standard Earth-2 0.25° global grid
   (`721 × 1440`) with nearest-neighbor. For production, swap to xESMF /
   pyresample conservative regrid.
5. **Toy ecological-response model** — linear per-biome sensitivity applied
   at five SERC/STRI field sites. This is API scaffolding, **not science**.
   It exists only so the end-to-end pipeline runs; the real model will be
   a neural operator trained on TEMPO × field-network time series.
6. A final cell that shows the real `earth2studio.run.diagnostic(...)` call
   shape — gated behind a "needs GPU" note so it doesn't run.

### GPU requirements

- **This notebook: CPU-only.** Runs on Apple Silicon.
- **Real earth2studio inference: NVIDIA GPU.** NVIDIA recommends compute
  capability ≥ 8.9 (L40S / A6000 / H100), ≥ 40 GB VRAM. Docs say *"if PyTorch
  can run, then many features of Earth2Studio should run as well"* — which is
  not the same as "runs well at scale."
- Intended deployment for the Innovation Design Lab: NSF ACCESS (Perlmutter
  H100s), cloud spot H100s, or a GPU loan via the NVIDIA Earth-2 partnership
  the proposal targets.

---

## Conventions & preferences

### Do

- **Keep `README.md` and `CLAUDE.md` in sync with every substantive change.**
  If you add a dependency, change how the notebook/website runs, add a
  directory, or change a convention — update both files in the same change.
  README is for humans landing on the repo; CLAUDE.md is for future Claude
  sessions. They should never disagree. Grant asked for this explicitly.
- **Follow the proposal.** Section 1 (sustainability challenge), §2 (animating
  question about solar-variability → atmosphere → ecosystems), §5 (Year 1/2/3
  phasing) are the canonical framing. Use their language.
- **Keep things minimal.** No bundlers, no frameworks for the website. No
  earth2studio install required for the notebook's default path.
- **Verify GIBS URLs with curl before committing.** See smoke-test snippet
  above. A silent broken overlay is worse than no overlay.
- **Keep SERC / STRI site coordinates sourced.** Don't invent plots — if you
  add a site, cite it (ForestGEO portal, SERC's GCReW site page, etc.).

### Don't

- Don't add NO₂-from-Earth2 style predictive hype. TEMPO **measures** NO₂; we
  **observe** and **feed** downstream biology. The proposal is careful about
  not overclaiming and the site should be too.
- Don't write a "working" prototype that blends TEMPO × SERC × STRI
  scientifically. Per the user: *"I don't need a working prototype necessarily
  that blends TEMPO and STRI/SERC data, I just need something basic."* The
  toy response model in the notebook is deliberately toy. Don't quietly
  upgrade it into something that looks like real science.
- Don't introduce a build step or package manager for the website.
- Don't vendor `earth2studio` — it lives at `~/Repositories/earth2studio` on
  Grant's machine and will be installed via pip when needed.

---

## External references

- **Proposal PDF:** [`proposal/Smithsonian Living Earth Digital Twin.pdf`](proposal/Smithsonian%20Living%20Earth%20Digital%20Twin.pdf)
- **TEMPO** instrument home: https://tempo.si.edu (SAO / K. Chance PI)
- **NASA GIBS API docs:** https://nasa-gibs.github.io/gibs-api-docs/
- **GIBS Capabilities XML:** https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml
- **NVIDIA Earth-2:** https://www.nvidia.com/en-us/high-performance-computing/earth-2/
- **earth2studio docs:** https://nvidia.github.io/earth2studio/
- **earth2studio custom-diagnostic example** (the pattern the notebook
  follows): `~/Repositories/earth2studio/examples/08_extend/02_custom_diagnostic.py`
- **SERC GCReW:** https://serc.si.edu/gcrew
- **STRI ForestGEO:** https://forestgeo.si.edu
- **Coastal Carbon Network:** https://serc.si.edu/coastalcarbon

---

## Principals (from proposal)

- **PI:** Grant Tremblay (SAO) — TremblayG@si.edu
- **SAO Co-Is:** Michael McCarthy, Randall Smith, Cecilia Garraffo, Caroline Nowlan
- **SERC Co-Is:** Justin Nowakowski, Patrick Megonigal, Roy Rich
- **STRI Co-Is:** Mark Torchin, Oris Sanjur
- **Engaged partners:** NVIDIA Earth-2, NASA ESDT, DestinE, Bezos Earth Fund, NMNH, Smithsonian Data Science Lab
