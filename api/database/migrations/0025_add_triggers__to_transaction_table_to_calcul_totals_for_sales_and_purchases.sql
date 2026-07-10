-- Migration number: 0025 	 2026-07-10T00:28:27.857Z

ALTER TABLE sales ADD COLUMN total_amount_received NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN total_amount_expensed NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE purchases ADD COLUMN total_amount_paid NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE projects ADD COLUMN total_amount_received NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN total_amount_expensed NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN total_amount_saled NUMERIC NOT NULL DEFAULT 0;

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
    SET total_amount_paid = total_amount_paid + NEW.amount
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

    UPDATE projects
    SET total_amount_expensed = total_amount_expensed + NEW.amount
    WHERE uid = NEW.project_uid
      AND NEW.project_uid IS NOT NULL
      AND (NEW.sale_uid IS NULL OR NEW.sale_uid = '')
      AND NEW.type = '-';

END;