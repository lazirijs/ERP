-- Migration number: 0027 	 2026-07-10T01:33:06.001Z

-- Drop old trigger
DROP TRIGGER transactions_calculate_total_amounts;

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
    SET total_amount_sold = total_amount_sold + NEW.amount
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