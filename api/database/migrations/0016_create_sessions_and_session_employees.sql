-- Migration number: 0016 	 Create attendance sessions + session_employees with denormalized present/absence counters

CREATE TABLE sessions (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    date TEXT NOT NULL UNIQUE,                          -- 'YYYY-MM-DD', one session per calendar date
    note TEXT DEFAULT '',
    total_employees INTEGER NOT NULL DEFAULT 0,
    total_absence   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE session_employees (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_uid TEXT NOT NULL REFERENCES sessions(uid) ON DELETE CASCADE,
    employee_uid TEXT NOT NULL REFERENCES employees(uid),
    team_uid TEXT REFERENCES teams(uid),               -- snapshot, autofilled from employee.team_uid
    status INTEGER NOT NULL CHECK(status IN (0, 1)),   -- 0 present, 1 absent
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (session_uid, employee_uid)
);

-- Denormalized counters on sessions, maintained by triggers (mirrors 0014)
CREATE TRIGGER session_employees_totals_ai AFTER INSERT ON session_employees BEGIN
    UPDATE sessions SET
        total_employees = total_employees + 1,
        total_absence   = total_absence + (CASE WHEN NEW.status = 1 THEN 1 ELSE 0 END)
    WHERE uid = NEW.session_uid;
END;
CREATE TRIGGER session_employees_totals_ad AFTER DELETE ON session_employees BEGIN
    UPDATE sessions SET
        total_employees = total_employees - 1,
        total_absence   = total_absence - (CASE WHEN OLD.status = 1 THEN 1 ELSE 0 END)
    WHERE uid = OLD.session_uid;
END;
CREATE TRIGGER session_employees_totals_au AFTER UPDATE ON session_employees BEGIN
    UPDATE sessions SET
        total_absence = total_absence
            - (CASE WHEN OLD.status = 1 THEN 1 ELSE 0 END)
            + (CASE WHEN NEW.status = 1 THEN 1 ELSE 0 END)
    WHERE uid = NEW.session_uid;
END;
