# Nebius x NVIDIA Global AI Hackathon 2026: Research Notes

Researched 2026-10-11. **Read this first:** the official Devpost page sits behind a Cloudflare "verify you are human" check, which I can't click through. Everything below comes from Nebius's own pages, Nebius docs, event listings and community write-ups. Anything marked **(verify)** should be checked against the Devpost Rules tab before you rely on it.

---

## 1. What kind of hackathon is this?

**Category: applied generative AI, specifically "agentic AI" apps.** You are *not* training AI models or doing research. You build a working app or "agent" on top of existing open AI models that are rented by the call through an API, much like using a calculator service instead of building a calculator.

- **Online, free, global**, hosted on Devpost. Solo or team. Beginners explicitly welcome.
- **Organisers/sponsors:** Nebius (an AI cloud company) and NVIDIA. Tavily (an AI web-search API) is a partner.
- **Mandatory tech:** every project must run on **Nebius Token Factory** or **Nebius AI Cloud** and use **at least one NVIDIA open-source model** (the Nemotron family).
- **Scale (unverified, third-party tracker):** ~20,483 registered, ~1,843 projects expected.

## 2. Key dates (today is 2026-10-11)

| Event | Date |
|---|---|
| Submissions open | Aug 26, 2026 |
| **Submissions close** | **Oct 30, 2026, 10:00 AM PDT** (= 17:00 UTC; 20:00 in Qatar if you're on UTC+3) |
| Judging | Dec 1-15, 2026 |
| Winners announced | ~Jan 11, 2027 |

**You have about 19 days.** Treat Oct 29 as your real deadline.

## 3. The four tracks

| Track | What it is | Beginner fit |
|---|---|---|
| **Best Apps and Agents** | Practical apps/agents powered by Nemotron models | **Best fit** |
| **Personal AI** | Private assistants with memory and user-controlled tools | **Good fit** |
| Coding and Agentic Engineering | Agents that write, run and test code using Token Factory Sandboxes | Harder |
| Physical AI | Embodied/edge agents: robotics, IoT, on-device AI (Nemotron, GR00T, Cosmos, Sonic). **Hardware is NOT required**: a simulation-only project is allowed (see section 11). The Jetson is only the prize | Technically steep; fewer rivals likely |

## 4. Prizes

| Prize | Amount |
|---|---|
| Grand prize | $20,000 |
| 2nd / 3rd | $10,000 / $6,000 |
| Track winners (4) | NVIDIA Jetson Orin Nano kit each |
| Best Use of Tavily | $3,000 |
| City winners (20) | $500 each (**verify** whether in-person attendance is required) |
| Most Valuable Feedback (10) | $100 + NVIDIA swag |

Total is advertised as $50K+. With ~1,800 competing projects, the big prizes are long shots for a first project. The **Tavily prize** and **Most Valuable Feedback** prizes are the more realistic targets, and the process of building and submitting is valuable on its own.

## 5. Judging criteria

Four **equally weighted** factors (source: community write-up, **verify** on Devpost):

1. Technological Implementation
2. Design
3. Potential Impact
4. Quality of the Idea

## 6. Submission checklist (secondary source, **verify**)

- Runs on Nebius Token Factory or AI Cloud and uses at least one NVIDIA open model
- A **working demo / test URL**
- A **public** GitHub/GitLab/Bitbucket repo with an **open-source licence file** (Apache 2.0, MIT or MPL 2.0)
- A **video under 3 minutes**
- A README with setup instructions
- A clear description of what it does

Questions to check on the Devpost Rules tab: team size limit, age/country eligibility, whether a pre-existing project can be entered if substantially updated (one entry, PokeTerior, did exactly that), IP ownership, and whether city prizes need event attendance.

## 7. Free resources you get

- **$25 Nebius Token Factory credit**
- **$25 Tavily credit** (plus Tavily's free tier: 1,000 credits/month, no card)
- **"Nebius Certified Agentic AI Builder Associate"** exam for $1, with extra credits on completion
- Builder office hours and Discord support
- **Kilo Code**, a free open-source AI coding assistant (VS Code/JetBrains/CLI), recommended by the organisers' community
- In-person "Builders & Brews" tour (20 cities, Sep 9 - Oct 13): mostly over by now. A separate invite-only Nebius Build Week event is on Oct 18 in Berlin (approval-based; not needed for the online hackathon).

## 8. The technology, explained for a total beginner

| Term | Plain meaning |
|---|---|
| **LLM** (large language model) | AI that reads and writes text (like the one behind ChatGPT/Claude) |
| **Open-weight / open-source model** | A model whose files are public, so many companies can run it. Nemotron is NVIDIA's |
| **Inference** | Running a model to get an answer. This is what Token Factory sells |
| **API** | A web address your code sends a request to and gets a response from |
| **API key** | A secret password for your account. **Never put it in a public repo** |
| **Token Factory** | Nebius's service: you send text, a Nemotron model replies. It is **OpenAI-compatible**, so any tutorial for the `openai` Python package works with a different URL |
| **Agent** | An LLM in a loop: it reads a goal, decides to use a **tool** (search the web, run code, read a file), sees the result, and repeats until done |
| **Tool / function calling** | The model *asks* your code to run a function (e.g. "search for X"); your code runs it and returns the result. The model never runs anything itself |
| **Tavily** | A search API built for agents, so your agent can look things up on the live web |
| **Sandbox** | A safe, isolated computer where an agent can run code without risking your machine (Nebius's is in Beta) |
| **Jetson Orin Nano** | A small NVIDIA computer for robots/edge devices (Physical AI track) |

### The Nemotron models on Token Factory

- `nvidia/nemotron-3-super-120b-a12b`: 120B-parameter mixture-of-experts, 1M-token context, built for multi-agent work and tool calling. **Confirmed by two sources.**
- `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`: smaller and cheaper. **Confirmed by one source.**
- Nemotron 3 Ultra (550B) was announced at Computex 2026, and Nebius's cookbook lists further variants. **Check the live [model catalog](https://tokenfactory.nebius.com/model-catalog.md) for current IDs and prices.**

### The smallest possible working program

Connection details (base URL, key variable, model ID) are from Nebius docs; I haven't run this against the live API since it needs your key.

```python
# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ["NEBIUS_API_KEY"],
)

reply = client.chat.completions.create(
    model="nvidia/nemotron-3-super-120b-a12b",
    messages=[{"role": "user", "content": "Explain what an AI agent is in two sentences."}],
)
print(reply.choices[0].message.content)
```

Add Tavily search and a loop and you have an agent. One organiser-adjacent write-up suggests starting with "a 30-line loop" of Token Factory + Tavily before touching any framework.

## 9. A real example to study

[PokeTerior](https://github.com/MrDingSan/poketerior) (Best Apps and Agents entry): ordinary code does the exact poker maths, Nemotron 3 Super only *reasons over* those facts, a validator rejects illegal advice, and a fallback model kicks in on failure. Lesson: **a good entry is a normal app with one well-chosen AI step, not a giant AI system.** Its Nebius integration is ~80 lines of plain HTTP calls.

## 10. Realistic plan for 19 days with no experience

| Days | Goal |
|---|---|
| Oct 11-14 | Create Nebius + Tavily accounts, get keys, run the snippet above, then the Nebius cookbook notebooks. Read the Devpost Rules tab. |
| Oct 15-17 | Pick **one** small, specific problem you personally understand. Sketch the user flow on paper. |
| Oct 18-25 | Build the simplest version that works end to end (model + 1-2 tools). Use Kilo Code or Claude Code to write most of the code. |
| Oct 26-28 | Deploy to a public URL, add the licence file and README, record the <3 min video. |
| Oct 29 | **Submit.** Leave the last day as buffer. |

Idea sources: pick a problem from your own work/study life (your steel-industry background could be a niche most entrants lack, for example document/certificate lookup or maintenance-log assistants). Specific beats flashy for the "Quality of the Idea" and "Potential Impact" criteria.

**Pitfalls to avoid**
- Committing your API key to the public repo (use a `.env` file and `.gitignore`).
- Scope creep. One feature that works beats five that don't.
- Forgetting the licence file, demo URL or video, which are required.
- Starting with the Physical AI track without a Jetson.

## 11. Confirmed from the official rules (your screenshots, Oct 11)

**Official track wording**
- **Coding and Agentic Engineering:** coding agents and developer tools that write, run and test code in Token Factory.
- **Best Apps and Agents:** any app or agent someone would actually use. Use Nemotron 3 Ultra for serious reasoning and Nano/Super for fast everyday calls (saves credits). Nebius Serverless Endpoints/Jobs are encouraged, not required.
- **Personal AI:** always-on private assistant with persistent memory, reusable skills, user-chosen tools. Use at least one NVIDIA open model and tools such as NemoClaw, OpenShell, Hermes Agent and Nebius Serverless.
- **Physical AI:** embodied/edge agents using Nemotron, GR00T, Cosmos and Sonic. Nebius Serverless Jobs for simulations, synthetic data and robot-policy evaluation; Endpoints for real-time inference.

**Submission requirements**
- Working project, chosen track, text description
- Demo URL (**not required** for Physical AI)
- Public **YouTube** video under 3 minutes; no third-party trademarks or copyrighted music. Judges are **not required to watch past 3 minutes**
- Physical AI video: at least 1 minute of the hardware/robot operating, **or** the key application modules in action if there is no hardware
- Public repo (GitHub/GitLab/Bitbucket) with a licence visible in the About section, a README with setup, and a section highlighting how you used Nemotron/NVIDIA models, where Token Factory helped, and any other Nebius tools
- **Written feedback** on Token Factory, AI Cloud and any NVIDIA tools used (required; this is also how the "Most Valuable Feedback" prize is won)
- If the project existed before Aug 26: allowed, but you must explain what was **significantly updated** during the period
- Everything in English

**Rules that shape strategy**
- **Judges are not required to test your project.** They may judge on description, images and video alone. The video is your whole entry.
- The project must stay **free and unrestricted for judges until the Judging Period ends** (Dec 15). A private site needs login credentials in the testing instructions. Watch your credit burn.
- **City Winner Award requires choosing the city whose in-person Builders & Brews event you attended.** The tour runs Sep 9 - Oct 13, so this is effectively out of reach now.
- For hardware not widely available (anything other than phone/tablet/desktop), the sponsor may demand **physical access** to it.
- The work must be solely yours and not violate anyone's IP or privacy rights. A third party may give technical assistance only if the work is yours. Open-source use is fine if you comply with licences. Do not use any employer's or university's confidential data, and check their IP policies.
- No sponsor funding or contract work behind the project.
- Drafts can be saved on Devpost; **no edits after the deadline**.
- A team must appoint one Representative to submit.

## 12. Still unconfirmed

- Team size limit, age/country eligibility, rules on AI-generated code (not in the screenshots; the organisers promote AI coding tools, so it is evidently expected)
- Nemotron model list **(resolved Oct 11, from the Token Factory catalog; re-check before building)**:
  - `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`: 262K context, $0.06 in / $0.24 out per million tokens
  - `nvidia/nemotron-3-super-120b-a12b`: 256K context, $0.30 / $0.90
  - `nvidia/Nemotron-3-Ultra-550b-a55b`: 1M context, $1.00 / $3.00
  - `nvidia/Nemotron-3_5-Lightning`: 30B, 1M context, $0.06 / $0.24
  - The catalog showed **no NVIDIA vision, embedding or safety models**. The only embedding model listed was Qwen3-Embedding-8B. NVIDIA's open vision model (Nemotron Nano V2 VL) exists but would need self-hosting on Nebius Serverless.
- Tools named in the rules: **Hermes Agent** (open-source, self-hosted persistent agent from Nous Research with memory, auto-created skills, Telegram/Discord/Slack access, works with any model provider); **Nebius Serverless** (Endpoints = always-on services, Jobs = background/batch containers, GPU options).

## 13. Time budget: 5-6 hours/week (~16 hours total). Supersedes the plan in section 10

**UPDATE Oct 11:** user raised this to ~20 hours/week (~54 hours) and can recruit a coder, so the riskier tracks are back on the table. The table below is the fallback if that falls through.

Constraint: the "risky and high-effort" tracks (coding agent with sandbox forking, Physical AI simulation) are **not realistic** in ~16 hours as a first-timer. Keep the risk in the *idea*, not the tech. Track: **Best Apps and Agents**, one narrow use case.

| When | Hours | Goal |
|---|---|---|
| Oct 11-17 | ~6 | Join on Devpost; Token Factory + Tavily accounts and keys; run the hello-world call; pick one narrow problem and write a one-paragraph spec; get a first version running locally |
| Oct 18-24 | ~6 | Make it genuinely useful for that one use case; add usage limits; deploy to a public URL |
| Oct 25-28 | ~4 | README + licence + Nemotron/Token Factory section; record and upload the <3 min YouTube video; description; written feedback; **submit by Oct 28** (buffer day Oct 29) |

Cheap differentiators: a human-approval step before the agent takes any action, source citations, a narrow domain you understand. Do not use confidential employer/university data.

## Sources

- [Nebius Build Week Hackathon (Berlin)](https://nebius.com/events/nebius-nvidia-ai-builders-hackathon)
- [Amsterdam recap with tracks, prizes, criteria, resources](https://lucaberton.com/blog/aaif-builders-brews-amsterdam-nebius-nvidia-hackathon-2026/)
- [Internshala listing](https://internshala.com/competitions/nebius-x-nvidia-global-ai-hackathon-2026/)
- [HackathonRadar listing](https://www.hackathonradar.com/database/hackathon/nebius-x-nvidia-global-ai-hackathon-2026)
- [Devpost page (blocked for me; open it yourself)](https://nebiusglobalaihackathon.devpost.com/)
- [Token Factory docs](https://docs.tokenfactory.nebius.com/quickstart.md), [function calling](https://docs.tokenfactory.nebius.com/ai-models-inference/function-calling.md), [Sandboxes](https://docs.tokenfactory.nebius.com/sandboxes/overview.md)
- [Nemotron 3 Super on Token Factory](https://nebius.com/blog/posts/nemotron3-super-now-available)
- [Nebius Token Factory cookbook (Nemotron)](https://github.com/nebius/token-factory-cookbook/tree/main/models/nemotron)
- [Tavily quickstart](https://docs.tavily.com/documentation/quickstart)
- [PokeTerior example project](https://github.com/MrDingSan/poketerior)
