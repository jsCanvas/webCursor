# syntax=docker/dockerfile:1.7

# Long-lived sandbox container.
# dockerBot API spawns `claude` (via claude-code-router) inside this container
# using `docker exec -i` and stream-json over stdio.
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      git \
      curl \
      ca-certificates \
      python3 \
      python3-pip \
      docker.io \
      openssh-client \
      jq \
      tini \
 && rm -rf /var/lib/apt/lists/*

# Claude Code SDK CLI + community Anthropic <-> OpenAI bridge
RUN npm install -g \
      @anthropic-ai/claude-code \
      @musistudio/claude-code-router

WORKDIR /workspace

# Claude Code refuses bypassPermissions when uid=0. Keep the sandbox
# non-root while preserving host bind-mount write access via a host-matched UID.
# node:20-bookworm-slim already owns UID 1000 as user `node`; drop it before useradd.
ARG PHONEBOT_AGENT_UID=1000
RUN set -eu \
 && existing="$(getent passwd "${PHONEBOT_AGENT_UID}" | cut -d: -f1 || true)" \
 && if [ -n "${existing}" ] && [ "${existing}" != "phonebot" ]; then userdel "${existing}"; fi \
 && if ! getent passwd phonebot >/dev/null; then \
      useradd \
        --uid "${PHONEBOT_AGENT_UID}" \
        --gid 0 \
        --home-dir /home/phonebot \
        --create-home \
        --shell /bin/bash \
        phonebot; \
    fi \
 && mkdir -p /home/phonebot/.claude /home/phonebot/.claude-code-router /workspace \
 && chown -R phonebot:root /home/phonebot /workspace

# Persist claude session history under the non-root user's home (bind mounted).
ENV HOME=/home/phonebot
USER phonebot

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sleep", "infinity"]
