---
title: Database Design and Schema Modeling
description: Learn how to design database schemas, create relationships, and normalize data effectively
order: 4
---

**TLDR**: Design schemas by identifying entities (users, products, orders) and their relationships. Use primary keys to identify rows uniquely and foreign keys to link tables. Normalize data to avoid duplication and anomalies. Create schemas (namespaces) to organize tables. Good design prevents data problems before they happen.

Database design determines how you model your application's data. Good design makes queries efficient and prevents data inconsistencies. Bad design leads to slow queries, duplicate data, and bugs that are hard to fix.

## Thinking About Entities and Relationships

Start by identifying the "things" your application tracks. These become tables.

For a blog:
- Users (who write posts)
- Posts (content users create)
- Comments (responses to posts)
- Tags (categories for posts)

Each entity becomes a table. The relationships between them determine your schema structure.

## Primary Keys

Every table needs a primary key - a column (or columns) that uniquely identifies each row.

### Auto-incrementing Integers

Most common approach:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL
);
```

`SERIAL` is shorthand for an auto-incrementing integer. PostgreSQL generates values automatically:

```sql
INSERT INTO users (username) VALUES ('alice');  -- id=1
INSERT INTO users (username) VALUES ('bob');    -- id=2
INSERT INTO users (username) VALUES ('carol');  -- id=3
```

Simple and efficient. Works for most tables.

### UUIDs

For distributed systems or when you don't want sequential IDs:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL
);
```

UUIDs are globally unique, so different servers can generate IDs without coordination. The tradeoff is they're larger (16 bytes vs 4) and less human-friendly.

### Natural Keys

Sometimes real-world identifiers work:

```sql
CREATE TABLE countries (
  code CHAR(2) PRIMARY KEY,  -- ISO country code: US, UK, FR
  name VARCHAR(100) NOT NULL
);
```

Only use natural keys when they're truly stable and unique. Email addresses seem unique but people change them. Product codes work if they never change.

## Foreign Keys

Foreign keys link tables together and enforce referential integrity.

### One-to-Many Relationships

A user has many posts:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT
);
```

The `REFERENCES users(id)` creates a foreign key. PostgreSQL enforces that every `user_id` in posts points to a real user:

```sql
-- This works - user 1 exists
INSERT INTO posts (user_id, title) VALUES (1, 'My Post');

-- This fails - user 999 doesn't exist
INSERT INTO posts (user_id, title) VALUES (999, 'Invalid');
```

Error:

```
ERROR: insert or update on table "posts" violates foreign key constraint
```

### Foreign Key Actions

Control what happens when referenced rows change:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL
);
```

Options for `ON DELETE`:

- `CASCADE`: Delete posts when user is deleted
- `SET NULL`: Set `user_id` to NULL (must allow NULL)
- `SET DEFAULT`: Set to a default value
- `RESTRICT` (default): Prevent deletion if posts exist
- `NO ACTION`: Same as RESTRICT

Similarly for `ON UPDATE`:

```sql
REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
```

Choose based on your data model:

```sql
-- Blog comments should disappear with posts
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT
);

-- Orders shouldn't be deleted when products change
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER
);
```

### Many-to-Many Relationships

Posts have many tags, tags apply to many posts. Use a junction table:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

The `post_tags` table links posts and tags. Its primary key is a composite key - the combination of both IDs must be unique.

Query posts with a specific tag:

```sql
SELECT p.*
FROM posts p
JOIN post_tags pt ON p.id = pt.post_id
WHERE pt.tag_id = 5;
```

Get all tags for a post:

```sql
SELECT t.*
FROM tags t
JOIN post_tags pt ON t.id = pt.tag_id
WHERE pt.post_id = 10;
```

### One-to-One Relationships

Less common but sometimes useful:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL
);

CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500)
);
```

Each user has at most one profile. The `user_id` is both a primary key and a foreign key.

Use one-to-one for:
- Splitting large tables for performance
- Optional related data not every row needs
- Implementing inheritance patterns

## Normalization

Normalization organizes data to avoid redundancy and anomalies.

### First Normal Form (1NF)

Each column contains atomic (indivisible) values. No repeating groups.

Bad:

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  products TEXT  -- "Widget, Gadget, Thing"
);
```

Problems:
- Can't query individual products
- Can't track quantities
- Hard to update product info

Good:

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_name VARCHAR(100),
  quantity INTEGER
);
```

### Second Normal Form (2NF)

No partial dependencies. Non-key columns depend on the entire primary key.

Bad (for composite keys):

```sql
CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  product_name VARCHAR(100),  -- Depends only on product_id, not order_id
  quantity INTEGER,
  PRIMARY KEY (order_id, product_id)
);
```

`product_name` depends only on `product_id`, not the full key.

Good:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  PRIMARY KEY (order_id, product_id)
);
```

### Third Normal Form (3NF)

No transitive dependencies. Non-key columns depend only on the primary key.

Bad:

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  customer_name VARCHAR(100),  -- Depends on customer_id, not order id
  customer_email VARCHAR(255)
);
```

`customer_name` and `customer_email` depend on `customer_id`, which depends on `id`. That's a transitive dependency.

Good:

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id)
);
```

### When to Denormalize

Sometimes duplication is okay for performance:

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  customer_name VARCHAR(100),  -- Denormalized for quick display
  total_amount DECIMAL(10, 2)  -- Calculated value cached here
);
```

Denormalize when:
- Joining is too slow
- Data rarely changes (customer names don't change often)
- Read performance matters more than write performance

Always denormalize intentionally, not accidentally.

## Schemas (Namespaces)

PostgreSQL schemas organize tables into namespaces. Don't confuse this with "database schema" (table structure).

### Creating Schemas

```sql
-- Create schemas for different parts of your app
CREATE SCHEMA auth;
CREATE SCHEMA blog;
CREATE SCHEMA analytics;

-- Create tables in schemas
CREATE TABLE auth.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL
);

CREATE TABLE blog.posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL,
  title VARCHAR(200)
);

CREATE TABLE analytics.pageviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  url VARCHAR(500)
);
```

Query with schema prefix:

```sql
SELECT * FROM auth.users;
SELECT * FROM blog.posts;
```

### Search Path

PostgreSQL searches schemas in order. The default search path is `public`:

```sql
-- Show current search path
SHOW search_path;
-- "$user", public

-- Set search path
SET search_path TO auth, blog, public;

-- Now queries check auth first, then blog, then public
SELECT * FROM users;  -- Finds auth.users
```

Set a default for a database:

```sql
ALTER DATABASE mydb SET search_path TO auth, blog, public;
```

Use schemas to:
- Organize related tables
- Separate concerns (auth vs core app vs analytics)
- Grant permissions per schema
- Avoid name conflicts

## Practical Schema Example

Here's a complete e-commerce schema:

```sql
-- Customer management
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products catalog
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders and fulfillment
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Addresses (one customer can have multiple addresses)
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  street VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  country VARCHAR(50) NOT NULL,
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE
);

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, customer_id)  -- One review per product per customer
);
```

This schema demonstrates:
- One-to-many (customers have many orders)
- Many-to-many (orders have many products via order_items)
- Self-referential (categories can have parent categories)
- Constraints for data integrity
- Calculated values (order total_amount)

## Database Diagrams

Visualize relationships:

```
customers                orders                  products
┌──────────┐           ┌──────────┐            ┌──────────┐
│id (PK)   │<────┐     │id (PK)   │       ┌───>│id (PK)   │
│email     │     │     │customer──┼───────┘    │name      │
│name      │     └─────┤   _id(FK)│            │price     │
└──────────┘           └──────────┘            └──────────┘
                             │                       ▲
                             │                       │
                             ▼                       │
                       order_items                   │
                       ┌──────────┐                  │
                       │id (PK)   │                  │
                       │order_id  │                  │
                       │  (FK)    │                  │
                       │product_id├──────────────────┘
                       │  (FK)    │
                       │quantity  │
                       │unit_price│
                       └──────────┘
```

Draw these before writing SQL. They clarify relationships and catch design issues early.

## Common Design Patterns

### Audit Columns

Track who changed what and when:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Update updated_at automatically with a trigger (covered later)
```

### Soft Deletes

Keep deleted records:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  deleted_at TIMESTAMP
);

-- "Delete" users
UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = 5;

-- Query only active users
SELECT * FROM users WHERE deleted_at IS NULL;
```

### Versioning

Track changes over time:

```sql
CREATE TABLE document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  title VARCHAR(200),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  UNIQUE (document_id, version)
);

-- Get latest version
SELECT * FROM document_versions
WHERE document_id = 10
ORDER BY version DESC
LIMIT 1;
```

### Polymorphic Associations

One table references multiple tables:

```sql
-- Comments on posts or photos
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  commentable_type VARCHAR(50),  -- 'post' or 'photo'
  commentable_id INTEGER,
  content TEXT
);

-- Query comments on a post
SELECT * FROM comments
WHERE commentable_type = 'post' AND commentable_id = 5;
```

This violates foreign key constraints (can't reference multiple tables). Consider separate tables or use inheritance features instead.

## Design Anti-Patterns to Avoid

**God Tables**: Tables with 50+ columns. Split into related tables.

**Entity-Attribute-Value (EAV)**: Generic key-value storage in SQL. Use JSONB instead or stick to structured columns.

**Too Many Joins**: If queries need 10+ joins, reconsider your design or denormalize.

**Overuse of NULL**: NULL means "unknown" not "zero" or "empty". Define clear meanings.

**Poor Naming**: Use clear, consistent names. `user_id` not `uid`. `created_at` not `cr_dt`.

## Planning Your Schema

Before writing CREATE TABLE:

1. **List entities**: What objects does your app manage?
2. **Identify attributes**: What properties does each entity have?
3. **Determine relationships**: How do entities relate?
4. **Choose primary keys**: Natural or surrogate?
5. **Add foreign keys**: Enforce relationships
6. **Normalize**: Remove duplication
7. **Consider denormalization**: Only for proven performance needs
8. **Add constraints**: Enforce data rules
9. **Plan indexes**: For common queries (covered later)

Good design up front prevents painful migrations later. Take time to get it right.

Next, we'll explore data types and constraints in detail - how to choose the right types for your columns and enforce data quality rules at the database level.
