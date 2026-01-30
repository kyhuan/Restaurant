<template>
  <div class="page-card">
    <div class="header">
      <div class="section-title">系统设置</div>
      <div class="muted">订单导入模板字段：订单日期、订单编号、桌台号、菜品、单位、数量、单价、金额、订单备注（可为空）</div>
    </div>

    <div class="section-block">
      <div class="block-title">订单导入</div>
      <el-upload
        class="upload"
        :http-request="uploadFile"
        :show-file-list="false"
        accept=".xlsx,.xls"
      >
        <el-button type="primary">上传 Excel</el-button>
      </el-upload>
    </div>

    <div class="section-block">
      <div class="block-title">订单删除</div>
      <div class="delete-row">
        <el-input v-model="deleteOrderNumber" placeholder="输入订单号" />
        <el-button type="danger" @click="deleteOrder">按订单号删除</el-button>
      </div>
      <div class="muted small">仅删除当前门店的对应订单及菜品明细。</div>
    </div>

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
import { ElMessage, ElMessageBox } from "element-plus";
import client from "../api/client";

const result = ref(null);
const deleteOrderNumber = ref("");

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

const deleteOrder = async () => {
  const orderNumber = deleteOrderNumber.value.trim();
  if (!orderNumber) {
    ElMessage.error("请输入订单号");
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除订单 ${orderNumber} 吗？`, "提示", {
      type: "warning",
    });
    await client.delete(`/orders/by-number/${encodeURIComponent(orderNumber)}`);
    ElMessage.success("删除成功");
    deleteOrderNumber.value = "";
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.response?.data?.message || "删除失败");
    }
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

.section-block {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(28, 124, 118, 0.06);
}

.block-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.upload {
  margin-bottom: 6px;
}

.delete-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.small {
  font-size: 12px;
}

.result {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.errors {
  margin-top: 12px;
}
</style>
