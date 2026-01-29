const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const HEADER_MAP = {
  "订单日期": "orderDate",
  "订单编号": "orderNumber",
  "桌台号": "tableLabel",
  "菜品": "dishName",
  "单位": "unit",
  "数量": "quantity",
  "单价": "price",
  "金额": "amount",
  "订单备注": "note",
};

function parseExcelDate(value) {
  if (!value && value !== 0) return null;
  if (typeof value === "number") {
    const date = xlsx.SSF.parse_date_code(value);
    if (!date) return null;
    return new Date(date.y, date.m - 1, date.d, 12, 0, 0);
  }
  if (value instanceof Date) {
    return value;
  }
  const text = String(value).trim();
  const cnMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) {
    return new Date(Number(cnMatch[1]), Number(cnMatch[2]) - 1, Number(cnMatch[3]), 12, 0, 0);
  }
  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }
  return null;
}

router.post("/orders", auth, upload.single("file"), async (req, res) => {
  const storeId = req.user.storeId;
  if (!req.file) {
    return res.status(400).json({ message: "缺少文件" });
  }
  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true });
  if (rows.length < 2) {
    return res.status(400).json({ message: "表格为空" });
  }
  const headers = rows[0].map((value) => String(value || "").trim());
  const columns = headers.map((header) => HEADER_MAP[header]);
  if (columns.some((value) => !value)) {
    return res.status(400).json({ message: "模板表头不正确" });
  }

  const orderMap = new Map();
  const errors = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.every((cell) => cell === null || cell === undefined || cell === "")) {
      continue;
    }
    const record = {};
    columns.forEach((key, index) => {
      record[key] = row[index];
    });
    const orderNumber = String(record.orderNumber || "").trim();
    const dishName = String(record.dishName || "").trim();
    if (!orderNumber || !dishName) {
      errors.push({ row: i + 1, message: "缺少订单编号或菜品" });
      continue;
    }
    const orderDate = parseExcelDate(record.orderDate);
    const tableLabel = record.tableLabel ? String(record.tableLabel).trim() : "";
    const quantity = Number(record.quantity) || 0;
    const price = Number(record.price) || 0;
    const amount = record.amount !== undefined && record.amount !== null && record.amount !== ""
      ? Number(record.amount)
      : quantity * price;
    const note = record.note ? String(record.note).trim() : "";

    if (!orderMap.has(orderNumber)) {
      orderMap.set(orderNumber, {
        orderNumber,
        orderDate,
        note,
        tableLabel,
        items: [],
      });
    }
    const order = orderMap.get(orderNumber);
    if (!order.orderDate && orderDate) {
      order.orderDate = orderDate;
    }
    if (!order.note && note) {
      order.note = note;
    }
    if (!order.tableLabel && tableLabel) {
      order.tableLabel = tableLabel;
    }
    order.items.push({
      dishName,
      unit: String(record.unit || "").trim(),
      quantity,
      price,
      amount,
    });
  }

  if (orderMap.size === 0) {
    return res.status(400).json({ message: "未识别到有效订单" });
  }

  const conn = await pool.getConnection();
  try {
    const orderNumbers = Array.from(orderMap.keys());
    const [existingOrders] = await conn.query(
      "SELECT order_number FROM orders WHERE store_id = ? AND order_number IN (?)",
      [storeId, orderNumbers]
    );
    const existingSet = new Set(existingOrders.map((row) => row.order_number));

    let successOrders = 0;
    for (const order of orderMap.values()) {
      if (existingSet.has(order.orderNumber)) {
        errors.push({ orderNumber: order.orderNumber, message: "订单号已存在" });
        continue;
      }
      const totalAmount = order.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const [orderResult] = await conn.query(
        "INSERT INTO orders (store_id, order_number, table_label, ordered_at, total_amount, note, source) VALUES (?, ?, ?, ?, ?, ?, 'import')",
        [
          storeId,
          order.orderNumber,
          order.tableLabel || "导入",
          order.orderDate || new Date(),
          totalAmount,
          order.note || null,
        ]
      );
      const orderId = orderResult.insertId;
      const itemValues = order.items.map((item) => [
        orderId,
        item.dishName,
        item.unit,
        item.quantity,
        item.price,
        item.amount,
      ]);
      await conn.query(
        "INSERT INTO order_items (order_id, dish_name, unit, quantity, price, amount) VALUES ?",
        [itemValues]
      );
      successOrders += 1;
    }

    await conn.query(
      "INSERT INTO import_batches (store_id, filename, total_rows, success_orders) VALUES (?, ?, ?, ?)",
      [storeId, req.file.originalname, rows.length - 1, successOrders]
    );

    return res.json({
      successOrders,
      totalOrders: orderMap.size,
      errors,
    });
  } catch (error) {
    return res.status(500).json({ message: "导入失败" });
  } finally {
    conn.release();
  }
});

module.exports = router;
