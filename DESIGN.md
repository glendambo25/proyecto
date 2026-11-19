---
name: Arrival
description: An arrival charted against time, with a calm minimal sibling on the same palette.
colors:
  paper: "#ffffff"
  paper-2: "#f3f4f6"
  card: "#ffffff"
  line: "#e5e7eb"
  ink: "#111827"
  ink-2: "#4b5563"
  ink-3: "#6b7280"
  accent: "#4f46e5"
  accent-soft: "#eef2ff"
  ok: "#16a34a"
  ok-soft: "#dcfce7"
  stamp: "#dc2626"
  stamp-soft: "#fee2e2"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "50px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 110"
  numeral:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.04em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  scale-label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    letterSpacing: "0.06em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 75"
  hand:
    fontFamily: "Reenie Beanie, cursive"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.09
  minimal-headline:
    fontFamily: "ui-sans-serif, -apple-system, Segoe UI, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  minimal-body:
    fontFamily: "ui-sans-serif, -apple-system, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
  minimal-meta:
    fontFamily: "ui-sans-serif, -apple-system, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.375
rounded:
  sm: "6px"
  md: "16px"
  lg: "24px"
  full: "9999px"
spacing:
  gutter: "20px"
  gutter-desktop: "32px"
  row: "12px"
  row-minimal: "14px"
  stack: "24px"
  rail-column: "108px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
  button-route:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "16px 28px"
  button-route-hover:
    backgroundColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
  choice-tile:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  choice-tile-selected-chart:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  choice-tile-selected-minimal:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  step-row-next:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.md}"
    padding: "12px"
  source-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "14px"
  today-readout:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: "{typography.scale-label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  design-switch-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

# Design System: Arrival

## Overview

**Creative North Star: "The Arrival Chart"**

The arrival is measured the way a coastal chart measures height: a vertical day rail counts days from landing, every step sits at its place on it, and indigo arcs in the gutter show what each step waits for. The ground is white paper with faint indigo contour lines rising toward the landing. Type is Archivo, used across its width axis: condensed caps for the scale and numerals, normal width for reading, slightly expanded heavy weights for headlines. A pen face writes the few notes a person would scribble in the margin: what a step is waiting for, how many days are left, that a deadline has passed.

The system ships as two siblings on one palette and one content model, switched per viewer (Chart is the default). **Chart** is the world above. **Minimal** keeps the same content and functions with the system UI face, hairline rows, one indigo accent and no ornament: no rail, no contours, no hand. Both are flat, white, mobile-first and calm under stress; colour carries state, never decoration.

**Key Characteristics:**
- White paper ground; indigo is the route, green is done, red is risk.
- A measured day rail and dependency arcs (dashed while waiting, solid once the prerequisite is done) in Chart.
- Archivo across its width axis; a single hand face for margin notes only.
- Flat surfaces, hairline dividers, fully rounded actions.
- Minimal sibling: system face, hairline list, a 4px progress bar, the same states.

## Colors

A white page, near-black ink, one indigo for the route and attention, and two state colours that only ever mean one thing each.

### Primary
- **Route Indigo** (accent): the rail's today marker and readout, dependency arcs, contour lines (at 9% and 20% opacity), hand annotations, the big step numeral, the Chart CTA, selected choice tiles in Chart, verified-source marks and the "Do it for me" panel in Chart. In Minimal it is the only accent: links, in-progress state, progress fill.
- **Indigo Wash** (accent-soft): the next-step row background (at 70%), row hover (at 60%), the soft verified mark in Minimal.

### Secondary
- **Done Green** (ok): completed step nodes, completed status text, ticked documents.
- **Done Wash** (ok-soft): reserved soft companion of Done Green.

### Tertiary
- **Stamp Red** (stamp): missed deadlines, unverified or missing official sources ("Not verified yet", "TODO: verify"), official warnings and housing-scam alerts, the hand note when a deadline has passed.
- **Stamp Wash** (stamp-soft): background of warning callouts and the unverified-source mark.

### Neutral
- **Paper** (paper / card): page and card ground; cards are separated by line, not by tone.
- **Mist** (paper-2): unfilled progress track, unreached onboarding step segments.
- **Hairline** (line): every divider, card border, input border, tab baseline.
- **Ink** (ink): text, the rail and its ticks, open step nodes, primary buttons, the active switch segment.
- **Ink Mid** (ink-2): supporting copy and secondary values.
- **Ink Soft** (ink-3): meta lines, blocked nodes, completed titles, chevrons.

### Named Rules
**The Green Means Done Rule.** Green appears only on something the student has finished. Never as a positive brand colour, a "verified" badge or a CTA.

**The Red Is Risk Rule.** Red marks a missed deadline, an unverified source or an official warning, and nothing else. It is never used for emphasis or for the "hang on" of a blocked step (blocked is dashed Ink Soft).

**The Indigo Is the Route Rule.** In Chart, anything that traces order or attention (arcs, marker, numeral, hand notes, the next row) is indigo; decoration is not.

## Typography

**Display / Body Font (Chart):** Archivo, variable with the `wdth` axis (fallback ui-sans-serif, system-ui)
**Annotation Font (Chart):** Reenie Beanie (fallback cursive)
**UI Font (Minimal):** the system UI stack (ui-sans-serif, -apple-system, Segoe UI, system-ui)

**Character:** One grotesque stretched to do three jobs, plus one pen. The width axis does the hierarchy work that a second family would normally do.

### Hierarchy
- **Display** (800, 50px mobile / 76px desktop, line-height 0.95, wdth 112 / 106): the onboarding welcome line only.
- **Headline** (800, 36px / 52px, line-height 1.02, wdth 110, balanced wrap, max 16ch): the checklist title ("Madrid, charted for Priya."). Step detail uses 28px / 40px at wdth 108; onboarding questions 40px at wdth 115.
- **Numeral** (800, 88px, line-height 0.8, wdth 75, tabular, indigo): the step number beside the step title. City codes in onboarding use the same voice at 22px and 28px.
- **Title** (600, 16px, snug): step rows; 14px semibold for source names and chain links.
- **Body** (400, 15px; 17px relaxed for a step description, max 65ch; 16-18px on onboarding intro, max 42ch).
- **Scale label** (700, 10.5-12px, uppercase, tracking 0.06-0.14em, wdth 75-80, tabular): rail ticks, the today readout, phase headings on the rail. This is the chart's scale, not a decorative kicker.
- **Hand** (Reenie Beanie, 22px, line-height 24px, indigo or red): margin notes only.
- **Minimal:** headline 600 at 28px / 34px (step 26px / 32px, onboarding 34px / 52px), tracking -0.015em; rows 15px; meta and section names 13px in Ink Soft, sentence case.

### Named Rules
**The Width Carries Role Rule.** Condensed (wdth 75-80) is for measuring: ticks, readouts, numerals, codes. Normal width is for reading. Expanded (wdth 106-115) at 800 is for the one headline per screen.

**The Pen Speaks Last Rule.** The hand face writes short notes about order and time (what a step waits for, days left, a missed deadline, the example-route caption), always 22px, indigo or red, with a small hand-drawn squiggle when attached to a row. Never headings, body copy, buttons or labels.

**The One Face Rule (Minimal).** Minimal uses the system UI stack only, weights 400-600, sentence case, no condensed caps.

## Layout

Mobile-first in a 440px column with 20px side gutters (32px on desktop). On desktop, onboarding splits into two columns (1.1fr / 1fr, 80px gap) and step detail into content plus a 360px sticky aside (48px gap). Vertical rhythm is 24px between blocks, 12px row padding in Chart, 14px in Minimal.

The Chart checklist is a two-part figure: a 108px left column holds the rail (at x 22), the arc lanes and the step nodes (centred at x 92); the step content reads to its right with an optional right-aligned "day +N". Arcs take one lane each, shortest span nearest the nodes, 9px apart. Phase headings sit indented to the content column. Minimal lays phases as hairline-bounded lists, two columns on desktop (48px gap).

### Named Rules
**The Gutter Is Data Rule.** In Chart, the left gutter is measured: rail ticks every 24px, labelled ticks only where an official rule sets a deadline, arcs only for real dependencies. Nothing ornamental goes there.

## Elevation & Depth

Flat. Depth comes from hairline borders, the indigo wash on the next row and the contour ground behind headers, not from shadows. The one shadow in this world is the today marker on the rail, a soft indigo glow under an 18px dot ringed in white, so the marker reads as sitting on top of the arcs.

### Shadow Vocabulary
- **Marker glow** (`box-shadow: 0 2px 6px rgba(79,70,229,0.45)`): the today marker only.

### Named Rules
**The Flat Chart Rule.** Cards, rows, inputs and buttons carry no shadow. Separation is a 1px Hairline border or a divider.

## Shapes

Actions are pills (fully rounded). Containers, inputs, choice tiles, source cards and step rows use a gentle 16px radius; the "Do it for me" panel 24px; the small today readout and the document checkbox 6px. Status nodes are circles: 24px on the rail, 20px in Minimal, 9px radius in the step chain.

Dashed strokes carry one meaning everywhere: not yet. Arcs are dashed (3 4) while their prerequisite is open and solid when it is done; blocked nodes, disabled actions and unverified source cards use dashed borders. Contours are smooth closed isolines with an irregular radius, every fourth line heavier.

## Components

### Buttons
- **Shape:** pill (9999px), 14px x 20px, 15px semibold; large CTAs 16px x 28px at 16px.
- **Primary:** Ink fill, white text, hovers to indigo. Used for "Mark as done" in both siblings and every CTA in Minimal.
- **Route (Chart onboarding):** indigo fill, white text, hovers to Ink.
- **Secondary:** white with Hairline border, hovers to an Ink border ("Start", "Undo").
- **Disabled:** dashed Hairline border, Ink Soft text, a lock icon, never faded fill.
- **Transitions:** colour only, 150ms.

### Choice tiles and inputs
- **Choice tile:** 16px radius, Hairline border, white; hover Ink border; selected fills indigo (Chart) or Ink (Minimal) with a check.
- **Input / select:** 16px radius, Hairline border, 14px x 16px, 16px text; focus shifts the border to indigo. Global focus-visible is a 2px indigo outline offset 2px.

### Step node and row (signature, Chart)
- **Node states:** done = green filled circle with check; in progress = 3px indigo ring; blocked = dashed Ink Soft ring with lock; open = 2px Ink ring.
- **Row:** title 16px semibold, meta "NN · local name" 12.5px Ink Soft, optional hand note, right-aligned "day +N" (red when overdue). The next row sits on the Indigo Wash; completed titles strike through in Ink Soft.

### Day rail and today marker (signature, Chart)
A 1.5px Ink rule with 24px minor ticks and every fourth tick longer; labelled ticks for landing ("0 · LANDING") and dated steps; an 18px indigo marker with the "TODAY +N" readout in a small indigo tag.

### Dependency arcs and step chain (signature, Chart)
Indigo arcs between prerequisite and dependent, dashed while waiting, solid (2px) once done. Step detail redraws the same idea locally: what it needs on the left, the step as a node in the middle, what it unlocks on the right.

### Deadline scale (Chart)
A card with a short horizontal day scale marking landing, today and the due day, a filled span to the deadline, and a hand note ("N days left", "done in time", "past the deadline: ask an advisor").

### Source card
16px radius, Hairline border, a 28px round mark (indigo check when verified, red alert when not), source name, "Official source · verified <date>" in indigo or "Not verified yet" in red. Unverified cards use a dashed red border at 50%.

### Navigation (in scope)
- **Tabs (step detail):** 14px semibold, 2px Ink underline for the selected tab, Ink Soft otherwise, on a Hairline baseline.
- **Design switch:** a small pill segmented control, Ink fill on the active segment.

### Minimal list row
Hairline-divided row: 20px status circle (same states as Chart, smaller), 15px title, a 13px line for "After ..." and the deadline (red when overdue), "In progress" in indigo, a chevron in Ink Soft. Progress is a 4px Mist track with an indigo fill.

## Do's and Don'ts

### Do:
- **Do** keep green for done, red for risk (missed deadline, unverified source, official warning) and indigo for the route and attention.
- **Do** use dashed strokes for "not yet" (open dependency, blocked step, disabled action, unverified source) and turn them solid when the condition is met.
- **Do** put a source line with its verified date on every step, and say "No verified official source yet" when there is none.
- **Do** use Archivo's width axis for hierarchy: wdth 75-80 for the scale, normal for reading, 106-115 at 800 for the one headline.
- **Do** keep hand notes short, 22px, indigo or red, and about order or time.
- **Do** keep Minimal to the system face, hairline rows and one indigo accent, with the same content and states as Chart.

### Don't:
- **Don't** replace the rail and arcs with a progress ring or percentage donut.
- **Don't** add shadows to cards, rows or buttons; the today marker's glow is the only one.
- **Don't** use the hand face for headings, body copy, buttons or labels.
- **Don't** use green for anything not finished, or red for emphasis.
- **Don't** bring contours, the rail, the hand face or condensed caps into Minimal.
- **Don't** put small uppercase tracked labels above headings; uppercase condensed caps belong only to the rail's scale and phase headings.
