<template>
  <div class="page-card">
    <div class="header">
      <div class="section-title">桌台管理</div>
      <div class="muted">支持批量新增桌台，用于点单选择</div>
    </div>
    <div class="form">
      <el-input v-model="form.prefix" placeholder="前缀（例如 A）" />
      <el-input-number v-model="form.start" :min="1" />
      <el-input-number v-model="form.count" :min="1" />
      <el-button type="primary" @click="createTables">批量新增</el-button>
    </div>

    <el-table :data="tables" border stripe>
      <el-table-column prop="label" label="桌台号" />
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import client from "../api/client";

const tables = ref([]);
const form = reactive({
  prefix: "",
  start: 1,
  count: 10,
});

const loadTables = async () => {
  const { data } = await client.get("/tables");
  tables.value = data.data;
};

const createTables = async () => {
  try {
    await client.post("/tables/batch", form);
    ElMessage.success("桌台创建成功");
    loadTables();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "创建失败");
  }
};

onMounted(() => {
  loadTables();
});
</script>

<style scoped>
.header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--brand-700);
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
