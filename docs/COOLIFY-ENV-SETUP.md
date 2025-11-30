# Coolify Environment Variables Setup Guide

Her iki servis için environment variables'ları nasıl ekleyeceğinizi gösteren detaylı rehber.

## 🎯 Önce Hangi Service?

1. **Python Microservice** (seo-analyzer.seomind.ch) - Basit, az variable
2. **Next.js App** (seomind.ch) - Daha fazla variable

## 🐍 1. Python Microservice Environment Variables

### Adım 1: Coolify'da Servisi Bul

1. Coolify Dashboard'a giriş yap
2. **Resources** veya **Services** → Python microservice'ini bul
3. Service ismini tıkla (örn: "seo-analyzer" veya "technical-seo-analyzer")

### Adım 2: Environment Variables Sayfasına Git

1. Sol menüden **Environment Variables** tıkla
2. veya üst menüden **Environment** tab'ına tıkla

### Adım 3: Variables Ekle

**Tek tek eklemek için:**
1. **+ Add** veya **Add Variable** butonuna tıkla
2. Her bir variable için:
   - **Key** (Name): Variable adı
   - **Value**: Değeri
   - **Is Build Variable**: ❌ (runtime variable)
   - **Save** tıkla

**Bulk eklemek için (Önerilen):**
1. **Bulk Edit** veya **Edit as Text** butonuna tıkla
2. Aşağıdaki formatı kopyala-yapıştır:

```bash
ALLOWED_ORIGINS=https://seomind.ch,http://localhost:3000
REQUEST_TIMEOUT=30
LOG_LEVEL=INFO
```

**Opsiyonel (AI suggestions için):**
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. **Save** veya **Update** tıkla

### Adım 4: Servisi Restart Et

1. Üst menüden **Actions** → **Restart** tıkla
2. veya **Redeploy** butonu varsa onu tıkla
3. 1-2 dakika bekle

### Adım 5: Test Et

```bash
# Terminal'de
curl https://seo-analyzer.seomind.ch/health

# Beklenen:
{
  "status": "healthy",
  "service": "Technical SEO Analyzer",
  "version": "1.0.0"
}
```

---

## ⚛️ 2. Next.js App Environment Variables

### Adım 1: Coolify'da Servisi Bul

1. Coolify Dashboard
2. **Resources** → Next.js app'ini bul (örn: "seomind" veya "seo-expert")
3. Service ismini tıkla

### Adım 2: Environment Variables Sayfasına Git

1. Sol menüden **Environment Variables**
2. veya **Environment** tab'ı

### Adım 3: Variables Ekle

**Bulk Edit kullan (Önerilen):**

1. **Bulk Edit** veya **Edit as Text** butonuna tıkla
2. Aşağıdaki TÜM variables'ları kopyala-yapıştır:

```bash
# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
NEXT_PUBLIC_SEO_ANALYZER_URL=https://your-seo-analyzer-domain.com

# Serper API
SERPER_API_KEY=your_serper_api_key

# Google Search Console API
GOOGLE_SEARCH_CONSOLE_API_KEY=your_gsc_api_key

# Node Environment
NODE_ENV=production

# Optional Rate Limiting
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000

# Optional Analysis Config
MAX_CONTENT_LENGTH=50000
DEFAULT_ANALYSIS_TIMEOUT=120000
```

3. **Save** tıkla

### Adım 4: Build & Restart

Next.js için environment variables değişince yeniden build gerekir:

1. **Actions** → **Redeploy** tıkla
2. veya **Build** → **Rebuild** 
3. 5-10 dakika bekle (build süresi)

### Adım 5: Test Et

```bash
# Health check
curl https://seomind.ch/api/health

# Beklenen:
{
  "status": "healthy",
  "database": "healthy"
}
```

---

## 🎨 Coolify UI Alternatifleri

### Yöntem A: Tek Tek Eklemek

```
Key (Name)                              Value
-------------------------------------------
ANTHROPIC_API_KEY                       your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL                https://xxx.supabase.co
...
```

Her satır için:
1. **+ Add Variable**
2. Key gir
3. Value gir
4. **Save**

### Yöntem B: Bulk Edit (Önerilen - Hızlı)

```
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SERPER_API_KEY=xxx
```

1. **Bulk Edit** tıkla
2. Tüm variables'ı yapıştır (KEY=VALUE formatında)
3. **Save All**

### Yöntem C: .env Dosyasından Import (Bazı Coolify versiyonlarında)

1. **Import** veya **Upload** butonu varsa
2. Local `.env` dosyanızı seç
3. **Upload**

---

## ✅ Environment Variables Checklist

### Python Microservice (Minimum)
- [x] `ALLOWED_ORIGINS=https://seomind.ch,http://localhost:3000`
- [x] `REQUEST_TIMEOUT=30`
- [x] `LOG_LEVEL=INFO`
- [ ] `ANTHROPIC_API_KEY` (opsiyonel)

### Next.js App (Tüm)
- [x] `ANTHROPIC_API_KEY`
- [x] `OPENAI_API_KEY`
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `NEXT_PUBLIC_APP_URL`
- [x] `NEXT_PUBLIC_SEO_ANALYZER_URL`
- [x] `SERPER_API_KEY`
- [x] `NODE_ENV=production`

---

## 🐛 Troubleshooting

### Hata: Variables Görünmüyor

**Çözüm:**
1. Service'i restart et
2. Deployment logs kontrol et
3. Runtime logs kontrol et

### Hata: Build Başarısız

**Çözüm:**
```bash
# Build-time variables için
# "Is Build Variable" checkbox'ını işaretle

# Coolify'ın build sırasında kullanması gereken variables:
- NEXT_PUBLIC_* (her zaman build-time)
```

### Hata: CORS Hatası

**Çözüm:**
```bash
# Python microservice'de
ALLOWED_ORIGINS=https://seomind.ch

# Kontrol et:
curl https://seo-analyzer.seomind.ch/health
```

### Hata: Database Connection Failed

**Çözüm:**
```bash
# Supabase keys'leri kontrol et
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Test:
curl https://seomind.ch/api/health
```

---

## 📸 Screenshot Rehberi (Adımlar)

### 1. Service Seç
```
Coolify Dashboard
  → Resources
    → [Your Service Name]
```

### 2. Environment Tab
```
Service Detail Page
  → Environment Variables (sol menü)
```

### 3. Variable Ekle
```
Environment Variables Page
  → + Add Variable (tek tek)
  → Bulk Edit (toplu)
```

### 4. Format
```
Tek tek:
  Key: ANTHROPIC_API_KEY
  Value: your_anthropic_api_key
  ☐ Is Build Variable
  [Save]

Bulk:
  ANTHROPIC_API_KEY=your_anthropic_api_key
  SERPER_API_KEY=xxx
  [Save All]
```

### 5. Restart
```
Service Page
  → Actions (üst menü)
    → Restart
  veya
    → Redeploy
```

---

## 🎯 Quick Copy-Paste Bölümü

### Python Microservice (Tüm Variables)

```bash
ALLOWED_ORIGINS=https://seomind.ch,http://localhost:3000
REQUEST_TIMEOUT=30
LOG_LEVEL=INFO
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Next.js App (Tüm Variables)

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
NEXT_PUBLIC_SEO_ANALYZER_URL=https://your-seo-analyzer-domain.com
SERPER_API_KEY=your_serper_api_key
NODE_ENV=production
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
MAX_CONTENT_LENGTH=50000
DEFAULT_ANALYSIS_TIMEOUT=120000
```

---

## ✨ Final Test Komutları

```bash
# 1. Python Microservice
curl https://seo-analyzer.seomind.ch/health

# 2. Next.js App
curl https://seomind.ch/api/health

# 3. Full Integration Test
curl -X POST https://seo-analyzer.seomind.ch/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# 4. Browser Test
open https://seomind.ch
```

---

**Son Güncelleme:** 30.11.2024  
**Deployment:** Coolify v4+  
**Services:** 2 (Next.js + Python)
