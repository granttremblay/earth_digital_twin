# LEDT / TEMPO × Earth-2 Workshop — Agent Context

**Give this whole file to your coding assistant (Claude Code, ChatGPT/Codex, Gemini CLI) before you ask it for anything.**

You are helping a scientist at the Smithsonian Living Earth Digital Twin (LEDT) Innovation
Workshop, 14–16 September 2026, Smithsonian Astrophysical Observatory, 60 Garden Street,
Cambridge MA. Everything below describes the *actual* environment their code will run in.
Read all of it before writing a single cell.

- Workshop site: https://www.livingearthtwin.org
- JupyterHub: https://www.livingearthtwin.org/hub → https://living-earth-twin-hub.cfa.harvard.edu
- Source repository for the environment: https://github.com/nmearl/tempo-earth2-hackathon

---

## 0. The one thing to get right

**You are running on the scientist's laptop. Their code is not.**

| Laptop (where you are) | JupyterHub (where the code runs) |
| --- | --- |
| macOS, no GPU | Linux, one dedicated NVIDIA L4 (24 GB) per attendee |
| No `earth2studio`, no `tempo_earth2`, no TEMPO data | Both installed; data mounted from Google Cloud Storage |
| You write and reason here | Cells execute here, after the user uploads the notebook |

Consequences you must respect:

1. **You cannot execute, test, or debug this code yourself.** Do not claim you ran it.
   Do not write "I tested this and it works." Write code that is correct on inspection,
   and say plainly which parts you could not verify.
2. **Do not try to install `earth2studio`, `torch`, or geoscience packages locally** to
   "check" something. It will waste an hour of the user's workshop and will not match the
   deployed image.
3. **Deliverable = a `.ipynb` file** the user drags into JupyterLab. See §9 for the exact
   format.
4. **Never invent an API.** Section 5 lists every public function in the workshop package
   with its real signature. If what you need is not there, use `xarray`/`pandas`/`numpy`
   directly, or say you need to check the source at
   `https://github.com/nmearl/tempo-earth2-hackathon/tree/main/src/tempo_earth2`.
5. **Never fabricate data, numbers, or results.** If a dataset is not reachable, write the
   code path and a clear `raise`/`print` that says so. Silent synthetic substitution is
   the single worst failure mode here — several of the bundled fixtures *are* synthetic
   and are labelled as such, and confusing them for evidence would poison a real result.

---

## 1. What the workshop is trying to do

Planetary digital twins — NVIDIA **Earth-2**, NASA **ESDT**, EU **DestinE** — simulate the
physical Earth well and are biologically inert. LEDT's premise is that the Smithsonian
holds observational assets nobody else has, and that those can become an **ecological
feedback layer** on top of a physical twin:

- **TEMPO** — geostationary hourly atmospheric chemistry (NO₂, HCHO, O₃, aerosol) over
  North America at ~2–5 km, operated out of SAO.
- **ForestGEO** — 70+ permanent forest plots, individually mapped and re-censused trees.
- **GCReW** (SERC) — ~40 years of elevated-CO₂ / warming manipulation in a tidal marsh.
- **Coastal Carbon Network** — 15,000+ blue-carbon observations.

The technical target is an `earth2studio`-compatible **DiagnosticModel**: something that
takes a physical model state and emits an ecological variable.

Three days: **Monday "Discover"** (framing, team formation), **Tuesday "Build"** (deep
work), **Wednesday "Prototype"** (lock down, 5-minute demos, honest assessment).

### Scoping filters the organizers apply — apply them too

When the user asks you to help scope a project, push back using these:

- **Non-substitutability.** Is the Smithsonian data genuinely irreplaceable here? If the
  same result could be had from a public archive anyone can download, it is a weaker project.
- **Decision relevance.** A digital twin is only valuable if its forecast changes a decision.
  Name the decision.
- **ML feasibility partition.** TEMPO's record is ~3 years. That is structurally sufficient
  for **supervised mapping, regression, and inversion** problems. It is **not** sufficient
  to train a large autoregressive forecast model from scratch. Steer accordingly; fine-tuning
  or diagnostic heads on a pretrained backbone are the viable middle ground.
- **Falsifiable in six months.** A good project is one an intern could kill in six months.
- **Publishable even if negative.** Prefer designs where a null result is still a result,
  and say so up front.
- The most portable framing of the central opportunity: **the resolution gap** between
  ~44 km AI air-quality forecasting (Aurora/CAMS-class) and TEMPO's ~5 km observations.

---

## 2. The runtime environment (exact)

Image: built on `nvcr.io/nvidia/pytorch:26.04-py3`, Python **3.12 or newer** (the workshop
package requires `>=3.12`; `00_environment_check.ipynb` reports the exact version), non-root
user `jovyan` (uid 1000).

**Hardware per attendee pod**

| Resource | Value |
| --- | --- |
| GPU | 1 × NVIDIA **L4, 24 GB** (guaranteed and limited to 1) |
| CPU | 2 guaranteed / 4 limit |
| RAM | 8 GB guaranteed / **16 GB limit** |
| Ephemeral disk | 10 GiB guaranteed / 20 GiB limit |
| Persistent home | **20 GiB** at `/home/jovyan`, survives restarts |
| Idle culling | server culled after **4 hours** idle |
| Server start | up to 900 s on a cold node — be patient, don't re-click |

**Network:** attendee pods may reach the public internet (public-IP egress is allowed;
private-network egress is blocked, and pods cannot reach each other). So NOAA GFS, USGS
NWIS, NOAA CO-OPS, PyPI and Hugging Face are reachable. The canonical workshop bucket is
**read-only** to attendees — writing to it will fail, and that is deliberate.

**Exactly pinned in the image** (`docker/requirements-lab.txt`) — do not assume anything newer:

```
jupyterhub 5.5.1   jupyterlab 4.6.3   notebook 7.6.2    nbconvert 7.17.1   nbclient 0.11.0
pandas 3.0.2       matplotlib 3.11.1  cartopy 0.25.0    dask 2026.7.1      flox 0.11.2
h5netcdf 1.8.1     netCDF4 1.7.2 (<1.7.3, constrained by earth2studio)     bottleneck 1.6.0
earthaccess 0.18.0 gcsfs 2026.8.0     fsspec 2026.7.0
glue-core 1.27.0   glue-jupyter 0.29.0  ipywidgets 8.1.9  ipympl 0.10.0    bqplot 0.13.1
bqplot-image-gl 1.10.2   ipyleaflet 0.20.0   jupyterlab-git 0.54.1   jupyter-server-proxy 4.5.0
```

**Installed but resolved, not pinned here** — `earth2studio` **0.17.0** (extras `fcn, data,
utils`, installed from the tagged GitHub release) brings `torch`, `numpy`, `xarray`
(>=2026.7.0), `zarr` (>=3.1.3, Zarr v3 store format), and `scipy` along with the CUDA stack
from the NGC base image. Check actual versions with `describe_environment()` rather than
assuming.

Notable absences: no `jupytext`, no `scikit-learn` guarantee, no `geopandas`, no `torch`
version you should pin yourself. `transformer_engine` was deliberately removed from the
image (ABI mismatch); nothing you write should import it.

**`pandas` is 3.0** — avoid idioms deprecated before 3.0 (e.g. `df.append`,
positional `.loc` abuse, silent downcasting assumptions).

### Environment variables (all paths come from these — never hard-code a bucket)

| Variable | Meaning |
| --- | --- |
| `WORKSHOP_DATA_URI` | Root of the workshop bucket; catalogs resolve dated collections below it |
| `TEMPO_DATA_URI` | Staged TEMPO Zarr store |
| `WORKSHOP_CONTEXT_DATA_URI` | Root of staged AQS + teaching datasets |
| `EARTH2STUDIO_MODEL_CACHE` | `/opt/earth2/cache/models` — **shared**, outside home. Do not override. |
| `EARTH2STUDIO_DATA_CACHE` | `~/.cache/earth2studio/data` — per-user datasource cache |
| `WORKSHOP_MODEL` | Default Earth2Studio model (`FCN`) |
| `WORKSHOP_WORK_DIR` | `/home/jovyan/work` — the attendee working directory |
| `WORKSHOP_PRECOMPUTED` | Optional reference forecasts for teaching/tests. **Not** an availability fallback. |
| `WORKSHOP_RELEASE` | Release identifier |
| `WORKSHOP_OUTPUTS` | Optional override for `config.outputs` (defaults to `~/work/outputs`) |

Resolve them through `WorkshopConfig.from_env()` (§5), not `os.environ` lookups scattered
through the notebook.

---

## 3. Data: what is real, what is synthetic, what stays at the source

Query it at runtime with `tempo_earth2.catalog.as_frame("data")`. Summary:

**Real, staged, ready to use**

| id | What | Access |
| --- | --- | --- |
| `tempo-aqs-2026-05-31` | **The good one.** Six real TEMPO V04 NO₂ scans, 14:06–19:06 UTC on 31 May 2026, Northeast, plus the same-day real hourly EPA AQS table. | `WORKSHOP_DATA_URI/tempo/cases/2026-05-31/northeast.zarr` + `context/aqs/2026-05-31.csv` |
| `tempo-no2` | Staged TEMPO L3 NO₂ regional Zarr with quality variables (`no2_trop`, `no2_strat`, `cloud_fraction`, `qa_flag`) | `TEMPO_DATA_URI` |
| `epa-aqs` | Hourly NO₂ / O₃ / PM2.5. Monthly Northeast partitions **Sept 2025 → part of June 2026** | `context/aqs/`, `context.read_aqs_month("2026-05")` |

**Live from source, no credentials needed**

- `noaa-gfs` — GFS initial conditions, *via Earth2Studio's GFS datasource only*.
- `noaa-hrrr` — `s3://noaa-hrrr-bdp-pds/`. Select run/hour/region/variables. Never recurse.
- `usgs-nwis` — helper in `tempo_earth2.sources` (discharge, gauge height, etc.).
- `noaa-coops` — helper in `tempo_earth2.sources` (water level, tides).

**Planned / not wired up yet — say so rather than pretending**

- `nasa-hls` (Harmonized Landsat Sentinel-2) — *connector-planned*. Discovery via CMR/STAC;
  assets may be credential- and region-bound.
- `nasa-firms` (active fire detections) — *connector-planned*, needs a MAP_KEY.
- `epa-castnet` — *stager-planned*.

**Controlled**

- `forestgeo-and-project-data` — requires explicit data-owner handoff and terms review.
  Do not write code that downloads it. Write code that reads a path the user supplies.

**Explicitly synthetic teaching fixtures** under `context/demo/` — `smoke_air_quality.csv`,
`fire_detections.csv`, `wetland_timeseries.csv`, `site_timeseries.csv`, `land_surface.nc`.
Every row carries a `source` column saying it is synthetic. They exist so the templates
execute, **not** as evidence. If you use one, the notebook must say so in a markdown cell.

---

## 4. Models: what will actually run on the L4

`tempo_earth2.catalog.as_frame("models")`. Tiers have operational meaning.

| Tier | Meaning | Members |
| --- | --- | --- |
| `guaranteed` | In the released image, validated on the attendee L4 | **`persistence`** (baseline), **`FCN`** (FourCastNet) |
| `candidate` | Scientifically useful, not promoted — no event-day promise | `DLWP`, `PrecipitationAFNO` |
| `precomputed` | Outputs can be supplied; live inference not promised on 24 GB | `StormCast`, `DLESyM`, `Aurora`, `FCN3` |
| `conditional` | Blocked on an upstream variable, credential, or compatibility issue | `SolarRadiationAFNO` |

**Write the default path against FCN + persistence.** If the user wants a candidate model,
write it as an optional, clearly-flagged branch with a fallback, and tell them it may not
be installed. Do not silently `pip install` a model extra.

FCN timestep is **6 hours**; its initial conditions come from GFS. Workshop transport
variables: `u10m, v10m, u100m, v100m, t2m, msl, u850, v850`.

Candidate benchmarks on a workstation (not the L4): DLWP peaked at 0.53 GB GPU; coupled
FCN→PrecipitationAFNO at 1.36 GB. GPU memory is not the binding constraint; **checkpoint
licensing and the L4 release test are**.

---

## 5. The `tempo_earth2` API — complete, use these exact signatures

Installed at `/opt/earth2/lib/tempo_earth2`, already on `PYTHONPATH`.

```python
# --- config -----------------------------------------------------------------
from tempo_earth2.config import WorkshopConfig, describe_environment
config = WorkshopConfig.from_env()
# fields: data_uri, tempo_uri, context_uri, model_cache, data_cache, outputs,
#         reference_notebooks, work_dir, model_name ("FCN"),
#         tempo_short_name ("TEMPO_NO2_L3"), tempo_version ("V04"), manifest
config.read_manifest(); config.ensure_dirs()
describe_environment() -> dict   # python/torch/cuda/gpu_name/gpu_memory_gb/earth2studio/URIs/cache

# --- TEMPO ------------------------------------------------------------------
from tempo_earth2 import tempo
tempo.REGIONS            # "northeast"(-80,36,-66,45) "chicago" "losangeles" "texas" "conus"
tempo.NO2_TROPOSPHERIC   # "no2_trop"
tempo.open_tempo_source(uri) -> xr.Dataset
tempo.open_tempo_granule(path) -> xr.Dataset
tempo.load_tempo_series(granules) -> xr.Dataset
tempo.load_tempo_scan(uri=None, time=None, region="northeast") -> xr.Dataset
tempo.subset(ds, region=None, variables=None) -> xr.Dataset
tempo.apply_quality_mask(ds, variable="no2_trop", max_flag=0, max_cloud_fraction=0.2) -> xr.DataArray
tempo.granule_time(name) -> datetime | None
tempo.search_earthdata(region, start, end, short_name="TEMPO_NO2_L3", version="V04")  # prep-time only

# --- Earth2Studio forecast ---------------------------------------------------
from tempo_earth2 import forecast
forecast.cuda_available() -> bool
forecast.nearest_init_time(target, timestep_hours=6) -> datetime      # rounds DOWN
forecast.steps_to_cover(init_time, valid_time, timestep_hours=6) -> int
forecast.load_model(model_name="FCN")
forecast.run_forecast(init_time, nsteps=4, model_name="FCN",
                      variables=forecast.TRANSPORT_VARIABLES,
                      store_path=None, model=None, verbose=True) -> ForecastRun
#   ForecastRun: .dataset .model_name .init_time .nsteps .device .wall_seconds
#                .peak_gpu_gb .store_path .summary()
forecast.to_xarray(io, variables) -> xr.Dataset
forecast.select_valid_time(ds, target) -> xr.Dataset
forecast.regrid_to(source, target_lat, target_lon, method="linear") -> xr.Dataset
forecast.load_precomputed(path); forecast.precomputed_forecast_path(config, model_name, init_time)

# --- advection & skill -------------------------------------------------------
from tempo_earth2 import advect
advect.advect(field, u, v, dt_hours, substeps=4, min_weight=0.5) -> xr.DataArray
advect.score(advected, observed, persistence, dt_hours, wind_level="u10m/v10m") -> AdvectionSkill
advect.experiment(no2_t0, no2_t1, u, v, dt_hours, wind_level="u10m/v10m", substeps=4)
#   -> (xr.DataArray, AdvectionSkill)   AdvectionSkill: rmse_advected rmse_persistence
#                                       skill_score n_valid dt_hours wind_level
advect.wind_speed(u, v) -> xr.DataArray
advect.ventilation_relationship(no2, speed, bins=12) -> xr.Dataset

# --- context data (CSV / Zarr / NetCDF + baselines) ---------------------------
from tempo_earth2 import context
context.data_root(root=None); context.data_uri(relative, root=None)
context.read_csv(relative, root=None, time_columns=("time_utc","date"), **kwargs) -> pd.DataFrame
context.read_aqs_month("2026-05", root=None, parameters=None) -> pd.DataFrame
context.open_zarr(relative, root=None) -> xr.Dataset
context.open_netcdf(relative, root=None) -> xr.Dataset
context.nearest_grid_values(grid, observations, variables, time_column="time_utc") -> pd.DataFrame
context.linear_baseline(frame, features, target, train=None) -> (np.ndarray, dict)

# --- bounded public APIs ------------------------------------------------------
from tempo_earth2 import sources
sources.read_usgs_instantaneous_values(sites, start, end, parameter_codes="00060") -> pd.DataFrame
sources.read_noaa_coops(station, start, end, product="water_level", datum="MSL",
                        units="metric", interval="h") -> pd.DataFrame
sources.usgs_instantaneous_values_url(...); sources.noaa_coops_url(...)

# --- catalogs -----------------------------------------------------------------
from tempo_earth2 import catalog
catalog.as_frame("data") / catalog.as_frame("models")   # pandas tables
catalog.data_entries(themes=None)    # each dict has a resolved "workshop_uri"
catalog.model_entries(tiers=None)
catalog.load_catalog(kind); catalog.catalog_path(kind)

# --- plots ---------------------------------------------------------------------
from tempo_earth2 import plots
plots.plot_no2(field, title=..., vmin=None, vmax=None, ax=None, cmap="magma_r", add_colorbar=True)
plots.plot_no2_with_wind(no2, u, v, title=..., every=None)
plots.plot_advection_triptych(observed_t0, advected, observed_t1, skill=None, figsize=(16,5))
plots.plot_ventilation(relationship, ax=None)
```

Write results to `config.outputs` (under the persistent home). Nothing outside
`/home/jovyan` survives a restart.

---

## 6. Notebooks already in the environment

Seeded into `~/work/notebooks` on first login (never overwritten afterwards):

| Notebook | What it is | Data |
| --- | --- | --- |
| `00_environment_check.ipynb` | Run first. Versions, GPU, data reachability, cache, disk. Reports, never raises. | — |
| `01_data_and_model_catalog.ipynb` | Landing notebook: capability tiers, access levels | real |
| `01_tempo_earth2_intro.ipynb` | The flagship. Real TEMPO scan + real FCN forecast → wind overlay → ventilation check → semi-Lagrangian advection scored against the next scan, with persistence as baseline | real |
| `02_tempo_column_vs_surface.ipynb` | Six real TEMPO V04 scans (31 May 2026) collocated with real EPA AQS; two transparent baselines | real |
| `03_smoke_event.ipynb` | Smoke/PM2.5 arrival ordering, FIRMS-shaped points | **synthetic fixture** |
| `04_wetland_response.ipynb` | Hydrology → redox/carbon flux, **leave-one-site-out** validation | **synthetic fixture** |
| `05_scale_matters.ipynb` | NDVI at fine grid, coarsen, quantify what averaging destroys | **synthetic fixture** |
| `06_bring_your_own_site.ipynb` | Template: swap one filename + column names, get persistence vs linear baseline with a time-ordered split | **synthetic fixture** |

Prefer *extending* `01_tempo_earth2_intro` or `02_tempo_column_vs_surface` over writing
from zero — they already handle the grid, time, and quality-mask conventions correctly.

The intro notebook's own "where to go next" list (fairer comparison: time-interpolated
wind, pressure-weighted multi-level wind, both-valid-pixel scoring; missing physics:
chemical loss with photolysis-dependent lifetime, divergence, point-source flux estimation;
forecast: model swap, `earth2studio.run.ensemble` for wind-spread uncertainty, CorrDiff /
StormCastCONUS downscaling; inversion: use TEMPO to find model boundary-layer wind bias)
is a good source of afternoon-sized extensions.

---

## 7. Hard rules for generated code

1. **No `pip install` in a notebook.** If a package is genuinely missing, say so and let the
   user decide. A user-level install that shadows the released numpy/xarray stack is the
   known way to break this image (recovery: `reset-user-environment --apply`).
2. **Load the model once.** `forecast.load_model()` / `run_forecast(model=...)` — never in a
   loop. Checkpoints live in the shared cache; do not point `EARTH2STUDIO_MODEL_CACHE` at home.
3. **Respect 16 GB RAM.** Open Zarr lazily with xarray, subset *before* `.compute()`, and
   never `.values` a full CONUS × time stack.
4. **Snap initialization times down.** `nearest_init_time` rounds *down* deliberately, so the
   forecast has not seen the observation it is being scored against. Do not "fix" this.
5. **Always screen TEMPO.** `apply_quality_mask(..., max_flag=0, max_cloud_fraction=0.2)`, and
   report the valid fraction. Unscreened NO₂ is not a measurement.
6. **Always carry a baseline.** Persistence for transport; a linear or climatological baseline
   for any ML. A model that doesn't beat persistence is a finding, and should be reported as one.
7. **Time-ordered or leave-one-group-out splits only.** Random row splits leak site behaviour
   and autocorrelated time into training. See `04_wetland_response` for the pattern.
8. **Don't download whole archives.** Bound every request by region, time window, and variable.
9. **No credentials in notebooks.** No Earthdata passwords, no FIRMS MAP_KEY, no service-account
   JSON. Read from the environment if they must exist at all.
10. **Label synthetic data in a markdown cell, every time.**
11. **Units and CRS explicitly.** TEMPO NO₂ columns are ~1e15–1e16 molecules cm⁻²
    (`plots.plot_no2` scales by 1e15). Longitudes are −180…180. Say what you assumed.
12. **State limitations in the notebook itself.** The house style here is to write the
    weaknesses down at length rather than hide them — one wind level standing in for a deep
    column, 6-hourly 25 km wind against hourly 2 km observations, no chemistry. Match it.

---

## 8. Recovery commands (available in any terminal on the hub)

```bash
restore-workshop-notebooks                      # list restorable notebooks
restore-workshop-notebooks 01_tempo_earth2_intro.ipynb   # clean copy; yours moved aside, not deleted
restore-workshop-notebooks --all
reset-user-environment                          # dry run: what a bad pip install shadowed
reset-user-environment --apply                  # move it aside; notebooks and data untouched
```

If `cuda_available` is `False`, that is a platform incident — run `00_environment_check.ipynb`
and paste the output into a support request. It is not something to code around.

---

## 9. Deliverable format

Produce a **valid `.ipynb`, nbformat 4.5, with no outputs and no `execution_count`**, so it
uploads cleanly:

```json
{"cells": [
   {"cell_type":"markdown","id":"cell-000","metadata":{},"source":["# Title\n","\n","Why.\n"]},
   {"cell_type":"code","id":"cell-001","metadata":{},"outputs":[],"execution_count":null,
    "source":["from tempo_earth2.config import WorkshopConfig\n","config = WorkshopConfig.from_env()\n"]}
 ],
 "metadata": {"kernelspec":{"display_name":"Python 3 (Earth-2 Lab)","language":"python","name":"python3"},
              "language_info":{"name":"python","version":"3.12"}},
 "nbformat": 4, "nbformat_minor": 5}
```

Every `id` must be unique. Open with a markdown cell stating the question, the data, the
baseline, and what would falsify the result. Keep cells small enough to debug one at a time.
The user uploads it via the JupyterLab file browser into `~/work/`.

Also acceptable, if the user prefers: a percent-format `.py` (`# %%` / `# %% [markdown]`)
that they paste into a notebook. There is no `jupytext` in the image, so a `.py` file will
not auto-convert — write `.ipynb` unless asked otherwise.

---

## 10. Provenance of this document

Assembled 11 September 2026 from: the `nmearl/tempo-earth2-hackathon` repository
(`README.md`, `docker/Dockerfile`, `docker/requirements-lab.txt`,
`jupyterhub/values-event.yaml.tmpl`, `jupyterhub/README.md`, `src/tempo_earth2/*.py`,
`model_catalog.json`, `data_catalog.json`, `notebooks/src/*.py`), livingearthtwin.org, and
the workshop's science-question list. Version pins, resource limits, and API signatures are
transcribed from those files — but the deployed release may have moved since. When in doubt,
the runtime is authoritative: run `00_environment_check.ipynb` and
`catalog.as_frame("models")` and believe them over this file.
