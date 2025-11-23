---
title: Installing and Setting Up PostgreSQL
description: Get PostgreSQL installed on your system and connect to your first database
order: 2
---

**TLDR**: Install PostgreSQL from official repositories or package managers. The installation creates a `postgres` superuser. Connect using `psql` (command-line client) or GUI tools like pgAdmin. Create databases with `CREATE DATABASE`, connect with `\c database_name`, and explore with `\d` commands.

Getting PostgreSQL running is straightforward on most platforms. We'll cover installation, initial configuration, connecting to the server, and creating your first database.

## Installing PostgreSQL

### On macOS

Using Homebrew is the simplest method:

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16
```

This installs PostgreSQL 16 (replace with the version you want) and starts it automatically. The service runs in the background and restarts on boot.

Alternatively, download Postgres.app from [postgresapp.com](https://postgresapp.com) - a self-contained macOS application that includes PostgreSQL and useful tools.

### On Ubuntu/Debian

PostgreSQL's official repositories provide the latest versions:

```bash
# Install prerequisites
sudo apt update
sudo apt install -y postgresql-common

# Add PostgreSQL repository
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

PostgreSQL starts automatically after installation:

```bash
# Check status
sudo systemctl status postgresql

# Start/stop/restart if needed
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
```

### On Red Hat/CentOS/Fedora

```bash
# Install PostgreSQL repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-$(rpm -E %{rhel})-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL
sudo dnf install -y postgresql16-server postgresql16-contrib

# Initialize database cluster
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb

# Start and enable service
sudo systemctl start postgresql-16
sudo systemctl enable postgresql-16
```

### On Windows

Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/):

1. Run the installer
2. Choose installation directory (default is fine)
3. Select components (PostgreSQL Server, pgAdmin, Command Line Tools)
4. Set a password for the postgres user
5. Choose port (5432 is default)
6. Select locale (default is fine)
7. Complete the installation

The installer sets up PostgreSQL as a Windows service that starts automatically.

### Using Docker

For development or testing, Docker provides a quick setup:

```bash
# Run PostgreSQL container
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -d postgres:16

# Connect to it
docker exec -it postgres-dev psql -U postgres -d myapp
```

This creates a PostgreSQL container with:
- Password: `mypassword`
- Default database: `myapp`
- Exposed on port 5432

For persistent data, add a volume:

```bash
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=mypassword \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres:16
```

Now data survives container restarts.

## Verifying Installation

Check that PostgreSQL is installed and running:

```bash
# Check version
psql --version

# On Linux/macOS, check if server is running
pg_isready
```

You should see:

```
psql (PostgreSQL) 16.1
/tmp:5432 - accepting connections
```

If you see "accepting connections", PostgreSQL is ready.

## Understanding PostgreSQL's Structure

After installation, PostgreSQL has:

**postgres user**: A superuser account that can do anything. On Linux, this is also a system user.

**postgres database**: A default database. Every PostgreSQL installation has this.

**template1 and template0**: Template databases. New databases are cloned from template1.

**Data directory**: Where PostgreSQL stores all data files. On Linux, typically `/var/lib/postgresql/16/main` or `/var/lib/pgsql/16/data`.

**Configuration files**:
- `postgresql.conf`: Main configuration
- `pg_hba.conf`: Client authentication rules

## Connecting to PostgreSQL

### Using psql (Command-Line Client)

`psql` is the standard PostgreSQL client. It's powerful and available everywhere.

On Linux, switch to the postgres user first:

```bash
sudo -i -u postgres
psql
```

On macOS (Homebrew installation):

```bash
psql postgres
```

On Windows, use SQL Shell (psql) from the Start menu.

You should see a prompt:

```
postgres=#
```

This means you're connected to the `postgres` database as the `postgres` user.

### psql Basics

Try these commands:

```sql
-- List all databases
\l

-- Connect to a database
\c postgres

-- List tables in current database
\dt

-- Describe a table
\d table_name

-- List users
\du

-- See current database and user
SELECT current_database(), current_user;

-- Quit psql
\q
```

The `\` commands are psql shortcuts. They're not SQL, but they make navigation easier.

### Connection String Format

PostgreSQL uses connection strings to specify where to connect:

```
postgresql://username:password@hostname:port/database
```

Examples:

```bash
# Local connection
psql postgresql://postgres@localhost/mydb

# Remote connection
psql postgresql://user:pass@db.example.com:5432/production

# Using environment variables
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=mydb
psql  # Uses environment variables
```

## Creating Your First Database

Let's create a database for a blog application:

```sql
-- Create database
CREATE DATABASE blog;

-- Connect to it
\c blog

-- Verify you're connected
SELECT current_database();
```

Output:

```
CREATE DATABASE
You are now connected to database "blog" as user "postgres".
 current_database
------------------
 blog
```

Now create a table:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Check that it exists:

```sql
\dt
```

Output:

```
        List of relations
 Schema | Name  | Type  |  Owner
--------+-------+-------+----------
 public | posts | table | postgres
```

Insert some data:

```sql
INSERT INTO posts (title, content)
VALUES
  ('First Post', 'Hello, PostgreSQL!'),
  ('Second Post', 'Learning databases is fun'),
  ('Third Post', 'PostgreSQL is powerful');
```

Query it:

```sql
SELECT * FROM posts;
```

Output:

```
 id |    title     |          content           |         created_at
----+--------------+----------------------------+----------------------------
  1 | First Post   | Hello, PostgreSQL!         | 2024-02-14 10:23:45.123456
  2 | Second Post  | Learning databases is fun  | 2024-02-14 10:23:45.123456
  3 | Third Post   | PostgreSQL is powerful     | 2024-02-14 10:23:45.123456
```

Congratulations! You've created a database, table, inserted data, and queried it.

## Creating a Non-Superuser

The `postgres` user has unlimited power. For applications, create users with limited permissions:

```sql
-- Create a new user
CREATE USER blog_app WITH PASSWORD 'secure_password';

-- Grant permissions on database
GRANT CONNECT ON DATABASE blog TO blog_app;

-- Connect to the blog database
\c blog

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO blog_app;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blog_app;

-- Grant permissions on sequences (for SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO blog_app;

-- Make future tables accessible too
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO blog_app;
```

Now the application can connect as `blog_app`:

```bash
psql -U blog_app -d blog -h localhost
```

This user can read and write the `posts` table but can't drop databases or create new users.

## Using GUI Tools

While `psql` is great for quick tasks, GUI tools help visualize data and write queries.

### pgAdmin

pgAdmin is the official PostgreSQL GUI. Download from [pgadmin.org](https://www.pgadmin.org/).

After installation:

1. Open pgAdmin
2. Right-click "Servers" → "Register" → "Server"
3. Name: "Local PostgreSQL"
4. Host: localhost
5. Port: 5432
6. Username: postgres
7. Password: your password

You can now browse databases, run queries, and view table data graphically.

### Other Tools

**DBeaver**: Universal database tool supporting many databases. Free and open source.

**TablePlus**: macOS/Windows client with a clean interface. Free tier available.

**DataGrip**: JetBrains' database IDE. Paid but very powerful.

**Postico**: macOS-only PostgreSQL client. Simple and elegant.

Choose based on your platform and preferences. Many developers use both `psql` for quick tasks and a GUI for exploration.

## Configuration Basics

PostgreSQL's main config file is `postgresql.conf`. Key settings:

```ini
# Maximum connections (default: 100)
max_connections = 100

# Memory for sorting and queries (default: 4MB)
work_mem = 4MB

# Shared memory for caching (default: 128MB, often too low)
shared_buffers = 256MB

# WAL settings for durability
wal_level = replica

# Logging
log_statement = 'none'  # 'none', 'ddl', 'mod', or 'all'
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
```

Find the file location:

```sql
SHOW config_file;
```

On Linux:

```
/etc/postgresql/16/main/postgresql.conf
```

After changing settings, reload configuration:

```bash
sudo systemctl reload postgresql

# Or in psql
SELECT pg_reload_conf();
```

Some settings require a full restart:

```bash
sudo systemctl restart postgresql
```

## Authentication Configuration

The `pg_hba.conf` file controls who can connect. Entries look like:

```
# TYPE  DATABASE  USER      ADDRESS         METHOD
local   all       postgres                  peer
host    all       all       127.0.0.1/32    scram-sha-256
host    all       all       ::1/128         scram-sha-256
```

This means:

- Local connections by `postgres` use peer authentication (Unix user = database user)
- TCP connections from localhost require password (scram-sha-256)

To allow remote connections, add:

```
host    all       all       0.0.0.0/0       scram-sha-256
```

And in `postgresql.conf`, change:

```ini
listen_addresses = '*'
```

Then reload:

```bash
sudo systemctl reload postgresql
```

Be careful allowing remote connections. Use firewalls and strong passwords, or better yet, restrict to specific IP addresses:

```
host    all       all       203.0.113.0/24  scram-sha-256
```

## Environment Variables

Set these to avoid typing connection parameters:

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=blog
export PGPASSWORD=mypassword  # Or use .pgpass file for security
```

Add to your `~/.bashrc` or `~/.zshrc` for persistence.

For security, use a `.pgpass` file instead of `PGPASSWORD`:

```bash
# Create ~/.pgpass
cat > ~/.pgpass << 'EOF'
localhost:5432:blog:postgres:mypassword
EOF

# Make it readable only by you
chmod 0600 ~/.pgpass
```

Now `psql` automatically uses this password.

## Connecting from Programming Languages

### Python with psycopg2

```python
import psycopg2

# Connect
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="blog",
    user="blog_app",
    password="secure_password"
)

# Create cursor
cur = conn.cursor()

# Execute query
cur.execute("SELECT * FROM posts")
rows = cur.fetchall()

for row in rows:
    print(row)

# Close
cur.close()
conn.close()
```

### Node.js with pg

```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'blog',
  user: 'blog_app',
  password: 'secure_password'
});

await client.connect();

const result = await client.query('SELECT * FROM posts');
console.log(result.rows);

await client.end();
```

### Go with pgx

```go
package main

import (
    "context"
    "fmt"
    "github.com/jackc/pgx/v5"
)

func main() {
    conn, err := pgx.Connect(context.Background(),
        "postgres://blog_app:secure_password@localhost:5432/blog")
    if err != nil {
        panic(err)
    }
    defer conn.Close(context.Background())

    var title string
    err = conn.QueryRow(context.Background(),
        "SELECT title FROM posts WHERE id = $1", 1).Scan(&title)
    if err != nil {
        panic(err)
    }

    fmt.Println(title)
}
```

## Common Installation Issues

### Port Already in Use

If PostgreSQL won't start because port 5432 is in use:

```bash
# Find what's using the port
sudo lsof -i :5432

# Or
sudo netstat -nlp | grep 5432
```

Either stop the conflicting service or configure PostgreSQL to use a different port in `postgresql.conf`:

```ini
port = 5433
```

### Permission Denied Errors

On Linux, if you get "could not connect to server":

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check you're using the right user
sudo -i -u postgres psql
```

### Password Authentication Failed

If passwords don't work:

1. Check `pg_hba.conf` uses `scram-sha-256` or `md5`, not `peer` or `ident`
2. Reload configuration: `sudo systemctl reload postgresql`
3. Make sure you're connecting via TCP: `psql -h localhost -U postgres`

### Can't Create Database

If "ERROR: permission denied to create database":

```sql
-- Check your user's permissions
\du

-- Grant createdb permission
ALTER USER your_user CREATEDB;
```

## Exploring the System Catalogs

PostgreSQL stores metadata about your databases in system tables:

```sql
-- List all databases
SELECT datname FROM pg_database;

-- List all tables in current database
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- See table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts';

-- Current database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

These queries are useful for understanding what's in your database and how much space it uses.

## Next Steps

You now have PostgreSQL installed and can connect to it. You've created a database, table, and run basic queries. In the next section, we'll dive deeper into SQL - the language you use to interact with PostgreSQL. You'll learn to retrieve exactly the data you need, manipulate it efficiently, and understand how queries work.
