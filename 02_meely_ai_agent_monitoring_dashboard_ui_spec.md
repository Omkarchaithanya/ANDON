# UI/UX Design & Frontend Architecture Specification: AI Agent Monitoring Dashboard (Meely)

## 1. Source Reference & Overview

* **Reference Design:** [AI Agent Monitoring Dashboard UI Design ✦ Meely](https://dribbble.com/shots/27601880-AI-Agent-Monitoring-Dashboard-UI-Design-Meely)
* **Design Agency:** Halo UI/UX for HALO LAB
* **Core Product Concept:** A dark-mode AI agent observability, telemetry, and orchestration dashboard (`meely`) that tracks autonomous agent execution states (`RUNNING`, `IDLED`, `FAILED`), token consumption, response latency, cost per agent, and real-time step-by-step reasoning traces.
* **Visual Signature:** Deep obsidian glassmorphism paired with glowing 3D particle constellation spheres (cyan for active/running agents, orange-red for failed agents), crisp monospaced telemetry metrics, step-line usage charts, and radial health gauges.

## 2. Visual Design System & Color Tokens

The interface uses a deep futuristic dark theme with high-contrast neon cyan and coral-orange semantic accents to indicate agent health at a glance.

| Token Name | Hex / CSS Value | UI Application | Source Reference |
| :--- | :--- | :--- | :--- |
| `--bg-app-obsidian` | `#0B0C10` | Deep ambient background canvas of the dashboard | Meely AI Dashboard Shot |
| `--bg-card-surface` | `#151722` | Primary dark slate container fill for agent cards, tables, and log panels | Meely AI Dashboard Shot |
| `--bg-card-elevated` | `#1E202D` | Hover states, inner pill containers, filter dropdowns, and action buttons | Meely AI Dashboard Shot |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | 1px hairline borders on standard cards, table rows, and panels | Meely AI Dashboard Shot |
| `--border-glow-cyan` | `rgba(0, 242, 254, 0.45)` | Highlighted border stroke around the active `RUNNING` agent card (`#750`) | Meely AI Dashboard Shot |
| `--accent-cyan-neon` | `#00F2FE` | Primary neon accent for `RUNNING` badges, particle spheres, and charts | Meely AI Dashboard Shot |
| `--accent-teal-success` | `#10B981` | Positive trend arrows (`TOKENS ↗ 75`) and `Received task` trace badges | Meely AI Dashboard Shot |
| `--accent-orange-fail` | `#FF5733` | Glowing particle sphere and status badge for `FAILED` agents and trace errors | Meely AI Dashboard Shot |
| `--text-primary` | `#FFFFFF` | Primary headings (`Active agents`), KPI numbers (`87%`, `15.0`), and agent names | Meely AI Dashboard Shot |
| `--text-muted` | `#9CA3AF` | Secondary descriptions, table column headers, and inactive navigation tabs | Meely AI Dashboard Shot |

## 3. Typography & Surface Styling

* **Font Pairing:**
  * **Primary UI Sans-Serif:** `Inter`, `SF Pro Display`, or `Plus Jakarta Sans` for section headers (`Active agents`, `Agents Health Status`), agent titles (`Hotel Booking Agent`), and body copy.
  * **Telemetry & Log Monospace:** `JetBrains Mono` or `Fira Code` for agent IDs (`#750`), execution timestamps (`13:05`, `13:06`, `13:10`, `13:19`), status badges (`RUNNING`, `IDLED`, `FAILED`), and uppercase table headers (`AGENT`, `SUCCESS`, `REQUESTS`, `RESPONSE`, `COST`).
* **Glassmorphism & Ambient Glows:**
  * Cards use `border-radius: 16px`, `backdrop-filter: blur(16px)`, and subtle radial background gradients (`radial-gradient(circle at 25% 30%, rgba(0, 242, 254, 0.14), transparent 65%)` for running agents; `radial-gradient(circle at 25% 30%, rgba(255, 87, 51, 0.14), transparent 65%)` for failed agents).

## 4. Layout Grid & Viewport Architecture

The dashboard uses a 12-column responsive CSS Grid (`max-width: 1600px`, `gap: 20px`, `padding: 20px 28px`) divided into a top navigation header and a two-column asymmetric main body (`8 columns` left primary workspace + `4 columns` right telemetry & reasoning sidebar):

| Structural Region | Grid Span & Layout | Contained Widgets | Source Reference |
| :--- | :--- | :--- | :--- |
| **Top Glass Navigation Header** | Full width (`12 cols`), height `64px`, `flex` row | Brand logo `meely`, pill tabs (`Dashboard`, `Agents`, `Builder`, `Consumption`), search, filter, `+ Create` CTA, user avatar | Meely AI Dashboard Shot |
| **Left Upper Hero: Active Agents Grid** | Left `8 cols`, horizontal 3-card bento grid (1 wide featured card + 2 compact state cards) | Featured `Hotel Booking Agent (#750)` (`RUNNING`), `IDLED` task planner agent card, and `FAILED` social scheduler agent card | Meely AI Dashboard Shot |
| **Left Lower Section: Health Status Table** | Left `8 cols`, full-width dark data table card | `Agents Health Status` header with `Today v` filter, radial progress meters, request counts, latency, and cost per agent | Meely AI Dashboard Shot |
| **Right Telemetry & Trace Column** | Right `4 cols`, vertical stack of 2 analytics cards | Top: Usage & Token Step-Line Chart (`TOKENS ↗ 75`, `TASKS ↘ 10`, `ERRORS ↘ 5%`); Bottom: Live `Reasoning Trace` chronological log | Meely AI Dashboard Shot |

## 5. Detailed Component Breakdown

### 5.1 Top Navigation Bar
* **Brand Mark:** Lowercase geometric wordmark `meely` on the far left.
* **Segmented Navigation Pills:** Dark pill bar containing `Dashboard`, `Agents` (highlighted with active dark-glass fill and bright white label), `Builder`, and `Consumption`.
* **Global Actions:** Icon buttons for search and filtering, a high-contrast `+ Create` button, and a circular user profile avatar.

### 5.2 Active Agents Hero Cards & 3D Particle Spheres
* **Featured Agent Card (`Hotel Booking Agent` / `#750`):**
  * **Header Row:** Status pill `RUNNING` with glowing teal dot on the left; monospaced agent ID `#750` on the right.
  * **3D Particle Constellation Visual:** Left-aligned interactive/animated 3D wireframe sphere composed of glowing cyan nodes and constellation edges.
  * **KPI Callouts:** Large numeric readout `87%` (`Success rate` with `+2.5` delta badge) alongside `15.0` (`Response time`).
  * **Identity & Subtitle:** Title `Hotel Booking Agent` and subtitle *"Automates hotel search, availability check & booking"*.
  * **Live Control Footer:** Animated audio/telemetry waveform badge (`LIVE`) alongside control buttons `|| Pause`, layer stack icon, and overflow menu `...`.
* **Secondary Agent Cards:**
  * **Idled Agent Card:** Displays `IDLED` status pill, muted cyan/grey particle sphere, and description *"Manages tasks, deadlines & daily planning"*.
  * **Failed Agent Card:** Displays `FAILED` status pill in glowing orange-red (`#FF5733`), an orange/red particle sphere, and description *"Schedules posts, analytics & engagement"*.

### 5.3 Agents Health Status Table
* **Header & Filter:** Section title `Agents Health Status` with a right-aligned time selector dropdown `Today v`.
* **Columns:** `AGENT`, `SUCCESS`, `REQUESTS`, `RESPONSE`, `COST`, and a right-aligned action column.
* **Data Rows & Micro-Visualizations:**
  * **Row 1 (`Sales Report`):** Circular radial progress gauge showing `87%`, `750` requests, `25.5s` response time, `$0.15` cost, and a `Details` button.
  * **Row 2 (`Flight Tracker`):** Circular radial progress gauge showing `97%`, `576` requests, `45.2s` response time, `$0.47` cost, and a `Details` button.

### 5.4 Right Column: Telemetry Step-Line Chart & Reasoning Trace Log
* **Usage & Token Step-Line Chart:**
  * **KPI Strip:** Three inline metric pills at the top of the card: `TOKENS ↗ 75` (emerald green upward arrow), `TASKS ↘ 10`, and `ERRORS ↘ 5%`.
  * **Step-Line Graph:** Orthogonal step-line plot across X-axis dates (`01`, `05`, `06`, `07`, `11`) with a highlighted peak callout bubble showing `150` on date `06`.
* **Live Reasoning Trace Widget:**
  * **Header:** Accordion/panel header with a copy-log icon and download action.
  * **Chronological Execution Steps:**
    * `13:05` — `Received task: Exec Report Draft` (highlighted with a soft green pill badge).
    * `13:06` — `Parsed input: Dates, location, guests`.
    * `13:06` — `Error in parsing list of deliverables` (highlighted in coral-red alert text `#FF5733`).
    * `13:10` — `Filtered results: Price, rating, amenities`.
    * `13:19` — `Generated output: Booking option...`.

