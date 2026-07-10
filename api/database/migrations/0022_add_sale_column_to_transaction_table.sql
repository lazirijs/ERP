-- Migration number: 0022 	 2026-07-09T16:34:35.072Z

ALTER TABLE transactions ADD COLUMN sale_uid REFERENCES sales(uid) DEFAULT NULL;