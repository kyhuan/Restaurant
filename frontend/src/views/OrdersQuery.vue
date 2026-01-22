<template>
  <div class="page-card orders-card">
    <div class="page-header">
      <div class="section-title">营业收入汇总</div>
    </div>
    <div class="filters">
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :popper-class="'zh-date-picker'"
      />
      <el-input v-model="filters.orderNumber" placeholder="订单号" />
      <el-button type="primary" @click="loadOrders">查询</el-button>
    </div>

    <el-table
      :data="orders"
      row-key="id"
      stripe
      border
      :fit="true"
      style="width: 100%"
    >
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-table :data="row.items" size="small" border>
            <el-table-column prop="dish_name" label="菜品" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="quantity" label="数量" width="90" />
            <el-table-column prop="price" label="单价" width="90" />
            <el-table-column prop="amount" label="金额" width="90" />
          </el-table>
        </template>
      </el-table-column>
      <el-table-column prop="order_number" label="订单号" width="200" />
      <el-table-column prop="table_label" label="桌台" width="100" />
      <el-table-column prop="ordered_at" label="下单时间" width="180" />
      <el-table-column prop="total_amount" label="订单金额" width="120" />
      <el-table-column prop="note" label="备注" min-width="160" show-overflow-tooltip />
    </el-table>

    <div class="table-footer">
      <div class="summary">
        <span class="muted">合计金额：</span>
        <span class="total">¥ {{ totalAmount.toFixed(2) }}</span>
      </div>
    </div>

    <div class="pagination">
      <el-pagination
        layout="total, prev, pager, next"
        :page-size="pagination.pageSize"
        :current-page="pagination.page"
        :total="pagination.total"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import client from "../api/client";

const orders = ref([]);
const filters = reactive({
  dateRange: [],
  orderNumber: "",
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const totalAmount = computed(() =>
  orders.value.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
);

const loadOrders = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
    if (filters.dateRange?.length === 2) {
      params.startDate = filters.dateRange[0];
      params.endDate = `${filters.dateRange[1]} 23:59:59`;
    }
    if (filters.orderNumber) {
      params.orderNumber = filters.orderNumber;
    }
    const { data } = await client.get("/orders", { params });
    orders.value = data.data.map((item) => ({
      ...item,
      ordered_at: item.ordered_at
        ? new Date(item.ordered_at).toLocaleString("zh-CN")
        : "",
    }));
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "加载失败");
  }
};

const onPageChange = (page) => {
  pagination.page = page;
  loadOrders();
};

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.orders-card {
  max-width: 1200px;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--brand-700);
}

.table-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.summary {
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(28, 124, 118, 0.08);
}

.total {
  font-weight: 600;
  color: var(--brand-700);
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
