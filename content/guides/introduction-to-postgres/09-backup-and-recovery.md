---
title: Backup, Recovery, and Replication
description: Learn how to backup PostgreSQL databases, restore from backups, and set up replication for high availability
order: 9
---

**TLDR**: Use `pg_dump` for logical backups of individual databases. Use `pg_basebackup` for physical backups of entire clusters. Test restores regularly - backups are useless if you can't restore. Set up streaming replication for high availability. Enable point-in-time recovery with WAL archiving.

Data loss is catastrophic. Proper backups and recovery procedures protect your business.

## Logical Backups with pg_dump

pg_dump creates SQL scripts that recreate your database:

```bash
# Backup entire database
pg_dump dbname > backup.sql

# Backup with custom format (compressed, faster restore)
pg_dump -Fc dbname > backup.dump

# Backup specific tables
pg_dump -t users -t posts dbname > partial.sql

# Exclude specific tables
pg_dump --exclude-table=logs dbname > backup.sql

# Include only data (no schema)
pg_dump --data-only dbname > data.sql

# Include only schema (no data)
pg_dump --schema-only dbname > schema.sql
```

### Restoring from pg_dump

```bash
# Restore SQL format
psql dbname < backup.sql

# Restore custom format
pg_restore -d dbname backup.dump

# Restore to a new database
createdb newdb
pg_restore -d newdb backup.dump

# Restore specific tables
pg_restore -t users -d dbname backup.dump

# Restore with multiple jobs (faster)
pg_restore -j 4 -d dbname backup.dump
```

### Backup All Databases

```bash
# Backup all databases in cluster
pg_dumpall > all_databases.sql

# Restore
psql -f all_databases.sql postgres
```

pg_dumpall also backs up roles and tablespaces.

## Physical Backups with pg_basebackup

pg_basebackup copies the entire data directory:

```bash
# Create base backup
pg_basebackup -D /backup/postgres -Ft -z -P

# Options:
# -D: backup directory
# -Ft: tar format
# -z: compress with gzip
# -P: show progress
```

Physical backups are faster for large databases and enable point-in-time recovery.

### Restoring from Base Backup

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Restore data directory
rm -rf /var/lib/postgresql/16/main/*
tar -xzf backup.tar.gz -C /var/lib/postgresql/16/main/

# Start PostgreSQL
sudo systemctl start postgresql
```

## Continuous Archiving and Point-in-Time Recovery (PITR)

Archive Write-Ahead Log (WAL) files to recover to any point in time.

### Setup WAL Archiving

Edit `postgresql.conf`:

```ini
# Enable archiving
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'

# Or use a script for remote storage:
# archive_command = 'rsync -a %p user@backup-server:/archive/%f'
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

PostgreSQL now copies WAL files to `/archive/`.

### Create Base Backup for PITR

```bash
# Start backup
psql -c "SELECT pg_start_backup('daily_backup');"

# Copy data directory
rsync -a /var/lib/postgresql/16/main/ /backup/base/

# Stop backup
psql -c "SELECT pg_stop_backup();"
```

Or use pg_basebackup:

```bash
pg_basebackup -D /backup/base -Ft -z
```

### Restore to Point in Time

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Restore base backup
rm -rf /var/lib/postgresql/16/main/*
tar -xzf /backup/base/base.tar.gz -C /var/lib/postgresql/16/main/

# Create recovery.signal file
touch /var/lib/postgresql/16/main/recovery.signal

# Configure recovery in postgresql.conf
echo "restore_command = 'cp /archive/%f %p'" >> /var/lib/postgresql/16/main/postgresql.auto.conf
echo "recovery_target_time = '2024-02-14 14:30:00'" >> /var/lib/postgresql/16/main/postgresql.auto.conf

# Start PostgreSQL - it will replay WAL files
sudo systemctl start postgresql

# Check recovery
psql -c "SELECT pg_is_in_recovery();"

# Once recovered, remove recovery.signal to exit recovery mode
rm /var/lib/postgresql/16/main/recovery.signal
sudo systemctl restart postgresql
```

## Streaming Replication

Create read replicas for high availability and load distribution.

### Setup Primary Server

Edit `postgresql.conf`:

```ini
# Connection settings
listen_addresses = '*'
max_wal_senders = 3
wal_level = replica
```

Edit `pg_hba.conf`:

```
# Allow replication connections
host    replication     replicator      replica-ip/32       scram-sha-256
```

Create replication user:

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_password';
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Setup Replica Server

```bash
# Stop PostgreSQL on replica
sudo systemctl stop postgresql

# Remove existing data
rm -rf /var/lib/postgresql/16/main/*

# Create base backup from primary
pg_basebackup -h primary-ip -D /var/lib/postgresql/16/main -U replicator -P -v -R -X stream -C -S replica_slot

# Options:
# -R: create standby.signal and replication config
# -X stream: stream WAL while backing up
# -C -S: create replication slot

# Start replica
sudo systemctl start postgresql

# Verify replication
psql -c "SELECT * FROM pg_stat_replication;" # On primary
psql -c "SELECT pg_is_in_recovery();"         # On replica (should return true)
```

### Promote Replica to Primary

If primary fails:

```bash
# On replica
pg_ctl promote -D /var/lib/postgresql/16/main/

# Or in psql
SELECT pg_promote();
```

Replica becomes the new primary and accepts writes.

## Backup Strategies

### Daily Backups

```bash
#!/bin/bash
# daily_backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR=/backups/$DATE

mkdir -p $BACKUP_DIR

# Dump all databases
pg_dumpall -U postgres | gzip > $BACKUP_DIR/all_databases.sql.gz

# Also dump individual databases
for db in $(psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';")
do
    pg_dump -U postgres -Fc $db > $BACKUP_DIR/$db.dump
done

# Cleanup old backups (keep 30 days)
find /backups/ -type d -mtime +30 -exec rm -rf {} \;
```

Run daily with cron:

```
0 2 * * * /usr/local/bin/daily_backup.sh
```

### Backup to Cloud Storage

```bash
#!/bin/bash
# backup_to_s3.sh

DATE=$(date +%Y%m%d)
BACKUP_FILE="/tmp/backup_$DATE.dump"

# Create backup
pg_dump -Fc dbname > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://my-backups/postgres/$DATE/

# Cleanup local copy
rm $BACKUP_FILE
```

### Incremental Backups with WAL-E or pgBackRest

For large databases, use tools that support incremental backups:

**pgBackRest**:

```bash
# Install
sudo apt install pgbackrest

# Configure /etc/pgbackrest/pgbackrest.conf
[global]
repo1-path=/backup/pgbackrest
repo1-retention-full=4

[mydb]
pg1-path=/var/lib/postgresql/16/main

# Full backup
pgbackrest --stanza=mydb --type=full backup

# Incremental backup
pgbackrest --stanza=mydb --type=incr backup

# Restore
pgbackrest --stanza=mydb restore
```

## Testing Restores

**Critical**: Test your backups regularly. Untested backups are worthless.

```bash
# Monthly restore test
#!/bin/bash

# Create test database
createdb restore_test

# Restore latest backup
pg_restore -d restore_test /backups/latest.dump

# Run basic queries to verify
psql restore_test -c "SELECT COUNT(*) FROM users;"
psql restore_test -c "SELECT COUNT(*) FROM orders;"

# Drop test database
dropdb restore_test

echo "Restore test completed successfully"
```

Schedule this monthly and alert if it fails.

## Monitoring Replication

```sql
-- On primary: check replication status
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  sync_state
FROM pg_stat_replication;

-- On replica: check replication lag
SELECT
  now() - pg_last_xact_replay_timestamp() AS replication_lag;
```

Alert if lag exceeds acceptable threshold (e.g., 1 minute).

## Disaster Recovery Plan

Document your recovery procedure:

1. **Identify failure type**: Hardware, corruption, accidental deletion, malicious

2. **Stop writes if possible**: Prevent further damage

3. **Assess data loss**: What was lost? When did it happen?

4. **Choose recovery method**:
   - Recent backup: Restore from pg_dump
   - Point-in-time needed: Use PITR
   - Primary failed: Promote replica

5. **Execute recovery**: Follow documented steps

6. **Verify data**: Run queries to confirm data integrity

7. **Resume operations**: Point applications to recovered database

8. **Post-mortem**: Document what happened and prevent recurrence

## Backup Best Practices

**3-2-1 Rule**: 3 copies of data, 2 different media types, 1 off-site.

**Automate everything**: Scripts, monitoring, alerts.

**Test restores**: Monthly at minimum.

**Monitor backup status**: Alert on failures.

**Encrypt backups**: Especially for sensitive data.

**Document procedures**: So anyone can restore, not just you.

**Keep multiple versions**: Don't overwrite backups immediately.

**Separate backup storage**: Don't backup to same disk/server as database.

Backups protect against hardware failures, bugs, malicious actors, and human error. Take them seriously. Next, we'll cover production best practices - everything you need to run PostgreSQL reliably in real environments.
