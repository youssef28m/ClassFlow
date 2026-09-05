#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/../logs}"
LOG_FILE="$LOG_DIR/cloud-backup.log"
mkdir -p "$LOG_DIR"

RCLONE_BIN="${RCLONE_BIN:-$HOME/bin/rclone}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
RCLONE_PATH="${RCLONE_PATH:-ClassFlow/backups}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
  echo "$*"
}

NOTIFY=0
if command -v notify-send >/dev/null 2>&1 && [[ -n "${DISPLAY:-}" || -n "${WAYLAND_DISPLAY:-}" ]]; then
  NOTIFY=1
fi

if [[ ! -x "$RCLONE_BIN" ]]; then
  log "ERROR: rclone not found at $RCLONE_BIN"
  exit 1
fi

if ! "$RCLONE_BIN" listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE}:$"; then
  log "ERROR: rclone remote '$RCLONE_REMOTE' not configured. Run: $RCLONE_BIN config"
  exit 1
fi

db_output="$(bash "$SCRIPT_DIR/backup-db.sh")"
echo "$db_output"
local_file="$(echo "$db_output" | grep -oE 'classflow_[0-9_]+\.sql\.gz' | head -1)"
local_path="$SCRIPT_DIR/../backups/$local_file"

if [[ -z "$local_file" || ! -f "$local_path" ]]; then
  log "ERROR: backup failed or file not found."
  exit 1
fi

REMOTE_URI="${RCLONE_REMOTE}:${RCLONE_PATH}/$(basename "$local_path")"
log "Uploading $local_file to $REMOTE_URI"
CONFIG_ARG=()
if [[ -n "${RCLONE_CONFIG:-}" ]]; then
  CONFIG_ARG=(--config "$RCLONE_CONFIG")
fi

if "$RCLONE_BIN" "${CONFIG_ARG[@]}" copy "$local_path" "${RCLONE_REMOTE}:${RCLONE_PATH}/" >> "$LOG_FILE" 2>&1; then
  log "Upload complete: $local_file"
else
  log "ERROR: upload failed."
  [[ $NOTIFY -eq 1 ]] && notify-send -a "ClassFlow Backup" -u critical "Cloud backup FAILED" "Upload to Google Drive failed. See $LOG_FILE" 2>/dev/null
  exit 1
fi

log "Pruning cloud backups older than 7 days..."
"$RCLONE_BIN" "${CONFIG_ARG[@]}" delete --min-age 7d "${RCLONE_REMOTE}:${RCLONE_PATH}/" --include 'classflow_*.sql.gz' >> "$LOG_FILE" 2>&1 || true

[[ $NOTIFY -eq 1 ]] && notify-send -a "ClassFlow Backup" -u normal "Backup uploaded to Google Drive" "$local_file" 2>/dev/null

log "Done."
