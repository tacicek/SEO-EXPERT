# Coolify Deployment Guide

Bu dokümantasyon, SEO Expert AI uygulamasını Coolify'a nasıl deploy edeceğinizi adım adım anlatır.

## 📋 Gereksinimler

- ✅ Coolify sunucusu (self-hosted veya cloud)
- ✅ GitHub/GitLab repository
- ✅ Supabase projesi
- ✅ Anthropic API key
- ✅ Serper.dev API key

## 🚀 Adım 1: Coolify'da Yeni Proje Oluşturma

1. Coolify dashboard'a giriş yapın
2. **New Resource** butonuna tıklayın
3. **Application** seçeneğini seçin
4. Git repository'nizi bağlayın:
   - GitHub/GitLab'dan repository seçin
   - Main/master branch'i seçin

## ⚙️ Adım 2: Build & Deploy Ayarları

### Build Pack
- **Build Pack:** Nixpacks veya Dockerfile (Dockerfile önerilir)
- **Dockerfile Location:** `/Dockerfile` (root dizinde)

### Port Configuration
- **Port:** 3000
- **Expose Port:** 80 (veya istediğiniz port)

### Build Command (Nixpacks kullanıyorsanız)
```bash
npm ci && npm run build
```

### Start Command (Nixpacks kullanıyorsanız)
```bash
npm start
```

**Not:** Dockerfile kullanıyorsanız bu komutları belirtmenize gerek yok.

## 🔐 Adım 3: Environment Variables

Coolify dashboard'da **Environment** sekmesine gidin ve aşağıdaki değişkenleri ekleyin:

### Gerekli Environment Variables

```bash
# AI Provider Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Serper.dev API Configuration
SERPER_API_KEY=your_serper_api_key

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000

# Analysis Configuration
MAX_CONTENT_LENGTH=50000
DEFAULT_ANALYSIS_TIMEOUT=120000
```

### Environment Variables Nasıl Eklenir?

1. Coolify'da projenizi açın
2. **Environment Variables** sekmesine gidin
3. Her değişken için:
   - **Name:** Değişken adı (örn. `ANTHROPIC_API_KEY`)
   - **Value:** Değişken değeri
   - **Is Secret:** Hassas bilgiler için işaretleyin
4. **Save** butonuna tıklayın

## 🗄️ Adım 4: Supabase Kurulumu

Deploy etmeden önce Supabase veritabanınızı hazırlayın:

### 4.1 SQL Schema'yı Çalıştırın

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **SQL Editor**'e gidin
3. `supabase/schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın ve **Run** butonuna basın

### 4.2 API Keys'leri Alın

1. Supabase Dashboard → Settings → API
2. Aşağıdaki değerleri kopyalayın:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 🌐 Adım 5: Domain Ayarları

### Custom Domain Ekleme

1. Coolify'da projenizi açın
2. **Domains** sekmesine gidin
3. **Add Domain** butonuna tıklayın
4. Domain adınızı girin (örn. `seo-expert.yourdomain.com`)
5. DNS ayarlarınızı yapın:

```
Type: A
Name: seo-expert (veya subdomain)
Value: Coolify sunucu IP adresi
```

### SSL/TLS Sertifikası

Coolify otomatik olarak Let's Encrypt sertifikası oluşturur:
- ✅ **Auto SSL:** Enabled (default)
- ✅ **Force HTTPS:** Enabled

## 📦 Adım 6: Build Options

### Dockerfile Kullanımı (Önerilen)

Proje zaten Dockerfile içeriyor, bu nedenle:

1. **Build Pack:** Dockerfile seçin
2. **Dockerfile Path:** `/Dockerfile`
3. Diğer ayarları default bırakın

### Resource Limits (Opsiyonel)

**Memory Limit:** 2GB (önerilen)
**CPU Limit:** 2 cores

```yaml
resources:
  limits:
    memory: 2G
    cpus: '2'
  reservations:
    memory: 512M
    cpus: '0.5'
```

## 🚀 Adım 7: İlk Deployment

1. Tüm ayarları kontrol edin
2. **Deploy** butonuna tıklayın
3. Build loglarını takip edin
4. Deployment tamamlandığında domain'inizi ziyaret edin

### Build Sürecini Takip Etme

```bash
# Coolify build logs
- Cloning repository...
- Installing dependencies...
- Building Next.js application...
- Creating Docker image...
- Starting container...
- Application running on port 3000
```

## ✅ Adım 8: Deployment Sonrası Kontroller

### 8.1 Health Check

Domain'inizi tarayıcıda açın ve şunları kontrol edin:
- ✅ Ana sayfa yükleniyor mu?
- ✅ URL analiz çalışıyor mu?
- ✅ Database bağlantısı aktif mi?

### 8.2 API Endpoint Testi

```bash
# Analyze endpoint test
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Serper endpoint test
curl -X POST https://your-domain.com/api/serper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### 8.3 Database Bağlantısı

1. `/analyses` sayfasını ziyaret edin
2. Bir analiz yapın
3. Veritabanına kaydedildiğini kontrol edin

## 🔄 Otomatik Deployment (CI/CD)

Coolify otomatik olarak Git push'larda deploy eder:

### Auto Deploy Ayarları

1. Coolify'da projenizi açın
2. **General** sekmesine gidin
3. **Watch Branches** altında:
   - ✅ **Auto Deploy on Push** - Aktif
   - **Branch:** main (veya kullandığınız branch)

### Deployment Webhook

Manuel deployment için webhook:

```bash
# Webhook URL'i Coolify'dan alın
curl -X POST https://coolify.server/api/webhook/deploy/YOUR_WEBHOOK_ID
```

## 🐛 Troubleshooting

### Build Hatası

**Hata:** `npm install failed`
**Çözüm:** `package-lock.json` dosyasının repository'de olduğundan emin olun

**Hata:** `Module not found`
**Çözüm:** 
```bash
# Local'de temiz build test edin
rm -rf node_modules .next
npm ci
npm run build
```

### Runtime Hatası

**Hata:** `Database connection failed`
**Çözüm:** Supabase environment variables'ları kontrol edin

**Hata:** `API key not configured`
**Çözüm:** Environment variables'ın doğru ayarlandığından emin olun

### Memory Issues

Eğer build sırasında memory hatası alırsanız:

```dockerfile
# Dockerfile'da Node options ekleyin
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

## 📊 Monitoring & Logs

### Application Logs

Coolify'da logs görüntüleme:
1. Projenizi açın
2. **Logs** sekmesine gidin
3. Real-time logs görüntüleyin

### Performance Monitoring

```bash
# CPU ve Memory kullanımı
# Coolify dashboard'da otomatik gösterilir
```

## 🔒 Güvenlik

### Environment Variables Güvenliği

- ✅ Hassas bilgileri **Is Secret** olarak işaretleyin
- ✅ API keys'leri asla commit etmeyin
- ✅ `.env` dosyası `.gitignore`'da olsun

### HTTPS Zorunluluğu

```bash
# Coolify'da Force HTTPS aktif olmalı
Settings → Force HTTPS → Enabled
```

### Rate Limiting

Environment variables'da ayarlandı:
```bash
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
```

## 🔄 Update & Rollback

### Yeni Versiyonu Deploy Etme

1. Kod değişikliklerini Git'e push edin
2. Coolify otomatik deploy eder
3. Build loglarını takip edin

### Rollback Yapma

1. Coolify'da **Deployments** sekmesine gidin
2. Önceki deployment'ı seçin
3. **Redeploy** butonuna tıklayın

## 💰 Maliyet Optimizasyonu

### Resource Kullanımı

- **Idle Shutdown:** Aktif etmeyin (production için)
- **Auto-scaling:** Gerekirse aktif edin
- **Cache:** Redis ekleyerek azaltın

### API Maliyetleri

- Anthropic API kullanımını takip edin
- Serper.dev limitlerini kontrol edin
- Supabase storage'ı optimize edin

## 📚 Ek Kaynaklar

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Supabase Documentation](https://supabase.com/docs)

## ✨ Best Practices

1. ✅ Her deployment sonrası test yapın
2. ✅ Environment variables'ı güvenli tutun
3. ✅ Regular backup alın (Supabase)
4. ✅ Monitoring aktif tutun
5. ✅ SSL sertifikasını kontrol edin
6. ✅ Domain DNS ayarlarını doğrulayın

## 🆘 Destek

Sorun yaşarsanız:
1. Coolify logs'ları kontrol edin
2. Environment variables'ı doğrulayın
3. Supabase bağlantısını test edin
4. API keys'lerin geçerliliğini kontrol edin

---

**Deployment başarılı olduktan sonra:**  
🎉 Uygulamanız `https://your-domain.com` adresinde canlı!
