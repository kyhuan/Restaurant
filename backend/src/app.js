const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const tableRoutes = require("./routes/tables");
const orderRoutes = require("./routes/orders");
const importRoutes = require("./routes/imports");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/imports", importRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function seedMenuIfNeeded() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query("SELECT COUNT(*) as total FROM menu_items");
    if (rows[0].total > 0) {
      return;
    }
    const menuPath = path.join(__dirname, "seed", "menu.txt");
    const content = fs.readFileSync(menuPath, "utf8");
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const items = [];
    for (const line of lines) {
      if (line.startsWith("品名")) {
        continue;
      }
      const parts = line.split(/\t+/);
      if (parts.length < 3) {
        continue;
      }
      const name = parts[0].trim();
      const unit = parts[1].trim();
      const priceText = parts[2].trim();
      const price = Number(String(priceText).replace(/[^\d.]/g, "")) || 0;
      items.push([name, unit, price]);
    }
    if (items.length > 0) {
      await conn.query(
        "INSERT INTO menu_items (name, unit, price) VALUES ?",
        [items]
      );
    }
  } finally {
    conn.release();
  }
}

const PORT = process.env.PORT || 3001;

seedMenuIfNeeded()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server running on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
