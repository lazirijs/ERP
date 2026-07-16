-- Migration number: 0029 	 Add contact and address to clients
ALTER TABLE clients ADD COLUMN contact TEXT DEFAULT '';
ALTER TABLE clients ADD COLUMN address TEXT DEFAULT '';
