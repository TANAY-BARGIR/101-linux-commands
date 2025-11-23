---
title: SQL Basics and CRUD Operations
description: Learn fundamental SQL commands for creating, reading, updating, and deleting data in PostgreSQL
order: 3
---

**TLDR**: Use SELECT to retrieve data, INSERT to add rows, UPDATE to modify existing rows, and DELETE to remove rows. Filter with WHERE, sort with ORDER BY, limit results with LIMIT. Use aggregate functions (COUNT, SUM, AVG) to summarize data. These operations cover 90% of daily database work.

SQL (Structured Query Language) is how you interact with PostgreSQL. These fundamental commands let you manipulate data and retrieve exactly what you need.

## Prerequisites

Create a test database to follow along:

```sql
CREATE DATABASE learn_sql;
\c learn_sql

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## SELECT: Retrieving Data

SELECT fetches data from tables. It's the most common SQL operation.

### Basic SELECT

```sql
-- Get all columns from all rows
SELECT * FROM users;

-- Get specific columns
SELECT username, email FROM users;

-- Get distinct values (no duplicates)
SELECT DISTINCT age FROM users;
```

The `*` means "all columns". Avoid it in production code - specify columns explicitly for clarity and performance.

### Filtering with WHERE

WHERE clauses filter which rows to return:

```sql
-- Users with specific age
SELECT * FROM users WHERE age = 25;

-- Users older than 25
SELECT * FROM users WHERE age > 25;

-- Users between 18 and 30
SELECT * FROM users WHERE age BETWEEN 18 AND 30;

-- Users with names starting with 'A'
SELECT * FROM users WHERE username LIKE 'A%';

-- Multiple conditions with AND
SELECT * FROM users WHERE age > 18 AND age < 65;

-- Either condition with OR
SELECT * FROM users WHERE age < 18 OR age > 65;

-- Check for NULL
SELECT * FROM users WHERE age IS NULL;

-- Check if value in list
SELECT * FROM users WHERE age IN (18, 21, 25, 30);
```

Common operators:

- `=`, `!=` (or `<>`): Equals, not equals
- `>`, `<`, `>=`, `<=`: Comparison
- `LIKE`, `ILIKE`: Pattern matching (ILIKE is case-insensitive)
- `IN`: Value in a list
- `BETWEEN`: Value in a range
- `IS NULL`, `IS NOT NULL`: NULL checks

Pattern matching wildcards:

- `%`: Any number of characters
- `_`: Exactly one character

```sql
-- Names starting with 'Jo'
SELECT * FROM users WHERE username LIKE 'Jo%';  -- John, Joe, Joanna

-- Names with exactly 4 letters
SELECT * FROM users WHERE username LIKE '____';

-- Emails from gmail.com
SELECT * FROM users WHERE email LIKE '%@gmail.com';
```

### Sorting Results

ORDER BY sorts query results:

```sql
-- Sort by age ascending (default)
SELECT * FROM users ORDER BY age;

-- Sort by age descending
SELECT * FROM users ORDER BY age DESC;

-- Sort by multiple columns
SELECT * FROM users ORDER BY age DESC, username ASC;

-- Sort by column position (1-indexed)
SELECT username, age FROM users ORDER BY 2 DESC;
```

### Limiting Results

LIMIT restricts how many rows return:

```sql
-- First 10 users
SELECT * FROM users LIMIT 10;

-- Skip first 10, get next 10 (pagination)
SELECT * FROM users OFFSET 10 LIMIT 10;

-- Get oldest 5 users
SELECT * FROM users ORDER BY created_at ASC LIMIT 5;
```

For pagination, combine ORDER BY with LIMIT and OFFSET:

```sql
-- Page 1 (rows 1-10)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 0;

-- Page 2 (rows 11-20)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 10;

-- Page 3 (rows 21-30)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;
```

## INSERT: Adding Data

INSERT adds new rows to tables.

### Basic INSERT

```sql
-- Insert one row
INSERT INTO users (username, email, age)
VALUES ('alice', 'alice@example.com', 28);

-- Insert multiple rows at once
INSERT INTO users (username, email, age)
VALUES
  ('bob', 'bob@example.com', 32),
  ('carol', 'carol@example.com', 24),
  ('dave', 'dave@example.com', 19);
```

You don't need to specify every column. Columns with defaults or that allow NULL can be omitted:

```sql
-- id and created_at are set automatically
INSERT INTO users (username, email)
VALUES ('eve', 'eve@example.com');
```

### Returning Data After INSERT

Get values of inserted rows with RETURNING:

```sql
INSERT INTO users (username, email, age)
VALUES ('frank', 'frank@example.com', 45)
RETURNING id, created_at;
```

Output:

```
 id |        created_at
----+---------------------------
  6 | 2024-02-14 14:23:11.234
```

This is useful for getting auto-generated IDs or timestamps.

### Handling Conflicts

If you insert a row that violates a unique constraint:

```sql
-- This fails because alice already exists
INSERT INTO users (username, email)
VALUES ('alice', 'alice2@example.com');
```

Error:

```
ERROR: duplicate key value violates unique constraint "users_username_key"
```

Use ON CONFLICT to handle this:

```sql
-- Do nothing if username already exists
INSERT INTO users (username, email, age)
VALUES ('alice', 'alice2@example.com', 29)
ON CONFLICT (username) DO NOTHING;

-- Update the row if it exists
INSERT INTO users (username, email, age)
VALUES ('alice', 'alice-new@example.com', 29)
ON CONFLICT (username)
DO UPDATE SET email = EXCLUDED.email, age = EXCLUDED.age;
```

`EXCLUDED` refers to the values you tried to insert. This is an "upsert" - update if exists, insert if not.

## UPDATE: Modifying Data

UPDATE changes existing rows.

### Basic UPDATE

```sql
-- Update one column
UPDATE users SET age = 29 WHERE username = 'alice';

-- Update multiple columns
UPDATE users SET email = 'newemail@example.com', age = 30
WHERE username = 'bob';

-- Update all rows (be careful!)
UPDATE users SET age = age + 1;
```

Always use WHERE unless you really mean to update every row. Without WHERE, UPDATE affects all rows in the table.

### UPDATE with Conditions

```sql
-- Give everyone under 18 an age of 18
UPDATE users SET age = 18 WHERE age < 18;

-- Update based on another column
UPDATE users SET email = LOWER(email) WHERE email != LOWER(email);

-- Conditional update
UPDATE users
SET age = CASE
  WHEN age < 18 THEN 18
  WHEN age > 65 THEN 65
  ELSE age
END;
```

### Returning Updated Rows

Like INSERT, UPDATE supports RETURNING:

```sql
UPDATE users SET age = 33 WHERE username = 'bob'
RETURNING id, username, age;
```

This shows what changed, useful for logging or confirmation.

## DELETE: Removing Data

DELETE removes rows from tables.

### Basic DELETE

```sql
-- Delete specific user
DELETE FROM users WHERE username = 'alice';

-- Delete users matching criteria
DELETE FROM users WHERE age < 18;

-- Delete all rows (dangerous!)
DELETE FROM users;
```

Never run DELETE without WHERE in production unless you genuinely want to empty the table.

### Safe Deletion Patterns

Before deleting, check what will be affected:

```sql
-- Preview what you'll delete
SELECT * FROM users WHERE age < 18;

-- If that looks right, delete
DELETE FROM users WHERE age < 18;
```

For important tables, use soft deletes instead:

```sql
-- Add deleted_at column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- "Delete" by setting timestamp
UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = 5;

-- Query only non-deleted users
SELECT * FROM users WHERE deleted_at IS NULL;
```

This preserves data while hiding it from normal queries. You can undelete or permanently remove later.

### DELETE with RETURNING

```sql
DELETE FROM users WHERE age > 65
RETURNING username, email;
```

Shows what you deleted, useful for audit logs.

## Aggregate Functions

Aggregates compute single values from multiple rows.

### COUNT

Count rows:

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Users with age set
SELECT COUNT(age) FROM users;

-- Distinct ages
SELECT COUNT(DISTINCT age) FROM users;

-- Users matching criteria
SELECT COUNT(*) FROM users WHERE age >= 18;
```

`COUNT(*)` counts all rows. `COUNT(column)` counts non-NULL values in that column.

### SUM, AVG, MIN, MAX

```sql
-- Total age of all users (not very useful)
SELECT SUM(age) FROM users;

-- Average age
SELECT AVG(age) FROM users;

-- Age range
SELECT MIN(age) AS youngest, MAX(age) AS oldest FROM users;

-- Multiple aggregates
SELECT
  COUNT(*) AS total_users,
  AVG(age) AS avg_age,
  MIN(age) AS min_age,
  MAX(age) AS max_age
FROM users;
```

Output:

```
 total_users | avg_age | min_age | max_age
-------------+---------+---------+---------
         100 |   32.45 |      18 |      75
```

### GROUP BY

GROUP BY groups rows before aggregating:

```sql
-- Count users by age
SELECT age, COUNT(*) AS user_count
FROM users
GROUP BY age
ORDER BY age;
```

Output:

```
 age | user_count
-----+------------
  18 |          5
  19 |          8
  20 |         12
  21 |         10
```

You can only SELECT columns that are either in GROUP BY or used with an aggregate function:

```sql
-- Valid
SELECT age, COUNT(*) FROM users GROUP BY age;

-- Valid
SELECT age, username FROM users GROUP BY age, username;

-- Invalid - email not in GROUP BY
SELECT age, email, COUNT(*) FROM users GROUP BY age;
```

### HAVING

WHERE filters before grouping. HAVING filters after:

```sql
-- Ages with more than 10 users
SELECT age, COUNT(*) AS user_count
FROM users
GROUP BY age
HAVING COUNT(*) > 10;

-- Average age by decade, only decades with 5+ users
SELECT
  (age / 10) * 10 AS decade,
  COUNT(*) AS user_count,
  AVG(age) AS avg_age
FROM users
GROUP BY decade
HAVING COUNT(*) >= 5
ORDER BY decade;
```

Output:

```
 decade | user_count | avg_age
--------+------------+---------
     20 |         45 |   24.35
     30 |         32 |   34.21
     40 |         18 |   44.56
```

## String Functions

Manipulate text in queries:

```sql
-- Convert to uppercase/lowercase
SELECT UPPER(username), LOWER(email) FROM users;

-- Concatenate strings
SELECT username || ' <' || email || '>' AS full_contact FROM users;

-- String length
SELECT username, LENGTH(username) FROM users;

-- Extract substring
SELECT SUBSTRING(email FROM '[^@]+') AS local_part FROM users;

-- Replace text
SELECT REPLACE(email, '@example.com', '@newdomain.com') FROM users;

-- Trim whitespace
SELECT TRIM(username) FROM users;

-- Check if string contains text
SELECT * FROM users WHERE email LIKE '%gmail%';

-- Case-insensitive search
SELECT * FROM users WHERE username ILIKE 'ALICE';
```

## Date and Time Functions

Work with timestamps:

```sql
-- Current timestamp
SELECT CURRENT_TIMESTAMP;

-- Current date
SELECT CURRENT_DATE;

-- Extract parts
SELECT
  EXTRACT(YEAR FROM created_at) AS year,
  EXTRACT(MONTH FROM created_at) AS month,
  EXTRACT(DAY FROM created_at) AS day
FROM users;

-- Format dates
SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS formatted_date FROM users;

-- Date arithmetic
SELECT created_at, created_at + INTERVAL '7 days' AS week_later FROM users;

-- Age calculation
SELECT AGE(created_at) FROM users;

-- Users created in last 30 days
SELECT * FROM users
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Group by month
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS signups
FROM users
GROUP BY month
ORDER BY month;
```

## Aliasing

Use AS to give columns or tables readable names:

```sql
-- Column alias
SELECT username AS user, email AS contact FROM users;

-- Alias without AS (works but less clear)
SELECT username user, email contact FROM users;

-- Table alias (useful for joins, covered later)
SELECT u.username, u.email
FROM users u
WHERE u.age > 25;

-- Alias for expressions
SELECT COUNT(*) AS total_users FROM users;

-- Alias required for complex expressions
SELECT
  age,
  CASE
    WHEN age < 18 THEN 'minor'
    WHEN age < 65 THEN 'adult'
    ELSE 'senior'
  END AS age_group
FROM users;
```

## CASE Expressions

Conditional logic in queries:

```sql
SELECT
  username,
  age,
  CASE
    WHEN age < 18 THEN 'Minor'
    WHEN age < 25 THEN 'Young Adult'
    WHEN age < 65 THEN 'Adult'
    ELSE 'Senior'
  END AS age_category
FROM users;

-- Simple CASE
SELECT
  username,
  CASE age
    WHEN 18 THEN 'Just turned adult'
    WHEN 21 THEN 'Legal drinking age'
    WHEN 65 THEN 'Retirement age'
    ELSE 'Other age'
  END AS age_note
FROM users;

-- CASE in aggregates
SELECT
  COUNT(CASE WHEN age < 18 THEN 1 END) AS minors,
  COUNT(CASE WHEN age >= 18 AND age < 65 THEN 1 END) AS adults,
  COUNT(CASE WHEN age >= 65 THEN 1 END) AS seniors
FROM users;
```

## NULL Handling

NULL represents missing or unknown data. It behaves differently than other values:

```sql
-- NULLs are not equal to anything, including NULL
SELECT * FROM users WHERE age = NULL;  -- Returns nothing!
SELECT * FROM users WHERE age IS NULL;  -- Correct way

-- NULL in expressions
SELECT 5 + NULL;  -- Returns NULL
SELECT 'Hello ' || NULL;  -- Returns NULL

-- COALESCE: Return first non-NULL value
SELECT username, COALESCE(age, 0) AS age FROM users;

-- NULLIF: Return NULL if two values equal
SELECT NULLIF(age, 0) FROM users;  -- NULL if age is 0, otherwise age

-- Count only non-NULL values
SELECT COUNT(age) FROM users;  -- Excludes NULL ages
SELECT COUNT(*) FROM users;    -- Includes all rows
```

## Practical Examples

### User Registration Report

```sql
SELECT
  DATE_TRUNC('day', created_at) AS signup_date,
  COUNT(*) AS new_users,
  AVG(age) AS avg_age
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY signup_date
ORDER BY signup_date DESC;
```

### Find Duplicates

```sql
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```

### Clean Up Data

```sql
-- Standardize email addresses
UPDATE users SET email = LOWER(TRIM(email));

-- Fix null ages to 0
UPDATE users SET age = 0 WHERE age IS NULL;

-- Remove old inactive users
DELETE FROM users
WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
  AND deleted_at IS NOT NULL;
```

### Export Data

```sql
-- Get data for CSV export
SELECT
  id,
  username,
  email,
  age,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
FROM users
ORDER BY id;
```

## Common Mistakes

**Forgetting WHERE in UPDATE/DELETE**: This affects all rows. Always double-check.

**NULL comparison with =**: Use `IS NULL`, not `= NULL`.

**Not considering NULL in aggregates**: `AVG(age)` ignores NULL ages. If that's not what you want, use `COALESCE`.

**Selecting * in production**: Specify columns. Tables change over time.

**No ORDER BY for pagination**: OFFSET/LIMIT without ORDER BY gives unpredictable results.

**Case sensitivity**: PostgreSQL is case-sensitive in strings. Use `ILIKE` for case-insensitive matching.

## Testing Queries Safely

Before running updates or deletes in production:

```sql
-- Wrap in a transaction
BEGIN;
  DELETE FROM users WHERE age < 18;
  -- Check what happened
  SELECT * FROM users;
  -- If wrong, rollback
ROLLBACK;
  -- If correct, commit
  -- COMMIT;
```

Or use a read-only transaction:

```sql
BEGIN TRANSACTION READ ONLY;
  SELECT * FROM users WHERE age < 18;
ROLLBACK;
```

These basic SQL operations handle most daily database work. You can create tables, add data, query it, update it, and delete it. Next, we'll look at database design - how to structure tables and relationships so your data stays consistent and your queries stay fast.
