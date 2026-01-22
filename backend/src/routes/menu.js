const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const storeId = req.user.storeId;
  const conn = await pool.getConnection();
  try {
    const [items] = await conn.query(
      "SELECT id, name, unit, price FROM menu_items WHERE store_id IS NULL OR store_id = ? ORDER BY id ASC",
      [storeId]
    );
    return res.json({ data: items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load menu" });
  } finally {
    conn.release();
  }
});

module.exports = router;
