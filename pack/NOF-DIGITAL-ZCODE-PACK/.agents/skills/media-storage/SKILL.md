---
name: media-storage
description: Implement secure media library and provider-neutral uploads for Vercel Blob now and S3/MinIO later.
---
# Media Storage Skill
- Use a `StorageProvider` interface and provider-specific adapters.
- Store provider + object key + checksum in DB; do not hardwire Blob URLs into domain entities.
- Vercel Blob write token is server-only.
- Validate user role, max size, MIME and file magic bytes, decoded image dimensions and pixel count.
- Default allow JPEG, PNG, WebP, AVIF; SVG/HTML disabled unless separately sanitized and reviewed.
- Generate random storage keys; never trust client filenames as paths.
- Store alt text, title, width/height, caption and usage relationships.
- Block deletion while referenced; allow explicit replace/relink flow.
- Verify migration by checksumming exported files.
