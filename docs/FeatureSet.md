# InfraSync — Feature Set & Implementation Plan

> **Status:** living draft, v0.1 — written 2026-10-23. Expect to revise.
> **Audience:** the two of us building this. Read §1–§5 first, then your assigned feature in §6.
> **Honesty policy:** anything not yet decided is marked **🟡 OPEN DECISION**; anything needing
> investigation before it can be built is marked **🔬 RESEARCH NEEDED**. These are not failures —
> they are the real state of the project. Do not treat a 🟡/🔬 item as settled.

---

## 0. Hard reality check (read this first)

- **Time left:** today is Fri Oct 23. Submissions close **Oct 30, 10:00 PDT**. Realistic internal
  deadline is **Oct 28** (video + README + submission on the 29th as buffer). That is **~5 working days**.
- **Team:** two relative beginners, leaning on AI coding assistants.
- **Consequence:** the **MVP** column is what we are actually committing to. Everything marked
  **STRETCH** only happens if the MVP is done and demoing cleanly. It is better to ship 4 features
  that work than 9 that half-work. The video is the entry (judges may not run our code), so a
  **small, polished, working demo beats a large broken one**.
- **Mandatory to qualify** (from `HACKATHON_RESEARCH.md`): must run on Nebius Token Factory **and**
  use at least one NVIDIA Nemotron model; public repo + OSI license; a working demo URL (for our
  track); a <3-min video; README; written feedback on the tooling. **Deployment is therefore not
  optional — see F11, which is currently our biggest unknown.**

---

## 1. What we are building (shared understanding)

**InfraSync** is a **pre-tender capital-planning and right-of-way coordination tool**. A city (or any
single owner of multiple infrastructure projects) feeds in the separate projects it already plans to
build on a set of streets. InfraSync:

1. **Sequences** those projects into one coordinated schedule using a deterministic solver
   (OR-Tools CP-SAT), honoring hard rules: task precedence, crew limits, budget caps, pavement-cut
   moratoria, and "don't close all parallel routes at once."
2. **Finds and quantifies "dig once" opportunities** — pairs of jobs that could share a single trench
   if their timing is aligned — and shows the money and road-closure days saved versus doing them
   separately.
3. **Adapts** when a disruption is described in plain English (flood, budget cut, emergency), by
   translating it (via NVIDIA Nemotron) into solver constraints and re-optimizing.
4. **Explains** every plan and every change in plain English for non-technical decision-makers, using
   only the solver's real numbers.
5. Keeps a **human in the loop** — nothing is "decided"; the planner approves or rejects proposals.

**Who it is for:** initially a **single owner coordinating its own portfolio** (no cross-institution
cooperation required — that is the easy, demo-able wedge). It **surfaces and quantifies**
opportunities; it does **not** force anyone to cooperate, and it sits **upstream of the tender** so
the coordinated bundle becomes the scope that goes to bid.

**What it is NOT (scope guards):**
- Not a replacement for Primavera P6 on a live job site (it works pre-bid, at portfolio scale).
- Not an autonomous planner — the human decides.
- Not handling procurement law, contracts, or cost-sharing agreements.
- Not using real city data — we use **one synthetic district** (see F1).

The division of labor is the whole pitch: **the solver decides (deterministic, provable), the AI
translates and explains (language), the human approves.**

---

## 2. Architecture at a glance

```
          Browser (React + TS, Vite)
   ┌──────────────┬───────────────┬──────────────┐
   │   MapView    │   Timeline    │  Scenario +   │
   │  (Leaflet)   │  (Gantt-ish)  │  Explanation  │
   └──────┬───────┴───────┬───────┴──────┬────────┘
          │  HTTP / JSON (fetch)         │
   ┌──────┴──────────────────────────────┴────────┐
   │        Backend API (FastAPI + Pydantic)        │
   │  /project  /plan  /replan  /plans/{id}/approve │
   ├───────────────┬───────────────┬────────────────┤
   │  Optimizer    │  AI agent     │  Dataset        │
   │  OR-Tools     │  Nemotron via │  (synthetic     │
   │  CP-SAT       │  Token Factory│   JSON files)   │
   └───────────────┴───────────────┴────────────────┘
```

- **No database for the MVP.** Data lives in JSON files loaded at startup; the "current approved plan"
  lives in memory. 🟡 OPEN DECISION: if we need per-user state we revisit, but for a single-session
  demo in-memory is correct and simplest.
- Already scaffolded and working: `/health`, `/project` (stub), and a frontend that fetches and lists.

---

## 3. Exact tech stack

| Layer | Choice | Notes / status |
|---|---|---|
| Backend language | **Python** | Installed: **3.9.6**. README claims 3.11+. 🟡 OPEN DECISION: upgrade to 3.11 (matches README, nicer syntax) or stay on 3.9 (works; we write 3.9-safe code). OR-Tools/FastAPI both support 3.9. |
| Web framework | **FastAPI + Uvicorn** | Already set up and verified. |
| Data validation | **Pydantic v2 + pydantic-settings** | Already set up. |
| Optimizer | **Google OR-Tools, CP-SAT solver** (`ortools`) | Not yet installed. The deterministic core. |
| Geometry | **Shapely** *(maybe)* | 🟡 OPEN DECISION: only needed if we compute trench co-location from real geometry. Recommendation: **avoid it for MVP** — precompute co-location pairs in the dataset instead (see F1/F6). |
| AI inference | **NVIDIA Nemotron via Nebius Token Factory**, called with the **`openai` Python SDK** (Token Factory is OpenAI-compatible) | 🔬 RESEARCH NEEDED: confirm current model IDs, and whether Nemotron reliably returns structured JSON (see F7). |
| Web grounding | **Tavily** (`tavily-python`) | STRETCH only. Optional prize. |
| Frontend | **React 19 + TypeScript + Vite** | Already scaffolded, fetches `/project`. |
| Map | **react-leaflet + leaflet**, OpenStreetMap tiles | Not yet installed. |
| Timeline | **Custom `<div>` bars** (no library) | Recommendation: avoid a Gantt library; our timeline is simple. 🟡 OPEN DECISION: revisit `vis-timeline`/`frappe-gantt` only if custom gets painful. |
| Frontend state | **Plain `useState` + props** | No Redux/Zustand needed at this size. |
| Deployment | **UNDECIDED** | 🔬 RESEARCH NEEDED — this is a required deliverable and our biggest gap. See F11. |

---

## 4. The shared data contract (agree on this BEFORE splitting work)

This is the single most important thing for working in parallel. Both the optimizer and the frontend
depend on these shapes. The backend version is Pydantic (`backend/app/models/schemas.py`); the
frontend version is the TS mirror (`frontend/src/types.ts`). **They must match field-for-field**
(JSON uses the backend's `snake_case`).

Proposed **v0** shapes (expands what the scaffold already has). 🟡 Every field here is provisional —
agree/adjust together tomorrow morning, then freeze for the day:

```
Segment
  id: str
  name: str
  coords: list[[lat, lng]]        # polyline points for the map
  traffic_weight: float           # 1–10, how costly it is to close (disruption scoring)
  moratorium_until_day: int | 0   # no pavement cut allowed before this day (0 = none)

WorkPackage
  id: str
  name: str
  utility: "road" | "drainage" | "water" | "fiber"
  segment_id: str
  duration_days: int
  cost_usd: int
  crew_type: str                  # which resource pool it draws from
  crews_needed: int
  depends_on: list[str]           # ids of packages that must finish first
  earliest_start_day: int | 0     # funding/availability window start (0 = anytime)

CoLocation            # precomputed "these two jobs could share a trench"
  package_a: str
  package_b: str
  compatible: bool                # separation codes allow co-trenching
  synergy_cost_usd: int           # $ saved if co-trenched (one dig not two)

Crew                  # resource capacity
  type: str
  capacity: int                   # max concurrent jobs of this crew type

ScheduledTask         # one line of the optimizer's output
  work_package_id: str
  start_day: int
  end_day: int
  shared_trench_with: str | null  # id of the package it co-trenches with, if any

Plan
  id: str
  status: "draft" | "approved" | "rejected"
  tasks: list[ScheduledTask]
  total_cost_usd: int
  total_days: int                 # makespan
  closure_days: int               # Σ segment-closure days, weighted by traffic
  dig_once_savings_usd: int       # vs the uncoordinated baseline
  dig_once_savings_closure_days: int

Project               # everything the frontend needs to draw the start state
  segments: list[Segment]
  packages: list[WorkPackage]
  crews: list[Crew]
  colocations: list[CoLocation]
  plan: Plan                      # the current baseline schedule

Disruption            # a tagged union (the "kind" field selects the shape)
  { kind: "road_closure", segment_id: str, days: int }
  { kind: "budget_change", new_cap_usd: int }
  { kind: "weather", from_day: int, to_day: int }
  { kind: "emergency", segment_id: str, duration_days: int, priority: str }

ReplanResult
  disruption: Disruption
  old_plan: Plan
  new_plan: Plan
  explanation: str                # Nemotron's plain-English "why"
  sources: list[{title, url}]     # Tavily citations (empty for MVP)
```

🟡 OPEN DECISIONS embedded above:
- How many packages/segments in the sample district? Recommendation: **~15–25 packages, ~8–12
  segments** — big enough to be interesting, small enough that CP-SAT solves in <2s and the demo
  reads clearly.
- Co-location as **precomputed pairs** (above) vs computed from geometry. Recommendation:
  **precomputed** for MVP (far simpler, fully controllable for the demo).
- Whether `depends_on` crosses utilities or only orders within a segment. Needs a quick
  engineering-sanity pass (e.g. drainage before road paving on the same segment).

---

## 5. Feature dependency map

```
F1 Data model & sample district  ──┬──► F2 Optimizer (CP-SAT) ──► F6 Dig-once quantification
   (foundation, do first)          │         │
                                    │         └──► F3 API endpoints ──► F9 Replan/scenario flow
                                    │                                        ▲   ▲
                                    ├──► F4 Map view ────────────────────────┘   │
                                    └──► F5 Timeline ─────────────────────────────┘
                                                                     F7 Disruption parsing (Nemotron) ─┘
                                                                     F8 Explanation (Nemotron) ────────┘
F10 Approval/state (small, folds into F9)      F11 Deployment (cross-cutting, start early-ish)
F12 Submission assets (README/video/feedback)  STRETCH: F13 Tavily, F14 polish
```

**Critical path to a demo:** F1 → F2 → (F4 + F5) → F3 → F7 → F8 → F9. F6 makes the pitch land.
F11 can sink us if left to the last day.

---

## 6. Features

Each feature: **priority**, suggested **owner fit**, **depends on**, **tech**, **implementation
detail**, **open items**, and **done when**. Detail is deliberately at the "signatures + algorithm
sketch" level — enough to start, not so much that it writes the code for you.

---

### F1 — Domain data model & synthetic district dataset  🟢 MVP · foundation
**Depends on:** nothing. **Do this first, together, tomorrow morning.**
**Tech:** Pydantic (backend), TS types (frontend), a hand-authored JSON file.

**What:** Finalize the §4 schemas and author **one** believable synthetic district as JSON
(`backend/data/district.json`): segments with coordinates, work packages with dependencies/costs/
crews, crew capacities, and co-location pairs. Replace the hardcoded `/project` stub with a loader
that reads this file.

**Implementation detail:**
- `backend/app/models/schemas.py`: expand to the §4 shapes.
- `frontend/src/types.ts`: mirror them exactly.
- `backend/data/district.json`: the dataset. Pick a real-ish small grid of streets so coordinates
  look sensible on the map (any city's lat/lng grid works — it is synthetic, label it as such).
- `backend/app/services/dataset.py`: `load_project() -> Project` reads+validates the JSON.

**Open items:**
- 🟡 All field choices in §4.
- 🟡 Dataset size (recommend ~15–25 packages).
- 🔬 A quick sanity pass on realistic precedence & which utilities may co-trench (water+fiber yes;
  gas/electric stricter — but we may not even include gas). Cite nothing we are unsure of; label
  the data "illustrative."

**Done when:** `/project` returns the full dataset, validated, and the frontend renders it without
type errors.

---

### F2 — Deterministic scheduler (OR-Tools CP-SAT)  🟢 MVP · the core · **highest technical risk**
**Depends on:** F1. **Tech:** `ortools` (CP-SAT).
**Owner fit:** whoever is more comfortable with Python/logic (Kenil has the most backend context so far).

**What:** Given the dataset, produce a valid, good `Plan`.

**Implementation detail (`backend/app/services/optimizer.py`):**
- Signature: `solve(project: Project, overrides: Optional[Constraints]) -> Plan`.
- CP-SAT building blocks:
  - For each package, an **interval variable** (`model.NewIntervalVar(start, size=duration, end)`).
  - **Precedence:** `end[i] <= start[j]` for each `j depends_on i` (plus any cure-lag).
  - **Crew capacity:** `AddCumulative` per crew type (demands = crews_needed, capacity = crew.capacity).
  - **Moratorium:** forbid a package's interval from starting before `segment.moratorium_until_day`.
  - **Objective (start simple, layer up):** begin with **minimize makespan** only. Then add weighted
    terms for closure-days and cost. Co-trench synergy comes with F6.
- **Build incrementally** — get *any* feasible schedule first, commit that, then add constraints one
  at a time. Do not try to encode the full objective on day one.

**Open items / honest risks:**
- 🔬 The full objective and the co-trench/closure modeling are **not finalized**. The README §4 math
  still has known gaps (missing `end = start + duration` link, budget as a hard constraint,
  `IsClosed` not tied to tasks, synergy not gated on an actual co-trench decision). **These need to be
  fixed before F6, and partly before the full F2 objective.** Fixing the math is a prerequisite task,
  not a detail. (See "Open Decisions" §8.)
- 🟡 Objective weights and how to normalize terms of different units (days vs $ vs traffic points)
  are undecided. Start with makespan-only so this does not block.
- 🔬 Representing "segment closed on day t" cleanly in CP-SAT (boolean-per-day vs a closure-day proxy)
  needs a short modeling spike.

**Done when:** a `GET /plan` (or extended `/project`) returns a schedule that provably respects
precedence + crew limits + moratoria, with a sensible makespan.

---

### F3 — API endpoints  🟢 MVP · thin glue
**Depends on:** F1 (schemas), and F2/F7/F8 for the bodies. **Tech:** FastAPI.

**What:** The REST surface the frontend calls.
- `GET /project` — dataset + current plan (F1).
- `GET /plan` or `POST /optimize` — run the optimizer, return a `Plan` (F2).
- `POST /replan` — body `{text}` or a structured `Disruption`; returns `ReplanResult` (F7+F8+F2).
- `POST /plans/{id}/approve` and `/reject` — update in-memory status (F10).

**Open items:** 🟡 whether `/replan` accepts free text (needs Nemotron) or a structured disruption
(no AI). Recommendation: support **both** — a structured path works even if Nemotron is flaky, and
makes the demo robust.

**Done when:** each endpoint validates input/output against Pydantic models and is visible in
`/docs`.

---

### F4 — Map view (Leaflet)  🟢 MVP · high demo value
**Depends on:** F1 (needs `segments[].coords`). Can start against a **mock** `/project` JSON.
**Tech:** `react-leaflet`, `leaflet`, OSM tiles. **Owner fit:** the frontend-leaning person.

**What:** Draw each segment as a colored polyline on a map; color by state (has work / co-location
candidate / closed); tooltip shows the jobs on that segment.

**Implementation detail (`frontend/src/components/MapView.tsx`):**
- `<MapContainer>` + `<TileLayer>` (OSM) + one `<Polyline>` per segment.
- Color rule: red = closed (from a disruption), purple = >1 utility / co-location candidate,
  blue = has work, grey = none.
- ⚠️ Must import `leaflet/dist/leaflet.css` and give the map an explicit height or it renders blank.

**Open items:** 🟡 exact color semantics; whether to show the schedule state (day slider) now or later
(recommend later — static colors for MVP).

**Done when:** the district's streets render on the map, colored, with working tooltips — even off a
mocked dataset.

---

### F5 — Schedule timeline / Gantt  🟢 MVP · high demo value
**Depends on:** F1 (+ a `Plan` to draw; can start against a **mock** Plan). **Tech:** custom `<div>`s.
**Owner fit:** the frontend-leaning person (pairs naturally with F4).

**What:** Horizontal bars, one per scheduled task, positioned by `start_day`/`end_day`, colored by
utility, with a 🔗 marker for shared-trench tasks.

**Implementation detail (`frontend/src/components/Timeline.tsx`):**
- Each bar: `left = start_day/total_days * 100%`, `width = (end-start)/total_days * 100%`.
- A label column with the package name; a track with the positioned bar.
- No library needed; see `learn/02-react-basics.md` Part 14 for the pattern.

**Open items:** 🟡 whether to show a "before vs after" pair of timelines for the replan (recommended
for F9, not needed for the first render).

**Done when:** a `Plan` renders as readable bars with correct relative positions — even off a mock.

---

### F6 — Dig-once opportunity detection & quantification  🟢 MVP · **this is the pitch**
**Depends on:** F1 (co-location pairs), F2 (scheduler). **Tech:** Python (inside/after the optimizer).

**What:** Compute, and display, how much coordination saves vs **not** coordinating. This is the
number that makes the whole demo land ("we save $X and Y closure-days").

**Implementation detail:**
- The honest, demo-robust approach: run the optimizer **twice** — once with co-trenching allowed,
  once forbidden ("uncoordinated baseline") — and report the difference in cost and closure-days.
  Put the deltas on the `Plan` (`dig_once_savings_*`).
- Co-trench in the model: for each compatible `CoLocation` pair, a boolean `y_ab` that, when true,
  forces the two intervals to overlap (`|start_a - start_b| <= ε`) and applies `synergy_cost_usd`.
  The savings only count when the jobs actually align — the synergy must be **gated on `y_ab`**.

**Open items / honest risks:**
- 🔬 Directly tied to the unfinished math (§8). The `y_ab` gating and the baseline definition must be
  pinned down. If CP-SAT co-trench modeling proves too hard in the time we have, the **fallback** is:
  keep co-trench out of the optimizer and compute savings from the co-location pairs as a
  **post-hoc estimate** (clearly labeled as an estimate). Decide by ~Oct 25.
- 🟡 "Uncoordinated baseline" definition (optimizer-with-co-trench-off vs a naive sequential schedule).

**Done when:** the plan shows a credible, non-zero savings figure that changes when you toggle
coordination — and we can explain exactly how it was computed.

---

### F7 — Disruption parsing: natural language → structured constraint (Nemotron)  🟢 MVP
**Depends on:** F1 (Disruption schema), Nebius account/keys. **Tech:** `openai` SDK → Token Factory.
**Owner fit:** either, once the solver contract exists.

**What:** Turn "Main St is flooded and closed for two weeks" into
`{kind: "road_closure", segment_id: "...", days: 14}`, validated against our schema.

**Implementation detail (`backend/app/services/agent.py`):**
- `parse_disruption(text: str, project: Project) -> Disruption`.
- Call Nemotron with the list of valid segments and the allowed `Disruption` shapes; ask for JSON.
- **Validate** the returned JSON against the Pydantic `Disruption` union; on failure, retry once with
  the error, then fall back to an error message. Never trust the model's JSON blindly.

**Open items / honest risks:**
- 🔬 **Does Nemotron reliably produce valid structured JSON** (JSON mode / function calling) on Token
  Factory? Unverified. This needs a 1–2 hour spike before committing to it. Have a **structured-input
  fallback** (F3) so the demo survives if parsing is flaky.
- 🔬 Confirm current Nemotron model IDs and pricing on the live Token Factory catalog (our notes list
  `nemotron-3-super`/`nano` but they must be re-checked).
- 🟡 Prompt design and how much of the dataset to include as context.

**Done when:** at least the 3–4 scripted demo disruptions parse reliably into valid `Disruption`
objects (scripted reliability is enough for the video).

---

### F8 — Explanation generation (Nemotron)  🟢 MVP
**Depends on:** F2 (a plan diff to explain). **Tech:** `openai` SDK → Token Factory.

**What:** Given old plan, new plan, the disruption, and the solver's real numbers, produce a short,
plain-English "why this changed," suitable for a non-technical director.

**Implementation detail:**
- `explain(old: Plan, new: Plan, disruption: Disruption, facts: dict) -> str`.
- **Grounding technique:** pass the model a *structured set of facts* (what moved, which constraint
  bound, the cost/time/closure deltas) and instruct it to narrate **only those facts**, not to invent
  reasons. This is the key to avoiding hallucinated justifications.

**Open items:**
- 🔬 Prompt engineering for grounded, non-hallucinated output — needs iteration/testing.
- 🟡 How verbose; whether to name the exact binding constraint (nicer, but needs the solver to report
  it).

**Done when:** explanations are accurate to the numbers (no invented figures) across the demo
scenarios.

---

### F9 — Disruption / scenario flow (the integrative feature)  🟢 MVP
**Depends on:** F2, F3, F4, F5, F7, F8. **Tech:** React + the endpoints. **Do this later in the week.**

**What:** The UI loop: pick/type a scenario → `POST /replan` → preview the new plan on map + timeline
→ read the explanation → Approve/Reject.

**Implementation detail:**
- `ScenarioPanel.tsx`: preset buttons (weather / budget cap / emergency / moratorium conflict) +
  a free-text box.
- On result: show old-vs-new (timeline diff, map highlight of the affected segment), the explanation,
  the savings/impact numbers, and Approve/Reject buttons.
- Lift state to `App.tsx` (data down, events up — see `learn/02` Part 9).

**Open items:** 🟡 preset scenarios vs free-text priority (recommend presets first — they are what the
video shows and they do not depend on F7 working perfectly).

**Done when:** at least one disruption can be triggered end-to-end and approved, visibly updating the
plan.

---

### F10 — Human approval & in-memory state  🟢 MVP · small (folds into F9/F3)
**Depends on:** F3. **What:** Approving a proposal makes it the new baseline plan (in memory);
rejecting discards it. **Done when:** approve/reject changes what `/project` returns next.

---

### F11 — Deployment & demo reachability  🟠 MVP-critical · **biggest unknown** · start by Oct 25
**Depends on:** a working app. **Tech:** 🔬 UNDECIDED.

**What:** The submission requires a **working demo URL** judges can reach, free and unrestricted until
Dec 15. We must host the frontend and backend somewhere, with the Nebius key kept server-side.

**Open items / honest risks:**
- 🔬 **No deployment decision has been made.** Options to evaluate: frontend on Vercel/Netlify +
  backend on a small host (Render/Fly/Railway/Nebius VM); or everything on a Nebius VM; or — for the
  *video only* — run locally and record, but the rules still want a reachable URL for our track.
- 🔬 Credit burn: the site must stay live through the judging period without draining Nebius/Tavily
  credits — need a rate limit or a cached demo mode.
- 🟡 Whether to add a "demo mode" that serves canned results if the AI/credits are unavailable.

**Why it is here:** this is the feature most likely to be left too late and block submission. Someone
should spike it mid-week, not on Oct 28.

**Done when:** a public URL loads the app and runs at least the scripted demo.

---

### F12 — Submission assets  🟢 MVP (non-code) · Oct 27–29
README section on how we used Nemotron/Token Factory/Nebius; OSI license (MIT already noted); **<3-min
YouTube video** (judges may not run the code — the video is the entry); project description; **written
feedback** on the tooling (also the "Most Valuable Feedback" prize path). **Done when:** all present
and submitted on Devpost.

---

### STRETCH features (only if MVP is done and demoing)
- **F13 — Tavily cited rules** 🔵: show sourced utility-separation / co-trench rules next to the rule
  table (and chase the $3k Tavily prize). 🟡 Weak fit on synthetic data; could be a static cited table
  instead of live search.
- **F14 — Polish** 🔵: before/after timeline diff animation, cost/closure summary cards, nicer styling,
  a day slider on the map.
- **F15 — Small/big model routing** 🔵: Nano for parsing, Super for explanation (saves credits; mirrors
  NVIDIA's own reference design — a nice thing to mention to judges).

---

## 7. Suggested split for tomorrow (one feature each)

**Step 0 (together, ~45–60 min):** lock the §4 data contract to a v0 and commit `F1` schemas +
`district.json` (even a rough dataset). **Nothing parallel works until this is agreed.**

Then split:

| Person | Feature | Why it is a clean split |
|---|---|---|
| **A (backend-leaning, e.g. Kenil)** | **F2 — Optimizer core** (makespan + precedence + crew limits first) | Owns the deterministic core; only needs the frozen F1 schema as input. |
| **B (frontend-leaning)** | **F5 — Timeline** (and/or **F4 — Map**) rendering a `Plan` | Works against a **mock `Plan` JSON** matching the schema until A's `/plan` is ready — zero blocking. |

The **contract between you** is the `Plan` / `Project` shape from §4. As long as that is frozen,
A can build the solver and B can build the view in parallel and they meet at the JSON.

🟡 If B would rather start with the map, that is equally valid — both are mock-able. Pick by comfort.

---

## 8. Open decisions & research backlog (consolidated — be honest about these)

**Decisions we must make (soon):**
1. 🟡 Python 3.9 vs upgrade to 3.11.
2. 🟡 Final §4 schema + dataset size.
3. 🟡 Co-location: precomputed pairs (recommended) vs geometry via Shapely.
4. 🟡 Optimizer objective: weights and unit normalization (defer by starting makespan-only).
5. 🟡 "Uncoordinated baseline" definition for the dig-once savings (F6).
6. 🟡 `/replan` input: free-text (needs Nemotron) vs structured vs both (recommend both).
7. 🟡 Deployment target (F11) — must decide by ~Oct 25.
8. 🟡 LangGraph/LangChain vs plain SDK calls. Recommendation: **plain `openai` SDK** — simpler, fewer
   moving parts for beginners; LangGraph only earns its place if we need a durable approval pause,
   which in-memory state already covers for the demo.

**Research spikes needed before building the dependent feature:**
1. 🔬 **Fix the README §4 math** (missing duration link, budget-as-constraint, `IsClosed`↔task link,
   synergy gated on a co-trench boolean). Prereq for F2's full objective and for F6. *This is the one
   piece of "homework" that blocks the most.*
2. 🔬 **Nemotron structured-output reliability** on Token Factory (F7) — 1–2 hr spike; confirm model
   IDs; design the validate-and-retry loop and the structured fallback.
3. 🔬 **CP-SAT closure-day / co-trench modeling** pattern (F2/F6) — short modeling spike.
4. 🔬 **Deployment** approach + credit-safety (F11).
5. 🔬 **Grounded explanation** prompt design (F8).

**Things we are explicitly NOT solving (and should say so in the pitch):** cross-institution
agreements, procurement law, real city data, real-time traffic, thousands-of-activities scale.

---

## 9. What already exists (don't rebuild)

- Backend: FastAPI app, `/health`, `/project` **stub**, Pydantic `Segment/WorkPackage/Project`
  (minimal), config + CORS, venv + requirements. (`backend/`)
- Frontend: Vite React+TS app that fetches `/project` and lists packages, with `api.ts` + `types.ts`
  and the loading/error/data pattern. (`frontend/`)
- These are the seams F1–F5 extend; we are not starting from zero.
