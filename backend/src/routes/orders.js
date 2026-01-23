const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

function generateOrderNumber() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${stamp}${rand}`;
}

router.post("/", auth, async (req, res) => {
  const storeId = req.user.storeId;
  const { tableLabel, orderedAt, note, items } = req.body || {};
  if (!tableLabel || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing order data" });
  }
  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);
  const orderNumber = generateOrderNumber();
  const conn = await pool.getConnection();
  try {
    const [orderResult] = await conn.query(
      "INSERT INTO orders (store_id, order_number, table_label, ordered_at, total_amount, note, source) VALUES (?, ?, ?, ?, ?, ?, 'manual')",
      [storeId, orderNumber, tableLabel, orderedAt ? new Date(orderedAt) : new Date(), totalAmount, note || null]
    );
    const orderId = orderResult.insertId;
    const itemValues = items.map((item) => [
      orderId,
      item.name,
      item.unit,
      item.quantity,
      item.price,
      (Number(item.quantity) || 0) * (Number(item.price) || 0),
    ]);
    await conn.query(
      "INSERT INTO order_items (order_id, dish_name, unit, quantity, price, amount) VALUES ?",
      [itemValues]
    );
    return res.json({ orderNumber });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create order" });
  } finally {
    conn.release();
  }
});

router.get("/", auth, async (req, res) => {
  const storeId = req.user.storeId;
  const { startDate, endDate, orderNumber, page = 1, pageSize = 20 } = req.query;
  const conditions = ["store_id = ?"];
  const params = [storeId];
  if (startDate) {
    conditions.push("ordered_at >= ?");
    params.push(new Date(startDate));
  }
  if (endDate) {
    conditions.push("ordered_at <= ?");
    params.push(new Date(endDate));
  }
  if (orderNumber) {
    conditions.push("order_number LIKE ?");
    params.push(`%${orderNumber}%`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Number(pageSize) || 20;
  const offset = (Number(page) - 1) * limit;

  const conn = await pool.getConnection();
  try {
    const [countRows] = await conn.query(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;
    const [sumRows] = await conn.query(
      `SELECT SUM(total_amount) as sumAmount FROM orders ${whereClause}`,
      params
    );
    const sumAmount = Number(sumRows[0]?.sumAmount || 0);
    const [orders] = await conn.query(
      `SELECT id, order_number, table_label, ordered_at, total_amount, note, source FROM orders ${whereClause} ORDER BY ordered_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    if (orders.length === 0) {
      return res.json({ data: [], total, sumAmount });
    }
    const orderIds = orders.map((order) => order.id);
    const [items] = await conn.query(
      "SELECT order_id, dish_name, unit, quantity, price, amount FROM order_items WHERE order_id IN (?) ORDER BY id ASC",
      [orderIds]
    );
    const itemsByOrder = items.reduce((map, item) => {
      if (!map[item.order_id]) {
        map[item.order_id] = [];
      }
      map[item.order_id].push(item);
      return map;
    }, {});
    const result = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));
    return res.json({ data: result, total, sumAmount });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load orders" });
  } finally {
    conn.release();
  }
});

module.exports = router;
