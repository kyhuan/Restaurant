<template>
  <div class="auth">
    <div class="card">
      <div class="brand-title">注册门店账号</div>
      <p class="muted">填写信息后创建登录账号</p>
      <el-form :model="form" class="form" @submit.prevent="onSubmit">
        <el-form-item label="门店名称">
          <el-input v-model="form.storeName" placeholder="例如：利川莲花山庄" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="设置管理员账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="设置密码" show-password />
        </el-form-item>
        <el-button type="primary" class="full" @click="onSubmit">注册并进入系统</el-button>
        <el-button class="full plain" @click="goLogin">返回登录</el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import client from "../api/client";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const form = reactive({
  storeName: "",
  username: "",
  password: "",
});

const onSubmit = async () => {
  if (!form.storeName || !form.username || !form.password) {
    ElMessage.error("请填写完整信息");
    return;
  }
  try {
    const { data } = await client.post("/auth/register", form);
    auth.setAuth(data);
    router.push("/");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "注册失败");
  }
};

const goLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 420px;
  padding: 32px;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.form {
  margin-top: 20px;
}

.full {
  width: 100%;
  margin-top: 12px;
}

.plain {
  background: transparent;
}
</style>
