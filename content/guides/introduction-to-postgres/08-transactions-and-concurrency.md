---
title: Transactions and Concurrency Control
description: Learn how to use transactions to maintain data consistency and handle concurrent database access safely
order: 8
---

**TLDR**: Wrap related operations in transactions with BEGIN/COMMIT. Transactions guarantee all operations succeed together or all fail. PostgreSQL provides ACID guarantees. Use appropriate isolation levels to balance consistency and performance. Handle deadlocks gracefully.

Transactions ensure data stays consistent even when multiple operations happen simultaneously or failures occur.

## What Are Transactions?

A transaction is a sequence of operations that execute as a single unit:

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

Either both updates happen or neither does. No partial transfers.

## Basic Transaction Commands

```sql
-- Start transaction
BEGIN;

-- Do work
INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com');
INSERT INTO posts (user_id, title) VALUES (1, 'First Post');

-- If everything worked:
COMMIT;

-- If something went wrong:
-- ROLLBACK;
```

### Rollback on Error

```sql
BEGIN;
  INSERT INTO users (username, email) VALUES ('bob', 'bob@example.com');
  INSERT INTO users (username, email) VALUES ('bob', 'duplicate@example.com');  -- Fails (duplicate username)
ROLLBACK;  -- Undo the first INSERT too
```

PostgreSQL automatically rolls back if an error occurs and you don't handle it.

## ACID Properties

Transactions provide ACID guarantees:

### Atomicity

All operations succeed or all fail. No partial execution.

```sql
BEGIN;
  UPDATE inventory SET quantity = quantity - 5 WHERE product_id = 1;
  INSERT INTO orders (product_id, quantity) VALUES (1, 5);
COMMIT;
```

If either statement fails, both roll back. Inventory and orders stay in sync.

### Consistency

Database moves from one valid state to another. Constraints are enforced.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- Total balance unchanged:
SELECT SUM(balance) FROM accounts;  -- Same before and after
```

### Isolation

Concurrent transactions don't interfere with each other.

```sql
-- Transaction 1
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- Sees 500
  -- ... do something ...
COMMIT;

-- Transaction 2 (running simultaneously)
BEGIN;
  UPDATE accounts SET balance = 1000 WHERE id = 1;
COMMIT;

-- Transaction 1 doesn't see Transaction 2's changes until it commits
```

### Durability

Once committed, changes persist even if the system crashes.

```sql
BEGIN;
  INSERT INTO critical_data (value) VALUES ('important');
COMMIT;
-- Power failure here
-- On restart, the insert is still there
```

PostgreSQL writes to the Write-Ahead Log (WAL) before confirming commits, ensuring durability.

## Isolation Levels

Control how transactions see each other's changes. Trade-off between consistency and concurrency.

### Read Uncommitted

Not supported in PostgreSQL (treated as Read Committed). Allows dirty reads in other databases.

### Read Committed (Default)

Sees only committed changes. Most common level.

```sql
-- Transaction 1
BEGIN;
  UPDATE products SET price = 100 WHERE id = 1;
  -- Not committed yet

-- Transaction 2
BEGIN;
  SELECT price FROM products WHERE id = 1;  -- Sees old price
  -- Wait for Transaction 1 to commit
  SELECT price FROM products WHERE id = 1;  -- Now sees 100
COMMIT;
```

### Repeatable Read

Queries see a consistent snapshot from transaction start.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- Sees 500

-- Another transaction updates the balance to 1000 and commits

  SELECT balance FROM accounts WHERE id = 1;  -- Still sees 500 (snapshot)
COMMIT;
```

Prevents non-repeatable reads but can cause serialization failures:

```sql
-- Transaction 1
BEGIN ISOLATION LEVEL REPEATABLE READ;
  SELECT * FROM products WHERE id = 1;
  UPDATE products SET stock = stock - 1 WHERE id = 1;
  -- Transaction 2 modified this row
COMMIT;  -- ERROR: could not serialize access
```

### Serializable

Strongest isolation. Transactions execute as if they ran one after another.

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
  -- ... operations ...
COMMIT;
```

Prevents all anomalies but causes more serialization failures. Use when consistency is critical.

Set default level:

```sql
ALTER DATABASE mydb SET default_transaction_isolation TO 'repeatable read';
```

## Savepoints

Partial rollbacks within transactions:

```sql
BEGIN;
  INSERT INTO users (username) VALUES ('alice');

  SAVEPOINT before_posts;

  INSERT INTO posts (user_id, title) VALUES (1, 'Post 1');
  INSERT INTO posts (user_id, title) VALUES (1, 'Post 2');  -- Might fail

  -- If post insert fails, rollback to savepoint
  ROLLBACK TO before_posts;

  -- User insert still committed
COMMIT;
```

Useful for complex operations where some parts can fail while others succeed.

## Handling Concurrent Access

### Row-Level Locking

SELECT FOR UPDATE locks rows:

```sql
BEGIN;
  SELECT * FROM inventory WHERE product_id = 1 FOR UPDATE;
  -- Other transactions wait here
  UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;
COMMIT;
```

Prevents two transactions from decrementing the same inventory simultaneously.

### Lock Types

```sql
-- Exclusive lock (blocks all other locks)
SELECT * FROM products WHERE id = 1 FOR UPDATE;

-- Shared lock (blocks FOR UPDATE but allows FOR SHARE)
SELECT * FROM products WHERE id = 1 FOR SHARE;

-- Skip locked rows
SELECT * FROM queue WHERE processed = false FOR UPDATE SKIP LOCKED LIMIT 10;

-- Error if rows are locked
SELECT * FROM products WHERE id = 1 FOR UPDATE NOWAIT;
```

FOR UPDATE SKIP LOCKED is great for job queues - each worker gets different rows.

### Advisory Locks

Application-level locks using arbitrary numbers:

```sql
-- Try to acquire lock 1234
SELECT pg_try_advisory_lock(1234);

-- Do work
UPDATE shared_resource SET value = value + 1;

-- Release lock
SELECT pg_advisory_unlock(1234);
```

Useful for coordinating between applications.

## Deadlocks

Two transactions wait for each other:

```sql
-- Transaction 1
BEGIN;
  UPDATE products SET price = 100 WHERE id = 1;
  -- Waiting for Transaction 2

-- Transaction 2
BEGIN;
  UPDATE products SET price = 200 WHERE id = 2;
  UPDATE products SET price = 150 WHERE id = 1;  -- Waits for Transaction 1

-- Transaction 1 continues
  UPDATE products SET price = 250 WHERE id = 2;  -- Waits for Transaction 2
  -- DEADLOCK
```

PostgreSQL detects deadlocks and aborts one transaction:

```
ERROR: deadlock detected
DETAIL: Process 1234 waits for ShareLock on transaction 5678; blocked by process 5678.
```

Handle in application code:

```python
try:
    execute_transaction()
except DeadlockError:
    retry_transaction()
```

Prevent deadlocks by accessing resources in consistent order:

```sql
-- Always update products in ID order
BEGIN;
  UPDATE products SET price = 100 WHERE id IN (1, 2, 5) ORDER BY id;
COMMIT;
```

## Long-Running Transactions

Avoid holding transactions open:

```sql
-- Bad
BEGIN;
  SELECT * FROM products;
  -- User thinks for 10 minutes
  UPDATE products SET ...;
COMMIT;
```

Long transactions:
- Block other transactions
- Prevent vacuum from cleaning up dead rows
- Hold locks longer than necessary

Keep transactions short:

```sql
-- Good
SELECT * FROM products;
-- Let user decide

-- When ready:
BEGIN;
  UPDATE products SET ...;
COMMIT;
```

## Practical Transaction Patterns

### Transfer Money

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100
  WHERE id = 1 AND balance >= 100;

  IF NOT FOUND THEN
    ROLLBACK;
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE accounts SET balance = balance + 100
  WHERE id = 2;
COMMIT;
```

### Process Queue Items

```sql
BEGIN;
  -- Lock and get next item
  SELECT * FROM queue
  WHERE processed = false
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  -- Process item
  -- ... do work ...

  -- Mark processed
  UPDATE queue SET processed = true WHERE id = ...;
COMMIT;
```

Multiple workers can process different items concurrently.

### Atomic Counters

```sql
BEGIN;
  UPDATE statistics
  SET view_count = view_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE page_id = 123;
COMMIT;
```

## Transaction Best Practices

**Keep transactions short**: Acquire locks, do work, commit. Don't hold transactions during user input or external API calls.

**Handle errors**: Always have error handling that rolls back on failure.

**Use appropriate isolation level**: Read Committed for most cases, Repeatable Read or Serializable when needed.

**Avoid nested transactions**: PostgreSQL doesn't support true nested transactions. Use savepoints instead.

**Retry serialization failures**: When using Repeatable Read or Serializable, retry on conflicts.

**Index foreign keys**: Helps avoid lock waits during updates.

**Monitor lock waits**:

```sql
SELECT
  pid,
  usename,
  pg_blocking_pids(pid) AS blocked_by,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

Transactions keep your data consistent even with concurrent access and failures. Next, we'll cover backup and recovery - how to protect your data and restore it when needed.
