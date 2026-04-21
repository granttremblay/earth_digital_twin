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
├── proposal/
│   └── Smithsonian Living Earth Digital Twin.pdf
├── website/                       # sophisticated landing page + live TEMPO map
│   ├── index.html
│   ├── styles.css
│   └── app.js
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

- **Hero** with animated orbiting-globe + starfield canvas
- **Mission / Gap** section (the "biologically inert" framing from proposal §1)
- **Live TEMPO map** — interactive, tiled from NASA GIBS
- **Architecture diagram** (Atmosphere → LEDT → Biosphere)
- **Field Network** (SAO / SERC / STRI cards)
- **Methane-to-Mangrove pipeline** (4-step)
- **Team / partners** (all 10 Co-Is from the proposal, plus engaged partners)

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

### Field-site markers

Representative SERC + STRI sites hardcoded in `app.js`:
- SERC: GCReW (38.8743, -76.5509), Kirkpatrick Marsh, SERC main campus
- STRI: Barro Colorado Island, Agua Salud, Bocas del Toro mangrove

These are illustrative. Keep the SERC sites inside TEMPO's FOV (continental
N. America); STRI sites are intentionally *outside* the FOV as a visual hint
for the Year-2 TEMPO + MethaneSAT + DestinE fusion roadmap.

### Styling notes

- Dark theme, Inter / Space Grotesk / JetBrains Mono stack
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

- **PI:** Grant Tremblay (SAO) — grant.tremblay@cfa.harvard.edu
- **SAO Co-Is:** Michael McCarthy, Randall Smith, Cecilia Garraffo, Caroline Nowlan
- **SERC Co-Is:** Justin Nowakowski, Patrick Megonigal, Roy Rich
- **STRI Co-Is:** Mark Torchin, Oris Sanjur
- **Engaged partners:** NVIDIA Earth-2, NASA ESDT, DestinE, Bezos Earth Fund, NMNH, Smithsonian Data Science Lab
