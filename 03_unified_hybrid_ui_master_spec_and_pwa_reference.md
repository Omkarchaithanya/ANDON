# UI/UX Design & Synthesis Specification: Field Technician PWA & Unified Master Reference Architecture

## 1. Source Reference & Purpose of This Third Specification

* **Reference URLs:** [Facility management software: 8–10x faster troubleshooting](https://dribbble.com/shots/25093318-Facility-management-software-8-10x-faster-troubleshooting) & [AI Agent Monitoring Dashboard UI Design ✦ Meely](https://dribbble.com/shots/27601880-AI-Agent-Monitoring-Dashboard-UI-Design-Meely).
* **Dual Scope of Document 3:**
  1. **Part A — Mobile/Tablet Field Technician PWA & Live Troubleshooting UI:** Covers the responsive on-site Progressive Web App, QR equipment scanner, and real-time technician chat/status log screens.
  2. **Part B — Unified 3-in-1 Master UI Blueprint & AI Coding Agent Prompt:** Provides the complete combined architecture fusing the **Spatial Digital Twin Floorplan Map**, the **Dark-Mode AI Agent Telemetry & Reasoning Dashboard**, and the **On-Site Field Technician Troubleshooting Workflow** into one unified web application.

## 2. Part A: Mobile & Tablet Field Technician PWA Specification

In the field, the platform runs as a responsive Progressive Web App (PWA) on phones and tablets with role-based access for third-party service providers and instant QR code verification.

| PWA Screen / Module | Layout & Structural Elements | Interactive Behavior & Visual Tokens | Source Reference |
| :--- | :--- | :--- | :--- |
| **Split Map + Activity View** | Top half: interactive vector floorplan viewport centered on the target room; Bottom half: draggable bottom-sheet activity drawer (`border-radius: 16px 16px 0 0`) | Selecting a room or scanning an equipment QR code zooms the map to the exact device node and opens its maintenance history | Reliqio Facility Shot |
| **QR Equipment Scanner & Role Gate** | Camera viewfinder overlay or quick-scan action button paired with role-based permission badges | Confirms the technician is standing in front of the exact physical asset before unlocking diagnostic actions, eliminating wasted repair visits | Reliqio Facility Shot |
| **Chronological Troubleshooting Feed** | Grouped by date dividers (`Yesterday`, `Today`) with circular user avatars, technician names, and exact timestamps (`John Doe 8:56 PM`, `Josh Doe 9:16 PM`, `George Vaalden 10:12 AM`) | Interleaves human technician notes with automated status transition pills (`Needs Attention` in `#FEE2E2`/`#EF4444`, `In Progress` in `#E0F2FE`/`#0284C7`) | Reliqio Facility Shot |
| **Contextual Equipment Composer** | Sticky bottom input bar with placeholder `Message HVAC...` and send/attachment controls | Appends timestamped field updates directly to the asset's spatial node on the floorplan | Reliqio Facility Shot |

## 3. Part B: Unified 3-in-1 Reference Architecture (Combining All Three into One UI)

To build a single unified application taking all three references into one cohesive product—an **AI-Autonomous Smart Facility & Agent Operations Command Center**—combine the spatial clarity of Reliqio Floorplan with the futuristic dark telemetry aesthetic of Meely AI Dashboard:

| Unified Architectural Layer | Borrowed From Reference 1 (Desktop Floorplan) | Borrowed From Reference 2 (Meely AI Dashboard) | Borrowed From Reference 3 (Field PWA & Activity Feed) |
| :--- | :--- | :--- | :--- |
| **Global Navigation & Theme Switcher** | Floor selector tabs (`New Floor 01`, `+`), drawing toolbar, and `Save` CTA | Glassmorphic top pill bar (`Dashboard`, `Agents`, `Floorplan`, `Consumption`) and `+ Create` CTA | Responsive mobile/tablet bottom-sheet collapse and QR scan trigger |
| **Hero Status & Spatial Workspace** | 60fps interactive 2D/WebGL vector floorplan with polygon zones (`Zone 2`) and room pins (`Server Room`, `Plant Room`) | 3D particle sphere agent cards (`RUNNING` `#00F2FE`, `IDLED`, `FAILED` `#FF5733`) with `87%` success rate & `15.0s` latency KPIs | Clicking a map pin or agent card links the physical room (`HVAC`, `Server Room`) to the AI diagnostic agent assigned to it |
| **Lower Analytical & Inventory Dock** | Categorized `Unassigned Assets` tree (`Lighting`, `Other Equipment`) | `Agents Health Status` table with circular radial progress gauges (`87%`, `97%`), request counts, latency, and cost | Status badge pills (`Needs Attention`, `In Progress`, `RUNNING`, `FAILED`) unified across table rows and map nodes |
| **Right Telemetry & Troubleshooting Drawer** | Asset property inspector (`Label`, `Description`, `Visible` toggle) | Step-line token/task usage chart (`TOKENS ↗ 75`, `TASKS ↘ 10`, `ERRORS ↘ 5%`) + timestamped `Reasoning Trace` (`13:05`–`13:19`) | Live human + AI collaboration feed (`Yesterday`, `Today`, `Message HVAC...` input) for instant on-site resolution |

