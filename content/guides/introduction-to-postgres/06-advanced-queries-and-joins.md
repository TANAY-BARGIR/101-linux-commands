---
title: Advanced Queries and Joins
description: Learn to combine data from multiple tables with joins, subqueries, and window functions
order: 6
---

**TLDR**: Use INNER JOIN to combine related rows from two tables. LEFT JOIN includes all rows from the first table even if there's no match. Subqueries let you nest queries. Window functions perform calculations across rows without grouping. CTEs make complex queries readable.

Most real queries need data from multiple tables. Joins combine tables based on relationships.

## Understanding Joins

Given two tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50)
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(200)
);

INSERT INTO users (id, username) VALUES (1, 'alice'), (2, 'bob'), (3, 'carol');
INSERT INTO posts (user_id, title) VALUES
  (1, 'Alice First Post'),
  (1, 'Alice Second Post'),
  (2, 'Bob Post');
```

Users:
```
 id | username
----+----------
  1 | alice
  2 | bob
  3 | carol
```

Posts:
```
 id | user_id | title
----+---------+-------------------
  1 |       1 | Alice First Post
  2 |       1 | Alice Second Post
  3 |       2 | Bob Post
```

## INNER JOIN

Returns only matching rows:

```sql
SELECT users.username, posts.title
FROM users
INNER JOIN posts ON users.id = posts.user_id;
```

Result:
```
 username |       title
----------+-------------------
 alice    | Alice First Post
 alice    | Alice Second Post
 bob      | Bob Post
```

Carol doesn't appear - she has no posts.

Table aliases make queries shorter:

```sql
SELECT u.username, p.title
FROM users u
INNER JOIN posts p ON u.id = p.user_id;
```

## LEFT JOIN

Returns all rows from the left table, with NULLs for non-matches:

```sql
SELECT u.username, p.title
FROM users u
LEFT JOIN posts p ON u.id = p.user_id;
```

Result:
```
 username |       title
----------+-------------------
 alice    | Alice First Post
 alice    | Alice Second Post
 bob      | Bob Post
 carol    | NULL
```

Carol appears even though she has no posts.

Find users with no posts:

```sql
SELECT u.username
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE p.id IS NULL;
```

## RIGHT JOIN

Opposite of LEFT JOIN - all rows from right table:

```sql
SELECT u.username, p.title
FROM posts p
RIGHT JOIN users u ON u.id = p.user_id;
```

Same result as LEFT JOIN with tables swapped. Most people prefer LEFT JOIN for consistency.

## FULL OUTER JOIN

All rows from both tables:

```sql
SELECT u.username, p.title
FROM users u
FULL OUTER JOIN posts p ON u.id = p.user_id;
```

Rarely needed, but useful for finding unmatched rows in either table.

## Multiple Joins

Join more than two tables:

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  user_id INTEGER REFERENCES users(id),
  content TEXT
);

INSERT INTO comments (post_id, user_id, content) VALUES
  (1, 2, 'Great post!'),
  (1, 3, 'Thanks for sharing');

SELECT
  p.title AS post_title,
  u.username AS author,
  c.content AS comment,
  cu.username AS commenter
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN comments c ON c.post_id = p.id
JOIN users cu ON c.user_id = cu.id;
```

Result:
```
    post_title    | author | comment           | commenter
------------------+--------+-------------------+-----------
 Alice First Post | alice  | Great post!       | bob
 Alice First Post | alice  | Thanks for sharing| carol
```

## Self Joins

Join a table to itself:

```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  manager_id INTEGER REFERENCES employees(id)
);

INSERT INTO employees (name, manager_id) VALUES
  ('CEO', NULL),
  ('VP Sales', 1),
  ('VP Engineering', 1),
  ('Sales Rep', 2),
  ('Developer', 3);

-- Find employees and their managers
SELECT
  e.name AS employee,
  m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

Result:
```
    employee     | manager
-----------------+---------
 CEO             | NULL
 VP Sales        | CEO
 VP Engineering  | CEO
 Sales Rep       | VP Sales
 Developer       | VP Engineering
```

## Subqueries

Queries within queries.

### Subquery in WHERE

```sql
-- Posts by users with more than 5 posts
SELECT title
FROM posts
WHERE user_id IN (
  SELECT user_id
  FROM posts
  GROUP BY user_id
  HAVING COUNT(*) > 5
);
```

### Subquery in SELECT

```sql
SELECT
  u.username,
  (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS post_count
FROM users u;
```

Result:
```
 username | post_count
----------+------------
 alice    |          2
 bob      |          1
 carol    |          0
```

### Subquery in FROM

```sql
SELECT avg_posts.username, avg_posts.post_count
FROM (
  SELECT u.username, COUNT(p.id) AS post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  GROUP BY u.username
) AS avg_posts
WHERE avg_posts.post_count > 0;
```

## Common Table Expressions (CTEs)

CTEs make complex queries readable. Use `WITH`:

```sql
WITH user_post_counts AS (
  SELECT u.id, u.username, COUNT(p.id) AS post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  GROUP BY u.id, u.username
)
SELECT * FROM user_post_counts WHERE post_count > 1;
```

Multiple CTEs:

```sql
WITH active_users AS (
  SELECT * FROM users WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
),
recent_posts AS (
  SELECT * FROM posts WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
)
SELECT u.username, COUNT(p.id) AS recent_post_count
FROM active_users u
LEFT JOIN recent_posts p ON u.id = p.user_id
GROUP BY u.username;
```

## Window Functions

Perform calculations across related rows without GROUP BY.

### ROW_NUMBER

```sql
SELECT
  username,
  created_at,
  ROW_NUMBER() OVER (ORDER BY created_at) AS signup_order
FROM users;
```

Result:
```
 username | created_at          | signup_order
----------+---------------------+--------------
 alice    | 2024-01-01 10:00:00 | 1
 bob      | 2024-01-02 11:00:00 | 2
 carol    | 2024-01-03 12:00:00 | 3
```

### RANK and DENSE_RANK

```sql
SELECT
  username,
  post_count,
  RANK() OVER (ORDER BY post_count DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY post_count DESC) AS dense_rank
FROM (
  SELECT u.username, COUNT(p.id) AS post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  GROUP BY u.username
) user_posts;
```

### PARTITION BY

Calculate within groups:

```sql
SELECT
  p.title,
  u.username,
  p.views,
  AVG(p.views) OVER (PARTITION BY u.id) AS user_avg_views
FROM posts p
JOIN users u ON p.user_id = u.id;
```

Shows each post's views and the user's average views across all their posts.

### LAG and LEAD

Access previous/next row values:

```sql
SELECT
  title,
  created_at,
  LAG(created_at) OVER (ORDER BY created_at) AS prev_post_date,
  LEAD(created_at) OVER (ORDER BY created_at) AS next_post_date
FROM posts;
```

Useful for calculating time between events.

## UNION and UNION ALL

Combine results from multiple queries:

```sql
SELECT username AS name, 'user' AS type FROM users
UNION ALL
SELECT title AS name, 'post' AS type FROM posts;
```

`UNION` removes duplicates, `UNION ALL` keeps them (faster).

## Practical Examples

### Find top authors:

```sql
SELECT
  u.username,
  COUNT(p.id) AS post_count,
  SUM(p.views) AS total_views
FROM users u
JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username
ORDER BY total_views DESC
LIMIT 10;
```

### Posts with most comments:

```sql
SELECT
  p.title,
  u.username AS author,
  COUNT(c.id) AS comment_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.title, u.username
ORDER BY comment_count DESC
LIMIT 5;
```

### User activity summary:

```sql
WITH user_stats AS (
  SELECT
    u.id,
    u.username,
    COUNT(DISTINCT p.id) AS posts,
    COUNT(DISTINCT c.id) AS comments
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  LEFT JOIN comments c ON c.user_id = u.id
  GROUP BY u.id, u.username
)
SELECT
  username,
  posts,
  comments,
  posts + comments AS total_activity
FROM user_stats
ORDER BY total_activity DESC;
```

Understanding joins and these advanced query techniques lets you extract exactly the data you need. Next, we'll explore indexes - how to make these queries fast even with millions of rows.
