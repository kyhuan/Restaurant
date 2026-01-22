<template>
  <div class="order-entry">
    <div class="left page-card">
      <div class="section-title">点单区域</div>
      <div class="controls">
        <el-select v-model="tableLabel" placeholder="选择桌台">
          <el-option v-for="table in tables" :key="table.id" :label="table.label" :value="table.label" />
        </el-select>
        <el-input v-model="keyword" placeholder="搜索菜品" clearable />
      </div>
      <el-table :data="filteredMenu" height="520" border>
        <el-table-column prop="name" label="菜品" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="price" label="价格" width="90" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="addToCart(row)">加入</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="right page-card">
      <div class="section-title">订单明细</div>
      <el-table :data="cart" border>
        <el-table-column prop="name" label="菜品" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="数量" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" />
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="90" />
        <el-table-column label="小计" width="100">
          <template #default="{ row }">
            {{ (row.quantity * row.price).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button text type="danger" @click="removeItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="summary">
        <el-input v-model="note" placeholder="订单备注（可选）" />
        <div class="total">合计：¥ {{ totalAmount.toFixed(2) }}</div>
        <el-button type="primary" @click="submitOrder">确认结算</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import client from "../api/client";

const menu = ref([]);
const tables = ref([]);
const keyword = ref("");
const tableLabel = ref("");
const cart = ref([]);
const note = ref("");

const filteredMenu = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  if (!term) return menu.value;
  return menu.value.filter((item) => item.name.toLowerCase().includes(term));
});

const totalAmount = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const addToCart = (item) => {
  const existing = cart.value.find((entry) => entry.id === item.id);
  if (existing) {
    existing.quantity += 1;
    return;
  }
  cart.value.push({ ...item, quantity: 1 });
};

const removeItem = (row) => {
  cart.value = cart.value.filter((item) => item.id !== row.id);
};

const submitOrder = async () => {
  if (!tableLabel.value) {
    ElMessage.error("请选择桌台");
    return;
  }
  if (cart.value.length === 0) {
    ElMessage.error("请先选择菜品");
    return;
  }
  try {
    await client.post("/orders", {
      tableLabel: tableLabel.value,
      orderedAt: new Date(),
      note: note.value,
      items: cart.value.map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
      })),
    });
    ElMessage.success("订单已生成");
    cart.value = [];
    note.value = "";
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "提交失败");
  }
};

const loadMenu = async () => {
  const { data } = await client.get("/menu");
  menu.value = data.data;
};

const loadTables = async () => {
  const { data } = await client.get("/tables");
  tables.value = data.data;
};

onMounted(() => {
  loadMenu();
  loadTables();
});
</script>

<style scoped>
.order-entry {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--brand-700);
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.summary {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.total {
  font-size: 18px;
  font-weight: 600;
  color: var(--brand-700);
}

@media (max-width: 1100px) {
  .order-entry {
    grid-template-columns: 1fr;
  }
}
</style>
