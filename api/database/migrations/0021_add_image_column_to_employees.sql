-- Migration number: 0021 	 Add profile picture (image) column to employees
ALTER TABLE employees ADD COLUMN image TEXT DEFAULT NULL;
