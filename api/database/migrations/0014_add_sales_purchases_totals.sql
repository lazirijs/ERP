-- Migration number: 0014 	 Denormalize total_amount + items_count on purchases/sales, maintained by triggers
ALTER TABLE purchases ADD COLUMN total_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN items_count  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sales     ADD COLUMN total_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE sales     ADD COLUMN items_count  INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing items
UPDATE purchases SET
    total_amount = COALESCE((SELECT SUM(price * quantity) FROM purchase_items WHERE purchase_uid = purchases.uid), 0),
    items_count  = COALESCE((SELECT COUNT(*)              FROM purchase_items WHERE purchase_uid = purchases.uid), 0);
UPDATE sales SET
    total_amount = COALESCE((SELECT SUM(price * quantity) FROM sale_items WHERE sale_uid = sales.uid), 0),
    items_count  = COALESCE((SELECT COUNT(*)              FROM sale_items WHERE sale_uid = sales.uid), 0);

-- purchase_items => purchases totals
CREATE TRIGGER purchase_items_totals_ai AFTER INSERT ON purchase_items BEGIN
    UPDATE purchases SET total_amount = total_amount + (NEW.price * NEW.quantity), items_count = items_count + 1 WHERE uid = NEW.purchase_uid;
END;
CREATE TRIGGER purchase_items_totals_ad AFTER DELETE ON purchase_items BEGIN
    UPDATE purchases SET total_amount = total_amount - (OLD.price * OLD.quantity), items_count = items_count - 1 WHERE uid = OLD.purchase_uid;
END;
CREATE TRIGGER purchase_items_totals_au AFTER UPDATE ON purchase_items BEGIN
    UPDATE purchases SET total_amount = total_amount - (OLD.price * OLD.quantity), items_count = items_count - 1 WHERE uid = OLD.purchase_uid;
    UPDATE purchases SET total_amount = total_amount + (NEW.price * NEW.quantity), items_count = items_count + 1 WHERE uid = NEW.purchase_uid;
END;

-- sale_items => sales totals
CREATE TRIGGER sale_items_totals_ai AFTER INSERT ON sale_items BEGIN
    UPDATE sales SET total_amount = total_amount + (NEW.price * NEW.quantity), items_count = items_count + 1 WHERE uid = NEW.sale_uid;
END;
CREATE TRIGGER sale_items_totals_ad AFTER DELETE ON sale_items BEGIN
    UPDATE sales SET total_amount = total_amount - (OLD.price * OLD.quantity), items_count = items_count - 1 WHERE uid = OLD.sale_uid;
END;
CREATE TRIGGER sale_items_totals_au AFTER UPDATE ON sale_items BEGIN
    UPDATE sales SET total_amount = total_amount - (OLD.price * OLD.quantity), items_count = items_count - 1 WHERE uid = OLD.sale_uid;
    UPDATE sales SET total_amount = total_amount + (NEW.price * NEW.quantity), items_count = items_count + 1 WHERE uid = NEW.sale_uid;
END;
