-- Migration number: 0002 	 2026-04-25T20:03:56.898Z

-- Clients table
CREATE TABLE clients (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Regions table
CREATE TABLE regions (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_uid REFERENCES clients(uid),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Categories table
CREATE TABLE categories (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    parent_uid REFERENCES categories(uid),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Projects table
CREATE TABLE projects (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_uid REFERENCES clients(uid),
    region_uid REFERENCES regions(uid),
    category_uid REFERENCES categories(uid),
    name TEXT NOT NULL,
    status INTEGER,
    offer DECIMAL,
    competitor_name TEXT,
    competitor_offer DECIMAL,
    guarantee_amount DECIMAL,
    note TEXT,
    description TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);