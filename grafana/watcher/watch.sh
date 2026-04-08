#!/usr/bin/env bash
# @author Claude Sonnet 4.6 Anthropic
# Polls the Grafana API and exports any changed dashboards to /dashboards as JSON files.

GRAFANA_URL="${GRAFANA_URL:-http://grafana:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin}"
OUT_DIR="/dashboards"
POLL_INTERVAL="${POLL_INTERVAL:-10}"

gf_get() {
  curl -sf -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" "${GRAFANA_URL}$1"
}

echo "Dashboard watcher started — polling every ${POLL_INTERVAL}s"

until gf_get "/api/health" | jq -e '.database == "ok"' > /dev/null 2>&1; do
  echo "Waiting for Grafana to be ready..."
  sleep 3
done
echo "Grafana ready"

while true; do
  uids=$(gf_get "/api/search?type=dash-db&limit=100" 2>/dev/null | jq -r '.[].uid' 2>/dev/null)

  for uid in $uids; do
    dashboard=$(gf_get "/api/dashboards/uid/${uid}" 2>/dev/null | jq '.dashboard' 2>/dev/null)
    [ -z "$dashboard" ] || [ "$dashboard" = "null" ] && continue

    title=$(echo "$dashboard" | jq -r '.title')
    filename=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')
    outfile="${OUT_DIR}/${filename}.json"

    new_hash=$(echo "$dashboard" | jq -cS . | md5sum | cut -d' ' -f1)
    old_hash=$(jq -cS . "$outfile" 2>/dev/null | md5sum | cut -d' ' -f1)

    if [ "$new_hash" != "$old_hash" ]; then
      echo "$dashboard" | jq . > "$outfile"
      echo "[$(date +%H:%M:%S)] Exported: ${title} -> ${filename}.json"
    fi
  done

  sleep "$POLL_INTERVAL"
done
