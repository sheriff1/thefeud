#!/bin/bash
# Count Vercel deployments for the whole team over the last 24h (#99).
# The free plan allows 100 per rolling 24h, shared across ALL projects on the team.
# Needs the Vercel CLI, logged in (`vercel login`), and jq. Prints only counts.
# Usage: scripts/vercel-deploy-count.sh [hours]   (default 24)
set -euo pipefail

HOURS="${1:-24}"
SINCE=$(( ($(date +%s) - HOURS * 3600) * 1000 ))
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

UNTIL=""
# Follow pagination.next (each page is up to 100 deployments); cap at 20 pages.
for _ in $(seq 1 20); do
  URL="/v6/deployments?since=$SINCE&limit=100"
  [ -n "$UNTIL" ] && URL="$URL&until=$UNTIL"
  PAGE=$(vercel api "$URL")
  echo "$PAGE" | jq -r '.deployments[] | "\(.name) \(.source // "unknown") \(.target // "preview") \(.state)"' >> "$TMP"
  UNTIL=$(echo "$PAGE" | jq -r '.pagination.next // empty')
  [ -z "$UNTIL" ] && break
done

TOTAL=$(wc -l < "$TMP" | tr -d ' ')
echo "Team deployments in the last ${HOURS}h: $TOTAL (free-plan limit: 100 per rolling 24h)"
echo
echo "By project:"
awk '{print $1}' "$TMP" | sort | uniq -c | sort -rn
echo
echo "By project / source / target:"
awk '{print $1, $2, $3}' "$TMP" | sort | uniq -c | sort -rn
