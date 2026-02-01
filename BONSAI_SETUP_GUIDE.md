# 🎯 Bonsai.io OpenSearch - Render.com Setup Guide

## ✅ Siz Bonsai.io-da Cluster Yaratdingiz!

Sizning Bonsai connection URL:

```
https://5d40cfd718:********@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
```

---

## 📋 STEP-BY-STEP SETUP

### **STEP 1: Parol-ni To'liq Oling**

1. **Bonsai dashboard-ga boring:**
   https://app.bonsai.io/clusters

2. **Cluster-ni tanlang** (honest-katsura-1m3g0mkv)

3. **"Access" tab-ni oching**

4. **To'liq URL-ni ko'chirib oling** (parolni ham!)

   Format:

   ```
   https://USERNAME:FULL_PASSWORD@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
   ```

   Sizning URL-da:
   - **Username**: `5d40cfd718`
   - **Password**: `********` ← Bu yerda to'liq parol bor (yulduzlar o'rnida)
   - **Host**: `honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net`

⚠️ **MUHIM:** To'liq URL-ni password bilan ko'chirib oling!

---

### **STEP 2: Local Test (Vaqtinchalik)**

1. **.env faylni oching:**

   ```bash
   c:\Users\azikm\Desktop\telegram\nest-backend\.env
   ```

2. **OPENSEARCH_NODE qatorini topib, to'liq parol-ni kiriting:**

   ```bash
   # ❌ XATO (yulduzlar bilan):
   OPENSEARCH_NODE=https://5d40cfd718:********@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net

   # ✅ TO'G'RI (to'liq parol bilan):
   OPENSEARCH_NODE=https://5d40cfd718:ACTUAL_PASSWORD_HERE@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
   ```

   ⚠️ `ACTUAL_PASSWORD_HERE` o'rniga Bonsai-dan olgan parolingizni yozing!

3. **Saqlang** (Ctrl+S)

4. **Backend-ni restart qiling:**

   ```bash
   # Agar Docker ishlatayotgan bo'lsangiz:
   docker-compose restart app

   # Agar npm ishlatayotgan bo'lsangiz:
   npm run start:dev
   ```

5. **Log-larni tekshiring:**

   ```bash
   # Docker:
   docker logs nest-backend

   # Muvaffaqiyatli bo'lsa ko'rasiz:
   [OpenSearch] ✅ Connected successfully to https://honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
   ```

6. **Test qiling:**
   ```bash
   curl "http://localhost:4000/search?q=test"
   ```

---

### **STEP 3: Render.com-ga Qo'shish**

Local-da ishlasangiz, endi Render-ga qo'shamiz:

#### **A. Render Dashboard-ga Boring**

1. **Login:** https://dashboard.render.com

2. **Web Service-ni tanlang** (backend service)

3. **"Environment" tab-ni oching**

#### **B. Environment Variable Qo'shing**

1. **"Add Environment Variable" bosing**

2. **Key va Value kiriting:**

   | Field     | Value                                                                                   |
   | --------- | --------------------------------------------------------------------------------------- |
   | **Key**   | `OPENSEARCH_NODE`                                                                       |
   | **Value** | `https://5d40cfd718:ACTUAL_PASSWORD@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net` |

   ⚠️ **MUHIM:**
   - `ACTUAL_PASSWORD` o'rniga Bonsai-dan olgan parolingizni kiriting!
   - Protocol `https://` bo'lsin (http emas!)
   - URL oxirida `/` yoki port raqami bo'lmasin

3. **"Save Changes" bosing**

#### **C. Boshqa Environment Variables-ni Tekshiring**

Render-da bu variables mavjudligini tekshiring:

| Key                   | Value                    | Notes                 |
| --------------------- | ------------------------ | --------------------- |
| `PORT`                | `4000`                   |                       |
| `NODE_ENV`            | `production`             |                       |
| `POSTGRES_HOST`       | `<from-render-postgres>` | Auto-filled           |
| `POSTGRES_PORT`       | `5432`                   |                       |
| `POSTGRES_USER`       | `<from-render>`          | Auto-filled           |
| `POSTGRES_PASSWORD`   | `<from-render>`          | Auto-filled           |
| `POSTGRES_DATABASE`   | `telegram_bot_db`        |                       |
| `TELEGRAM_BOT_TOKEN`  | `8565756347:AAG...`      | Your bot token        |
| `JWT_SECRET`          | `super-secret-key`       | Change in production! |
| **`OPENSEARCH_NODE`** | **Bonsai URL**           | ⚠️ With password!     |

#### **D. Deploy**

1. **Render avtomatik redeploy qiladi** (2-3 daqiqa)

2. **Log-larni kuzating:**
   - Render Dashboard → Your Service → **Logs** tab

3. **Qidirayotgan log:**

   ```
   [OpenSearch] Connecting to: https://honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
   [OpenSearch] ✅ Connected successfully to https://honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
   [OpenSearch] ✅ Index documents already exists.
   ```

4. **Xatolik bo'lsa:**

   ```
   [OpenSearch] ❌ Error connecting (Retries left: 29)
   ```

   Bu degani:
   - Parol noto'g'ri
   - URL format noto'g'ri
   - Network problema

---

### **STEP 4: Test Qiling**

1. **Render-dagi URL-ni oling:**

   ```
   https://your-app-name.onrender.com
   ```

2. **Search endpoint-ni test qiling:**

   ```bash
   curl "https://your-app-name.onrender.com/search?q=test"
   ```

3. **Brauzerda:**

   ```
   https://your-app-name.onrender.com/search?q=test
   ```

4. **Kutilayotgan javob:**

   ```json
   [] // Agar hali PDF yuklagan bo'lmasangiz
   ```

   Yoki:

   ```json
   [
     {
       "id": "...",
       "score": 1.5,
       "source": {...},
       "highlight": {...}
     }
   ]
   ```

---

## 🐛 Troubleshooting

### **Xatolik: "OpenSearch is not configured"**

**Sabab:** OPENSEARCH_NODE to'g'ri o'rnatilmagan

**Yechim:**

1. Render Dashboard → Environment → OPENSEARCH_NODE tekshiring
2. URL-da parol borligini tekshiring
3. URL `https://` bilan boshlanayotganini tekshiring

---

### **Xatolik: "Connection Error"**

**Sabab:** Parol noto'g'ri yoki network problema

**Yechim:**

1. Bonsai dashboard-dan URL-ni qayta ko'chirib oling
2. Parol-ni tekshiring (katta-kichik harflar farq qiladi!)
3. Bonsai cluster "Active" statusda ekanligini tekshiring

**Bonsai-da tekshirish:**

```bash
curl "https://5d40cfd718:YOUR_PASSWORD@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net"
```

**Javob:**

```json
{
  "name": "...",
  "cluster_name": "...",
  "version": {...}
}
```

---

### **Xatolik: "401 Unauthorized"**

**Sabab:** Username yoki password noto'g'ri

**Yechim:**

1. Bonsai dashboard → Access → "Show credentials"
2. Username: `5d40cfd718`
3. Password-ni to'g'ri kiriting
4. URL format: `https://USERNAME:PASSWORD@HOST`

---

## 📊 Tekshirish Checklist

- [ ] Bonsai-dan to'liq URL ko'chirildi (parol bilan)
- [ ] `.env` faylda OPENSEARCH_NODE to'g'ri
- [ ] Local-da test qilindi va ishladi
- [ ] Render-da OPENSEARCH_NODE environment variable qo'shildi
- [ ] Render redeploy qilindi
- [ ] Render log-larida "✅ Connected successfully" ko'rsatildi
- [ ] Search endpoint test qilindi va ishlayapti

---

## 🎉 Muvaffaqiyatli Bo'lsa

Render log-larida ko'rasiz:

```
[OpenSearch] Connecting to: https://honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net
[OpenSearch] ✅ Connected successfully!
[OpenSearch] ✅ Index documents already exists.
```

Va search ishlaydi:

```bash
curl "https://your-app.onrender.com/search?q=test"
# → Returns results!
```

---

## 📝 Keyingi Qadamlar

1. **PDF yuklash:**

   ```bash
   POST /documents/upload
   # Upload PDF files
   ```

2. **Index-ni tekshirish:**
   - Bonsai Dashboard → Indices
   - `documents` index ko'rinishi kerak

3. **Qidiruv test:**
   - PDF yuklang
   - Search qiling
   - Results qaytishi kerak

---

## ⚠️ SECURITY NOTES

1. **Parol-ni hech qayerga commit qilmang!**

   ```bash
   # .gitignore-da bo'lsin:
   .env
   .env.local
   .env.*.local
   ```

2. **Render-da Environment Variables-dan foydalaning**
   - Kodga hardcode qilmang!

3. **Bonsai parol-ni o'zgartirish:**
   - Bonsai Dashboard → Cluster → Settings → Reset Credentials

---

## 🆘 Yordam Kerakmi?

**Agar ishlamasa:**

1. **Log-larni yuboring** (Render → Logs)
2. **Environment variables-ni screenshot qiling**
3. **Bonsai cluster statusni tekshiring** (Active bo'lishi kerak)

**Test uchun command:**

```bash
# Bonsai-ga to'g'ridan-to'g'ri ulanish:
curl "https://5d40cfd718:YOUR_PASSWORD@honest-katsura-1m3g0mkv.us-east-1.bonsaisearch.net"

# Render-dan search:
curl "https://your-app.onrender.com/search?q=test"
```

---

**Good luck! 🚀**
