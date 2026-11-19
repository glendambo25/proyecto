---
version: 1
slug: "app-tasks-page-tsx"
primary_target: "app/tasks/page.tsx"
related_targets: ["app/onboarding/page.tsx","app/tasks/[id]/page.tsx"]
---

Scope: onboarding, checklist (/tasks) and step detail (/tasks/[id]). Mode: operate. Office view and plans untouched (rebuilt in later sprints).
Audience: non-EU student arriving in Spain; must do steps in order and on time, often stressed, on a phone.
Two directions built side by side behind a switch, founder's request: "Arrival chart" (creative) and "Minimal" (Álvaro's preference). Palette pinned by the founder: white, ink #111827, indigo #4f46e5, green #16a34a.

## Direction contract

THESIS: The arrival is charted against time, like a coastal chart charts height: a day rail measures where the student stands relative to landing, and every step sits at its place on it. Refuses the category's progress-ring checklist.
OWN-WORLD: White ground with faint indigo contour lines; ink #111827 type in Archivo (condensed caps for the scale, normal width for reading); indigo #4f46e5 for the route, rail and dependency arcs; green #16a34a only for done; red only for a changed source or a missed deadline; handwritten annotations in a pen face for blockers and deadlines.
STORY: The student sees how many days to (or since) landing, which step is next and what it waits for; taps it; reads the official source and date; marks it done and sees the arcs it unlocks turn solid.
FIRST VIEWPORT: Left: a vertical day rail with a readout (e.g. "+64 DAYS since landing") and a marker at today. Right: the step list ordered by dependency, each node joined to its prerequisites by indigo arcs in the gutter; the next step annotated by hand. Primary action: the next step row.
FORM: builder-chosen chart world (not a founder pin): the founder pinned the palette and the register ("much more creative" + a minimalist sibling) and cited the coastal-chart page only as a level of creativity. This world borrows that reference's devices (a measured rail, contour ground, hand annotation) and applies them to time instead of altitude. Roll on record: seed:65f8295c9c43740c (its assigned direction and sketches were rejected by the founder).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: marking a step done redraws its outgoing arcs from dashed to solid and moves the rail marker.
Minimal sibling: same content and functions, system UI face, hairline rows, one indigo accent, no ornament.
