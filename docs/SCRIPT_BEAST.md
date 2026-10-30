# InfraSync Demo — SCRIPT 2 (BEAST MODE) — frame-accurate

**Goal:** festival-grade pitch film. Your real app stays the spine (the demo is *always* real screen recordings — never fake the product), but every non-app beat is elevated: a particle-field cold open, cinematic Higgsfield B-roll for things you can't film (underground, trenching, the city at dusk), living `explainer-diagram` pipelines, and kinetic type. Same VO, same facts, bigger wrapper.

- **Runtime:** ~2:48 · **1920×1080 · 30 fps**
- **Tools:** Claude Video 2.0 skill (code graphics **+ Higgsfield** AI clips) + your `/footage` screen recordings + After Effects (grade + lower-thirds) + 2-voice VO.
- **Credit gate (from the skill):** no Higgsfield clip renders until you approve the storyboard's credit estimate; each clip is made one at a time, 3 frames checked before use, failed jobs aren't charged. Needs `HIGGSFIELD_API_KEY=key_id:key_secret` in a `.env` in the work folder (from `console.higgsfield.ai`) — never pasted in chat.
- **Anti-slop law still applies:** one accent per piece · ≤6 words on screen · no gratuitous glow/hue-shift/linear-ease · moves 0.27–0.6 s · holds ≥0.6 s · change every ≤1 s · hits on a 0.5 s grid. AI clips are **colour-graded to the app's dark palette** so they read as one world.
- **Every on-screen number is real:** 6 segments · 11 WPs · **$115,000** · **241 d** · closure **10,924→12,254 (+1,330)** · **$11.0M**.

---

## The voiceover (identical to SCRIPT_BASIC — record once, reuse)

[K]=Kenil · [B]=Bhavya.

1. **[K]** Every city has the same problem buried under its streets — water, power, fiber.
2. **[K]** And every year, crews dig up the same road to reach them, one at a time. Water this spring, fiber this summer, repaving in the fall. Three digs, three closures, three times the cost.
3. **[K]** We built InfraSync to fix that. It coordinates a city's entire construction portfolio — before any of it goes out to tender.
4. **[B]** Here's one district: eleven projects across six streets. The map on the left, the schedule on the right. That schedule isn't a guess — it's solved by Google OR-Tools, a real constraint solver, so it never breaks a hard rule: crew limits, funding windows, pavement moratoriums.
5. **[B]** And here's the payoff. On 7th Avenue, the water main and the fiber conduit get scheduled into one shared trench. Dig once, not twice. That single coordination saves an estimated one hundred fifteen thousand dollars.
6. **[K]** But real cities are messy — so InfraSync adapts. Watch. I'll describe a disruption in plain English: a water main rupture on 7th Avenue forces a fourteen-day emergency road closure.
7. **[K]** We hand that to NVIDIA's Nemotron model, running on Nebius Token Factory. It reads the situation, diagnoses it as an emergency, and turns it into a constraint the solver understands.
8. **[B]** A second later, CP-SAT has re-optimized the whole schedule. The road-closure impact climbs — that's real disruption to residents. But look: the dig-once savings held. The solver protected the coordination under pressure.
9. **[B]** And every explanation here is written by Nemotron — from the solver's actual numbers. It narrates the facts; it never invents them. Nothing on this screen is faked.
10. **[K]** Then a human approves it, and it becomes the new baseline. The planner is always in control.
11. **[K]** That's the whole idea: the solver decides — provably. The AI explains — in plain language. And a person approves.
12. **[B]** Deterministic where it has to be. Intelligent where it helps.
13. **[B]** InfraSync — coordinate once, dig once.

---

## The timeline (cut picture to the VO)

| Time | VO | On screen | Words (≤6) | Motion / notes |
|---|---|---|---|---|
| 0:00–0:08 | L1 [K] | **particle-field** opener → **HF-1** underground cross-section bleeds through | — | 10k points condense into glowing pipes/cables; slow push-in |
| 0:08–0:18 | L2 [K] | **HF-2 → HF-3** trench montage (`time-travel` frame) | **SAME STREET. / DUG TWICE.** | road dug → paved → dug again across "seasons"; type hits on beat |
| 0:18–0:24 | L2 [K] | **data-story** counter over the montage | **3× the cost** | 3 bars rise (0.5 s each), last flips red |
| 0:24–0:33 | L3 [K] | **ink-line** transition → app builds in; **particle** logo form | **InfraSync** | one unbroken brush line resolves into the UI + logo |
| 0:33–0:46 | L4 [B] | **SR-01 → SR-02** map + **explainer-diagram** callouts | **OR-Tools · CP-SAT** | blue "constraint" packets land on crew-limit / deadline / moratorium |
| 0:46–1:00 | L5 [B] | **SR-03** co-trench + **growing-city** micro-metaphor | **$115,000 saved** | two trenches animate into one; number odometer-rolls up |
| 1:00–1:12 | L6 [K] | **SR-04** type the incident | — | real typing, no overlay |
| 1:12–1:22 | L7 [K] | **SR-05** diagnose + **explainer-diagram** pipeline | **Nemotron · Token Factory** | packet flows: situation → Nemotron → constraint → CP-SAT |
| 1:22–1:32 | L8 [B] | **SR-06** cards | **+1,330 closure-days** | CLOSURE card rolls; red accent pin |
| 1:32–1:40 | L8 [B] | **SR-09** before/after toggle | **$115k preserved** | bars morph Baseline→Proposed; green tick holds |
| 1:40–1:50 | L9 [B] | **SR-07** Nemotron text | **Grounded in real numbers** | the 3 real figures lift off the paragraph and lock into place |
| 1:50–1:58 | L10 [K] | **SR-08** approve | **Human approves** | green ripple; committed state holds 0.8 s |
| 1:58–2:10 | L11 [K] | **explainer-diagram** three-pillar living diagram | **Solver → AI → Human** | each node lights on a 0.5 s beat, packet runs the chain |
| 2:10–2:20 | L12 [B] | **HF-4** aerial city at dusk, lights coming on (or `growing-city`) + quick **SR-10** API flash | **It's real.** | the district "switches on" as coordination lands |
| 2:20–2:48 | L13 [B] | **swiss-kinetic** close + logo lockup | **Coordinate once. Dig once.** | stack logos resolve: NVIDIA Nemotron · Nebius Token Factory · OR-Tools; URL; final hold 1.5 s |

---

## Higgsfield clip bank (render ONLY after the credit gate; grade each to the dark palette)

Prompt rule: describe the **camera + ONE action**, close framing, **no text in the clip** (text is always code on top), audio off.

- **HF-1 · underground cross-section** — `seedance-2.0`, text-to-video, **8 s**, 1080p, 16:9.
  *Prompt:* "Slow cinematic push-in on a dark cross-section of a city street underground, layered soil with a glowing water pipe, a power line and a fiber-optic bundle, faint volumetric light, moody, shallow depth of field."
- **HF-2 · the trench** — `seedance-2.0`, text-to-video, **6 s**, 1080p.
  *Prompt:* "Static low-angle shot, an open construction trench in a city street at overcast dawn, dirt and a yellow excavator arm, cold light, documentary realism."
- **HF-3 · cut open again** — `seedance-2.0`, image-to-video (feed HF-2's end frame), **5 s**, 1080p.
  *Prompt:* "Slow dolly across freshly paved black asphalt as a saw blade cuts a new line into it, dust, the same street, bleak repetition."
- **HF-4 · city at dusk** — `seedance-2.5`, text-to-video, **10 s**, 1080p.
  *Prompt:* "High aerial drift over a dense city grid at blue-hour, street lights switching on in sequence block by block, calm, hopeful, cinematic."

*(If credits are tight: drop HF-4 and use the `growing-city` code style for the dusk beat — free, and on-brand.)*

---

## Code-graphic pieces (Claude Video skill)

| Piece | Style | Len | Words (≤6) | Notes |
|---|---|---|---|---|
| Opener | `particle-field` | 8 s | — | points → underground forms; hand it HF-1 as the "arrive" image |
| Dig-twice frame | `time-travel` | 10 s | SAME STREET. / DUG TWICE. | houses HF-2/HF-3 inside the timeline device |
| Numbers | `data-story` | 6 s | 3× the cost | printed-chart build |
| Intro transition | `ink-line` | 4 s | InfraSync | brush line → logo |
| Pipeline callouts | `explainer-diagram` | reused | OR-Tools · CP-SAT / Nemotron · Token Factory | blue-packet overlays over SR-01/05 |
| Co-trench metaphor | `growing-city` | 6 s | $115,000 saved | two trenches → one |
| Three pillars | `explainer-diagram` | 12 s | Solver → AI → Human | living chain |
| Close | `swiss-kinetic` | 12 s | Coordinate once. Dig once. | logo + stack + URL |

**Skill 5-question defaults for every piece:** purpose = explainer/launch · length as above · words = the ≤6 label shown · loop = no (close/pillars may loop) · brand = InfraSync lime `#9EE84A` as the single accent on near-black `#0A0B0E`, mono for numbers · media = `none` except the pieces that host HF clips (`generate`) or your SR clips (`user_clip`).

---

## Build order & approval gates (don't skip — it's how you avoid slop AND surprise credit spend)
1. Lock the **VO** → it fixes every cut above.
2. Capture all **SR clips** (`SHOT_LIST.md`).
3. Build the **free code pieces** first (particle-field, ink-line, data-story, explainer-diagram, growing-city, swiss-kinetic). Approve 3 stills each.
4. Only then storyboard the **Higgsfield** clips → **approve credit estimate** → render one at a time → check 3 frames each → **grade to the dark palette**.
5. Assemble in **Premiere**: VO bed first, then picture per the table, AE lower-thirds, burned-in captions, one royalty-free music track at ~15 % (no copyrighted audio/marks).
6. Export **H.264 1920×1080 30 fps**, < 3:00, public YouTube.

> **Fallback to BASIC at any point:** if Higgsfield/credits/time get tight, swap each HF clip for its `growing-city`/`particle-field` code equivalent or a royalty-free stock shot — the structure above still holds and nothing breaks.
