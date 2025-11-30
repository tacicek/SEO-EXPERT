# SEO Expert AI - Coolify Backend Deployment Guide

Bu rehber, SEO Expert AI uygulamasını Coolify'a deploy etmek için adım adım talimatlar içerir.

## 📋 Öncesinde Hazırlıklar

### 1. Gereksinimler

- ✅ Coolify instance (self-hosted veya cloud)
- ✅ GitHub/GitLab repository
- ✅ Supabase account ve project
- ✅ Domain (opsiyonel ama önerilen)

### 2. Environment Variables Hazırlığı

Aşağıdaki environment variable'ları hazır edin:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Serper (Google Search API)
SERPER_API_KEY=your-serper-key

# Google PageSpeed (opsiyonel)
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=your-pagespeed-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🚀 Coolify Deployment Adımları

### Adım 1: GitHub Repository Hazırlama

```bash
# Eğer henüz GitHub'da değilse
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/SEO-EXPERT.git
git push -u origin main
```

### Adım 2: Coolify'da Yeni Resource Oluşturma

1. **Coolify Dashboard**'a giriş yapın
2. **+ Add** → **New Resource** tıklayın
3. **Public Repository** seçin (veya Private ise GitHub integration)
4. Repository URL'sini girin: `https://github.com/yourusername/SEO-EXPERT`

### Adım 3: Build & Deploy Ayarları

#### 3.1 Build Configuration

```yaml
Build Pack: Nixpacks (Auto-detect)
Base Directory: /
Build Command: npm run build (auto-detected)
Start Command: npm run start (auto-detected)
Port: 3000
```

#### 3.2 Advanced Settings

**Dockerfile Location:** `/Dockerfile` (zaten mevcut)

**Build Arguments:**
```
NODE_ENV=production
```

### Adım 4: Environment Variables Ekleme

Coolify Dashboard → Your App → **Environment Variables** bölümünde:

#### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Configuration  
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Search API
SERPER_API_KEY=xxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://seo-expert.yourdomain.com
NODE_ENV=production
```

#### Optional Variables

```bash
# Google PageSpeed
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=xxx

# Redis (future use)
REDIS_URL=redis://localhost:6379
```

### Adım 5: Domain Configuration

#### 5.1 Custom Domain Ekleme

1. Coolify Dashboard → Your App → **Domains**
2. **Add Domain** tıklayın
3. Domain girin: `seo-expert.yourdomain.com`
4. **Generate SSL Certificate** (Let's Encrypt) tıklayın

#### 5.2 DNS Ayarları

DNS provider'ınızda (Cloudflare, etc.):

```
Type: A
Name: seo-expert (or @)
Value: [Coolify Server IP]
TTL: Auto

# Veya CNAME
Type: CNAME
Name: seo-expert
Value: your-coolify-instance.com
TTL: Auto
```

### Adım 6: Health Check Ayarları

Coolify → Your App → **Health Checks**

```yaml
Health Check Path: /api/health
Health Check Port: 3000
Health Check Method: GET
```

**Health Check Endpoint Oluştur:**

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SEO Expert AI',
    version: '1.0.0'
  });
}
```

### Adım 7: Deploy Triggers

#### 7.1 Automatic Deployment

Coolify → Your App → **Automatic Deployment**

- ✅ **Enable Automatic Deployment**
- Branch: `main`
- Deploy on Push: ✅

#### 7.2 Webhook (GitHub)

GitHub Repository → Settings → Webhooks → Add webhook

```
Payload URL: [Coolify webhook URL]
Content type: application/json
Which events: Just the push event
Active: ✅
```

## 🔧 Advanced Configuration

### Docker Compose (Multi-Service Setup)

Eğer Python microservice de deploy edecekseniz:

```yaml
# docker-compose.coolify.yml
version: '3.8'

services:
  nextjs-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SERPER_API_KEY=${SERPER_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Python Technical SEO Microservice (future)
  # technical-seo-analyzer:
  #   build:
  #     context: ./services/technical-seo-analyzer
  #     dockerfile: Dockerfile
  #   ports:
  #     - "8000:8000"
  #   environment:
  #     - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  #   restart: unless-stopped
```

### Nginx Reverse Proxy (Opsiyonel)

Coolify otomatik handle eder, ama custom nginx config için:

```nginx
# coolify-nginx.conf
upstream nextjs_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name seo-expert.yourdomain.com;

    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Logs

### Logs Görüntüleme

Coolify Dashboard → Your App → **Logs**

```bash
# Real-time logs
Click "Live Logs" button

# Historical logs
Select date range
```

### Metrics

Coolify → Your App → **Metrics**

- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

## 🔄 CI/CD Pipeline

### GitHub Actions (Opsiyonel)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Trigger Coolify Deployment
        run: |
          curl -X POST ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

## 🐛 Troubleshooting

### Build Başarısız Olursa

```bash
# Coolify logs kontrol et
Dashboard → App → Logs → Build Logs

# Common issues:
1. Environment variables eksik
2. Node version uyumsuz
3. Dependencies install hatası
4. Build memory yetersiz
```

**Çözümler:**

```yaml
# Coolify → Advanced Settings
Build Settings:
  Memory Limit: 2GB (default: 1GB)
  CPU Limit: 2 (default: 1)
  Build Timeout: 600s (default: 300s)
```

### Runtime Hataları

```bash
# Application logs kontrol et
Dashboard → App → Logs → Runtime Logs

# Common issues:
1. Database connection failed (Supabase keys)
2. API rate limits (Anthropic, Serper)
3. Port already in use
```

### Database Migration

```bash
# Migration'ları manuel çalıştırma
Coolify → App → Terminal

# SQL Editor'e git (Supabase)
# Copy migrations/002_projects_system.sql
# Execute
```

## ✅ Deployment Checklist

Pre-Deployment:
- [ ] GitHub repo hazır
- [ ] `.env.example` dosyası eklenmiş
- [ ] Dockerfile test edilmiş
- [ ] Migrations hazır
- [ ] Health check endpoint var

During Deployment:
- [ ] Coolify resource oluşturuldu
- [ ] Environment variables eklendi
- [ ] Domain configure edildi
- [ ] SSL certificate oluşturuldu
- [ ] Health check ayarlandı

Post-Deployment:
- [ ] App çalışıyor (domain check)
- [ ] Database bağlantısı OK
- [ ] API endpoints çalışıyor
- [ ] Logs temiz
- [ ] Auto-deployment aktif

## 🚀 Production Optimizations

### 1. Caching

```typescript
// next.config.ts
const nextConfig = {
  // ...existing config
  
  // Enable SWC minification
  swcMinify: true,
  
  // Cache headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};
```

### 2. Image Optimization

Coolify otomatik handle eder, ama custom domain için:

```typescript
// next.config.ts
images: {
  domains: ['your-coolify-domain.com'],
  formats: ['image/avif', 'image/webp'],
}
```

### 3. Analytics (Opsiyonel)

```bash
# Environment variable ekle
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

## 📚 Kaynaklar

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Guides](https://supabase.com/docs/guides)

## 🆘 Destek

Sorun yaşarsanız:

1. Coolify Logs kontrol edin
2. GitHub Issues açın
3. Coolify Discord'a katılın
4. [Coolify Docs](https://coolify.io/docs) inceleyin

---

**Son Güncelleme:** 30.11.2024  
**Versiyon:** 1.0.0  
**Status:** ✅ Production Ready
