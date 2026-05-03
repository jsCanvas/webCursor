---
name: fullstack-scaffold
description: Scaffold a full-stack project (frontend + backend + db) following dockerBot conventions. Use when the user asks to build a complete app from scratch.
---

# Fullstack Scaffold

When asked to build a full-stack app, follow these conventions so the runtime / preview / deploy pipelines just work.

## Required Layout

```
<project-root>/
├── frontend/                # Web app (Next.js / Vite / etc.)
│   └── Dockerfile           # Multi-stage build, EXPOSE matches PORT label
├── backend/                 # API server (Nest / FastAPI / Express / etc.)
│   └── Dockerfile
├── db/                      # If self-managed; else use upstream image
│   └── init.sql
├── docker-compose.yml       # MUST be at root
└── .env.example             # All env vars used by services
```

## docker-compose.yml Conventions

- **The service exposed externally MUST be named `app`** (typically the frontend or a reverse-proxy service).
- All other services use the `default` network only — never expose ports outside compose.
- Every service has restart `unless-stopped`.
- `app` service includes Traefik labels per `docker-runtime` skill.
- Use named volumes for DB data: `pgdata:/var/lib/postgresql/data`.

## Coding Standards

- Frontend: TypeScript, ESLint, mobile-first responsive.
- Backend: TypeScript, env via `process.env`, structured JSON logging.
- DB: Postgres unless user requests otherwise.
- Migrations: SQL files numbered `001_*.sql` in `backend/migrations/`.

## After Generating

1. Provide a short README at the project root describing how to run.
2. Commit logically grouped changes; do NOT commit secrets.
3. Stop and ask if the user wants `runtime up` next.
