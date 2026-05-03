#!/usr/bin/env bash
# 一键启动 / 停止：dockerBot:8080 → clientCoder+Nginx:5371 → phoneCoder Web:3000
#
# 用法：
#   ./scripts/docker-stack.sh          # 后台构建并启动（默认）
#   ./scripts/docker-stack.sh up       # 同上（显式）
#   ./scripts/docker-stack.sh fg       # 前台附加日志
#   ./scripts/docker-stack.sh down     # 停止并移除本 compose 创建的容器
#   ./scripts/docker-stack.sh logs ... # 其余参数透传给 docker compose logs
#
# 前置：已安装 Docker 与 Compose v2；.env 位于 webCursor/dockerBot/（脚本可从同目录 .env.example 生成）。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKERBOT_DIR="${HERE}/dockerBot"

log() { printf '\033[1;36m[docker-stack]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[docker-stack]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[docker-stack]\033[0m %s\n' "$*" >&2; exit 1; }

set_env_default() {
  local key=$1 value=$2
  local f="${DOCKERBOT_DIR}/.env"
  if grep -qE "^${key}=" "$f" 2>/dev/null; then
    return
  fi
  printf '\n%s=%s\n' "$key" "$value" >>"$f"
  log "已写入 ${key}=${value}"
}

command -v docker >/dev/null 2>&1 || die "未找到 docker"
docker compose version >/dev/null 2>&1 || die "未找到 docker compose（v2）"
docker info >/dev/null 2>&1 || die "Docker 不可用，请先启动 Docker"

cd "$HERE"

COMPOSE_FILES=(-f docker-compose.stack.yml)
COMPOSE_PROJECT=(-p webcursor-stack)

compose() {
  docker compose "${COMPOSE_PROJECT[@]}" "${COMPOSE_FILES[@]}" "$@"
}

subcmd="${1:-up}"

if [[ "$subcmd" == "logs" ]] || [[ "$subcmd" == "ps" ]] || [[ "$subcmd" == "config" ]]; then
  shift || true
  log "docker compose ${subcmd} $*"
  exec compose "${subcmd}" "$@"
fi

if [[ "$subcmd" == "down" ]] || [[ "$subcmd" == "stop" ]]; then
  log "停止栈…"
  exec compose down
fi

# --- 准备 dockerBot/.env（与 dockerBot/scripts/start.sh 行为对齐） ---
if [[ ! -f "${DOCKERBOT_DIR}/.env" ]]; then
  [[ -f "${DOCKERBOT_DIR}/.env.example" ]] \
    || die "缺少 ${DOCKERBOT_DIR}/.env.example（请先把完整 dockerBot 放入 webCursor/dockerBot）"
  cp "${DOCKERBOT_DIR}/.env.example" "${DOCKERBOT_DIR}/.env"
  log "已从 .env.example 创建 dockerBot/.env"
fi

if grep -qE '^PHONEBOT_ENCRYPTION_KEY=(replace-me|replace-me-with-openssl-rand-hex-32)\s*$' "${DOCKERBOT_DIR}/.env" 2>/dev/null; then
  command -v openssl >/dev/null 2>&1 || die "需要 openssl 以自动生成 PHONEBOT_ENCRYPTION_KEY"
  KEY=$(openssl rand -hex 32)
  if sed --version >/dev/null 2>&1; then
    sed -i -E "s|^PHONEBOT_ENCRYPTION_KEY=.*$|PHONEBOT_ENCRYPTION_KEY=${KEY}|" "${DOCKERBOT_DIR}/.env"
  else
    sed -i '' -E "s|^PHONEBOT_ENCRYPTION_KEY=.*$|PHONEBOT_ENCRYPTION_KEY=${KEY}|" "${DOCKERBOT_DIR}/.env"
  fi
  log "已自动生成 PHONEBOT_ENCRYPTION_KEY"
fi

if ! grep -qE '^PHONEBOT_ENCRYPTION_KEY=[0-9a-fA-F]{64}\s*$' "${DOCKERBOT_DIR}/.env"; then
  die "PHONEBOT_ENCRYPTION_KEY 必须为 64 位十六进制。请执行：openssl rand -hex 32"
fi

command -v id >/dev/null 2>&1 && set_env_default "PHONEBOT_AGENT_UID" "$(id -u)"

mkdir -p "${DOCKERBOT_DIR}/data/projects" "${DOCKERBOT_DIR}/data/claude-home" "${DOCKERBOT_DIR}/data/traefik/letsencrypt"

PHONEBOT_AGENT_UID="$(grep -E '^PHONEBOT_AGENT_UID=' "${DOCKERBOT_DIR}/.env" | tail -n1 | cut -d= -f2-)"
export PHONEBOT_AGENT_UID="${PHONEBOT_AGENT_UID:-$(id -u)}"

log "启动顺序：dockerbot-agent → dockerbot-api → clientcoder-nginx → phonecoder-web"

case "$subcmd" in
fg|foreground)
  exec compose up --build
  ;;
up)
  compose up --build -d
  log "就绪："
  log "  - dockerBot API:     http://127.0.0.1:8080/api"
  log "  - clientCoder (代理): http://127.0.0.1:5371 （/api → dockerBot）"
  log "  - phoneCoder Web:    http://127.0.0.1:3000 （设置里 dockerBot API 指向 http://<宿主机>:8080/api）"
  ;;
*)
  die "未知子命令: ${subcmd}（可用: up, fg, down, logs …）"
  ;;
esac
