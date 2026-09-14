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
SOURCE_DB="${SOURCE_DATABASE:-optimizer_backup_test}"
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

if [[ "$SOURCE_DB" == "$RESTORE_DB" ]]; then
  echo "Refusing backup/restore drill: source and restore databases must differ" >&2
  exit 2
fi

mkdir -p "$BACKUP_DIR"

pg_container() {
  docker run --rm --network host     -e PGPASSWORD="$PGPASSWORD"     "$@"
}

drop_database() {
  local database_name="$1"
  pg_container postgres:16 dropdb     --if-exists     -h "$PGHOST"     -p "$PGPORT"     -U "$PGUSER"     "$database_name" >/dev/null 2>&1 || true
}

cleanup() {
  drop_database "$RESTORE_DB"
  drop_database "$SOURCE_DB"
  rm -f "$BACKUP_FILE"
}
trap cleanup EXIT

drop_database "$SOURCE_DB"
drop_database "$RESTORE_DB"

pg_container postgres:16 createdb   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   "$SOURCE_DB"

SOURCE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$SOURCE_DB"
DATABASE_URL="$SOURCE_URL" node --input-type=module -e "
  const { createDatabase } = await import('./dist/persistence/database.js');
  const database = createDatabase(process.env.DATABASE_URL);
  try {
    await database.migrate();
  } finally {
    await database.close();
  }
"

pg_container postgres:16 psql   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   -d "$SOURCE_DB"   -v ON_ERROR_STOP=1   -c "insert into organizations (id, name, reporting_currency, timezone, materiality_target, retention_days) values ('restore-org', 'Restore Drill Org', 'USD', 'UTC', '100', 90);"   -c "insert into users (id, email, auth_provider, auth_subject) values ('restore-user', 'restore@example.test', 'restore-drill', 'restore-user');"   -c "insert into memberships (organization_id, user_id, role) values ('restore-org', 'restore-user', 'OWNER');"   -c "insert into telemetry_credentials (id, organization_id, label, secret_hash, created_by_user_id) values ('restorecredential000000000000000000', 'restore-org', 'restore-agent', repeat('a', 64), 'restore-user');"   -c "insert into rate_limit_windows (organization_id, scope_key, window_start, request_count) values ('restore-org', 'credential:restore', '2026-09-14T00:00:00Z', 3);"

pg_container   -v "$BACKUP_DIR:/backup"   postgres:16   pg_dump   -h "$PGHOST"   -p "$PGPORT"   -U "$PGUSER"   -d "$SOURCE_DB"   --format=custom   --no-owner   --file=/backup/optimizer.dump

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
  pilot_invoice_requests
  design_partner_permissions
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

restored_org="$(
  pg_container postgres:16 psql     -h "$PGHOST"     -p "$PGPORT"     -U "$PGUSER"     -d "$RESTORE_DB"     -Atc "select name from organizations where id = 'restore-org';"
)"

if [[ "$restored_org" != "Restore Drill Org" ]]; then
  echo "Restored sentinel organization is missing or incorrect" >&2
  exit 1
fi

migration_table="$(
  pg_container postgres:16 psql     -h "$PGHOST"     -p "$PGPORT"     -U "$PGUSER"     -d "$RESTORE_DB"     -Atc "select to_regclass('drizzle.__drizzle_migrations');"
)"

if [[ -z "$migration_table" ]]; then
  echo "Restored database is missing Drizzle migration history" >&2
  exit 1
fi

echo "Backup/restore drill passed for $SOURCE_DB -> $RESTORE_DB"
