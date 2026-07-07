-- Migration number: 0013 	 Add products.quantity stock, maintained by triggers on purchase_items/sale_items
ALTER TABLE products ADD COLUMN quantity NUMERIC NOT NULL DEFAULT 0;

-- Backfill existing stock from prior purchases/sales
UPDATE products SET quantity =
    COALESCE((SELECT SUM(quantity) FROM purchase_items WHERE product_uid = products.uid), 0)
  - COALESCE((SELECT SUM(quantity) FROM sale_items     WHERE product_uid = products.uid), 0);

-- purchase_items => stock IN
CREATE TRIGGER purchase_items_ai AFTER INSERT ON purchase_items BEGIN
    UPDATE products SET quantity = quantity + NEW.quantity WHERE uid = NEW.product_uid;
END;
CREATE TRIGGER purchase_items_ad AFTER DELETE ON purchase_items BEGIN
    UPDATE products SET quantity = quantity - OLD.quantity WHERE uid = OLD.product_uid;
END;
CREATE TRIGGER purchase_items_au AFTER UPDATE ON purchase_items BEGIN
    UPDATE products SET quantity = quantity - OLD.quantity WHERE uid = OLD.product_uid;
    UPDATE products SET quantity = quantity + NEW.quantity WHERE uid = NEW.product_uid;
END;

-- sale_items => stock OUT
CREATE TRIGGER sale_items_ai AFTER INSERT ON sale_items BEGIN
    UPDATE products SET quantity = quantity - NEW.quantity WHERE uid = NEW.product_uid;
END;
CREATE TRIGGER sale_items_ad AFTER DELETE ON sale_items BEGIN
    UPDATE products SET quantity = quantity + OLD.quantity WHERE uid = OLD.product_uid;
END;
CREATE TRIGGER sale_items_au AFTER UPDATE ON sale_items BEGIN
    UPDATE products SET quantity = quantity + OLD.quantity WHERE uid = OLD.product_uid;
    UPDATE products SET quantity = quantity - NEW.quantity WHERE uid = NEW.product_uid;
END;
