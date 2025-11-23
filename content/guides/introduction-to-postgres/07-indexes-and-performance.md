---
title: Indexes and Query Performance
description: Learn how to create indexes and optimize PostgreSQL queries for better performance
order: 7
---

**TLDR**: Indexes speed up queries by creating sorted lookup structures. Create indexes on columns you frequently search, filter, or join on. Use EXPLAIN to see query plans. Too many indexes slow down writes. Index foreign keys and WHERE clause columns.

Without indexes, PostgreSQL scans entire tables to find rows. With indexes, it jumps directly to matching rows.

## Understanding Indexes

An index is like a book's index - instead of reading every page to find "PostgreSQL", you check the index which tells you exactly which pages mention it.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 1 million users
INSERT INTO users (email)
SELECT 'user' || n || '@example.com'
FROM generate_series(1, 1000000) n;

-- Without index: slow (scans all rows)
SELECT * FROM users WHERE email = 'user500000@example.com';

-- Create index
CREATE INDEX idx_users_email ON users(email);

-- With index: fast (direct lookup)
SELECT * FROM users WHERE email = 'user500000@example.com';
```

## Types of Indexes

### B-tree (Default)

Good for most use cases:

```sql
CREATE INDEX idx_users_created_at ON users(created_at);

-- Works for:
SELECT * FROM users WHERE created_at = '2024-01-01';
SELECT * FROM users WHERE created_at > '2024-01-01';
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
SELECT * FROM users ORDER BY created_at;
```

### Hash

Only for equality comparisons:

```sql
CREATE INDEX idx_users_email_hash ON users USING HASH (email);

-- Fast
SELECT * FROM users WHERE email = 'alice@example.com';

-- Doesn't use index
SELECT * FROM users WHERE email LIKE 'alice%';
```

Rarely needed - B-tree works for equality too.

### GIN (Generalized Inverted Index)

For full-text search, arrays, JSONB:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  tags TEXT[],
  metadata JSONB
);

CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
CREATE INDEX idx_posts_metadata ON posts USING GIN (metadata);

-- Fast array queries
SELECT * FROM posts WHERE tags @> ARRAY['postgres'];

-- Fast JSONB queries
SELECT * FROM posts WHERE metadata @> '{"status": "published"}';
```

### GiST (Generalized Search Tree)

For geometric data, full-text search, range types:

```sql
CREATE INDEX idx_posts_title_search ON posts USING GiST (to_tsvector('english', title));

-- Full-text search
SELECT * FROM posts WHERE to_tsvector('english', title) @@ to_tsquery('postgres');
```

## EXPLAIN: Understanding Query Plans

EXPLAIN shows how PostgreSQL executes queries:

```sql
EXPLAIN SELECT * FROM users WHERE email = 'user500000@example.com';
```

Without index:
```
Seq Scan on users  (cost=0.00..18334.00 rows=1 width=45)
  Filter: (email = 'user500000@example.com')
```

"Seq Scan" means scanning every row. Cost is high.

With index:
```
Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1 width=45)
  Index Cond: (email = 'user500000@example.com')
```

"Index Scan" - uses the index. Much lower cost.

### EXPLAIN ANALYZE

Actually runs the query and shows real timing:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user500000@example.com';
```

Output:
```
Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1 width=45) (actual time=0.028..0.029 rows=1 loops=1)
  Index Cond: (email = 'user500000@example.com')
Planning Time: 0.123 ms
Execution Time: 0.053 ms
```

Shows estimated cost and actual execution time.

## When to Create Indexes

Create indexes for:

**Foreign keys**:
```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

**Columns in WHERE clauses**:
```sql
-- If you frequently query:
SELECT * FROM orders WHERE status = 'pending';
-- Create:
CREATE INDEX idx_orders_status ON orders(status);
```

**Columns in JOIN conditions**:
```sql
-- For:
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;
-- Create:
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

**Columns in ORDER BY**:
```sql
-- For:
SELECT * FROM posts ORDER BY created_at DESC;
-- Create:
CREATE INDEX idx_posts_created_at ON posts(created_at);
```

## Composite Indexes

Index multiple columns:

```sql
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- Uses index efficiently
SELECT * FROM posts WHERE user_id = 123 ORDER BY created_at;

-- Also uses index (leftmost column)
SELECT * FROM posts WHERE user_id = 123;

-- Doesn't use index (missing leftmost column)
SELECT * FROM posts WHERE created_at > '2024-01-01';
```

Column order matters. Put columns used in WHERE before columns used only in ORDER BY.

## Partial Indexes

Index only some rows:

```sql
-- Only index active users
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- Or only pending orders
CREATE INDEX idx_pending_orders ON orders(customer_id) WHERE status = 'pending';
```

Smaller, faster indexes when you frequently query a subset.

## Unique Indexes

Enforce uniqueness and speed up lookups:

```sql
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Equivalent to UNIQUE constraint
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
```

## Index Maintenance

### View Indexes

```sql
-- List indexes on a table
\d users

-- Or:
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
```

### Drop Indexes

```sql
DROP INDEX idx_users_email;
```

### Reindex

Rebuild indexes (rarely needed):

```sql
REINDEX TABLE users;
REINDEX INDEX idx_users_email;
```

## Query Optimization Techniques

### Use Indexes Wisely

```sql
-- Bad - function prevents index use
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- Good - index on expression
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- Or better - store lowercase
UPDATE users SET email = LOWER(email);
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'alice@example.com';
```

### Avoid SELECT *

```sql
-- Slower
SELECT * FROM posts;

-- Faster
SELECT id, title FROM posts;
```

Fetching only needed columns reduces data transfer.

### Use LIMIT

```sql
-- Without LIMIT, fetches all rows
SELECT * FROM posts ORDER BY created_at DESC;

-- With LIMIT, stops after 10
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;
```

### Covering Indexes

Include all needed columns in the index:

```sql
CREATE INDEX idx_posts_user_title ON posts(user_id) INCLUDE (title);

-- Index-only scan - doesn't touch table
SELECT title FROM posts WHERE user_id = 123;
```

## Common Performance Issues

### N+1 Queries

Bad (in application code):

```python
# Fetch users
users = query("SELECT * FROM users")

# For each user, fetch posts
for user in users:
    posts = query("SELECT * FROM posts WHERE user_id = ?", user.id)
```

This runs N+1 queries (1 for users, N for each user's posts).

Good:

```python
# One query with JOIN
results = query("""
    SELECT u.*, p.*
    FROM users u
    LEFT JOIN posts p ON p.user_id = u.id
""")
```

### Inefficient WHERE Clauses

```sql
-- Bad - scans all rows
SELECT * FROM posts WHERE EXTRACT(YEAR FROM created_at) = 2024;

-- Good - uses index
SELECT * FROM posts
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
```

### Missing Indexes on Foreign Keys

Always index foreign keys:

```sql
ALTER TABLE posts ADD CONSTRAINT fk_posts_user
  FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX idx_posts_user_id ON posts(user_id);
```

## Monitoring Query Performance

### pg_stat_statements

Track slow queries:

```sql
CREATE EXTENSION pg_stat_statements;

-- View slowest queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Auto Explain

Log slow query plans:

```sql
-- In postgresql.conf or via SQL
SET auto_explain.log_min_duration = 1000;  -- Log queries over 1 second
SET auto_explain.log_analyze = true;
```

## Practical Indexing Strategy

1. **Start without indexes** (except primary keys and unique constraints)
2. **Profile real queries** using EXPLAIN ANALYZE
3. **Add indexes for slow queries** on columns in WHERE, JOIN, ORDER BY
4. **Monitor index usage**:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

Indexes with `idx_scan = 0` are never used - consider dropping them.

5. **Balance read vs write performance** - indexes speed up reads but slow down writes

Proper indexing can turn a 10-second query into a 10-millisecond query. Next, we'll explore transactions - how to keep data consistent when multiple operations must succeed or fail together.
