-- Migration number: 0007 	 2026-10-13T18:38:38.639Z

CREATE TABLE attendance_registers (
  attendance_uid REFERENCES attendances(uid),
  employee_uid REFERENCES employees(uid),
  project_uid REFERENCES projects(uid),
  status INTEGER NOT NULL CHECK(status IN (0, 1)),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (attendance_uid, employee_uid)
);