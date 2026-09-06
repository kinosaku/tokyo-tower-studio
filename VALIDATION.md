# Validation · 验证记录

Validated on 2026-09-06 with Node 24.19.0.

- `npm run typecheck`: passed.
- `npm run build:demo`: passed; produces static HTML, CSS, JavaScript and the SVG favicon.
- `npm run validate:model`: passed against the actual procedural geometry source, using Three.js mesh geometry and transforms.
- 640 deterministic parts; unique IDs; finite transforms; positive solid dimensions and nonzero beams.
- Seven sections: foundation 39, legs 208, lower lattice 93, Main Deck 82, upper lattice 133, Top Deck 21, spire 64.
- Actual rendered mesh bounds: `[-0.496, 0, -0.496]` to `[0.496, 3.33, 0.496]`; 1 model unit equals 100 metres.
- Final exploded layout: 30 columns × 22 rows, 0.24-unit spacing, 0.33 piece scale. Zero bounding-box candidates and zero convex-mesh intersections.
- Static preview route returned HTTP 200. Build uses relative asset URLs for GitHub Pages under a repository path.

Code review also addressed dock overlap with desktop component lists, short landscape layouts, stale zoom-button distances, multitouch selection, unsupported fullscreen calls, reduced-motion transitions and camera distance limits.

Scope: these are type/build checks, geometry checks and source review. They are not a browser interaction test, screenshot review or frame-rate measurement. Optional WebMCP tools are feature-detected; no supported live WebMCP validation context was available, so registration and state transitions have not been verified in a supporting browser. Ordinary browser controls do not depend on WebMCP.
