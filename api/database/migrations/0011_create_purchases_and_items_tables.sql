-- Migration number: 0011 	 Create purchases and purchase_items tables
CREATE TABLE purchases (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    supplier_uid TEXT REFERENCES suppliers(uid),
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE purchase_items (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    purchase_uid TEXT NOT NULL REFERENCES purchases(uid) ON DELETE CASCADE,
    product_uid TEXT NOT NULL REFERENCES products(uid),
    price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 1,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
