# InfraSync Demo — SCRIPT 1 (BASIC / safe) — frame-accurate

**Goal:** a clean, confident product walkthrough. Mostly your real screen recordings, wrapped with a *few* tasteful code-graphic pieces from the Claude Video 2.0 skill (`claude-video-studio`). **No AI/Higgsfield clips. No slop.** Some creativity (kinetic title, a data reveal, clean lower-thirds, a stack + close card) — not just hard cuts.

- **Runtime:** ~2:42 · **1920×1080 · 30 fps**
- **Tools:** Claude Video skill (code graphics) + your `/footage` clips (see `SHOT_LIST.md`) + Premiere (assemble) + your 2-voice VO.
- **Anti-slop law (from the skill's rules):** one accent colour per piece · ≤6 words on screen at once · no glow/bloom/hue-shift/linear-ease · a normal move is 0.27–0.6 s · hold a finished state ≥0.6 s · something changes every ≤1 s · hits on a 0.5 s grid.
- **Every on-screen number is real** (verified 2026-10-30): 6 segments · 11 WPs · **$115,000** · **241 d** · closure **10,924→12,254 (+1,330)** · **$11.0M**.

---

## The voiceover (record straight through — [K]=Kenil, [B]=Bhavya)

Read it like you built it and you're proud of it — conversational, unhurried, a little swagger. Record each line with a 0.5 s tail.

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

| Time | VO | On screen | Words on screen (≤6) | Motion / notes |
|---|---|---|---|---|
| 0:00–0:08 | L1 [K] | **P1 — HOOK card** (`swiss-kinetic`) | **SAME STREET. / DUG TWICE.** | type snaps in on the beat (0.3 s each), red dot accent; hold 0.8 s |
| 0:08–0:24 | L2 [K] | **P2 — number build** (`data-story`) | **Three digs. Three closures.** → **3× the cost** | three bars rise one per 0.5 s, last bar flips red; printed-chart feel |
| 0:24–0:33 | L3 [K] | **SR-01** overview (push-in) + **lower-third** | **InfraSync** | SR-01 scaled ~104%→100% slow; title wipes up at 0:28 |
| 0:33–0:46 | L4 [B] | **SR-01 → SR-02** map | **OR-Tools · CP-SAT** | cut to SR-02 at ~0:40; lower-third holds 2 s then out |
| 0:46–1:00 | L5 [B] | **SR-03** co-trench + **callout** | **$115,000 saved** | number counts up (odometer, 0.6 s) as cursor hits the 🔗 badge |
| 1:00–1:12 | L6 [K] | **SR-04** type scenario | *(none — let the typing read)* | real-time typing; no overlay competing with it |
| 1:12–1:22 | L7 [K] | **SR-05** diagnose→solve + **lower-third** | **Nemotron · Token Factory** | overlay appears the instant the EMERGENCY badge lands |
| 1:22–1:30 | L8 [B] | **SR-06** cards | **+1,330 closure-days** | callout pins to the CLOSURE card as it rolls up; red accent |
| 1:30–1:38 | L8 [B] | **SR-09** before/after toggle | **$115k preserved** | green tick on the DIG-ONCE value; bars shift Baseline→Proposed |
| 1:38–1:48 | L9 [B] | **SR-07** Nemotron paragraph + **lower-third** | **Grounded in real numbers** | the 3 real figures (241 / 12,254 / $115k) briefly underline |
| 1:48–1:56 | L10 [K] | **SR-08** approve | **Human approves** | green ripple on click; hold the committed state 0.8 s |
| 1:56–2:08 | L11 [K] | **P3 — three pillars** (`midnight-grid`) | **Solver decides → AI explains → Human approves** | each label slides in on a 0.5 s beat; one blue accent |
| 2:08–2:16 | L12 [B] | **SR-10** /docs API proof *(quick)* | **It's real.** | 1.5 s scroll of live JSON; proves nothing's faked |
| 2:16–2:42 | L13 [B] | **P4 — CLOSE card** (`swiss-grid`) | **Coordinate once. Dig once.** | logo settles; small line: repo + demo URL; final hold 1.5 s |

---

## The 4 code-graphic pieces to build (Claude Video skill, `media: none`)

Run `/claude-video-studio` once per piece. Answers to its 5 questions are below. All `code` assets, no Higgsfield.

**P1 — Hook** · style `swiss-kinetic` · 8 s · 16:9 · no loop · words: **"SAME STREET." / "DUG TWICE."** · brand: InfraSync lime `#9EE84A` as the one accent on black.

**P2 — Number build** · style `data-story` · 12 s · 16:9 · no loop · words (sequential, ≤6 each): **"Three digs."** → **"Three closures."** → **"3× the cost."** · one blue accent, printed-chart motion.

**P3 — Three pillars** · style `midnight-grid` · 12 s · 16:9 · loops ok · words: **"Solver decides"**, **"AI explains"**, **"Human approves"** (one at a time) · deep navy, one clean blue.

**P4 — Close** · style `swiss-grid` · 9 s · 16:9 · no loop · words: **"Coordinate once. Dig once."** + a small static line **"github.com/ken2k7/NVIDIA-Hackathon"** · brand colours + logo.

> Lower-thirds over the demo (the small `OR-Tools · CP-SAT`, `Nemotron · Token Factory`, `Grounded in real numbers`, `+1,330 closure-days`, `$115,000 saved`, `$115k preserved`, `Human approves`, `It's real.` labels) are done in **After Effects / Premiere** as plain text + a 1 px underline — NOT separate skill pieces. Keep them bottom-left, one accent colour, in/out in 0.3 s.

---

## Assembly order (Premiere)
1. Lay the **VO** first — it sets every cut point above.
2. Drop **P1, P2** at the head; **SR clips** per the table; **P3, P4** at the tail.
3. Add the AE/Premiere **lower-thirds** at the marked times.
4. **Captions burned in** (muted viewing). One **royalty-free** music bed at ~15 %, no copyrighted tracks (rules).
5. Export **H.264, 1920×1080, 30 fps**. Target 2:42, hard cap < 3:00. Upload **public YouTube**.
