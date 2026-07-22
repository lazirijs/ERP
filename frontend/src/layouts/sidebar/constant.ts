export interface MenuItem {
    name: string;
    icon: string;
    routeName?: string;
    permission?: string;
    children?: MenuItem[];
}

// Each entry carries the `<module>.access` permission it requires; the sidebar hides items the
// user can't access (a parent group is hidden when none of its children are visible). Items
// without a `permission` (e.g. home) are always shown.
const menuItems: MenuItem[] = [
    { name: 'home', icon: 'el-icon-house', routeName: 'home' },
    { name: 'clients', icon: 'el-icon-office-building', routeName: 'clients-list', permission: 'clients.access' },
    { name: 'projects', icon: 'el-icon-folder-opened', routeName: 'projects-list', permission: 'projects.access' },
    {
        name: 'finance',
        icon: 'el-icon-money',
        children: [
            { name: 'sales', icon: 'el-icon-shopping-bag', routeName: 'sales-list', permission: 'sales.access' },
            { name: 'transactions', icon: 'el-icon-switch', routeName: 'transactions-list', permission: 'transactions.access' },
            { name: 'accounts', icon: 'el-icon-wallet', routeName: 'accounts-list', permission: 'accounts.access' }
        ]
    },
    {
        name: 'inventory',
        icon: 'el-icon-box',
        children: [
            { name: 'purchases', icon: 'el-icon-shopping-cart-full', routeName: 'purchases-list', permission: 'purchases.access' },
            { name: 'products', icon: 'el-icon-goods', routeName: 'products-list', permission: 'products.access' },
            { name: 'suppliers', icon: 'el-icon-office-building', routeName: 'suppliers-list', permission: 'suppliers.access' }
        ]
    },
    { name: 'reports', icon: 'el-icon-data-line', routeName: 'reports-list', permission: 'reports.access' },
    {
        name: 'humanResources',
        icon: 'el-icon-user',
        children: [
            { name: 'employees', icon: 'el-icon-user', routeName: 'employees-list', permission: 'employees.access' },
            { name: 'teams', icon: 'el-icon-position', routeName: 'teams-list', permission: 'teams.access' },
            { name: 'sessions', icon: 'el-icon-calendar', routeName: 'sessions-list', permission: 'sessions.access' }
        ]
    },
    {
        name: 'settings',
        icon: 'el-icon-setting',
        children: [
            { name: 'parameters', icon: 'el-icon-set-up', routeName: 'parameters-list', permission: 'settings.access' },
            { name: 'users', icon: 'el-icon-user', routeName: 'users-list', permission: 'users.access' },
            { name: 'roles', icon: 'el-icon-key', routeName: 'roles-list', permission: 'roles.access' }
        ]
    },
];

export default { menuItems };
