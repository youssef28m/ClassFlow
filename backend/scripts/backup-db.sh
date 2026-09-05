#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_USER="${POSTGRES_USER:-classflow}"
DB_NAME="${POSTGRES_DB:-classflow}"
COMPOSE_PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --restore <file>   Restore from a backup file (.sql or .sql.gz)"
  echo "  --list             List available backups"
  echo "  -h, --help         Show this help"
  exit 0
}

list_backups() {
  echo "Available backups in $BACKUP_DIR:"
  echo ""
  if ls "$BACKUP_DIR"/*.sql.gz 1>/dev/null 2>&1; then
    ls -lht "$BACKUP_DIR"/*.sql.gz
  elif ls "$BACKUP_DIR"/*.sql 1>/dev/null 2>&1; then
    ls -lht "$BACKUP_DIR"/*.sql
  else
    echo "  No backups found."
  fi
}

check_docker() {
  if ! command -v docker &>/dev/null; then
    echo "Error: docker is not installed." >&2
    exit 1
  fi

  local container_status
  container_status="$(docker compose -f "$COMPOSE_PROJECT_DIR/docker-compose.yml" ps db --format '{{.State}}' 2>/dev/null || true)"

  if [[ "$container_status" != "running" ]]; then
    echo "Error: db container is not running (status: ${container_status:-not found})." >&2
    echo "Start it with: docker compose up -d db" >&2
    exit 1
  fi
}

do_backup() {
  check_docker

  mkdir -p "$BACKUP_DIR"

  local backup_file="$BACKUP_DIR/classflow_${TIMESTAMP}.sql.gz"

  echo "Creating backup: $backup_file"
  docker compose -f "$COMPOSE_PROJECT_DIR/docker-compose.yml" exec -T db \
    pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges \
    | gzip > "$backup_file"

  local size
  size="$(du -h "$backup_file" | cut -f1)"
  echo "Backup completed: $backup_file ($size)"

  echo ""
  echo "Cleaning up backups older than $RETENTION_DAYS days..."
  local count
  count="$(find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -type f | wc -l)"
  find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -type f -delete
  echo "Deleted $count old backup(s)."
}

do_restore() {
  local restore_file="$1"

  if [[ ! -f "$restore_file" ]]; then
    echo "Error: file not found: $restore_file" >&2
    exit 1
  fi

  check_docker

  echo "WARNING: This will overwrite the current database '$DB_NAME'." >&2
  read -r -p "Are you sure? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Restore cancelled."
    exit 0
  fi

  echo "Restoring from: $restore_file"
  if [[ "$restore_file" == *.gz ]]; then
    gunzip -c "$restore_file" | docker compose -f "$COMPOSE_PROJECT_DIR/docker-compose.yml" exec -T db \
      psql -U "$DB_USER" -d "$DB_NAME" -q
  else
    docker compose -f "$COMPOSE_PROJECT_DIR/docker-compose.yml" exec -T db \
      psql -U "$DB_USER" -d "$DB_NAME" -q < "$restore_file"
  fi

  echo "Restore completed."
}

# --- Main ---

case "${1:-}" in
  -h|--help)   usage ;;
  --list)      list_backups ;;
  --restore)
    if [[ -z "${2:-}" ]]; then
      echo "Error: --restore requires a file path." >&2
      exit 1
    fi
    do_restore "$2"
    ;;
  "")          do_backup ;;
  *)           echo "Unknown option: $1" >&2; usage ;;
esac
