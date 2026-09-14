#!/usr/bin/env bash
set -euo pipefail

if [[ "${ALLOW_DESTRUCTIVE_RESTORE_DRILL:-}" != "true" ]]; then
  echo "Refusing restore drill without ALLOW_DESTRUCTIVE_RESTORE_DRILL=true" >&2
  exit 2
fi

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
SOURCE_DB="${PGDATABASE:-optimizer_test}"
RESTORE_DB="${RESTORE_DATABASE:-optimizer_restore}"
BACKUP_DIR="${BACKUP_DIR:-$PWD/.tmp-backup-drill}"
BACKUP_FILE="$BACKUP_DIR/optimizer.dump"

case "$SOURCE_DB" in
  *_test) ;;
  *)
    echo "Refusing backup/restore drill: source database must end with _test" >&2
    exit 2
    ;;
esac

case "$RESTORE_DB" in
  *_restore) ;;
  *)
    echo "Refusing backup/restore drill: restore database must end with _restore" >&2
    exit 2
    ;;
esac

mkdir -p "$BACKUP_DIR"

pg_container() {
  docker run --rm --network host     -e PGPASSWORD="$PGPASSWORD"     "$@"
}

cleanup() {
  pg_container postgres:16 dropdb     --if-exists     -h "$PGHOST"     -p "$PGPORT"     -U "$PGUSER"     "$RESTORE_DB" >/dev/null 2>&1 || true
  rm -f "$BACKUP_FILE"
}
trap cleanup EXIT

pg_container   -v "$BACKUP_DIR:/backup"   postgres:16   pg_dump   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   -d "$SOURCE_DB"   --format=custom   --no-owner   --file=/backup/optimizer.dump

pg_container postgres:16 dropdb   --if-exists   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   "$RESTORE_DB"

pg_container postgres:16 createdb   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   "$RESTORE_DB"

pg_container   -v "$BACKUP_DIR:/backup"   postgres:16   pg_restore   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   -d "$RESTORE_DB"   --no-owner   /backup/optimizer.dump

critical_tables=(
  organizations
  memberships
  usage_records
  recommendations
  ledger_events
  implementation_records
  verification_windows
  telemetry_credentials
  rate_limit_windows
)

for table in "${critical_tables[@]}"; do
  source_count="$(
    pg_container postgres:16 psql       -h "$PGHOST"       -p "$PGPORT"       -U "$PGUSER"       -d "$SOURCE_DB"       -Atc "select count(*) from \"$table\";"
  )"
  restored_count="$(
    pg_container postgres:16 psql       -h "$PGHOST"       -p "$PGPORT"       -U "$PGUSER"       -d "$RESTORE_DB"       -Atc "select count(*) from \"$table\";"
  )"

  if [[ "$source_count" != "$restored_count" ]]; then
    echo "Restore mismatch for $table: source=$source_count restored=$restored_count" >&2
    exit 1
  fi
done

migration_table="$(
  pg_container postgres:16 psql     -h "$PGHOST"     -p "$PGPORT"     -U "$PGUSER"     -d "$RESTORE_DB"     -Atc "select to_regclass('drizzle.__drizzle_migrations');"
)"

if [[ -z "$migration_table" ]]; then
  echo "Restored database is missing Drizzle migration history" >&2
  exit 1
fi

echo "Backup/restore drill passed for $SOURCE_DB -> $RESTORE_DB"
