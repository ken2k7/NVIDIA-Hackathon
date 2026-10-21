# InfraSync: Autonomous Civil Infrastructure Sequencer & Adaptive Planning Copilot

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Optimization: Google OR-Tools](https://img.shields.io/badge/Solver-Google%20OR--Tools%20CP--SAT-EA4335?logo=google&logoColor=white)](https://developers.google.com/optimization)
[![AI: NVIDIA Nemotron](https://img.shields.io/badge/Inference-Nebius%20Token%20Factory-76B900?logo=nvidia&logoColor=white)](https://tokenfactory.nebius.com)

> **Autonomous multi-utility construction sequencing and real-time disruption adaptation powered by Constraint Programming (Google OR-Tools) and Agentic Reasoning (NVIDIA Nemotron via Nebius Token Factory).**

---

## 1. Executive Summary & Problem Statement

Uncoordinated street works are one of the most visible and costly failures in public infrastructure, and the waste starts **inside a single owner's own portfolio** before it ever involves outside parties:

* **Within one owner.** A city's roads, water, drainage and sewer departments plan in separate systems and separate budget cycles. The city repaves a corridor, then months later excavates the same asphalt to replace a water main, then opens it again for drainage — all projects it *already owns*, simply never sequenced together.
* **Across owners.** The same street is later re-opened by a private telecom for fiber, because utility and municipal plans are never compared against each other.
* **Tooling gap.** Legacy suites (Oracle Primavera P6, Microsoft Project) optimize *one project at a time* and operate in departmental silos. Existing "Dig Once" portals (e.g., Michigan's statewide portal, London's Infrastructure Mapping Application) only *flag* geographic overlaps on a map — they do not optimize a joint schedule or quantify the trade-off.
* **Why not a pure LLM.** Language models cannot reliably solve combinatorial scheduling or guarantee physical constraint satisfaction; they hallucinate impossible timelines and code violations. The math must be deterministic.

### What InfraSync actually does

InfraSync is a **right-of-way coordination and decision-support tool** for the party that plans the work — **initially a single owner sequencing its own portfolio** (a city public works office, a large utility, or a corridor-design consultancy). It:

1. **Ingests** the separate plans that owner already holds and finds, for each pair of work packages, where sharing a single trench is **spatially co-located, temporally reachable within available slack, engineering-compatible** (utility separation codes permit it), and **net-beneficial** after the cost of shifting timing.
2. **Optimizes** the joint sequence deterministically with Google OR-Tools (CP-SAT), honoring hard constraints including precedence, crew capacity, parallel-corridor traffic limits, and legal **pavement-cut moratoria**.
3. **Explains and re-plans** in plain English via NVIDIA Nemotron-3, so a non-technical decision-maker can see *why* a sequence was chosen and what a disruption costs.

**Positioning — what it is not.** InfraSync does **not** force independent institutions to cooperate. For a single owner, no coordination between parties is required at all. For cross-owner cases, it surfaces and *quantifies* the opportunities where coordination already pays each side (the city avoids re-excavation and political cost; a utility avoids a multi-year moratorium lockout or shares trench cost), and leaves the decision to humans. Organizational agreements, procurement, and cost-sharing contracts are explicitly out of scope — InfraSync informs those decisions, it does not execute them.

### Architecture: Neuro-Symbolic

1. **Google OR-Tools (CP-SAT)** is the deterministic engine — hard precedence, crew capacities, traffic thresholds, moratoria, and "Dig Once" synergies, with zero hallucination.
2. **NVIDIA Nemotron-3 (via Nebius Token Factory)** is the reasoning copilot — translating fuzzy real-world events into solver constraints and producing transparent, defensible justifications for stakeholders.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph UI ["Frontend (React + TypeScript)"]
        GIS["Interactive GIS Map\n(Leaflet / GeoJSON)"]
        Gantt["Gantt Schedule & Timeline"]
        Scenarios["Scenario Disruption Controls\n(Rain, Incident, Budget)"]
    end

    subgraph API ["Backend API (FastAPI)"]
        Router["REST Endpoints\n(/api/network, /api/schedule, /api/adapt)"]
        Validator["Pydantic Data Schemas\n(Work Orders, Crews, Streets)"]
    end

    subgraph Intelligence ["Neuro-Symbolic Planning Engine"]
        Agent["AI Assistant (LangChain / OpenAI SDK)\nNVIDIA Nemotron-3 Super (Nebius Token Factory)"]
        Solver["Combinatorial Optimizer\nGoogle OR-Tools CP-SAT"]
        GeoEngine["Spatial Conflict Engine\n(GeoJSON / Spatial Geometry)"]
    end

    subgraph Data ["Data Storage & Specs"]
        CityData["Municipal Network & Work Orders\n(city_infrastructure.json)"]
    end

    UI <-->|HTTP / JSON| Router
    Router --> Validator
    Validator <--> CityData
    Validator <--> Agent
    Agent <-->|Constraint Formulation| Solver
    Solver <--> GeoEngine
```

---

## 3. Core Capabilities

### A. "Dig Once" Opportunity Detection & Co-Trenching
* Scans an owner's own portfolio (and, optionally, shared cross-owner plans) for work-package pairs that are spatially co-located, temporally reachable within schedule slack, engineering-compatible under separation codes, and net-beneficial after re-timing.
* Synchronizes excavation windows so a street is opened **once** instead of repeatedly — cutting both direct cost (one trench, one repave) and street-closure days. The savings are surfaced and quantified per opportunity so a human can act on them; the tool recommends, it does not compel.

### B. Provable Mathematical Constraint Satisfaction
* **Precedence Enforcement**: Guarantees deep utility installation (drainage/water) precedes sub-base preparation and final asphalt wearing course.
* **Cumulative Resource Bounds**: Restricts concurrent activities to available municipal crew and heavy equipment capacities.
* **Traffic Disruption Mitigation**: Prevents simultaneous closures on adjacent parallel corridors to prevent urban gridlock.

### C. Real-Time Disruption Adaptation
* When unexpected disruptions occur (flash floods, supply chain bottlenecks, emergency water pipe bursts), the agent translates the natural language event into revised boundary constraints, invokes OR-Tools to re-optimize remaining tasks, and returns a modified baseline in seconds.

### D. Explainable AI Engineering Justifications
* Translates mathematical solver states into plain-English briefings for public works directors, detailing why specific sequences were chosen, trade-offs made, and exact tax dollars saved.

---

## 4. Mathematical Formulation

### Objective Function
The optimizer minimizes a multi-objective loss function $Z$:

$$\min Z = w_1 \cdot \text{Makespan} + w_2 \cdot \text{DisruptionScore} + w_3 \cdot \text{DirectCost} + w_4 \cdot \text{RiskPenalty}$$

Where:
* $\text{Makespan} = \max_{i} (C_i)$ (Total calendar duration to project completion).
* $\text{DisruptionScore} = \sum_{t} \sum_{s} \text{TrafficImpact}(s) \cdot \text{IsClosed}(s, t)$.
* $\text{DirectCost} = \sum_{i} \text{BaseCost}(i) - \sum_{(i,j) \in \text{CoTrench}} \text{SynergyDiscount}(i, j)$.
* $\text{RiskPenalty}$ penalizes scheduling deep earthworks during high-precipitation intervals.

### Primary Constraints
1. **Precedence**: $S_j \ge C_i + \text{CureLag}_{i,j} \quad \forall (i, j) \in \text{Dependencies}$
2. **Resource Capacity**: $\sum_{i \in \text{Active}(t)} \text{CrewDemand}(i, r) \le \text{MaxCapacity}(r) \quad \forall t, \forall r$
3. **Co-Trench Window**: $|S_i - S_j| \le \epsilon \quad \forall (i, j) \in \text{SynchronizedUtilities}$
4. **Corridor Non-Interference**: $\text{IsClosed}(s_1, t) + \text{IsClosed}(s_2, t) \le 1 \quad \forall (s_1, s_2) \in \text{ParallelCorridors}$

---

## 5. Technology Stack

| Layer | Component | Technology | Rationale |
|---|---|---|---|
| **Frontend** | Application UI | React 18, TypeScript, Vite | Strongly-typed, reactive interface with high performance |
| **Frontend** | GIS Visualization | Leaflet / React-Leaflet | Lightweight, responsive vector mapping of street networks |
| **Backend** | API Server | Python 3.11, FastAPI, Pydantic | High-speed asynchronous Python framework with automatic schema validation |
| **Intelligence** | Combinatorial Solver | Google OR-Tools (CP-SAT) | C++-backed constraint solver with proven deterministic optimality |
| **Intelligence** | Reasoning Agent | NVIDIA Nemotron-3 Super / Nano | Large context, tool-calling reasoning hosted on Nebius Token Factory |
| **Geospatial** | Spatial Datasets | GeoJSON / Shapely | Standardized spatial coordinate representations with zero DB overhead |

---

## 6. Repository Structure

```text
├── .agents/                      # Workflow rules and customization guidelines
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI router endpoints
│   │   ├── core/                 # Configuration and environment settings
│   │   ├── models/               # Pydantic schemas (Task, Street, Schedule)
│   │   ├── services/
│   │   │   ├── optimizer.py      # Google OR-Tools CP-SAT formulation
│   │   │   ├── agent.py          # NVIDIA Nemotron client via Nebius Token Factory
│   │   │   └── scenario.py       # Disruption simulation engine
│   │   └── main.py               # Application entry point
│   ├── data/
│   │   └── city_network.geojson  # Municipal street coordinates and utility tasks
│   └── requirements.txt          # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.tsx       # Leaflet GIS vector map with utility layers
│   │   │   ├── GanttChart.tsx    # Interactive schedule timeline
│   │   │   ├── ScenarioPanel.tsx # Disruption simulation triggers
│   │   │   └── ChatDrawer.tsx    # AI engineering explainer interface
│   │   ├── App.tsx               # Main layout container
│   │   └── main.tsx              # React mounting root
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── PROJECT_SPECIFICATION.md  # Detailed engineering and algorithm specifications
├── HACKATHON_RESEARCH.md         # Event constraints, judging criteria, and rules
├── LICENSE                       # MIT Open Source License
└── README.md                     # Project documentation
```

---

## 7. Getting Started

### Prerequisites
* Python 3.11+
* Node.js 18+ and `npm`
* Nebius Token Factory API Key (`NEBIUS_API_KEY`)

### Backend Setup
1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your environment variables:
   ```bash
   cp .env.example .env
   # Configure NEBIUS_API_KEY=your_token_here
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive OpenAPI documentation will be accessible at `http://localhost:8000/docs`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 8. Demonstration Scenarios

**Demo setup — a single owner coordinating its own portfolio.** One city holds four separately-planned projects on a district: a road resurfacing, a drainage upgrade, a water-main replacement, and a fiber conduit. Same owner, four schedules, nothing sequenced across them. No cross-institution agreement is required — this is the city coordinating with itself, which is where the demo lives and where adoption is easiest.

| Scenario | Trigger | Optimizer Response | AI Copilot Action |
|---|---|---|---|
| **Baseline Optimization** | Initial Load | Enforces precedence and crew limits; co-trenches water & fiber by shifting fiber earlier; schedules paving last to respect the pavement-cut moratorium | Outlines the joint schedule; quantifies trench cost and closure-days saved vs. the uncoordinated baseline |
| **Pavement Moratorium Conflict** | "Fiber crew wants to dig Main St after resurfacing" | Blocks the cut (moratorium active for M years post-repave); forces fiber into the pre-repave window or defers it | Explains the legal lock-out and why aligning *before* the repave is the only non-penalized option |
| **Severe Weather Event** | "Simulate 3-Day Monsoon Delay" | Pauses deep earthworks; pushes dependent paving while advancing dry-weather tasks | Explains makespan impact and the revised critical path |
| **Emergency Infrastructure Incident** | "Water Main Burst on Broadway" | Injects a high-priority repair; pre-empts lower-priority cabling within crew limits | Explains resource reallocation and detour strategy |
| **Fiscal Constraint Shift** | "Apply 15% Budget Cap" | Treats the cap as a hard constraint; re-sequences non-critical telecom to Phase 2 | Quantifies capital deferral without delaying the core road opening |

---

## 9. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 10. Acknowledgments

* **Nebius AI Cloud** for Token Factory high-throughput model inference.
* **NVIDIA** for the open-source Nemotron-3 model family.
* **US Federal Highway Administration (FHWA)** for published "Dig Once" engineering coordination guidelines.
