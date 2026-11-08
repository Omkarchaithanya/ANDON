# ANDON Visual Language & Design System Specification

> **Design Thesis:** An inspector’s annotated drawing meeting a factory signal tower.  
> ANDON is not a generic SaaS card dashboard. It is an industrial optical comparator and clearance control plane. The central object is a literal physical connection between an ordinary maintenance ticket and a documented commissioning assumption, rendered with engineering drafting cues and physical andon signal lamps.

---

## 1. Principles & Anti-Patterns

### Core Principles
1. **Physicality over Abstraction:** The UI behaves like an engineering revision drawing with title blocks, revision triangles, leader callouts, and stamped certifications.
2. **Honest Uncertainty (`Unknown`):** A missing relationship, permission denial, or empty graph response is rendered as an intentional, trustworthy cool-gray diagonal hatch with an explicit explanation. Uncertainty is an asset, never masked.
3. **No Color Without Redundancy:** State is never communicated by color alone. Every signal pairs color with a distinct geometric glyph, text label, and hatching pattern for complete accessibility.
4. **Verbatim Provenance:** Quotes are exact substrings tied to source revisions. If text cannot be cited, it is not shown. No model confidence percentages or probabilistic meters.

### Anti-Patterns (Strictly Forbidden)
- Generic white cards on pale gray with generic blue buttons.
- Emoji iconography, AI sparkles, chat interfaces, or prompt boxes.
- Fabricated risk claims (no "emergency stops", "friction coefficients", or "braking hazards").
- Invented test procedures (only show real test plans or an explicit *Expert-Definition Request*).
- Status lights that show green when no call has completed.

---

## 2. Color Palette & The Three-Lamp Andon Stack

The palette is derived from drafting paper, technical ink, and industrial signal towers:

| Token | Light Theme Value | Dark Theme Value | Semantics & Purpose |
| :--- | :--- | :--- | :--- |
| `--andon-ground` | `#f8f7f4` (drafting paper) | `#0d1117` (blueprint dark) | Base canvas background with subtle grid |
| `--andon-surface` | `#ffffff` | `#161b22` | Drawing sheets, title blocks, tags |
| `--andon-ink` | `#1c2128` | `#f0f6fc` | Primary drafting text, borders, callouts |
| `--andon-ink-subtle` | `#57606a` | `#8b949e` | Metadata, coordinates, secondary notes |
| `--andon-ink-muted` | `#8c959f` | `#484f58` | Grid lines, ruler marks, leader guides |
| `--andon-signal-amber` | `#d97706` (amber lamp) | `#f59e0b` | **Axis 1 (Discovery):** Candidate identified / review needed |
| `--andon-signal-red` | `#dc2626` (red lamp) | `#ef4444` | **Axis 2 (Applicability):** Coverage Gap / Stale assessment |
| `--andon-signal-green` | `#16a34a` (green lamp) | `#22c55e` | **Axis 3 (Freshness):** Supported within declared scope ONLY |
| `--andon-hatch-unknown` | `repeating-linear-gradient` | `repeating-linear-gradient` | Missing evidence / restricted access / unverified |

### The Andon Light Stack Glyphs:
- **Discovery Lamp:** Circle glyph `●` (Amber when candidate detected, Gray when quiet).
- **Applicability Lamp:** Diamond glyph `◆` (Red when coverage gap detected, Green when supported).
- **Freshness Lamp:** Hexagon glyph `⬡` (Red when stale revision detected, Green when verified current).

---

## 3. Typography & Technical Lettering

- **Display & Section Titles:** Grotesque technical sans-serif: `system-ui, -apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif`. High tracking, uppercase subtitles.
- **Identifiers, Values & Coordinates:** Technical Monospace: `'SFMono-Medium', 'JetBrains Mono', 'Roboto Mono', Menlo, Consolas, monospace`.
- **Revision Anchors:** Bold monospace inside revision triangles: `▲ rev 3`.

---

## 4. Drafting Anatomy & Graphic Vocabulary

1. **Title Block:** Classic ANSI/ISO engineering drawing header containing Drawing ID, Sheet Number (1 of 3), Date, Author, and Clearance Status.
2. **Leader Callouts:** Crisp SVG vector lines extending from quoted ticket text directly to candidate inspection tags with circular landing dots.
3. **The Redline Convention:** Proposed modifications are rendered side by side: old condition struck through (`~~matte_epoxy~~`) and new condition inserted beside it (`high_gloss_clear_finish`).
4. **The Stamp:** Physical circular and rectangular rubber stamps ("LOCATION CONFIRMED", "DEPLOYMENT CONFIRMED", "CONDITION DIVERGENCE CONFIRMED") applied by authenticated reviewer.
5. **Handoff Work Tag:** Industrial luggage/equipment tag format for Jira dispatch with perforated edge styling, target project key, and explicit opt-in disclosure toggles.

---

## 5. Responsive Behavior

- **Full Page / Wide Workspace (> 800px):** Dual-sheet side-by-side redline, full floor-plan schematic, horizontal leader lines.
- **Jira Issue Panel (~ 400px):** Sheets stack vertically, floor plan collapses to an industrial zone chip, and the vertical Andon stack collapses into a persistent top signal bar.

