-- Migration number: 0024 	 2026-07-09T23:40:02.577Z

ALTER TABLE transactions DROP COLUMN purchase_uid;
ALTER TABLE transactions ADD COLUMN purchase_uid REFERENCES purchases(uid) DEFAULT NULL;