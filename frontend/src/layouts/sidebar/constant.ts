const menuItems = [
    { name: 'home', icon: 'el-icon-house', routeName: 'home' },
    { name: 'clients', icon: 'el-icon-office-building', routeName: 'clients-list' },
    { name: 'projects', icon: 'el-icon-folder-opened', routeName: 'projects-list' },
    { 
        name: 'finance', 
        icon: 'el-icon-money', 
        children: [
            { name: 'sales', icon: 'el-icon-shopping-bag', routeName: 'sales-list' },
            { name: 'transactions', icon: 'el-icon-switch', routeName: 'transactions-list' },
            { name: 'accounts', icon: 'el-icon-wallet', routeName: 'accounts-list' }
        ]
    },
    {
        name: 'inventory',
        icon: 'el-icon-box',
        children: [
            { name: 'purchases', icon: 'el-icon-shopping-cart-full', routeName: 'purchases-list' },
            { name: 'products', icon: 'el-icon-goods', routeName: 'products-list' },
            { name: 'suppliers', icon: 'el-icon-office-building', routeName: 'suppliers-list' }
        ]
    },
    { name: 'reports', icon: 'el-icon-data-line', routeName: 'reports-list' },
    { 
        name: 'humanResources', 
        icon: 'el-icon-user', 
        children: [
            { name: 'employees', icon: 'el-icon-user', routeName: 'employees-list' },
            { name: 'teams', icon: 'el-icon-position', routeName: 'teams-list' },
            { name: 'sessions', icon: 'el-icon-calendar', routeName: 'sessions-list' }
        ]
    },
    {
        name: 'settings',
        icon: 'el-icon-setting',
        children: [
            { name: 'parameters', icon: 'el-icon-set-up', routeName: 'parameters-list' },
            { name: 'users', icon: 'el-icon-user', routeName: 'users-list' },
            { name: 'roles', icon: 'el-icon-key', routeName: 'roles-list' }
        ]
    },
];

export default { menuItems };