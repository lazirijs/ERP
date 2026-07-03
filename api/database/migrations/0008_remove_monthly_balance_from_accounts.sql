-- Migration number: 0008 	 Remove monthly_balance from accounts
ALTER TABLE accounts DROP COLUMN monthly_balance;
