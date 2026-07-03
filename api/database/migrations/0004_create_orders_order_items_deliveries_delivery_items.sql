-- Migration number: 0004 	 2026-05-11T22:12:00.000Z

-- Orders table
CREATE TABLE orders (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    project_uid REFERENCES projects(uid),
    name TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 0 CHECK(status IN (0, 1)),
    note TEXT DEFAULT '',
    search_vector TEXT GENERATED ALWAYS AS (lower(name)) STORED,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Order items table
CREATE TABLE order_items (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_uid REFERENCES orders(uid),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    requested_quantity NUMERIC NOT NULL,
    note TEXT DEFAULT '',
    search_vector TEXT GENERATED ALWAYS AS (lower(name)) STORED,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Deliveries table
CREATE TABLE deliveries (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_uid REFERENCES orders(uid),
    name TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 0 CHECK(status IN (0, 1)),
    note TEXT DEFAULT '',
    search_vector TEXT GENERATED ALWAYS AS (lower(name)) STORED,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Delivery items table
CREATE TABLE delivery_items (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    delivery_uid REFERENCES deliveries(uid),
    item_uid REFERENCES order_items(uid),
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    note TEXT DEFAULT '',
    search_vector TEXT GENERATED ALWAYS AS (lower(note)) STORED,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
