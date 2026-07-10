-- Migration number: 0023 	 2026-07-09T23:38:36.465Z

ALTER TABLE transactions ADD COLUMN purchase_uid REFERENCES sales(uid) DEFAULT NULL;