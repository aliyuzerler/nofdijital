---
name: security-review
description: Review authentication, authorization, XSS, CSRF, uploads, secrets, injection, headers, rate limiting and privacy.
---
# Security Review Skill
- Authenticate and authorize every server mutation and private read.
- Client-side route hiding is never authorization.
- Apply Zod validation, Drizzle parameterized queries and rich-text allowlisting/sanitization.
- Protect cookie-authenticated state changes against CSRF; keep strict Origin checks.
- Rate limit admin login, contact form, search and upload.
- Check IDOR, role escalation, open redirects, SSRF, path traversal and public draft leakage.
- Secrets must not be logged, committed, returned to clients or prefixed with NEXT_PUBLIC_.
- Uploads require MIME+magic byte+size+dimension validation; SVG is off by default.
- Configure CSP and security headers; review CORS and cookies.
- Report findings with severity, evidence, affected files and remediation.
