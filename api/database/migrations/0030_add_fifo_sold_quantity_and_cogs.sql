-- Migration number: 0030 	 Add FIFO sold_quantity to purchase_items and per-line COGS to sale_items
--
-- `purchase_items.sold_quantity` is the FIFO cursor: how much of a purchase lot has
-- already been consumed by COMPLETED sales. Available lot capacity = quantity - sold_quantity.
--
-- `sale_items.cost` is the per-unit cost of goods sold, frozen at the moment the sale is
-- completed (status 0 -> 1). Profit for a line = (price - cost) * quantity.
--
-- Both are maintained in the API layer (see modules/sales/db.ts completeSale), not by
-- triggers, because FIFO allocation is order-dependent and easier to express and test there.

ALTER TABLE purchase_items ADD COLUMN sold_quantity NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN cost NUMERIC NOT NULL DEFAULT 0;
