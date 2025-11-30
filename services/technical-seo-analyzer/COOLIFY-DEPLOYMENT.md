# Python Microservice - Coolify Deployment Guide

Technical SEO Analyzer microservice'ini Coolify'a deploy etme rehberi.

## 📋 Ön Hazırlık

### 1. GitHub Repository

Python microservice kodlarını GitHub'a push edin:

```bash
# Ana dizinden (SEO-EXPERT/)
git add services/technical-seo-analyzer/
git commit -m "Add Python Technical SEO Analyzer microservice"
git push origin main
```

### 2. Environment Variables Hazırlama

Coolify'da kullanacağınız değişkenler:

```bash
# Optional - AI Suggestions için
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# CORS - Next.js app'inizin URL'i
ALLOWED_ORIGINS=https://your-nextjs-app.com,http://localhost:3000

# Timeout
REQUEST_TIMEOUT=30

# Logging
LOG_LEVEL=INFO
```

## 🚀 Coolify Deployment - İki Yöntem

### Yöntem 1: Monorepo ile (Önerilen)

Tüm projeyi deploy edip sadece microservice'i çalıştırın.

#### Adım 1: Coolify'da Resource Oluştur

1. Coolify Dashboard → **+ Add Resource**
2. **Public Repository** seçin
3. Repository URL: `https://github.com/yourusername/SEO-EXPERT`
4. Branch: `main`

#### Adım 2: Build Configuration

```yaml
Build Pack: Dockerfile
Dockerfile Location: /services/technical-seo-analyzer/Dockerfile
Base Directory: /services/technical-seo-analyzer
Build Command: (auto - Dockerfile kullanacak)
Port: 8000
```

**IMPORTANT:** Coolify'da "Base Directory" ayarı:
- Advanced Settings → **Base Directory**
- Değer: `services/technical-seo-analyzer`

#### Adım 3: Environment Variables

Coolify → Your Service → **Environment Variables**

```bash
ALLOWED_ORIGINS=https://your-nextjs-app.com
REQUEST_TIMEOUT=30
LOG_LEVEL=INFO

# Optional
ANTHROPIC_API_KEY=sk-ant-xxx
```

#### Adım 4: Health Check

```yaml
Health Check Path: /health
Health Check Port: 8000
Health Check Method: GET
Interval: 30s
```

#### Adım 5: Domain (Optional)

```
Domain: seo-analyzer.yourdomain.com
SSL: ✅ Auto (Let's Encrypt)
```

### Yöntem 2: Separate Git Subtree (Advanced)

Sadece microservice klasörünü ayrı bir repo olarak deploy edin.

#### Subtree Oluşturma

```bash
# Ana repo'dan
git subtree split --prefix=services/technical-seo-analyzer -b python-microservice

# Yeni repo oluşturun GitHub'da: seo-analyzer
# Push edin
git push https://github.com/yourusername/seo-analyzer.git python-microservice:main
```

#### Coolify'da Deploy

1. New Resource → Public Repository
2. URL: `https://github.com/yourusername/seo-analyzer`
3. Branch: `main`
4. Build Pack: Dockerfile (root'ta)
5. Port: 8000

## 🐳 Docker Deployment Özellikleri

Mevcut Dockerfile zaten production-ready:

```dockerfile
# Python 3.11 slim
FROM python:3.11-slim

# Dependencies
RUN apt-get update && apt-get install -y gcc

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY app/ ./app/

# Health check built-in
HEALTHCHECK --interval=30s --timeout=10s

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📊 Resource Ayarları

### Minimum Requirements

```yaml
CPU: 1 vCPU
RAM: 512 MB
Disk: 1 GB
```

### Recommended (Production)

```yaml
CPU: 2 vCPU
RAM: 1 GB
Disk: 2 GB
```

## 🔧 Coolify Advanced Settings

### Build Settings

```yaml
Memory Limit: 2GB
CPU Limit: 2
Build Timeout: 300s
```

### Runtime Settings

```yaml
Restart Policy: unless-stopped
Max Restart Attempts: 3
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Dockerfile tested locally
- [ ] Environment variables ready
- [ ] Domain configured (optional)

### During Deployment
- [ ] Coolify resource created
- [ ] Base directory set (if monorepo)
- [ ] Environment variables added
- [ ] Health check configured
- [ ] Domain & SSL configured

### Post-Deployment
- [ ] Health check test: `curl https://seo-analyzer.yourdomain.com/health`
- [ ] Full analysis test
- [ ] Logs check (no errors)
- [ ] Auto-deploy enabled

## 🧪 Testing After Deployment

### 1. Health Check

```bash
curl https://seo-analyzer.yourdomain.com/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "Technical SEO Analyzer",
  "version": "1.0.0"
}
```

### 2. Analysis Test

```bash
curl -X POST https://seo-analyzer.yourdomain.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. Swagger UI

Ziyaret et: `https://seo-analyzer.yourdomain.com/docs`

## 🔗 Next.js Integration

Deploy edildikten sonra Next.js app'inizde:

```typescript
// lib/config/services.ts
export const SERVICES = {
  seoAnalyzer: process.env.NEXT_PUBLIC_SEO_ANALYZER_URL || 
               'https://seo-analyzer.yourdomain.com'
};

// lib/services/seo-analyzer.ts
import { SERVICES } from '@/lib/config/services';

export async function analyzeUrl(url: string) {
  const response = await fetch(`${SERVICES.seoAnalyzer}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    throw new Error('Analysis failed');
  }
  
  return await response.json();
}
```

Next.js `.env`:
```bash
NEXT_PUBLIC_SEO_ANALYZER_URL=https://seo-analyzer.yourdomain.com
```

## 📊 Monitoring & Logs

### Logs Görüntüleme

Coolify Dashboard → Your Service → **Logs**

```bash
# Real-time
Click "Live Logs"

# Filter
Search: "error", "warning", etc.
```

### Metrics

Coolify → Your Service → **Metrics**

- CPU Usage
- Memory Usage
- Network I/O
- Request count

## 🔄 Auto-Deployment

### GitHub Webhook Setup

Coolify otomatik webhook oluşturur, ancak manual:

1. GitHub Repo → Settings → Webhooks
2. Payload URL: (Coolify'dan alın)
3. Content type: `application/json`
4. Events: `push`
5. Active: ✅

### Coolify Auto-Deploy

Coolify → Your Service → **Automatic Deployment**

- ✅ Enable Automatic Deployment
- Branch: `main`
- Deploy on Push: ✅

## 🐛 Troubleshooting

### Build Başarısız

**Hata:** `pip install failed`

**Çözüm:**
```yaml
# Coolify Advanced Settings
Build Memory: 2GB (default: 1GB)
```

**Hata:** `Dockerfile not found`

**Çözüm:**
```yaml
# Base Directory
services/technical-seo-analyzer

# Dockerfile Location
services/technical-seo-analyzer/Dockerfile
```

### Runtime Hataları

**Hata:** Service crashes on startup

**Çözüm:** Logs kontrol et
```bash
# Common issues:
1. Missing environment variables
2. Port conflict (8000 already used)
3. Memory limit exceeded
```

**Hata:** CORS errors from Next.js

**Çözüm:**
```bash
# Update environment variable
ALLOWED_ORIGINS=https://your-nextjs-app.com,https://app.example.com
```

### Health Check Fails

**Hata:** Health check timeout

**Çözüm:**
```yaml
# Increase timeout
Health Check Timeout: 30s (default: 10s)

# Or check if service is actually running
curl http://localhost:8000/health
```

## 🚀 Production Optimizations

### 1. Workers Configuration

Update Dockerfile CMD:

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 2. Caching (Optional)

Eğer Redis eklerseniz:

```yaml
# Coolify
Services:
  seo-analyzer:
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
```

Environment:
```bash
REDIS_URL=redis://redis:6379
```

### 3. Rate Limiting

FastAPI middleware ekleyin:

```python
# app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze_url(...):
    ...
```

## 📈 Scaling

### Horizontal Scaling

Coolify → Your Service → **Scale**

```yaml
Instances: 2-4 (based on traffic)
Load Balancer: ✅ Auto
```

### Vertical Scaling

```yaml
CPU: 2 → 4 vCPU
RAM: 1GB → 2GB
```

## 💰 Cost Optimization

### Resource Limits

```yaml
# Development
CPU: 0.5 vCPU
RAM: 512 MB
Cost: ~$5/month

# Production
CPU: 1 vCPU
RAM: 1 GB
Cost: ~$10/month

# High Traffic
CPU: 2 vCPU
RAM: 2 GB
Cost: ~$20/month
```

## 🎯 Quick Deploy Summary

```bash
# 1. Push code
git push origin main

# 2. Coolify
- Create Resource
- Set Base Directory: services/technical-seo-analyzer
- Add Env Vars
- Configure Health Check: /health on port 8000
- Deploy

# 3. Test
curl https://your-service.com/health

# 4. Integrate
Update NEXT_PUBLIC_SEO_ANALYZER_URL in Next.js
```

## 📚 Resources

- [Coolify Docs](https://coolify.io/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Status:** ✅ Production Ready  
**Deployment Time:** ~10 minutes  
**Difficulty:** ⭐⭐ Easy (with monorepo)
