---
name: performance-optimization
description: Optimize public NOF DİJİTAL pages for Web Vitals, images, fonts, JavaScript, database queries and animation cost without visual changes.
---
# Performance Optimization Skill
- Measure first; preserve visual parity.
- Server Components by default; keep admin/editor chunks out of public routes.
- Use next/image, responsive sizes, dimensions and lazy loading below the fold.
- Do not embed large Base64 images in HTML/JS.
- Optimize font loading without changing visual metrics.
- Reuse IntersectionObserver, throttle expensive scroll/resize work, pause canvas offscreen.
- Honor reduced motion.
- Add indexes and avoid N+1; paginate blog server-side.
- Revalidate only affected content after publishing.
- Target CWV at p75: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; report actual field/lab data.
