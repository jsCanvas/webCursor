---
name: docker-runtime
description: Conventions for Dockerfiles and docker-compose so the project is reachable via Traefik subdomain preview. Use when writing or updating Dockerfile / compose.
---

# Docker Runtime

dockerBot launches the project's compose stack on the host docker daemon and routes a subdomain through Traefik. To make this work:

## Networks

Two networks per stack:

```yaml
networks:
  phonebot-traefik:
    external: true
  default:
    driver: bridge
```

## Externally-Exposed Service

Pick exactly one service to expose externally and name it `app`. Add ONLY these labels to that service:

```yaml
services:
  app:
    # ...
    networks: [phonebot-traefik, default]
    labels:
      - traefik.enable=true
      - traefik.docker.network=phonebot-traefik
      - traefik.http.routers.${SLUG}.rule=Host(`${SLUG}.${BASE_DOMAIN}`)
      - traefik.http.routers.${SLUG}.entrypoints=web
      - traefik.http.services.${SLUG}.loadbalancer.server.port=${PORT:-3000}
```

`SLUG`, `BASE_DOMAIN`, `PORT` will be substituted by dockerBot at `runtime up` time. Do not hardcode them.

## Internal Services (db, cache, etc.)

- Do NOT expose `ports:` (only `expose:` if needed).
- Stay on the `default` network.
- Use service names as hostnames (e.g. `postgres://db:5432/...`).

## Dockerfile Best Practices

- Multi-stage builds; final stage is a slim runtime image.
- Use `EXPOSE` matching the port advertised in the loadbalancer label.
- `HEALTHCHECK` for the `app` service — Traefik backs off unhealthy backends.
- Run as a non-root user when possible.

## Secrets

- Never bake secrets into images.
- Use `.env` referenced by `env_file: .env` in compose.
- dockerBot owns the `.env` file lifecycle for runtime configs.
