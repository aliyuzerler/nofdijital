---
name: nextjs-architecture
description: Apply portable Next.js App Router, TypeScript, server/client boundaries, routing, caching and Docker architecture for NOF DİJİTAL.
---
# Next.js Architecture Skill
- Use App Router and Server Components by default.
- Restrict Client Components to actual browser interactions.
- Keep domain logic in server services, separated from provider SDKs.
- Use `server-only` for secrets/data modules.
- Use standard Node.js deployment; standalone Docker output.
- No Vercel-only APIs in business logic; use adapters around platform features.
- Use real `/blog/[slug]` paths and metadata APIs.
- Route/action mutations must enforce authentication and role authorization server-side.
- Add tests for cache invalidation, draft visibility, route status and redirects.
