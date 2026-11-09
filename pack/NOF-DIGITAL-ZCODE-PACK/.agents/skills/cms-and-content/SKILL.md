---
name: cms-and-content
description: Implement admin dashboard, blog CRUD, Tiptap content editing, homepage section management, publishing, revisions and SEO fields.
---
# CMS & Content Skill
- Provide secure owner/editor RBAC; no public account creation.
- Build clear CRUD and lifecycle states: draft, scheduled, published, archived.
- Store editor JSON; render only an allowlisted schema with HTML sanitization.
- Admin can manage every source HTML homepage section's text, CTA, visibility and allowed ordering.
- Admin must not freely alter layout markup/grid definitions.
- Preview is authenticated, signed, short-lived and uncached publicly.
- Publish operations create revision/audit events and invalidate only relevant cache tags/paths.
- Preserve source sample content; mark template blog body as draft/review.
