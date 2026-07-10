-- Migration number: 0026 	 2026-07-10T01:20:43.459Z

-- Drop old trigger
DROP TRIGGER transactions_calculate_total_amounts;

-- Change purchases.total_amount_paid column name to total_amount_expensed
ALTER TABLE purchases DROP COLUMN total_amount_paid;
ALTER TABLE purchases ADD COLUMN total_amount_expensed NUMERIC NOT NULL DEFAULT 0;

-- Recreate it with new infos
CREATE TRIGGER transactions_calculate_total_amounts
AFTER INSERT ON transactions
BEGIN

    UPDATE sales
    SET total_amount_received = total_amount_received + NEW.amount
    WHERE uid = NEW.sale_uid
      AND NEW.sale_uid IS NOT NULL
      AND NEW.type = '+';

    UPDATE sales
    SET total_amount_expensed = total_amount_expensed + NEW.amount
    WHERE uid = NEW.sale_uid
      AND NEW.sale_uid IS NOT NULL
      AND NEW.type = '-';

    UPDATE purchases
    SET total_amount_expensed = total_amount_expensed + NEW.amount
    WHERE uid = NEW.purchase_uid
      AND NEW.purchase_uid IS NOT NULL
      AND NEW.type = '-';

    UPDATE projects
    SET total_amount_saled = total_amount_saled + NEW.amount
    WHERE uid = NEW.project_uid
      AND NEW.sale_uid IS NOT NULL
      AND NEW.type = '+';

    UPDATE projects
    SET total_amount_received = total_amount_received + NEW.amount
    WHERE uid = NEW.project_uid
      AND NEW.project_uid IS NOT NULL
      AND (NEW.sale_uid IS NULL OR NEW.sale_uid = '')
      AND NEW.type = '+';

    -- Add sales expense to projects
    UPDATE projects
    SET total_amount_expensed = total_amount_expensed + NEW.amount
    WHERE uid = NEW.project_uid
      AND NEW.project_uid IS NOT NULL
      AND NEW.sale_uid IS NOT NULL
      AND NEW.type = '-';

    UPDATE projects
    SET total_amount_expensed = total_amount_expensed + NEW.amount
    WHERE uid = NEW.project_uid
      AND NEW.project_uid IS NOT NULL
      AND (NEW.sale_uid IS NULL OR NEW.sale_uid = '')
      AND NEW.type = '-';

END;