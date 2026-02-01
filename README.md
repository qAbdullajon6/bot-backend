# 🤖 Telegram Bot Backend - NestJS

PDF fayllardan qidiruv funksiyasi bilan Telegram bot backend.

## 🚀 Features

- **OpenSearch Integration** - PDF fayllardan content qidiruv
- **PostgreSQL Database** - Users va search history
- **JWT Authentication** - Secure admin panel
- **File Upload** - PDF fayllarni yuklash va indexlash
- **Telegram Bot** - User management
- **Admin Dashboard API** - Statistics va monitoring

## 📋 Tech Stack

- **NestJS** - Backend framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Relational database
- **OpenSearch** - Full-text search engine
- **Docker** - Containerization

---

## 🏠 Local Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# 1. Clone repository
git clone <your-repo-url>
cd nest-backend

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start services with Docker Compose
docker-compose up -d

# 5. Check services status
docker ps

# 6. View logs
docker logs nest-backend
docker logs opensearch
docker logs postgres

# 7. Access the application
# Backend: http://localhost:4000
# OpenSearch: http://localhost:9200
# PostgreSQL: localhost:5432
```

### Development Commands

```bash
# Start in development mode
npm run start:dev

# Build production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

---

## 🌐 Production Deployment

### ⚠️ Important: Render.com Limitations

**Render.com does NOT support Docker Compose!**

You have two options:

### Option 1: Render.com (Recommended for beginners)

**Requirements:**

- Render.com account (free tier available)
- External OpenSearch hosting (see below)

**Steps:**

1. **Setup External OpenSearch**

Choose one of these providers:

| Provider           | Free Tier   | Setup Link                                 |
| ------------------ | ----------- | ------------------------------------------ |
| **SearchBox.io**   | 50,000 docs | https://searchbox.io                       |
| **Bonsai.io**      | 125MB       | https://bonsai.io                          |
| **AWS OpenSearch** | 750 hrs/mo  | https://aws.amazon.com/opensearch-service/ |

2. **Deploy to Render**

```bash
# Push to GitHub
git add .
git commit -m "Deploy to Render"
git push origin main

# On Render Dashboard:
# 1. New → Web Service
# 2. Connect GitHub repository
# 3. Select branch: main
# 4. Build Command: npm install
# 5. Start Command: npm run start:prod
```

3. **Configure Environment Variables**

Go to Render Dashboard → Your Service → Environment:

```bash
PORT=4000
NODE_ENV=production

# PostgreSQL (create PostgreSQL database in Render first)
POSTGRES_HOST=<from-render-postgres-service>
POSTGRES_PORT=5432
POSTGRES_USER=<from-render>
POSTGRES_PASSWORD=<from-render>
POSTGRES_DATABASE=telegram_bot_db

# Bot & Auth
TELEGRAM_BOT_TOKEN=<your-bot-token>
JWT_SECRET=<generate-random-secret>

# OpenSearch (CRITICAL!)
OPENSEARCH_NODE=https://your-cluster.searchbox.io:443
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=<your-password>
```

⚠️ **CRITICAL:** `OPENSEARCH_NODE` must be external URL, NOT `localhost`!

4. **Deploy**

Click "Create Web Service" and wait for deployment to complete.

**See detailed guide:** [RENDER_OPENSEARCH_FIX.md](./RENDER_OPENSEARCH_FIX.md)

---

### Option 2: VPS (Full Control)

**Recommended VPS Providers:**

- Hetzner Cloud - €4.51/month (CX11)
- DigitalOcean - $6/month
- Contabo - €5/month

**Deployment:**

```bash
# 1. SSH to your VPS
ssh root@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone repository
git clone <your-repo-url>
cd nest-backend

# 4. Configure environment
nano .env
# Set your production values

# 5. Deploy with Docker Compose
docker-compose up -d

# 6. Check status
docker ps
curl http://localhost:9200  # OpenSearch
curl http://localhost:4000  # Backend

# 7. Setup Nginx reverse proxy (optional)
apt install nginx certbot python3-certbot-nginx
# Configure nginx for your domain
```

**See detailed guide:** [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

---

## 🔍 API Endpoints

### Public Endpoints

```bash
# Health check
GET /

# Search documents
GET /search?q=your-query
```

### Admin Endpoints (require JWT)

```bash
# Login
POST /auth/login
Body: { "username": "admin", "password": "password" }

# Get all users
GET /users

# Upload PDF
POST /documents/upload
Body: FormData with 'file' field

# Statistics
GET /statistics
```

---

## 🐛 Troubleshooting

### OpenSearch Connection Error

**Error:** `ConnectionError: Connection Error at http://localhost:9200/`

**Solution:**

1. Check `OPENSEARCH_NODE` environment variable
2. Make sure it's NOT `localhost` in production
3. Verify OpenSearch cluster is accessible
4. Check logs: `docker logs opensearch`

See: [RENDER_OPENSEARCH_FIX.md](./RENDER_OPENSEARCH_FIX.md)

### Database Connection Error

**Error:** `Error connecting to database`

**Solution:**

1. Check PostgreSQL is running: `docker ps`
2. Verify credentials in `.env`
3. Check connection: `docker exec -it postgres psql -U postgres`

### Application Won't Start

**Solution:**

```bash
# Check logs
docker logs nest-backend --tail 100

# Restart services
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose up -d --build
```

---

## 📊 Project Structure

```
nest-backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # Users management
│   ├── documents/         # PDF upload & indexing
│   ├── search/            # OpenSearch integration
│   ├── synonyms/          # Search synonyms
│   ├── statistics/        # Analytics
│   └── main.ts
├── docker-compose.yml     # Local development
├── Dockerfile             # Production image
├── .env.example           # Environment template
├── .env.render.example    # Render.com template
└── README.md
```

---

## 🔒 Security Notes

1. **Never commit `.env` file** - It contains secrets!
2. **Change default passwords** - Especially for production
3. **Use strong JWT_SECRET** - Generate random 32+ characters
4. **Enable HTTPS** - Use SSL certificates in production
5. **Secure OpenSearch** - Use authentication when possible

---

## 📝 Environment Variables

| Variable              | Description                    | Example                          |
| --------------------- | ------------------------------ | -------------------------------- |
| `PORT`                | Application port               | `4000`                           |
| `NODE_ENV`            | Environment                    | `production`                     |
| `POSTGRES_HOST`       | PostgreSQL host                | `postgres` (local) or external   |
| `POSTGRES_PORT`       | PostgreSQL port                | `5432`                           |
| `POSTGRES_USER`       | PostgreSQL username            | `postgres`                       |
| `POSTGRES_PASSWORD`   | PostgreSQL password            | `your-password`                  |
| `POSTGRES_DATABASE`   | Database name                  | `telegram_bot_db`                |
| `TELEGRAM_BOT_TOKEN`  | Telegram bot token             | `123456:ABC...`                  |
| `JWT_SECRET`          | JWT secret key                 | Random string                    |
| `OPENSEARCH_NODE`     | OpenSearch URL                 | `http://opensearch:9200` (local) |
| `OPENSEARCH_USERNAME` | OpenSearch user (optional)     | `admin`                          |
| `OPENSEARCH_PASSWORD` | OpenSearch password (optional) | `password`                       |

See [.env.render.example](./.env.render.example) for production examples.

---

## 📚 Additional Documentation

- [Render.com Deployment Guide](./RENDER_DEPLOYMENT.md)
- [OpenSearch Connection Fix](./RENDER_OPENSEARCH_FIX.md)
- [API Documentation](#) (Coming soon)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

---

## 📄 License

MIT License - feel free to use this project for learning and building.

---

## 💬 Support

If you encounter issues:

1. Check [RENDER_OPENSEARCH_FIX.md](./RENDER_OPENSEARCH_FIX.md)
2. Review logs: `docker logs <service-name>`
3. Verify environment variables
4. Open GitHub issue with error details

---

**Made with ❤️ using NestJS and OpenSearch**
