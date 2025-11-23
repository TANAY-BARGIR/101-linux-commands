---
title: Data Types and Constraints in PostgreSQL
description: Learn PostgreSQL's data types and how to use constraints to enforce data integrity
order: 5
---

**TLDR**: Choose appropriate data types for each column - INTEGER for whole numbers, TEXT for strings, TIMESTAMP for dates. Use constraints (NOT NULL, UNIQUE, CHECK, FOREIGN KEY) to enforce data rules at the database level. Constraints prevent invalid data from entering the database.

PostgreSQL offers many data types and constraint options. Choosing correctly prevents bugs and improves performance.

## Numeric Types

### Integers

```sql
CREATE TABLE products (
  id SERIAL,              -- Auto-incrementing 4-byte int (1 to 2 billion)
  small_count SMALLINT,   -- 2 bytes (-32K to 32K)
  regular_count INTEGER,  -- 4 bytes (-2B to 2B)
  big_count BIGINT        -- 8 bytes (-9 quintillion to 9 quintillion)
);
```

Use:
- `SMALLINT` for counts under 32,000
- `INTEGER` for most purposes
- `BIGINT` for large counts or when integers might grow huge
- `SERIAL`, `BIGSERIAL` for auto-incrementing primary keys

### Decimal Numbers

```sql
CREATE TABLE finances (
  price DECIMAL(10, 2),        -- Exactly 10 digits, 2 after decimal: 12345678.90
  precise_value NUMERIC(15, 5), -- Same as DECIMAL
  approx_value REAL,           -- 4-byte floating point (6 decimal digits precision)
  scientific DOUBLE PRECISION  -- 8-byte floating point (15 decimal digits)
);
```

Use:
- `DECIMAL`/`NUMERIC` for money (exact values)
- `REAL`/`DOUBLE PRECISION` for scientific calculations (approximate)

Never use floating point for currency - rounding errors accumulate.

## Character Types

```sql
CREATE TABLE texts (
  fixed_code CHAR(5),          -- Always 5 characters, padded with spaces
  variable_name VARCHAR(100),  -- Up to 100 characters
  unlimited_text TEXT          -- Unlimited length
);
```

Use:
- `CHAR(n)` for fixed-length codes (country codes, status flags)
- `VARCHAR(n)` when you want length limits
- `TEXT` for most text (no performance difference from VARCHAR)

PostgreSQL handles all three efficiently. `TEXT` is often the simplest choice.

## Date and Time Types

```sql
CREATE TABLE events (
  event_date DATE,                    -- Just the date: 2024-02-14
  event_time TIME,                    -- Just the time: 14:30:00
  event_timestamp TIMESTAMP,          -- Date and time: 2024-02-14 14:30:00
  event_timestamptz TIMESTAMPTZ,      -- With timezone: 2024-02-14 14:30:00-05
  duration INTERVAL                   -- Time span: 2 days 3 hours
);
```

**Always use `TIMESTAMPTZ`** for timestamps. It stores in UTC and converts to local time zones automatically.

```sql
-- Set timezone
SET timezone = 'America/New_York';

INSERT INTO events (event_timestamptz)
VALUES ('2024-02-14 14:30:00');  -- Interpreted as New York time

-- Query returns in current timezone
SELECT event_timestamptz FROM events;
-- 2024-02-14 14:30:00-05

-- Change timezone
SET timezone = 'Europe/London';
SELECT event_timestamptz FROM events;
-- 2024-02-14 19:30:00+00  -- Same moment, different display
```

## Boolean Type

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- Query
SELECT * FROM users WHERE is_active = TRUE;
SELECT * FROM users WHERE NOT email_verified;
```

Stores TRUE, FALSE, or NULL.

## JSON Types

PostgreSQL excels at JSON:

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  data JSON,      -- Text storage, slower
  metadata JSONB  -- Binary storage, faster, supports indexing
);

INSERT INTO documents (metadata)
VALUES ('{"name": "John", "age": 30, "tags": ["developer", "postgres"]}');

-- Query JSON
SELECT metadata->>'name' AS name FROM documents;
SELECT * FROM documents WHERE metadata->>'age' = '30';
SELECT * FROM documents WHERE metadata @> '{"tags": ["postgres"]}';
```

Use `JSONB` for:
- Flexible schemas
- Nested data structures
- API responses
- Configuration data

## Array Types

PostgreSQL supports arrays of any type:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  tags TEXT[],
  view_counts INTEGER[]
);

INSERT INTO posts (title, tags, view_counts)
VALUES ('PostgreSQL Guide', ARRAY['database', 'tutorial'], ARRAY[100, 150, 200]);

-- Query arrays
SELECT * FROM posts WHERE 'database' = ANY(tags);
SELECT * FROM posts WHERE tags @> ARRAY['database'];
```

Useful for short lists, but consider separate tables for complex relationships.

## UUID Type

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER,
  data JSONB
);
```

UUIDs are 128-bit globally unique identifiers. Good for distributed systems.

## Constraints

Constraints enforce data rules.

### NOT NULL

Require a value:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  bio TEXT  -- Can be NULL
);

-- This fails
INSERT INTO users (bio) VALUES ('My bio');
-- ERROR: null value in column "username" violates not-null constraint
```

Make columns NOT NULL unless NULL has clear meaning ("unknown" not "empty").

### UNIQUE

Prevent duplicates:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE
);

-- This fails
INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com');
INSERT INTO users (username, email) VALUES ('alice', 'different@example.com');
-- ERROR: duplicate key value violates unique constraint
```

Create multi-column unique constraints:

```sql
CREATE TABLE enrollments (
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  UNIQUE (student_id, course_id)  -- Each student can enroll once per course
);
```

### CHECK

Validate data:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100)
);

-- This fails
INSERT INTO products (name, price, stock) VALUES ('Widget', -10.00, 5);
-- ERROR: new row violates check constraint "products_price_check"
```

Complex checks:

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CHECK (end_date >= start_date)
);
```

### DEFAULT

Set default values:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status and views use defaults
INSERT INTO posts (title) VALUES ('My Post');
```

### PRIMARY KEY

Uniquely identifies rows:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50)
);

-- Equivalent to:
CREATE TABLE users (
  id SERIAL NOT NULL UNIQUE,
  username VARCHAR(50)
);
```

Composite primary keys:

```sql
CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  PRIMARY KEY (order_id, product_id)
);
```

### FOREIGN KEY

Maintain referential integrity (covered in previous section):

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

## Generated Columns

Computed values:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(4, 3) NOT NULL DEFAULT 0.075,
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (price * (1 + tax_rate)) STORED
);

INSERT INTO products (price) VALUES (100.00);
SELECT * FROM products;
-- price: 100.00, tax_rate: 0.075, total_price: 107.50
```

Use for values that are always calculated from other columns.

## Altering Tables

Add constraints to existing tables:

```sql
-- Add NOT NULL
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Add UNIQUE
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Add CHECK
ALTER TABLE products ADD CONSTRAINT positive_price CHECK (price >= 0);

-- Add DEFAULT
ALTER TABLE posts ALTER COLUMN status SET DEFAULT 'draft';

-- Add column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Drop constraint
ALTER TABLE users DROP CONSTRAINT users_email_key;

-- Rename column
ALTER TABLE users RENAME COLUMN phone TO phone_number;

-- Change column type
ALTER TABLE users ALTER COLUMN age TYPE SMALLINT;
```

## Choosing the Right Type

- **IDs**: `SERIAL` or `BIGSERIAL` for auto-incrementing, `UUID` for distributed systems
- **Money**: `DECIMAL(10, 2)` or appropriate precision
- **Short text**: `TEXT` or `VARCHAR(n)` if you want limits
- **Long text**: `TEXT`
- **Timestamps**: `TIMESTAMPTZ`
- **Flags**: `BOOLEAN`
- **Flexible data**: `JSONB`
- **Small integers**: `SMALLINT` if range is limited, otherwise `INTEGER`

## Common Patterns

### Email validation:

```sql
ALTER TABLE users ADD CONSTRAINT valid_email
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
```

### Enum-like constraints:

```sql
ALTER TABLE orders ADD CONSTRAINT valid_status
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));
```

### Phone numbers:

```sql
-- Store as text, enforce format
ALTER TABLE users ADD CONSTRAINT valid_phone
  CHECK (phone ~ '^\+?[1-9]\d{1,14}$');
```

Constraints catch errors early, before they corrupt your data. Use them liberally. Next, we'll explore advanced queries and joins - how to retrieve data from multiple tables efficiently.
