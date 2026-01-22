const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const storeId = req.user.storeId;
  const conn = await pool.getConnection();
  try {
    const [tables] = await conn.query(
      "SELECT id, label FROM dining_tables WHERE store_id = ? ORDER BY id ASC",
      [storeId]
    );
    return res.json({ data: tables });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load tables" });
  } finally {
    conn.release();
  }
});

router.post("/batch", auth, async (req, res) => {
  const storeId = req.user.storeId;
  const { prefix = "", start = 1, count = 10 } = req.body || {};
  const total = Number(count);
  if (!Number.isInteger(total) || total <= 0) {
    return res.status(400).json({ message: "Invalid count" });
  }
  const startNumber = Number(start);
  const labels = Array.from({ length: total }, (_, index) => `${prefix}${startNumber + index}`);
  const conn = await pool.getConnection();
  try {
    const values = labels.map((label) => [storeId, label]);
    await conn.query("INSERT INTO dining_tables (store_id, label) VALUES ?", [values]);
    return res.json({ created: labels.length });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create tables" });
  } finally {
    conn.release();
  }
});

module.exports = router;
