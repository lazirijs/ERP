-- Migration number: 0032 	 Add status to users (1 = active [default], 0 = inactive, 2 = suspended)

ALTER TABLE users ADD COLUMN status INTEGER NOT NULL DEFAULT 1 CHECK(status IN (0, 1, 2));
