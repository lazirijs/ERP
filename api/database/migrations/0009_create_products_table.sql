-- Migration number: 0009 	 Create products table
CREATE TABLE products (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
