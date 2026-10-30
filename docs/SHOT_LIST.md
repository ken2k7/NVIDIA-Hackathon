# InfraSync — Screen-Recording Shot List (RECORD THIS FIRST)

**This is the priority doc.** Every screen-recording clip the video needs, split between **Kenil** and **Bhavya**. Record these before any graphics/VO work; they are the inputs everything else wraps around.

> **Both video scripts use these exact same clips.** `SCRIPT_BASIC.md` (safe) and `SCRIPT_BEAST.md` (cinematic) reference the identical `SR-xx` clips below, so you only record this set **once** and use it for either version.

All on-screen numbers are **verified against the live app (2026-10-30)**. Do not improvise different values.

---

## 0 · The one hard rule — record TRUE 1920×1080 (16:9)

Your MacBook screen is **16:10 and Retina (high-DPI)**, so a naive full-screen capture is the wrong shape and 2× the pixels. Use ONE of these three methods:

### Method A — OBS Studio *(recommended · exact 1080p · free)*
1. Install OBS → `obsproject.com`.
2. **Settings → Video:** Base (Canvas) = **1920×1080**, Output (Scaled) = **1920×1080**, FPS = **60**.
3. **Settings → Output → Recording:** Format **mp4**, Encoder = Apple VT H.264 (hardware), quality **High/Indistinguishable**.
4. **Sources → + → macOS Screen Capture** → pick the display (grant permission in System Settings → Privacy → Screen Recording).
5. Right-click source → **Transform → Edit Transform** → Bounding Box = **Scale to outer bounds**, 1920×1080. (Fills 16:9, trims a sliver top/bottom — fine.)
6. **Start Recording.** Output is exactly 1920×1080.

### Method B — QuickTime + crop in Premiere *(no install)*
1. `⌘⇧5` → record the browser window (or full screen).
2. In Premiere: new **1920×1080 / 30 fps** sequence → drop clip → **scale to fill width** (crops extra height down to 16:9). Retina footage downscales crisp.
3. **Keep all important UI out of the top/bottom 10%** so the crop never eats a number.

### Method C — Chrome exact viewport
DevTools (`⌘⌥I`) → device toolbar (`⌘⇧M`) → Responsive = **1920×1080** → record just that region. *(Test the Leaflet map first — DevTools device mode can resize it oddly.)*

> **Pick Method A.** No time to learn OBS → Method B.

---

## 1 · Pre-flight (do before EVERY session)

- [ ] Backend up: from `backend/` → `uvicorn app.main:app --reload --port 8000`
- [ ] Frontend up: from `frontend/` → `npm run dev` → open **http://localhost:5173**
- [ ] **Warm Nemotron:** run the scenario once and discard it (the first AI call lags).
- [ ] Chrome, **zoom 110%**, bookmarks bar hidden, single clean window, cursor visible.
- [ ] Hard-reload (`⌘⇧R`) before each take so you start from the clean baseline.
- [ ] **60 fps**, move the mouse **slowly**, **pause ~1 s** on anything important, never scrub.
- [ ] Type the scenario **exactly** (copy-paste if easier):
  > `A water main rupture on 7th Avenue forces a 14-day emergency road closure.`

**Locked facts (must match on screen):** 6 segments · 11 work packages · **$115,000** dig-once · **241**-day horizon · closure **10,924 → 12,254 (+1,330)** · total cost **$11.0M** · diagnosis **EMERGENCY** on **s_main (7th Avenue)**.

---

## 2 · The clips

**Naming:** `SR-01_overview_kenil.mp4`, `SR-04_type_bhavya.mp4`, … → drop all into a shared `/footage` folder.
**Takes:** shoot each clip **2–3 times**, keep the cleanest. Record **5–10 % longer** than the "use" duration so there's trim room.

### 🎬 KENIL records — baseline + proof (4 clips)

| ID | Clip | Exact actions | Must be in frame | Record len |
|---|---|---|---|---|
| **SR-01** | **Overview** | Hard-reload. Hold 1 s. Slowly glide the cursor left→right across the **header**, then down the **map**, then down to the **Gantt**. No clicks. | Header chips: `Segments: 6 · Work Packages: 11 · Dig-Once Savings: $115,000 · FastAPI Live` | 20 s |
| **SR-02** | **Map detail** | On the **District Network Map**, scroll-zoom in one notch, slow pan; hover a colored street so a tooltip shows; let the **Right-of-Way Layers** legend sit in frame. | Colored segments + the legend (Closed / Co-Location Synergy / Active / None) | 14 s |
| **SR-03** | **Co-trench payoff** | On the **Gantt**, hover the **"7th Ave Water Main"** row, then **"7th Ave Fiber Conduit"**, then rest the cursor on the **🔗 Co-Trench** badge for ~2 s. | The 🔗 Co-Trench badge **and** `Dig-Once Savings: $115,000` | 14 s |
| **SR-09** | **It's real (API proof)** | New tab → `http://localhost:8000/docs` → expand **GET /plan** → click **Try it out → Execute** → slow-scroll the JSON response. | FastAPI Swagger page, the live JSON (`total_days`, `dig_once_savings_usd`) | 16 s |

### 🎬 BHAVYA records — the live replan (5 clips, one continuous session)

Record SR-04 → SR-07 as one smooth run first (backup), then grab clean individual takes.

| ID | Clip | Exact actions | Must be in frame | Record len |
|---|---|---|---|---|
| **SR-04** | **Type the incident** | Click the **"Incident Dispatch / Situation Report"** textarea (pause on the click), then **type the scenario line slowly**, word by word. | The full typed sentence in the box | 16 s |
| **SR-05** | **Diagnose + solve** | Click **"Diagnose with Nemotron & Re-Optimize"**. Hold still while it resolves. | `NEMOTRON AUTONOMOUS DIAGNOSIS: EMERGENCY` + `OR-Tools CP-SAT Solved` badge + map segment turning **red** | 12 s |
| **SR-06** | **Cards + grounded AI text** *(merged)* | Slowly move across the 4 metric cards, resting ~1.5 s on each, then drift down and rest the cursor so the **"NVIDIA Nemotron Reasoning Synthesis"** paragraph is fully readable for ~4 s. | `CLOSURE DAYS 10,924 → 12,254 · +1,330 road impact` **and** `DIG-ONCE $115k → $115k · synergy preserved` **and** the full generated paragraph + the `Grounded Solver Facts` tag | 24 s |
| **SR-07** | **Human approves** | Move to and click **"Approve & Commit Baseline"**; hold on the committed state. | The green Approve button → the status flip | 8 s |
| **SR-08** | **Before vs after** | On the Gantt's **Scenario View** toggle, click **Baseline (Old)** → **Proposed (New)** → **Diff Overlay**, pausing ~1.5 s on each. | The toggle + the bars shifting between states | 14 s |

**Total raw ≈ 2:20 → used footage ≈ 90 s.** Plenty.

---

## 3 · Hand-off
When both folders are in `/footage`, ping me and I'll tell you which clip sits under which VO line (see `SCRIPT_BASIC.md` / `SCRIPT_BEAST.md`). If any clip shows a number that doesn't match §1, re-shoot it — the whole pitch rests on those figures being real.
