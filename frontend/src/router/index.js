import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import MainLayout from "../layouts/MainLayout.vue";
import OrdersQuery from "../views/OrdersQuery.vue";
import OrderEntry from "../views/OrderEntry.vue";
import OrderImport from "../views/OrderImport.vue";
import TableManager from "../views/TableManager.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", redirect: "/orders" },
      { path: "orders", component: OrdersQuery },
      { path: "order-entry", component: OrderEntry },
      { path: "order-import", component: OrderImport },
      { path: "tables", component: TableManager },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.path.startsWith("/") && !["/login", "/register"].includes(to.path)) {
    if (!auth.token) {
      return "/login";
    }
  }
  if (["/login", "/register"].includes(to.path) && auth.token) {
    return "/";
  }
  return true;
});

export default router;
