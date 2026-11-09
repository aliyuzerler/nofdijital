---
name: database-and-drizzle
description: Design and implement PostgreSQL schema, Drizzle migrations, seeds, repositories, indexes and backup-safe data operations.
---
# Database & Drizzle Skill
- PostgreSQL standard types and features first; avoid vendor lock-in.
- Drizzle schema + checked-in migrations; never push schema from production app startup.
- Runtime pooled URL; migration/export unpooled URL.
- Foreign keys, unique constraints, indexes, timestamps, status checks.
- Parameterized queries; no concatenated SQL from input.
- Idempotent seed for source HTML services, process steps, categories, posts and 14 gallery images.
- Keep rich content in structured Tiptap JSON, not arbitrary mega JSON page blobs.
- Public queries filter `published` and effective `published_at`.
- Test migration from empty DB and backup restore compatibility.
