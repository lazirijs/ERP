-- Migration number: 0031 	 Create roles, permissions (with self-referential parent), and role_permissions
--
-- Model:
--   permissions  = a fixed catalog defined by features, seeded below. Each permission has a
--                  unique `key` ("clients.create") and an optional `parent_uid` pointing at the
--                  module's ".access" permission (e.g. "clients.create" -> "clients.access").
--   roles        = admin-managed; a role is granted a set of permissions via role_permissions.
--   users        = `role_uid` (added in 0005) picks the role; `is_admin` bypasses all checks.

CREATE TABLE roles (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE permissions (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    parent_uid TEXT REFERENCES permissions(uid) ON DELETE CASCADE,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE role_permissions (
    role_uid TEXT NOT NULL REFERENCES roles(uid) ON DELETE CASCADE,
    permission_uid TEXT NOT NULL REFERENCES permissions(uid) ON DELETE CASCADE,
    PRIMARY KEY (role_uid, permission_uid)
);

ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0, 1));

-- ============================================================================
-- Seed: permission catalog
-- ============================================================================

-- Parents: one ".access" per module (view the module's list/detail)
INSERT INTO permissions (key, name) VALUES
    ('clients.access',      'Access clients'),
    ('projects.access',     'Access projects'),
    ('sales.access',        'Access sales'),
    ('transactions.access', 'Access transactions'),
    ('accounts.access',     'Access accounts'),
    ('purchases.access',    'Access purchases'),
    ('products.access',     'Access products'),
    ('suppliers.access',    'Access suppliers'),
    ('employees.access',    'Access employees'),
    ('teams.access',        'Access teams'),
    ('sessions.access',     'Access sessions'),
    ('reports.access',      'Access reports'),
    ('users.access',        'Access users'),
    ('roles.access',        'Access roles'),
    ('settings.access',     'Access settings');

-- Children: actions under each module, linked to their parent ".access" permission
INSERT INTO permissions (key, name, parent_uid) VALUES
    -- Clients
    ('clients.create', 'Create client', (SELECT uid FROM permissions WHERE key = 'clients.access')),
    ('clients.update', 'Update client', (SELECT uid FROM permissions WHERE key = 'clients.access')),
    ('clients.delete', 'Delete client', (SELECT uid FROM permissions WHERE key = 'clients.access')),
    -- Projects
    ('projects.create', 'Create project', (SELECT uid FROM permissions WHERE key = 'projects.access')),
    ('projects.update', 'Update project', (SELECT uid FROM permissions WHERE key = 'projects.access')),
    ('projects.delete', 'Delete project', (SELECT uid FROM permissions WHERE key = 'projects.access')),
    -- Sales
    ('sales.create',   'Create sale',   (SELECT uid FROM permissions WHERE key = 'sales.access')),
    ('sales.update',   'Update sale',   (SELECT uid FROM permissions WHERE key = 'sales.access')),
    ('sales.delete',   'Delete sale',   (SELECT uid FROM permissions WHERE key = 'sales.access')),
    ('sales.complete', 'Complete sale', (SELECT uid FROM permissions WHERE key = 'sales.access')),
    -- Transactions
    ('transactions.create', 'Create transaction', (SELECT uid FROM permissions WHERE key = 'transactions.access')),
    ('transactions.delete', 'Delete transaction', (SELECT uid FROM permissions WHERE key = 'transactions.access')),
    -- Accounts
    ('accounts.create', 'Create account', (SELECT uid FROM permissions WHERE key = 'accounts.access')),
    ('accounts.update', 'Update account', (SELECT uid FROM permissions WHERE key = 'accounts.access')),
    ('accounts.delete', 'Delete account', (SELECT uid FROM permissions WHERE key = 'accounts.access')),
    -- Purchases
    ('purchases.create', 'Create purchase', (SELECT uid FROM permissions WHERE key = 'purchases.access')),
    ('purchases.update', 'Update purchase', (SELECT uid FROM permissions WHERE key = 'purchases.access')),
    ('purchases.delete', 'Delete purchase', (SELECT uid FROM permissions WHERE key = 'purchases.access')),
    -- Products
    ('products.create', 'Create product', (SELECT uid FROM permissions WHERE key = 'products.access')),
    ('products.update', 'Update product', (SELECT uid FROM permissions WHERE key = 'products.access')),
    ('products.delete', 'Delete product', (SELECT uid FROM permissions WHERE key = 'products.access')),
    -- Suppliers
    ('suppliers.create', 'Create supplier', (SELECT uid FROM permissions WHERE key = 'suppliers.access')),
    ('suppliers.update', 'Update supplier', (SELECT uid FROM permissions WHERE key = 'suppliers.access')),
    ('suppliers.delete', 'Delete supplier', (SELECT uid FROM permissions WHERE key = 'suppliers.access')),
    -- Employees
    ('employees.create', 'Create employee', (SELECT uid FROM permissions WHERE key = 'employees.access')),
    ('employees.update', 'Update employee', (SELECT uid FROM permissions WHERE key = 'employees.access')),
    ('employees.delete', 'Delete employee', (SELECT uid FROM permissions WHERE key = 'employees.access')),
    -- Teams
    ('teams.create', 'Create team', (SELECT uid FROM permissions WHERE key = 'teams.access')),
    ('teams.update', 'Update team', (SELECT uid FROM permissions WHERE key = 'teams.access')),
    ('teams.delete', 'Delete team', (SELECT uid FROM permissions WHERE key = 'teams.access')),
    -- Sessions
    ('sessions.create', 'Create session', (SELECT uid FROM permissions WHERE key = 'sessions.access')),
    ('sessions.update', 'Update session', (SELECT uid FROM permissions WHERE key = 'sessions.access')),
    ('sessions.delete', 'Delete session', (SELECT uid FROM permissions WHERE key = 'sessions.access')),
    -- Reports
    ('reports.financials', 'View financial reports', (SELECT uid FROM permissions WHERE key = 'reports.access')),
    -- Users
    ('users.create', 'Create user', (SELECT uid FROM permissions WHERE key = 'users.access')),
    ('users.update', 'Update user', (SELECT uid FROM permissions WHERE key = 'users.access')),
    ('users.delete', 'Delete user', (SELECT uid FROM permissions WHERE key = 'users.access')),
    -- Roles
    ('roles.create', 'Create role', (SELECT uid FROM permissions WHERE key = 'roles.access')),
    ('roles.update', 'Update role', (SELECT uid FROM permissions WHERE key = 'roles.access')),
    ('roles.delete', 'Delete role', (SELECT uid FROM permissions WHERE key = 'roles.access')),
    -- Settings
    ('settings.update', 'Update settings', (SELECT uid FROM permissions WHERE key = 'settings.access'));
