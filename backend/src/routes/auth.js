const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, storeName } = req.body || {};
  if (!username || !password || !storeName) {
    return res.status(400).json({ message: "Missing fields" });
  }
  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const [storeResult] = await conn.query(
      "INSERT INTO stores (name) VALUES (?)",
      [storeName]
    );
    const storeId = storeResult.insertId;
    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      "INSERT INTO users (store_id, username, password_hash, role) VALUES (?, ?, ?, 'admin')",
      [storeId, username, hash]
    );
    const token = jwt.sign(
      { id: userResult.insertId, storeId, role: "admin", username },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: { id: userResult.insertId, username, storeId, role: "admin" },
      store: { id: storeId, name: storeName },
    });
  } catch (error) {
    return res.status(500).json({ message: "Register failed" });
  } finally {
    conn.release();
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }
  const conn = await pool.getConnection();
  try {
    const [users] = await conn.query(
      "SELECT u.id, u.username, u.password_hash, u.role, u.store_id, s.name as store_name FROM users u JOIN stores s ON u.store_id = s.id WHERE u.username = ?",
      [username]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = users[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, storeId: user.store_id, role: user.role, username },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: { id: user.id, username: user.username, storeId: user.store_id, role: user.role },
      store: { id: user.store_id, name: user.store_name },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  } finally {
    conn.release();
  }
});

module.exports = router;
