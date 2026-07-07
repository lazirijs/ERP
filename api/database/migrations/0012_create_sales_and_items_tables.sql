-- Migration number: 0012 	 Create sales and sale_items tables
CREATE TABLE sales (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT DEFAULT '',
    project_uid TEXT REFERENCES projects(uid),
    client_uid TEXT REFERENCES clients(uid),
    status INTEGER NOT NULL DEFAULT 0 CHECK(status IN (0, 1)),
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE sale_items (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sale_uid TEXT NOT NULL REFERENCES sales(uid) ON DELETE CASCADE,
    product_uid TEXT NOT NULL REFERENCES products(uid),
    price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 1,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
