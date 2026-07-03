-- Migration number: 0006 	 2026-05-26T18:38:38.639Z

CREATE TABLE attendances (
  uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);