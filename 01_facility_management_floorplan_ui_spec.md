# UI/UX Design & Frontend Architecture Specification: Facility Management Software (Floorplan Digital Twin)

## 1. Source Reference & Overview

* **Reference Design:** [Facility management software: 8–10x faster troubleshooting](https://dribbble.com/shots/25093318-Facility-management-software-8-10x-faster-troubleshooting)
* **Design Agency:** Reliqio
* **Core Product Concept:** A map-first digital twin and spatial IoT troubleshooting platform ("Google Maps for facility management") built to replace legacy slider-and-table interfaces.
* **Performance & Scale Targets:** Renders interactive vector floor plans at 60 frames per second (60fps) while streaming live IoT status feeds across 10,000+ devices simultaneously, reducing on-site troubleshooting time from 30+ minutes to under 3 minutes.
* **Original Production Stack:** Angular, Angular Material, Mapbox, WebGL, and Figma, deployed as a desktop web application and a responsive Progressive Web App (PWA) for mobile and tablet field technicians.

## 2. Visual Design System & Color Tokens

The interface uses a high-contrast, light-mode architectural blueprint aesthetic so technicians can read spatial layouts and status markers clearly both in control rooms and on field tablets.

| Token Name | Hex / CSS Value | UI Application | Source Reference |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F4F5F7` | Main viewport background and unmapped canvas workspace | Reliqio Facility Shot |
| `--bg-surface` | `#FFFFFF` | Top bar, left asset sidebar, right inspector drawer, and floating cards | Reliqio Facility Shot |
| `--bg-subtle` | `#F8F9FA` | Secondary accordion headers, inactive floor tabs, and input backgrounds | Reliqio Facility Shot |
| `--border-default` | `#E5E7EB` | 1px structural dividers between top header, sidebars, and map canvas | Reliqio Facility Shot |
| `--text-primary` | `#111827` | Primary headings, active tab labels, room blueprint outlines, and form values | Reliqio Facility Shot |
| `--text-secondary` | `#6B7280` | Property field labels, unassigned asset counts, and chat timestamps | Reliqio Facility Shot |
| `--accent-primary` | `#3B82F6` | Primary CTAs (`Save`, `Upload Image`), active floor underline, and map nodes | Reliqio Facility Shot |
| `--accent-zone-fill` | `rgba(59, 130, 246, 0.18)` | Translucent vector polygon overlay for active spatial zones (`Zone 2`) | Reliqio Facility Shot |
| `--accent-zone-stroke` | `#2563EB` | 2px vector polygon outline and vertex handles on selected map zones | Reliqio Facility Shot |
| `--status-danger-bg` | `#FEE2E2` | Pill background for `Needs Attention` alerts | Reliqio Facility Shot |
| `--status-danger-text` | `#EF4444` | Text and icon color for `Needs Attention` device markers | Reliqio Facility Shot |
| `--status-info-bg` | `#E0F2FE` | Pill background for `In Progress` maintenance status | Reliqio Facility Shot |
| `--status-info-text` | `#0284C7` | Text color for `In Progress` status badges | Reliqio Facility Shot |

## 3. Typography & Elevation Rules

* **Font Stack:** Clean geometric sans-serif (`Inter`, `Roboto`, or system UI stack aligned with Angular Material) for crisp legibility at small blueprint scales.
* **Type Scale:**
  * **Empty State / Modal Heading:** `20px` (`1.25rem`), font-weight `600`, line-height `1.3` (e.g., *"We're missing a Floor Map"*).
  * **Panel & Drawer Headers:** `15px` (`0.9375rem`), font-weight `600`, color `#111827` (e.g., `Unassigned Assets`, `Zone 2`).
  * **Navigation Tabs & Tree Items:** `13px–14px`, font-weight `500`, color `#374151` (`#3B82F6` when active).
  * **Blueprint Room Labels & Map Badges:** `11px–12px`, font-weight `500`, high-contrast dark charcoal over white/translucent pill backgrounds.
* **Border Radius & Shadows:**
  * **Panels & Drawers:** `0px` on docked edges with `1px solid #E5E7EB` borders; `8px–12px` radius on floating cards, tooltips, and dialogs.
  * **Buttons & Inputs:** `6px–8px` border radius for action buttons (`Save`, `Upload Image`) and text inputs; `9999px` full pill radius for status badges (`Needs Attention`, `In Progress`).
  * **Floating Map Controls:** Soft elevation shadow `0 4px 12px rgba(17, 24, 39, 0.08)` on zoom pills (`+` / `-`) and canvas tooltips.

## 4. Layout Grid & Viewport Architecture

The desktop web application uses a full-viewport (`100vw x 100vh`, `overflow: hidden`) four-zone spatial shell:

| Viewport Zone | Dimensions / CSS Layout | Core Responsibility | Source Reference |
| :--- | :--- | :--- | :--- |
| **Top Navigation & Tool Header** | Height `56px`, `flex` row, `justify-content: space-between`, bottom border `1px solid #E5E7EB` | Floor switching tabs (`Floors`, `New Floor 01`, `+`), vector drawing tools, and primary `Save` CTA | Reliqio Facility Shot |
| **Left Asset Inventory Sidebar** | Width `260px–280px`, collapsible vertical flex column, right border `1px solid #E5E7EB` | Categorized accordion tree of `Unassigned Assets` ready to be dragged and pinned onto the floor plan | Reliqio Facility Shot |
| **Central Interactive Map Canvas** | `flex: 1`, `position: relative`, WebGL / Mapbox 2D vector surface | 60fps pan/zoom architectural blueprint, room labels, polygon zones, and clickable IoT device pins | Reliqio Facility Shot |
| **Right Contextual Inspector Drawer** | Width `300px–340px`, left border `1px solid #E5E7EB`, scrollable vertical stack | Editable metadata form for selected floor/zone/asset or live field technician activity chat feed | Reliqio Facility Shot |

## 5. Detailed Component Breakdown

### 5.1 Top Floor-Management & Drawing Toolbar
* **Left Group (Floor Tabs):** Displays a section label `Floors` followed by horizontal tab pills such as `New Floor 01` with an active bottom border (`2px solid #3B82F6`) and an icon button (`+`) to add a new building floor.
* **Center Group (Canvas Drawing Tools):** Segmented icon toolbar containing a cursor/select pointer tool, a polygon zone drawing tool, a rectangle/geometric shape tool, and a text annotation tool.
* **Right Group (Persistence Actions):** Primary solid blue `Save` button (`#3B82F6`, white text, `padding: 8px 16px`, `border-radius: 6px`).

### 5.2 Left Sidebar: Unassigned Assets Accordion Tree
* **Header:** Displays `Unassigned Assets` with a collapse/expand chevron.
* **Accordion Categories:** Expandable groups for `Lighting`, `Other Equipment`, and `Non-Equipment` (including individual items such as `Tanya's stapler`).
* **Drag-and-Drop Interaction:** Users drag an unassigned asset from the sidebar directly onto the blueprint canvas to bind its coordinates to a specific room or polygon zone.

### 5.3 Central WebGL / Mapbox Architectural Floorplan Canvas
* **Vector Blueprint Layer:** High-contrast architectural CAD/SVG floor plan showing walls, doors, stairwells, and labeled rooms including `Exhibition space`, `Bike parking`, `Cleaner's Cupboard`, `Bar back of house`, `Plant Room`, `Server Room`, `Storage Room`, `Showers`, and `WC`.
* **Interactive Polygon Zone Overlays:** Translucent blue vector polygons (`rgba(59, 130, 246, 0.18)`) with crisp blue strokes (`#2563EB`) and draggable corner vertex handles. Selecting or drawing a zone displays a dark/light floating confirmation tooltip such as *"2 zones auto-assigned to Zone 2"*.
* **IoT Device Pin Markers:** Circular status nodes (`20px–28px` diameter) in royal blue/purple or alert coral with white center icons and subtle white outer rings (`2px solid #FFFFFF`) positioned inside rooms.
* **Floating Canvas Controls:** Bottom-left vertical pill button group containing `+` (zoom in) and `-` (zoom out) buttons.
* **Empty State View (Unconfigured Floor):** When a newly created floor tab has no blueprint uploaded yet, the center canvas renders a clean empty-state card with a minimal architectural graphic, the heading *"We're missing a Floor Map"*, explanatory helper text, and a primary blue `Upload Image` CTA button.

### 5.4 Right Contextual Properties & Inspector Panel
* **Editable Properties Mode:** When editing a floor, zone, or asset, the right drawer displays form inputs for `Label` (display text), `Description` (multiline textarea), and a `Visible` boolean toggle switch.
* **Live Troubleshooting Activity Mode:** When inspecting an active equipment issue, the panel transitions into a real-time technician timeline grouped by `Yesterday` and `Today` with status badges (`Needs Attention`, `In Progress`), timestamped technician messages (`John Doe 8:56 PM`, `Josh Doe 9:16 PM`, `George Vaalden 10:12 AM`), and a bottom message composer (`Message HVAC...`).

