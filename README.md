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

In municipal civil engineering, uncoordinated street works represent one of the costliest and most disruptive public sector failures:
* A city repaves a major corridor; three months later, the water authority excavates the asphalt to replace mains; six months later, telecom providers tear it open again for fiber-optic cabling.
* Legacy construction management suites (such as Oracle Primavera P6 and Microsoft Project) operate in departmental silos, rely on brittle manual Gantt adjustments, and cannot dynamically negotiate cross-utility coordination.
* Traditional pure LLM solutions fail in this domain because language models cannot reliably solve combinatorial scheduling or guarantee physical constraint satisfaction (often hallucinating impossible timelines or safety code violations).

**InfraSync** implements a **Neuro-Symbolic architecture**:
1. **Google OR-Tools (CP-SAT)** acts as the deterministic mathematical engine, enforcing hard physical precedence, crew capacities, traffic detour thresholds, and "Dig Once" co-trenching synergies with guaranteed zero hallucinations.
2. **NVIDIA Nemotron-3 (via Nebius Token Factory)** serves as the cognitive reasoning copilot, translating fuzzy real-world disruptions (e.g., weather events, budget shifts, emergency incidents) into solver constraints and providing transparent, defensible engineering justifications for executive stakeholders.

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

### A. "Dig Once" Co-Trenching Synchronization
* Automatically detects co-located subsurface utilities (e.g., water mains and fiber-optic ducts along the same right-of-way).
* Synchronizes excavation windows to share single trench openings, reducing street closure duration by up to 40% and eliminating duplicate excavation costs.

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

| Scenario | Trigger | Optimizer Response | AI Copilot Action |
|---|---|---|---|
| **Baseline Optimization** | Initial Load | Enforces precedence, resolves crew limits, co-trenches Water & Fiber | Outlines schedule, highlights $20k+ savings |
| **Severe Weather Event** | "Simulate 3-Day Monsoon Delay" | Pauses earthworks; pushes dependent paving while advancing indoor/dry tasks | Explains minimal makespan impact and revised critical path |
| **Emergency Infrastructure Incident** | "Water Main Burst on Broadway" | Injects high-priority repair, pre-empts lower priority cabling | Explains resource reallocation and detour strategy |
| **Fiscal Constraint Shift** | "Apply 15% Budget Cap" | Re-sequences non-critical telecommunications to Phase 2 | Quantifies capital deferral without delaying core road opening |

---

## 9. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 10. Acknowledgments

* **Nebius AI Cloud** for Token Factory high-throughput model inference.
* **NVIDIA** for the open-source Nemotron-3 model family.
* **US Federal Highway Administration (FHWA)** for published "Dig Once" engineering coordination guidelines.
