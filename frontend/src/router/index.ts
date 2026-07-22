import { createRouter, createWebHistory } from "vue-router";
import type { Route } from "./type";
import AuthApi from "@/modules/auth/api";
import AuthStore from "@/modules/auth/store";
import { ElLoading } from 'element-plus'

const routes: Route[] = [
  {
    path: "/auth",
    meta: {
      auth: "none",
    },
    children: [
      {
        path: "login",
        name: "auth-login",
        component: () => import("@/modules/auth/views/login.vue")
      }
    ],
  },
  {
    path: "/",
    name: "home",
    component: () => import("@/modules/home/index.vue"),
    meta: { auth: "required" },
    children: [],
  },
  {
    path: "/users",
    meta: {
      auth: "required",
      permission: "users.access",
    },
    children: [
      {
        path: "list",
        name: "users-list",
        component: () => import("@/modules/users/views/list.vue")
      },
    ],
  },
  {
    path: "/roles",
    meta: {
      auth: "required",
      permission: "roles.access",
    },
    children: [
      {
        path: "list",
        name: "roles-list",
        component: () => import("@/modules/roles/view/list.vue")
      },
    ],
  },
  {
    path: "/clients",
    meta: {
      auth: "required",
      permission: "clients.access",
    },
    children: [
      {
        path: "list",
        name: "clients-list",
        component: () => import("@/modules/clients/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "clients-detail",
        component: () => import("@/modules/clients/view/detail.vue")
      },
    ],
  },
  {
    path: "/projects",
    meta: {
      auth: "required",
      permission: "projects.access",
    },
    children: [
      {
        path: "list",
        name: "projects-list",
        component: () => import("@/modules/projects/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "projects-detail",
        component: () => import("@/modules/projects/view/detail.vue")
      },
    ],
  },
  {
    path: "/transactions",
    meta: {
      auth: "required",
      permission: "transactions.access",
    },
    children: [
      {
        path: "list",
        name: "transactions-list",
        component: () => import("@/modules/transactions/view/list.vue")
      },
    ],
  },
  {
    path: "/accounts",
    meta: {
      auth: "required",
      permission: "accounts.access",
    },
    children: [
      {
        path: "list",
        name: "accounts-list",
        component: () => import("@/modules/accounts/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "accounts-detail",
        component: () => import("@/modules/accounts/view/detail.vue")
      },
    ],
  },
  {
    path: "/products",
    meta: {
      auth: "required",
      permission: "products.access",
    },
    children: [
      {
        path: "list",
        name: "products-list",
        component: () => import("@/modules/products/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "products-detail",
        component: () => import("@/modules/products/view/detail.vue")
      },
    ],
  },
  {
    path: "/purchases",
    meta: {
      auth: "required",
      permission: "purchases.access",
    },
    children: [
      {
        path: "list",
        name: "purchases-list",
        component: () => import("@/modules/purchases/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "purchases-detail",
        component: () => import("@/modules/purchases/view/detail.vue")
      },
    ],
  },
  {
    path: "/sales",
    meta: {
      auth: "required",
      permission: "sales.access",
    },
    children: [
      {
        path: "list",
        name: "sales-list",
        component: () => import("@/modules/sales/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "sales-detail",
        component: () => import("@/modules/sales/view/detail.vue")
      },
    ],
  },
  {
    path: "/suppliers",
    meta: {
      auth: "required",
      permission: "suppliers.access",
    },
    children: [
      {
        path: "list",
        name: "suppliers-list",
        component: () => import("@/modules/suppliers/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "suppliers-detail",
        component: () => import("@/modules/suppliers/view/detail.vue")
      },
    ],
  },
  {
    path: "/employees",
    meta: {
      auth: "required",
      permission: "employees.access",
    },
    children: [
      {
        path: "list",
        name: "employees-list",
        component: () => import("@/modules/employees/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "employees-detail",
        component: () => import("@/modules/employees/view/detail.vue")
      },
    ],
  },
  {
    path: "/teams",
    meta: {
      auth: "required",
      permission: "teams.access",
    },
    children: [
      {
        path: "list",
        name: "teams-list",
        component: () => import("@/modules/teams/view/list.vue")
      },
      {
        path: "detail/:uid",
        name: "teams-detail",
        component: () => import("@/modules/teams/view/detail.vue")
      },
    ],
  },
  {
    path: "/reports",
    meta: {
      auth: "required",
      permission: "reports.access",
    },
    children: [
      {
        path: "list",
        name: "reports-list",
        component: () => import("@/modules/reports/view/list.vue")
      },
    ],
  },
  {
    path: "/sessions",
    meta: {
      auth: "required",
      permission: "sessions.access",
    },
    children: [
      {
        path: "detail/:uid",
        name: "sessions-detail",
        component: () => import("@/modules/sessions/view/detail.vue")
      },
      {
        path: "list",
        name: "sessions-list",
        component: () => import("@/modules/sessions/view/list.vue")
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "error-404",
    meta: {
      auth: "optional",
    },
    component: () => import("@/modules/errors/views/404.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: to => ({
    behavior: "smooth",
    top: to.hash ? 80 : 0,
    ...(to.hash ? { el: to.hash } : { left: 0 }),
  }),
});

const loading = ElLoading.service();

router.beforeEach(async (to) => {
  const authApi = new AuthApi();
  const authStore = AuthStore();

  if (authStore.isAuthed == undefined) {
    try {
      const response = await authApi.profile();
      authStore.set(response.detail);
      if (to.meta.auth == 'none' && authStore.isAuthed == true) return { name: 'home' };
    } catch {
      authStore.logout();
    } finally {
      loading.close();
    }
  }
  else if (to.meta.auth == 'required' && authStore.isAuthed == false) return { name: 'auth-login' };
  else if (to.meta.auth == 'none' && authStore.isAuthed == true) return { name: 'home' };

  // Block routes the user lacks the `<module>.access` permission for (admins hold every key).
  // Only relevant once authed; unauthed users are already redirected to login above.
  if (authStore.isAuthed && to.meta.permission && !authStore.hasPermission(to.meta.permission as string)) {
    return { name: 'home' };
  }
});

export default router;