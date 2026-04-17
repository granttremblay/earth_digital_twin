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
| [`CLAUDE.md`](CLAUDE.md) | Working notes for anyone (human or AI) picking up this repo — repo layout, GIBS/TEMPO gotchas, conventions, don'ts. |

## Running the website

No build step. Just serve the directory:

```bash
cd website
python -m http.server 8000
# open http://localhost:8000
```

The TEMPO overlay pulls directly from NASA GIBS WMTS. GIBS near-real-time TEMPO products typically run 24–48 h behind; the date picker lets you scrub back. CartoDB dark basemap, Leaflet 1.9, vanilla JS — no framework, no build, no bundler.

## Running the notebook

```bash
cd notebooks
pip install numpy xarray netcdf4 matplotlib cartopy requests earthaccess
jupyter lab tempo_earth2_integration.ipynb
```

On first run `earthaccess` will prompt for a free NASA Earthdata login. If Earthdata is unreachable the notebook falls back to a synthetic TEMPO-like field so the rest of the pipeline still runs.

## Do I need an NVIDIA GPU?

**For this prototype: no.** The notebook runs end-to-end on CPU (an Apple Silicon Mac is fine).

**For the real Earth-2 pipeline: yes.** NVIDIA's recommended baseline for `earth2studio` inference is a compute-capability-≥ 8.9 GPU (L40S / A6000 / H100) with ≥ 40 GB VRAM. Some smaller models run on more modest GPUs, and a subset will technically run on CPU — but at unusable speeds. The Earth2Studio docs are explicit: *"if PyTorch can run, then many features of Earth2Studio should run as well,"* which is not the same as *"runs well."*

For the LEDT's Year-1 prototyping we don't need the full pipeline locally; we need custom diagnostic authoring, data ingest, and CorrDiff-Bio design — all of which are CPU-friendly. When we need real-scale runs we'll use NSF ACCESS (Perlmutter has H100s), AWS/Lambda spot H100s, or a GPU loan from the NVIDIA Earth-2 partnership we're targeting.
