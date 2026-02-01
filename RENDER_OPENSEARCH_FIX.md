# 🚀 Render.com Deploy - Xatolikni Tuzatish

## 🔴 Muammo

Render.com-da `localhost:9200` ishlamayapti, chunki:

- Render Docker Compose-ni qo'llab-quvvatlamaydi
- Har bir service alohida bo'lishi kerak
- `localhost` faqat local development uchun

## ✅ Yechim

### **Variant 1: OpenSearch-ni Alohida Hosting (TAVSIYA)**

#### 1. OpenSearch Hosting Tanlash

**Bepul/Arzon OpenSearch hosting:**

**A) SearchBox.io (OpenSearch hosting)**

- URL: https://searchbox.io
- Free tier: 50,000 documents
- Setup:
  1. Sign up → Create deployment
  2. Connection URL olasiz: `https://your-cluster.searchbox.io:443`

**B) Bonsai.io**

- URL: https://bonsai.io
- Free tier: 125MB
- Setup:
  1. Sign up → Create cluster
  2. Access URL: `https://username:password@your-cluster.bonsai.io`

**C) AWS OpenSearch Service (Production)**

- Free tier: 750 hours/month
- URL: AWS Console → OpenSearch

#### 2. Render Environment Variables O'rnatish

Render Dashboard → Your Service → Environment:

```bash
# PostgreSQL - Render auto-fills these from database
POSTGRES_HOST=<from-render-postgres>
POSTGRES_PORT=5432
POSTGRES_USER=<from-render>
POSTGRES_PASSWORD=<from-render>
POSTGRES_DATABASE=telegram_bot_db

# Backend
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this
TELEGRAM_BOT_TOKEN=8565756347:AAGn7B3X_pSJw_MfZh1yNov0I1oVaRMDVc8

# OpenSearch - External hosting
OPENSEARCH_NODE=https://your-cluster.searchbox.io:443
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=your-password
```

⚠️ **MUHIM:** `OPENSEARCH_NODE` ni to'g'ri qiymat bilan o'rnating, `localhost` emas!

---

### **Variant 2: VPS Ishlatish (To'liq Nazorat)**

Agar Render-da OpenSearch hosting qimmat bo'lsa, **VPS** ishlatish yaxshiroq:

#### Tavsiya: Hetzner Cloud (€4.51/oy)

```bash
# 1. VPS sotib oling: https://hetzner.cloud
# 2. SSH orqali ulanish
ssh root@your-server-ip

# 3. Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Loyihani clone qilish
git clone https://github.com/your-username/telegram.git
cd telegram/nest-backend

# 5. .env sozlash
cat > .env << EOF
PORT=4000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong-password-123
POSTGRES_DATABASE=telegram_bot_db
TELEGRAM_BOT_TOKEN=8565756347:AAGn7B3X_pSJw_MfZh1yNov0I1oVaRMDVc8
JWT_SECRET=super-secret-jwt-key
EOF

# 6. Ishga tushirish
docker-compose up -d

# 7. Tekshirish
docker ps
curl http://localhost:9200
curl http://localhost:4000
```

---

### **Variant 3: Render-da OpenSearch-siz Ishlash (Vaqtinchalik)**

Agar test qilmoqchi bo'lsangiz, OpenSearch-ni vaqtincha o'chirib qo'yish mumkin.

#### Kodni o'zgartirish:

```typescript
// src/search/search.service.ts

async search(query: string, userId?: string, username?: string) {
  // Temporary: Disable OpenSearch
  if (!this.configService.get<string>("OPENSEARCH_NODE")) {
    console.warn('[WARN] OpenSearch not configured, returning empty results');
    return [];
  }

  // ... rest of the code
}

async onModuleInit() {
  // Skip if OpenSearch not configured
  if (!this.configService.get<string>("OPENSEARCH_NODE")) {
    console.warn('[WARN] OpenSearch not configured, skipping initialization');
    return;
  }

  // ... rest of the code
}
```

**Bu faqat test uchun!** Search ishlamaydi, lekin backend ishga tushadi.

---

## 🎯 Qaysi Variantni Tanlash?

| Variant                     | Narx           | Qulaylik   | Production Ready |
| --------------------------- | -------------- | ---------- | ---------------- |
| **Render + SearchBox.io**   | $0 (free tier) | ⭐⭐⭐⭐   | ✅               |
| **Render + Bonsai.io**      | $10/oy         | ⭐⭐⭐⭐⭐ | ✅               |
| **VPS (Hetzner)**           | €4.51/oy       | ⭐⭐⭐     | ✅               |
| **Render (OpenSearch-siz)** | $0             | ⭐         | ❌ (test only)   |

### **Mening Tavsiyam:**

**1. Test uchun:** Render + SearchBox.io (bepul)
**2. Production:** VPS (Hetzner) - to'liq nazorat, arzon

---

## 📋 Render Environment Variables Ro'yxati

Render Dashboard → Settings → Environment:

| Key                   | Value                                          |
| --------------------- | ---------------------------------------------- |
| `PORT`                | `4000`                                         |
| `NODE_ENV`            | `production`                                   |
| `POSTGRES_HOST`       | `<from-render-postgres>`                       |
| `POSTGRES_PORT`       | `5432`                                         |
| `POSTGRES_USER`       | `<from-render>`                                |
| `POSTGRES_PASSWORD`   | `<from-render>`                                |
| `POSTGRES_DATABASE`   | `telegram_bot_db`                              |
| `JWT_SECRET`          | `<generate-random>`                            |
| `TELEGRAM_BOT_TOKEN`  | `8565756347:...`                               |
| **`OPENSEARCH_NODE`** | **`https://your-cluster.searchbox.io:443`** ⚠️ |
| `OPENSEARCH_USERNAME` | `admin` (agar kerak bo'lsa)                    |
| `OPENSEARCH_PASSWORD` | `your-password` (agar kerak bo'lsa)            |

**❌ XATO:** `OPENSEARCH_NODE=http://localhost:9200`
**✅ TO'G'RI:** `OPENSEARCH_NODE=https://your-cluster.searchbox.io:443`

---

## 🔧 Keyingi Qadamlar

1. **OpenSearch hosting tanlang** (SearchBox.io yoki Bonsai.io)
2. **Cluster yarating** va connection URL oling
3. **Render-da environment variable o'rnating:**
   - `OPENSEARCH_NODE=<your-cluster-url>`
4. **Redeploy qiling** (Render auto-redeploy qiladi)
5. **Test qiling:** `GET /search?q=test`

---

## ❓ Savollar

**Q: Nima uchun localhost ishlamayapti?**
A: Render-da har bir service alohida container. `localhost` faqat bitta container ichida ishlaydi.

**Q: Docker Compose ishlaydimi?**
A: Yo'q! Render faqat bitta Dockerfile qo'llab-quvvatlaydi.

**Q: OpenSearch hosting qancha turadi?**
A: SearchBox.io free tier bor, Bonsai.io $10/oy, VPS €4.51/oy

**Q: VPS-da qanday setup qilaman?**
A: Yuqoridagi "Variant 2" ko'rsatmasiga qarang.
