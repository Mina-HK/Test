# 安全卡密生成与核销系统

> 说明：本项目是一个安全合规的通用卡密系统示例。它不会接收、存储或使用第三方账号 Session Cookie，也不会自动化操作 ChatGPT、Apple ID 或任何第三方订阅。兑换接口要求下游提交非敏感 `customerRef`，后续履约应通过官方、授权的账单或人工流程完成。

## 1. 完整项目结构

```text
.
├── client/                 # Vue 3 + Vite 简单后台界面
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.vue
│       ├── main.js
│       └── style.css
├── server/                 # Node.js Express API
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── config.js
│       ├── index.js
│       ├── db/pool.js
│       ├── middleware/auth.js
│       ├── middleware/rateLimit.js
│       ├── routes/appleIds.js
│       ├── routes/cards.js
│       ├── routes/orders.js
│       ├── routes/redemptions.js
│       └── services/
│           ├── crypto.js
│           └── fulfillment.js
├── sql/schema.sql          # MySQL 表结构
├── package.json            # 根目录快捷脚本
└── README.md
```

## 2. 功能清单

- 卡密管理：后台批量生成 16 位随机卡密、CSV 导出、状态标记为 `unused` / `used` / `expired`。
- 兑换接口：下游提交 `cardCode + customerRef` 进行核销；接口明确拒绝第三方 Session Cookie 字段。
- 履约流程：创建订单后进入 `manual_review` 或 `queued` 状态，管理员通过授权渠道完成服务交付。
- 订单管理：记录客户编号脱敏值、充值/履约状态、有效期、质保期、请求 IP 和备注。
- 后台管理：Vue 页面查看卡密、订单和 Apple ID 台账状态。
- 安全要求：卡密 HMAC 查找 + AES-256-GCM 加密存储、客户编号脱敏存储、API Key 鉴权、兑换接口同 IP 每分钟最多 5 次。

## 3. 数据库表结构 SQL

数据库结构位于 [`sql/schema.sql`](sql/schema.sql)，包含 `cards`、`orders`、`apple_accounts` 三张表。

## 4. 安装部署步骤

### 4.1 准备软件

1. 安装 Node.js 20 或更高版本。
2. 安装 MySQL 8 或更高版本。
3. 克隆项目并进入项目根目录。

### 4.2 创建数据库和表

```bash
mysql -uroot -p < sql/schema.sql
```

如果你要创建专用数据库账号，可在 MySQL 中执行：

```sql
CREATE USER 'voucher_app'@'%' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON voucher_system.* TO 'voucher_app'@'%';
FLUSH PRIVILEGES;
```

### 4.3 配置后端环境变量

```bash
cp server/.env.example server/.env
openssl rand -base64 32
```

把生成的 32 字节 Base64 密钥填入 `server/.env` 的 `ENCRYPTION_KEY_BASE64`，并修改数据库账号、密码和 API Key。

### 4.4 安装依赖

```bash
npm run install:all
```

### 4.5 启动服务

后端：

```bash
npm run dev:server
```

前端：

```bash
npm run dev:client
```

浏览器打开 Vite 输出的地址，默认 API 地址为 `http://localhost:3000`，管理员 API Key 使用 `.env` 中的 `ADMIN_API_KEYS`。

## 5. 测试方法（curl 示例）

### 健康检查

```bash
curl http://localhost:3000/health
```

### 管理员生成 3 张卡密

```bash
curl -X POST http://localhost:3000/api/cards/generate \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: admin-api-key' \
  -d '{"count":3}'
```

### 查看卡密列表

```bash
curl http://localhost:3000/api/cards \
  -H 'x-api-key: admin-api-key'
```

### 导出 CSV

```bash
curl http://localhost:3000/api/cards/export \
  -H 'x-api-key: admin-api-key' \
  -o cards.csv
```

### 下游兑换（使用非敏感客户编号）

```bash
curl -X POST http://localhost:3000/api/redeem \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: dev-api-key' \
  -d '{"cardCode":"替换为16位卡密","customerRef":"customer_abc123456789"}'
```

### 安全拦截示例：提交 Session Cookie 会被拒绝

```bash
curl -X POST http://localhost:3000/api/redeem \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: dev-api-key' \
  -d '{"cardCode":"ABCDEFGH23456789","__Secure-next-auth.session-token":"secret"}'
```

### 查看订单

```bash
curl http://localhost:3000/api/orders \
  -H 'x-api-key: admin-api-key'
```
