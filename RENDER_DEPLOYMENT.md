# 🚀 Render.com-ga Deploy Qilish Ko'rsatmasi

## ⚠️ Muhim: OpenSearch Muammosi

**Render.com Docker Compose-ni qo'llab-quvvatlamaydi!**
Shuning uchun OpenSearch-ni alohida hosting-da deploy qilish kerak.

---

## 📦 Variantlar

### **Variant 1: Render + Alohida OpenSearch Hosting (Tavsiya)**

#### 1️⃣ OpenSearch Hosting Tanlash

**Bepul yoki arzon variantlar:**

- **Bonsai.io** - OpenSearch/Elasticsearch hosting
  - URL: https://bonsai.io
  - Free tier: 125MB
- **AWS OpenSearch Service**
  - URL: https://aws.amazon.com/opensearch-service/
  - Free tier: 750 soat/oy
- **DigitalOcean Managed OpenSearch**
  - URL: https://www.digitalocean.com/products/managed-databases-opensearch
  - $15/oy dan boshlanadi

#### 2️⃣ Render.com Setup

1. **GitHub repo-ni push qiling**

   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

2. **Render Dashboard-da:**
   - https://dashboard.render.com ga boring
   - **New +** → **Blueprint** tanlang
   - GitHub repo-ni ulang
   - `render.yaml` faylni tanlay
   - Deploy bosing

3. **Environment Variables-ni sozlang:**
   ```bash
   OPENSEARCH_NODE=https://your-opensearch-cluster.bonsai.io:443
   OPENSEARCH_USERNAME=your_username
   OPENSEARCH_PASSWORD=your_password
   TELEGRAM_BOT_TOKEN=8565756347:AAGn7B3X_pSJw_MfZh1yNov0I1oVaRMDVc8
   ```

#### 3️⃣ OpenSearch-siz Test (Ixtiyoriy)

Agar OpenSearch-ni keyinroq qo'shmoqchi bo'lsangiz, kodni o'zgartiring:

**src/search/search.service.ts:**

```typescript
async searchProducts(query: string) {
  // Temporarily disable OpenSearch
  console.log('OpenSearch not available, skipping search');
  return { hits: { hits: [] } };
}
```

---

### **Variant 2: VPS-da To'liq Docker Compose (Eng yo'lqolay)**

Bu variant uchun Render emas, **VPS** kerak.

#### 1️⃣ VPS Hosting Tanlash

**Tavsiya qilingan:**

- **Hetzner Cloud** - €4.51/oy (CX11)
  - 2 GB RAM, 20 GB SSD
  - URL: https://hetzner.cloud
- **DigitalOcean Droplet** - $6/oy
  - 1 GB RAM, 25 GB SSD
  - URL: https://www.digitalocean.com
- **Contabo** - €5/oy
  - 4 GB RAM, 200 GB SSD
  - URL: https://contabo.com

#### 2️⃣ VPS-da Deploy

```bash
# 1. VPS-ga SSH orqali ulanish
ssh root@your-server-ip

# 2. Docker va Docker Compose-ni o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Loyihani clone qilish
git clone https://github.com/your-username/telegram.git
cd telegram/nest-backend

# 4. .env faylni sozlash
nano .env
# Parollarni to'g'ri qiymatlar bilan almashtiring

# 5. Ishga tushirish
docker-compose up -d

# 6. Statusni tekshirish
docker ps
curl http://localhost:9200  # OpenSearch
curl http://localhost:4000  # Backend
```

#### 3️⃣ Domain va SSL sozlash (Nginx)

```bash
# Nginx o'rnatish
apt update && apt install -y nginx certbot python3-certbot-nginx

# Nginx config
nano /etc/nginx/sites-available/telegram-bot
```

**Nginx config:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Config-ni yoqish
ln -s /etc/nginx/sites-available/telegram-bot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL sertifikat
certbot --nginx -d api.yourdomain.com
```

---

## 🔍 Docker Containerlarni Tekshirish

### Render.com-da

**Render-da faqat bitta container ishlatishingiz mumkin** (web service).

Container log-larini ko'rish:

- Render Dashboard → Your Service → Logs

Docker container-ni to'g'ridan-to'g'ri ko'ra olmaysiz, chunki Render bu access bermaydi.

### VPS-da

```bash
# Barcha containerlar
docker ps

# Faqat ishlaydigan
docker ps --filter "status=running"

# Container log-lari
docker logs opensearch
docker logs postgres
docker logs nest-backend

# Container ichiga kirish
docker exec -it opensearch bash
docker exec -it nest-backend sh

# Resource usage
docker stats
```

---

## 📊 Tavsiyalar

| Ehtiyoj                 | Yechim                  | Narx          |
| ----------------------- | ----------------------- | ------------- |
| **Tez test**            | Render + OpenSearch-siz | **Bepul**     |
| **Production (kichik)** | Render + Bonsai.io      | **$10-15/oy** |
| **To'liq nazorat**      | VPS (Hetzner) + Docker  | **€5/oy**     |
| **Enterprise**          | AWS/Azure               | **$50+/oy**   |

---

## ❓ Savollar

**1. Qaysi variantni tanlayman?**

- Agar budget cheklangan → **VPS (Hetzner/Contabo)**
- Agar osongina setup kerak → **Render + Bonsai.io**
- Agar test qilmoqchi → **Render (OpenSearch-siz)**

**2. OpenSearch URL-i qayerdan olaman?**

- **Bonsai.io**: Dashboard → Access URL
- **AWS**: OpenSearch domain endpoint
- **VPS**: `http://your-server-ip:9200`

**3. Render-da docker ps ishlaydimi?**

- **Yo'q!** Render-da SSH access yo'q.
- Faqat Render dashboard logsni ko'rsatadi.

**4. .env faylni server-ga qanday yuklash?**

- **Render**: Dashboard → Environment Variables
- **VPS**: `.env` faylni SSH orqali yuklash yoki git-dan pull qilish

---

## 🎯 Tavsiya

Sizning holingiz uchun **VPS (Hetzner Cloud)** eng yaxshi variant:

- ✅ To'liq Docker Compose ishlaydi
- ✅ Barcha 3ta container (backend, postgres, opensearch)
- ✅ SSH access
- ✅ Arzon (€4.51/oy)
- ✅ Full control

**Render** faqat bitta web service uchun yaxshi, lekin siz 3ta service ishlatmoqchisiz.
