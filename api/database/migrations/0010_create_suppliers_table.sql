-- Migration number: 0010 	 Create suppliers table
CREATE TABLE suppliers (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
