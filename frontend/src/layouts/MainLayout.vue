<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-title">钱管家·云餐饮</div>
        <div class="muted">{{ storeName }}</div>
      </div>
      <el-menu
        class="menu"
        :default-active="activePath"
        background-color="transparent"
        text-color="#dfecec"
        active-text-color="#f4b642"
        router
      >
        <el-menu-item index="/order-entry">点单开台</el-menu-item>
        <el-menu-item index="/tables">桌台管理</el-menu-item>
        <el-menu-item index="/orders">营业查询</el-menu-item>
        <el-menu-item index="/order-import">系统设置</el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <el-button type="primary" plain size="small" @click="logout">退出登录</el-button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="topbar-title">
          <div class="topbar-name">{{ storeName }}</div>
        </div>
        <div class="topbar-meta">
          <div class="store-pill">已登录</div>
          <div class="muted">管理员</div>
        </div>
      </header>
      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const storeName = computed(() => auth.store?.name || "未命名门店");
const activePath = computed(() => route.path);

const logout = () => {
  auth.clearAuth();
  router.push("/login");
};
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, var(--brand-900), #0c2c2a);
  color: #dfecec;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
}

.brand {
  margin-bottom: 32px;
}

.menu {
  border-right: none;
  flex: 1;
  margin-top: 12px;
}

.sidebar-footer {
  padding-top: 20px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(120deg, #e8f6f4 0%, #ffffff 50%, #f6efe2 100%);
  border-bottom: 1px solid #e5eeec;
}

.topbar-title {
  display: flex;
  align-items: center;
}

.topbar-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--brand-900);
  padding: 6px 16px;
  border-radius: 14px;
  background: linear-gradient(90deg, #dff3ef 0%, #f9ecd8 100%);
  box-shadow: inset 0 0 0 1px rgba(15, 90, 84, 0.08);
}

.topbar-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.store-pill {
  background: var(--brand-200);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  color: var(--brand-900);
}

.content {
  padding: 28px 32px 48px;
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .menu {
    flex: 1 1 100%;
  }
}
</style>
