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
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">修改</el-button>
          <el-button size="small" type="danger" @click="removeTable(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="修改桌台" width="360px">
      <el-input v-model="editForm.label" placeholder="请输入桌台号" />
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import client from "../api/client";

const tables = ref([]);
const form = reactive({
  prefix: "",
  start: 1,
  count: 10,
});

const editVisible = ref(false);
const editForm = reactive({
  id: null,
  label: "",
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

const openEdit = (row) => {
  editForm.id = row.id;
  editForm.label = row.label;
  editVisible.value = true;
};

const saveEdit = async () => {
  try {
    await client.put(`/tables/${editForm.id}`, { label: editForm.label });
    ElMessage.success("修改成功");
    editVisible.value = false;
    loadTables();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "修改失败");
  }
};

const removeTable = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除桌台 ${row.label} 吗？`, "提示", {
      type: "warning",
    });
    await client.delete(`/tables/${row.id}`);
    ElMessage.success("删除成功");
    loadTables();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.response?.data?.message || "删除失败");
    }
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
