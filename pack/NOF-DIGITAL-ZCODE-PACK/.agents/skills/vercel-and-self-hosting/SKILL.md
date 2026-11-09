---
name: vercel-and-self-hosting
description: Deploy NOF DİJİTAL to Vercel with Neon and Blob, then preserve a tested Docker/VPS migration path.
---
# Vercel & Self-hosting Skill
- Keep Preview and Production environment variables and databases isolated.
- Neon Marketplace Postgres: pooled runtime connection; unpooled migration/export connection.
- Vercel Blob is one adapter behind StorageProvider.
- Use Next.js standalone output and multi-stage non-root Dockerfile.
- Provide local Postgres + MinIO compose for reproducible development.
- Document `pg_dump`/`pg_restore`, media copy/checksum, env cutover, DNS and rollback.
- VPS uses reverse proxy, TLS, private DB, firewall and automated offsite backups.
- Confirm platform-specific behavior (ISR/cache, image optimization, cron) before migration.
