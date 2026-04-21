# LEDT — Smithsonian Living Earth Digital Twin

Seed-award prototype repository for the **Living Earth Digital Twin** (LEDT) — a proposed ecological feedback layer that plugs into existing planetary digital twins (NVIDIA Earth-2, NASA ESDT, DestinE).

- **PI:** Grant Tremblay (SAO)
- **Award:** $150K OUSSR Innovation Concept seed
- **Units:** SAO · SERC · STRI

## Contents

| Path | Purpose |
|---|---|
| [`proposal/`](proposal/) | The authoritative OUSSR proposal PDF. Read first. |
| [`website/`](website/) | Interactive landing site with live NASA GIBS TEMPO tiles, field-network map, architecture diagram, team / pipeline. |
| [`notebooks/tempo_earth2_integration.ipynb`](notebooks/tempo_earth2_integration.ipynb) | Runnable CPU-only demo: fetches TEMPO NO₂, wraps it as an `earth2studio`-compatible diagnostic model, sketches the TEMPO → ecological-response linkage. |
| [`pyproject.toml`](pyproject.toml) / [`uv.lock`](uv.lock) | Python deps for the notebook, managed with [`uv`](https://docs.astral.sh/uv/). See [Python environment](#python-environment-uv) below. |
| [`CLAUDE.md`](CLAUDE.md) | Working notes for anyone (human or AI) picking up this repo — repo layout, GIBS/TEMPO gotchas, conventions, don'ts. |

## Running the website

No build step. Just serve the directory:

```bash
cd website
python -m http.server 8000
# open http://localhost:8000
```

The TEMPO overlay pulls directly from NASA GIBS WMTS. GIBS near-real-time TEMPO products typically run 24–48 h behind; the date picker lets you scrub back. CartoDB dark basemap, Leaflet 1.9, vanilla JS — no framework, no build, no bundler.

The hero background is an animated 3-D "plexus Earth" — a slowly-rotating sphere of connected nodes in a blue-green (teal → ocean → navy) gradient, with two canvases for depth (far-blurred, near-sharp) and a breathing cyan atmospheric halo. Code lives in [`website/earth-plexus-bg.js`](website/earth-plexus-bg.js) and injects its own DOM into the `.hero` element; no CSS changes required to enable it. `prefers-reduced-motion: reduce` freezes the animation.

The hero title ("The Smithsonian / Living Earth / Digital Twin") is set in **Cormorant Garamond** — an elegant classical serif — with a blue-green gradient accent on "Living Earth". The rest of the site uses Inter / Space Grotesk / JetBrains Mono.

A project emblem ([`website/assets/digital_earth_logo.svg`](website/assets/digital_earth_logo.svg)) sits above the title in the hero. It's rendered via CSS `mask-image` and filled with the same animated `--grad-hero` gradient as "Living Earth", so recoloring the gradient in one place updates both.

### Public deploy (GitHub Pages)

The site auto-publishes to **https://granttremblay.github.io/earth_digital_twin/** on every push to `main` that touches `website/`. The deploy is driven by [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which uploads the `website/` directory as-is — no build step, no branch dance.

One-time setup on the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Notes:
- The site lives at a **subpath** (`/earth_digital_twin/`), so keep all internal links relative (`styles.css`, `app.js`, etc.) and never root-rooted (`/styles.css` would 404).
- External resources (GIBS tiles, CDN-hosted Leaflet / fonts) are absolute HTTPS URLs and work fine on Pages.
- `workflow_dispatch` is enabled — you can trigger a redeploy manually from the Actions tab.

## Python environment (uv)

This repo uses [**uv**](https://docs.astral.sh/uv/) for Python dependency management — no conda, no manual venv, no build step. Dependencies are declared in [`pyproject.toml`](pyproject.toml); [`uv.lock`](uv.lock) pins the exact resolved versions; [`.python-version`](.python-version) pins the interpreter (3.12).

```bash
# install uv once (macOS): brew install uv
uv sync    # creates .venv/ and installs everything in pyproject.toml + uv.lock
```

That's it. No activation required — `uv run <cmd>` picks up `.venv` automatically. You *can* still `source .venv/bin/activate` if you prefer.

### Common commands

```bash
uv run jupyter lab notebooks/tempo_earth2_integration.ipynb   # run the notebook
uv run python -c "import xarray; print(xarray.__version__)"   # one-off python
uv add pyresample                                              # add a dep
uv remove h5netcdf                                             # remove one
uv sync                                                        # re-sync after a git pull
```

Notes:
- Commit **`uv.lock`** and **`.python-version`** — they're the reproducibility guarantee (the conda equivalent of a frozen env spec).
- uv will auto-download Python 3.12 if your machine doesn't have it — no `pyenv` needed.
- In JupyterLab, pick the **"Python 3 (ipykernel)"** kernel when launched via `uv run jupyter lab`.
- `earth2studio` is intentionally **not** pinned here — it's GPU-only and gated behind the "needs GPU" cell at the end of the notebook. Install it separately on a GPU host when you need it.

## Running the notebook

```bash
uv run jupyter lab notebooks/tempo_earth2_integration.ipynb
```

On first run `earthaccess` will prompt for a free NASA Earthdata login. If Earthdata is unreachable the notebook falls back to a synthetic TEMPO-like field so the rest of the pipeline still runs.

## Do I need an NVIDIA GPU?

**For this prototype: no.** The notebook runs end-to-end on CPU (an Apple Silicon Mac is fine).

**For the real Earth-2 pipeline: yes.** NVIDIA's recommended baseline for `earth2studio` inference is a compute-capability-≥ 8.9 GPU (L40S / A6000 / H100) with ≥ 40 GB VRAM. Some smaller models run on more modest GPUs, and a subset will technically run on CPU — but at unusable speeds. The Earth2Studio docs are explicit: *"if PyTorch can run, then many features of Earth2Studio should run as well,"* which is not the same as *"runs well."*

For the LEDT's Year-1 prototyping we don't need the full pipeline locally; we need custom diagnostic authoring, data ingest, and CorrDiff-Bio design — all of which are CPU-friendly. When we need real-scale runs we'll use NSF ACCESS (Perlmutter has H100s), AWS/Lambda spot H100s, or a GPU loan from the NVIDIA Earth-2 partnership we're targeting.
