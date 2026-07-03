-- Migration number: 0003 	 2026-05-09T23:08:14.020Z

-- Accounts table
CREATE TABLE accounts (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    monthly_balance NUMERIC,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Employees table
CREATE TABLE employees (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    status INTEGER NOT NULL CHECK(status IN (0, 1, 2, 3)),
    vacation_start_at TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Teams table
CREATE TABLE teams (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    supervisor_uid REFERENCES employees(uid),
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Transactions table
CREATE TABLE transactions (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    project_uid REFERENCES projects(uid),
    account_uid REFERENCES accounts(uid) DEFAULT NULL,
    employee_uid REFERENCES employees(uid) DEFAULT NULL,
    type TEXT NOT NULL CHECK(type IN ('+', '-')),
    amount NUMERIC NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
