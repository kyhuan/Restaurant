# Restaurant POS (简版收银系统)

## 目录结构
- `backend/` Node.js + Express API
- `frontend/` Vue 3 + Element Plus 前端

## 数据库初始化
1. 创建数据库并导入表结构：
```sql
source backend/schema.sql;
```
2. 配置 `backend/.env`（参考 `backend/.env.example`）。

## 启动后端
```bash
cd backend
npm install
npm run dev
```
首次启动会自动导入菜单数据（`backend/src/seed/menu.txt`）。

## 启动前端
```bash
cd frontend
npm install
npm run dev
```

## Excel 导入模板字段
固定 8 列：订单日期、订单编号、菜品、单位、数量、单价、金额、订单备注（可空）。
