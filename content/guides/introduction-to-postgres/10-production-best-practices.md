---
title: Production Best Practices and Operations
description: Learn how to run PostgreSQL reliably in production with proper security, monitoring, and maintenance
order: 10
---

**TLDR**: Secure PostgreSQL with strong passwords, SSL, and minimal permissions. Monitor key metrics (connections, cache hit rate, slow queries). Run VACUUM regularly. Plan for growth with connection pooling and read replicas. Have runbooks for common issues. Test changes in staging first.

Running PostgreSQL in production requires more than knowing SQL. You need security, monitoring, maintenance, and operational procedures.

## Security

### Authentication

Never use default postgres password:

```sql
ALTER USER postgres PASSWORD 'strong_random_password';
```

Create application users with minimal permissions:

```sql
CREATE USER app_user WITH PASSWORD 'another_strong_password';
GRANT CONNECT ON DATABASE myapp TO app_user;
\c myapp
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### SSL/TLS Connections

Edit `postgresql.conf`:

```ini
ssl = on
ssl_cert_file = '/etc/postgresql/server.crt'
ssl_key_file = '/etc/postgresql/server.key'
```

Require SSL in `pg_hba.conf`:

```
hostssl    all    all    0.0.0.0/0    scram-sha-256
```

Clients connect with SSL:

```bash
psql "sslmode=require host=db.example.com dbname=myapp user=app_user"
```

### Network Security

Restrict access in `pg_hba.conf`:

```
# Allow only from application servers
host    all    all    10.0.1.0/24    scram-sha-256

# Deny everything else
host    all    all    0.0.0.0/0      reject
```

Use firewalls:

```bash
# UFW example
sudo ufw allow from 10.0.1.0/24 to any port 5432
sudo ufw deny 5432
```

### Audit Logging

Log connections and commands:

```ini
# postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'mod'  # Log INSERT, UPDATE, DELETE
log_duration = on
```

### Row-Level Security

Restrict which rows users can access:

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER,
  content TEXT
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_documents ON documents
  FOR ALL
  TO app_user
  USING (owner_id = current_setting('app.user_id')::INTEGER);

-- In application, set user ID per connection:
SET app.user_id = '123';
SELECT * FROM documents;  -- Only sees user 123's documents
```

## Monitoring

### Key Metrics

**Connection count**:

```sql
SELECT count(*) FROM pg_stat_activity;
SELECT max_connections FROM pg_settings WHERE name = 'max_connections';
```

Alert if connections approach max_connections.

**Database size**:

```sql
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

**Table sizes**:

```sql
SELECT
  schemaname AS schema,
  tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

**Cache hit ratio** (should be >99%):

```sql
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

Low ratio means you need more shared_buffers or system memory.

**Long-running queries**:

```sql
SELECT
  pid,
  now() - query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 minutes'
ORDER BY duration DESC;
```

**Replication lag** (if using replicas):

```sql
-- On replica
SELECT now() - pg_last_xact_replay_timestamp() AS lag;
```

### Monitoring Tools

**pgAdmin**: GUI with built-in monitoring.

**pg_stat_statements**: Track query performance:

```sql
CREATE EXTENSION pg_stat_statements;

SELECT
  query,
  calls,
  total_exec_time / 1000 AS total_time_seconds,
  mean_exec_time / 1000 AS avg_time_seconds
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Prometheus + postgres_exporter**: Metrics collection and alerting.

**Datadog, New Relic**: Commercial monitoring solutions with PostgreSQL integration.

## Performance Tuning

### Configuration

Tune `postgresql.conf` based on your hardware:

```ini
# Memory (for server with 16GB RAM)
shared_buffers = 4GB              # 25% of RAM
effective_cache_size = 12GB       # 75% of RAM
work_mem = 64MB                   # RAM / max_connections / 4
maintenance_work_mem = 1GB        # For VACUUM, CREATE INDEX

# Connections
max_connections = 200

# Query planning
random_page_cost = 1.1            # Lower for SSD (default 4.0 for HDD)
effective_io_concurrency = 200    # Higher for SSD

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Logging
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000 # Log queries slower than 1 second
```

Restart after config changes:

```bash
sudo systemctl restart postgresql
```

### Connection Pooling

Applications shouldn't create new connections per request. Use pooling.

**PgBouncer**:

```bash
# Install
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
myapp = host=localhost port=5432 dbname=myapp

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25

# Start
sudo systemctl start pgbouncer
```

Applications connect to port 6432 instead of 5432. PgBouncer reuses database connections.

### Vacuum and Analyze

PostgreSQL needs regular maintenance:

```sql
-- Vacuum recovers space from deleted rows
VACUUM;

-- Vacuum specific table
VACUUM users;

-- Full vacuum (locks table)
VACUUM FULL users;

-- Analyze updates statistics for query planner
ANALYZE;

-- Both together
VACUUM ANALYZE;
```

Enable autovacuum (on by default):

```ini
autovacuum = on
autovacuum_naptime = 1min
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1
```

Monitor autovacuum:

```sql
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  vacuum_count,
  autovacuum_count
FROM pg_stat_user_tables
ORDER BY last_autovacuum;
```

### Reindex

Rebuild indexes to reclaim space and improve performance:

```sql
-- Reindex table
REINDEX TABLE users;

-- Reindex database (takes exclusive locks)
REINDEX DATABASE myapp;

-- Concurrent reindex (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
```

## Capacity Planning

### Disk Space

Monitor disk usage:

```bash
df -h /var/lib/postgresql
```

Alert at 80% full. Plan storage expansion before reaching 90%.

Database growth rate:

```sql
-- Track database size over time
CREATE TABLE db_size_history (
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  database_name TEXT,
  size_bytes BIGINT
);

-- Run daily
INSERT INTO db_size_history (database_name, size_bytes)
SELECT datname, pg_database_size(datname)
FROM pg_database;

-- View growth
SELECT
  recorded_at::date,
  pg_size_pretty(size_bytes) AS size
FROM db_size_history
WHERE database_name = 'myapp'
ORDER BY recorded_at DESC
LIMIT 30;
```

### Connection Limits

If you hit max_connections:

1. **Increase max_connections** (requires more memory)
2. **Add connection pooling** (better solution)
3. **Optimize application** to use fewer connections

### Read Replicas

Scale reads by adding replicas (covered in backup section). Applications send reads to replicas, writes to primary.

## High Availability

### Automatic Failover

Use tools like **Patroni** or **repmgr** for automatic failover:

**Patroni** example:

```yaml
# patroni.yml
scope: postgres-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: node1:8008

etcd:
  hosts: etcd1:2379,etcd2:2379,etcd3:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true

postgresql:
  listen: 0.0.0.0:5432
  connect_address: node1:5432
  data_dir: /var/lib/postgresql/16/main
```

### Load Balancers

Use HAProxy or similar to route connections:

```
# haproxy.cfg
listen postgres
    bind *:5432
    option httpchk
    http-check expect status 200
    default-server inter 3s fall 3 rise 2
    server pg1 pg1:5432 maxconn 100 check port 8008
    server pg2 pg2:5432 maxconn 100 check port 8008 backup
```

## Common Production Issues

### Query Performance

**Symptom**: Slow queries

**Diagnosis**:
```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Explain specific query
EXPLAIN ANALYZE SELECT ...;
```

**Fix**: Add indexes, optimize query, increase work_mem

### Connection Exhaustion

**Symptom**: "FATAL: remaining connection slots reserved"

**Diagnosis**:
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Fix**: Add connection pooling, increase max_connections, close idle connections

### Disk Full

**Symptom**: Database stops accepting writes

**Diagnosis**:
```bash
df -h
```

**Fix**: Delete old backups, VACUUM FULL, expand disk

### Replication Lag

**Symptom**: Replicas far behind primary

**Diagnosis**:
```sql
SELECT pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

**Fix**: Check network, increase wal_buffers, upgrade replica hardware

## Upgrade Procedures

### Minor Version Upgrades

Safe, usually just:

```bash
sudo apt update
sudo apt upgrade postgresql-16
sudo systemctl restart postgresql
```

Test in staging first.

### Major Version Upgrades

Requires pg_upgrade or dump/restore:

```bash
# Install new version
sudo apt install postgresql-17

# Stop both versions
sudo systemctl stop postgresql

# Run pg_upgrade
sudo -u postgres /usr/lib/postgresql/17/bin/pg_upgrade \
  --old-datadir=/var/lib/postgresql/16/main \
  --new-datadir=/var/lib/postgresql/17/main \
  --old-bindir=/usr/lib/postgresql/16/bin \
  --new-bindir=/usr/lib/postgresql/17/bin

# Start new version
sudo systemctl start postgresql@17-main
```

Always test upgrades in staging and have rollback plan.

## Disaster Recovery Runbooks

Document step-by-step procedures for:

- Primary server failure
- Data corruption
- Accidental data deletion
- Security breach
- Performance degradation

Example runbook:

```
RUNBOOK: Primary Database Server Failure

1. Verify primary is down:
   - Check monitoring alerts
   - Attempt psql connection

2. Promote replica to primary:
   ssh replica-server
   sudo -u postgres pg_ctl promote

3. Update application config:
   - Point database connection to new primary
   - Deploy config change

4. Verify application connectivity:
   - Check application logs
   - Run smoke tests

5. Rebuild old primary as replica:
   - Fix failed server
   - Run pg_basebackup from new primary
   - Configure as replica

6. Post-incident:
   - Document what happened
   - Update runbooks if needed
   - Schedule post-mortem
```

## Checklist for Production PostgreSQL

- [ ] Strong passwords on all accounts
- [ ] SSL/TLS encryption enabled
- [ ] Firewall rules restrict access
- [ ] Automated backups running
- [ ] Backup restores tested monthly
- [ ] Monitoring and alerting configured
- [ ] Connection pooling in place
- [ ] Replication configured
- [ ] Autovacuum enabled
- [ ] pg_stat_statements installed
- [ ] Runbooks documented
- [ ] Staging environment for testing
- [ ] Upgrade procedure tested
- [ ] Disaster recovery plan documented

Running PostgreSQL in production requires vigilance, but with proper setup and monitoring, it's reliable and performant. You now have the knowledge to deploy PostgreSQL confidently, from development to production.

Keep learning - PostgreSQL has deep features we couldn't cover. Explore extensions (PostGIS for geo data, pg_cron for scheduled jobs), advanced replication strategies, and performance optimization for your specific workload. The PostgreSQL community is helpful - don't hesitate to ask questions.
