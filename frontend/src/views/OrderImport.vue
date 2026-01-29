<template>
  <div class="page-card">
    <div class="header">
      <div class="section-title">系统设置</div>
      <div class="muted">订单导入模板字段：订单日期、订单编号、桌台号、菜品、单位、数量、单价、金额、订单备注（可为空）</div>
    </div>

    <el-upload
      class="upload"
      :http-request="uploadFile"
      :show-file-list="false"
      accept=".xlsx,.xls"
    >
      <el-button type="primary">上传 Excel</el-button>
    </el-upload>

    <div v-if="result" class="result">
      <div>成功导入订单：{{ result.successOrders }}</div>
      <div>识别订单数：{{ result.totalOrders }}</div>
      <div v-if="result.errors?.length" class="errors">
        <div class="muted">错误详情：</div>
        <el-table :data="result.errors" border size="small">
          <el-table-column prop="row" label="行号" width="80" />
          <el-table-column prop="orderNumber" label="订单号" width="160" />
          <el-table-column prop="message" label="原因" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import client from "../api/client";

const result = ref(null);

const uploadFile = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const { data } = await client.post("/imports/orders", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    result.value = data;
    ElMessage.success("导入完成");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "导入失败");
  }
};
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

.upload {
  margin-bottom: 20px;
}

.result {
  display: grid;
  gap: 12px;
}

.errors {
  margin-top: 12px;
}
</style>
