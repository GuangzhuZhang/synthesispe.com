# Local template: comments service

This directory is a deployment-ready **template only**. No Cloudflare resource has been created.

Required author-controlled setup: create one Worker, one D1 database, one Turnstile site, set `TURNSTILE_SECRET`, bind D1 as `DB`, set the production origin, review retention and moderation policy, then apply `schema.sql`. Keep `COMMENTS_ENABLED=false` until moderation/export/restore tests pass.

Recommended secrets/variables: `TURNSTILE_SECRET`, `ADMIN_TOKEN`, `EMAIL_ENCRYPTION_KEY`, `ALLOWED_ORIGIN=https://synthesispe.com`, `COMMENTS_ENABLED=false`, `IP_HASH_SALT`, `MAX_POSTS_PER_HOUR=5`. If a reader supplies an email address, the Worker encrypts it with AES-GCM before D1 storage; the public API and exports exclude it.

Export: authenticated `GET /admin/export`; moderation queue: authenticated `GET /admin/queue`; moderation actions: authenticated `POST /admin/moderate`. Logs are append-only in `moderation_log`.
