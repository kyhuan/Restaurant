<template>
  <div class="auth">
    <div class="card">
      <div class="brand-title">钱管家·云餐饮</div>
      <p class="muted">餐饮收银系统</p>
      <el-form :model="form" class="form" @submit.prevent="onSubmit">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-button type="primary" class="full" @click="onSubmit">登录</el-button>
        <el-button class="full plain" @click="goRegister">去注册</el-button>
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
  username: "",
  password: "",
});

const onSubmit = async () => {
  if (!form.username || !form.password) {
    ElMessage.error("请输入账号和密码");
    return;
  }
  try {
    const { data } = await client.post("/auth/login", form);
    auth.setAuth(data);
    router.push("/");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "登录失败");
  }
};

const goRegister = () => {
  router.push("/register");
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
  width: 380px;
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
