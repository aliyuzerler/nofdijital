---
name: design-fidelity
description: Port the provided NOF DİJİTAL HTML reference without redesign; use for public UI, CSS, responsive layout, animations and visual regression.
---
# Design Fidelity Skill
1. Read `reference/nof_digital.html` and `docs/01-DESIGN-FIDELITY.md` first.
2. Treat reference DOM/CSS/assets and behavior as approved truth, not inspiration.
3. Extract exact computed styles/measurements rather than guessing.
4. Keep source logo/gallery order from `reference-assets/asset-manifest.json`.
5. Capture same viewport screenshots before and after each meaningful UI change.
6. Do not introduce new colors, gradients, shadows, radii, fonts or spacing without explicit approval.
7. Keep breakpoints 1024px and 700px unless measured source proves more.
8. Verify reduced-motion, keyboard interactions, alt text and focus without changing layout.
9. Report pixel/geometry differences and fix them before proceeding.
