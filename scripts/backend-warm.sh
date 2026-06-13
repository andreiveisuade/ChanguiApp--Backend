#!/usr/bin/env bash
#
# backend-warm.sh — mantiene despierto el backend de ChanguiApp en Render (free tier),
# que se duerme tras ~15 min sin tráfico. Pinguea /health en loop hasta que lo apagues.
#
#   ./backend-warm.sh start    # prende el keep-warm (corre en background)
#   ./backend-warm.sh stop     # lo apaga
#   ./backend-warm.sh status   # muestra si está corriendo + últimos pings
#   ./backend-warm.sh ping     # un ping suelto, sin background
#
# Config opcional por env:
#   WARM_URL       (default backend de prod)
#   WARM_INTERVAL  segundos entre pings (default 600 = 10 min)
#
set -euo pipefail

URL="${WARM_URL:-https://changuiapp-backend.onrender.com/health}"
INTERVAL="${WARM_INTERVAL:-600}"
PIDFILE="/tmp/changui-backend-warm.pid"
LOGFILE="/tmp/changui-backend-warm.log"

is_running() {
  [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

ping_once() {
  local ts code
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 40 "$URL" 2>/dev/null || echo 'ERR')
  echo "$ts  $URL -> $code"
}

start() {
  if is_running; then
    echo "ya está corriendo (pid $(cat "$PIDFILE"))"
    return 0
  fi
  nohup bash -c '
    while true; do
      ts=$(date "+%Y-%m-%d %H:%M:%S")
      code=$(curl -fsS -o /dev/null -w "%{http_code}" --max-time 40 "'"$URL"'" 2>/dev/null || echo "ERR")
      echo "$ts  '"$URL"' -> $code"
      sleep '"$INTERVAL"'
    done
  ' >> "$LOGFILE" 2>&1 &
  echo $! > "$PIDFILE"
  echo "keep-warm ON (pid $(cat "$PIDFILE")) — ping cada ${INTERVAL}s a $URL"
  echo "log: $LOGFILE"
}

stop() {
  if is_running; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
    echo "keep-warm OFF"
  else
    rm -f "$PIDFILE"
    echo "no estaba corriendo"
  fi
}

status() {
  if is_running; then
    echo "ON (pid $(cat "$PIDFILE")) — ping cada ${INTERVAL}s"
    echo "--- últimos pings ---"
    tail -n 3 "$LOGFILE" 2>/dev/null || echo "(sin log todavía)"
  else
    echo "OFF"
  fi
}

case "${1:-}" in
  start|on)   start ;;
  stop|off)   stop ;;
  status)     status ;;
  ping)       ping_once ;;
  *) echo "uso: $0 {start|stop|status|ping}"; exit 1 ;;
esac
