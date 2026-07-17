-- Migration number: 0033 	 Add indexes for foreign-key joins and default list sort
--
-- Until now the schema had no indexes at all: only the implicit autoindexes SQLite
-- creates for PRIMARY KEY / UNIQUE constraints. Parent lookups (JOIN ... ON x = parent.uid)
-- already ride those autoindexes, but two things fell back to full table scans:
--
--   1. Child-side foreign keys (sale_items.sale_uid, purchase_items.product_uid, ...):
--      every join/GROUP BY and every completeSale() FIFO pass scanned the whole child table.
--   2. The DataGrid list builder orders by created_at with no matching index, so each page
--      scanned + sorted the entire table (USE TEMP B-TREE FOR ORDER BY) to return 20 rows.
--
-- Indexes already covered by a constraint are intentionally omitted:
--   - role_permissions(role_uid): leading column of PK (role_uid, permission_uid).
--   - session_employees(session_uid): leading column of UNIQUE (session_uid, employee_uid).
--
-- created_at is stored as ISO-8601 text, so its lexicographic order is chronological and a
-- plain index on it satisfies ORDER BY created_at.

-- --- Foreign-key / join indexes ---

CREATE INDEX idx_sale_items_sale_uid            ON sale_items(sale_uid);
CREATE INDEX idx_sale_items_product_uid         ON sale_items(product_uid);

CREATE INDEX idx_purchase_items_purchase_uid    ON purchase_items(purchase_uid);
-- Composite: completeSale() filters by product and reads its lots oldest-first, so this one
-- index serves both the WHERE product_uid = ? and the ORDER BY created_at with no extra sort.
CREATE INDEX idx_purchase_items_product_created ON purchase_items(product_uid, created_at);

-- Composite: an account statement filters by account and sorts newest-first.
CREATE INDEX idx_transactions_account_created   ON transactions(account_uid, created_at);
CREATE INDEX idx_transactions_project_uid       ON transactions(project_uid);
CREATE INDEX idx_transactions_employee_uid      ON transactions(employee_uid);
CREATE INDEX idx_transactions_sale_uid          ON transactions(sale_uid);
CREATE INDEX idx_transactions_purchase_uid      ON transactions(purchase_uid);

CREATE INDEX idx_sales_client_uid               ON sales(client_uid);
CREATE INDEX idx_sales_project_uid              ON sales(project_uid);

CREATE INDEX idx_purchases_supplier_uid         ON purchases(supplier_uid);

CREATE INDEX idx_session_employees_employee_uid ON session_employees(employee_uid);
CREATE INDEX idx_session_employees_team_uid     ON session_employees(team_uid);

CREATE INDEX idx_projects_client_uid            ON projects(client_uid);
CREATE INDEX idx_regions_client_uid             ON regions(client_uid);
CREATE INDEX idx_employees_team_uid             ON employees(team_uid);

-- --- Default list-sort indexes (remove the per-page TEMP B-TREE sort) ---

CREATE INDEX idx_sales_created_at               ON sales(created_at);
CREATE INDEX idx_purchases_created_at           ON purchases(created_at);
CREATE INDEX idx_transactions_created_at        ON transactions(created_at);
CREATE INDEX idx_products_created_at            ON products(created_at);
CREATE INDEX idx_clients_created_at             ON clients(created_at);
CREATE INDEX idx_projects_created_at            ON projects(created_at);
CREATE INDEX idx_employees_created_at           ON employees(created_at);
CREATE INDEX idx_sessions_date                  ON sessions(date);
