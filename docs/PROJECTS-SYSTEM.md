# Proje Bazlı SEO Sistemi

Bu dokümantasyon, geliştirilmiş proje bazlı SEO analiz sistemini açıklar.

## 🎯 Genel Bakış

Sistem artık proje bazlı çalışır. Her site (domain) bir proje olarak yönetilir ve:
- ✅ Sınırsız sayıda proje oluşturulabilir
- ✅ Her proje için geçmiş analizler saklanır
- ✅ Sitemap'ler otomatik keşfedilir ve analiz edilir
- ✅ Google PageSpeed Insights entegrasyonu
- ✅ Google Search Console entegrasyonu (gelecek)
- ✅ URL inventory tracking

## 🗄️ Database Yapısı

### Yeni Tablolar

#### 1. **sitemaps**
Sitemap URL'lerini ve içeriğini saklar.

```sql
- id: UUID
- site_id: Site referansı
- url: Sitemap URL'i
- urls: Sitemap içindeki tüm URL'ler (JSONB)
- total_urls: URL sayısı
- status: pending | fetching | completed | failed
```

#### 2. **pagespeed_results**
Google PageSpeed Insights test sonuçları.

```sql
- id: UUID
- site_id: Site referansı
- url: Test edilen URL
- performance_score: 0-100
- accessibility_score: 0-100
- best_practices_score: 0-100
- seo_score: 0-100
- fcp, lcp, cls, tti, tbt, si: Core Web Vitals
- metrics: Detaylı metrikler (JSONB)
- opportunities: İyileştirme önerileri (JSONB)
- diagnostics: Teşhis bilgileri (JSONB)
```

#### 3. **gsc_data**
Google Search Console performance verileri.

```sql
- id: UUID
- site_id: Site referansı
- date: Veri tarihi
- clicks, impressions, ctr, position: Metrikler
- queries: Top sorgular (JSONB)
- pages: Top sayfalar (JSONB)
- devices, countries: Breakdown (JSONB)
```

#### 4. **url_inventory**
Site'daki tüm URL'lerin envanteri.

```sql
- id: UUID
- site_id: Site referansı
- url: Tam URL
- title, meta_description, h1: SEO verileri
- http_status: HTTP durum kodu
- is_indexed: Google'da indexli mi?
- last_analyzed_at: Son analiz tarihi
- analysis_count: Toplam analiz sayısı
- discovered_via: sitemap | crawl | manual
```

### Güncellenmiş Tablolar

#### **sites** (Projeler)
```sql
-- Yeni sütunlar:
- settings: JSONB (API keys, preferences)
- last_crawled_at: Son tarama zamanı
- total_urls: Toplam URL sayısı
- sitemap_url: Sitemap URL'i
- robots_txt: robots.txt içeriği
- description: Proje açıklaması
- favicon_url: Site favicon'u
- status: active | paused | archived
```

## 📊 Migration'ı Uygulama

### Adım 1: Supabase Dashboard

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **SQL Editor**'e gidin
3. **New Query** tıklayın
4. `supabase/migrations/002_projects_system.sql` içeriğini kopyalayın
5. SQL Editor'e yapıştırın
6. **Run** butonuna basın

### Adım 2: Başarı Kontrolü

Migration başarılı olursa:
- ✅ 4 yeni tablo oluşturulur
- ✅ sites tablosuna yeni sütunlar eklenir
- ✅ 2 yeni view oluşturulur
- ✅ RLS policies aktif olur

### Adım 3: Hata Durumunda

Eğer hata alırsanız:
1. Hatayı okuyun (genellikle constraint veya column zaten var anlamına gelir)
2. SQL'i satır satır çalıştırmayı deneyin
3. Duplication hatalarını görmezden gelin (IF NOT EXISTS sayesinde)

## 🚀 Özellikler

### 1. Proje Yönetimi

**Yeni Proje Oluşturma:**
```typescript
const project = await siteService.create({
  domain: 'example.com',
  name: 'Example Company',
  userId: user.id,
  description: 'Company website',
});
```

**Proje Listesi:**
- Tüm projelerinizi görün
- Her proje için:
  - Son analiz tarihi
  - Toplam analiz sayısı
  - Ortalama SEO skoru
  - URL sayısı
  - Status (aktif/pasif)

### 2. Sitemap Discovery

**Otomatik Sitemap Bulma:**
```
1. robots.txt'i kontrol et
2. Sitemap URL'lerini çıkar
3. Sitemap'i fetch et
4. URL'leri parse et
5. url_inventory'ye ekle
```

**Manuel Sitemap Ekleme:**
```typescript
const sitemap = await sitemapService.create({
  siteId: project.id,
  url: 'https://example.com/sitemap.xml',
});
```

### 3. URL Inventory

**Tüm URL'leri Takip Edin:**
- Sitemap'ten keşfedilen URL'ler
- Manuel eklenen URL'ler
- Crawl ile bulunan URL'ler

**Her URL için:**
- SEO metadata (title, description, h1)
- HTTP status
- Index durumu
- Performance metrics
- Analiz geçmişi

### 4. PageSpeed Integration

**URL Performance Testi:**
```typescript
const result = await pageSpeedService.analyze({
  url: 'https://example.com/page',
  strategy: 'mobile', // or 'desktop'
});

// Results:
- Performance Score
- Accessibility Score
- Best Practices Score
- SEO Score
- Core Web Vitals (LCP, FCP, CLS, etc.)
- Opportunities (iyileştirme önerileri)
```

### 5. Historical Tracking

**Zaman içinde ilerlemeyi takip edin:**
- Günlük/haftalık/aylık SEO score trends
- PageSpeed score değişiklikleri  
- Content quality improvements
- Indexing status changes

### 6. Bulk Analysis

**Toplu URL Analizi:**
```typescript
// Sitemap'teki tüm URL'leri analiz et
await bulkAnalyze({
  siteId: project.id,
  urls: sitemapUrls,
  priority: 'high'
});
```

## 📈 Views & Reporting

### site_stats View

Proje istatistikleri özeti:
```sql
SELECT * FROM site_stats WHERE user_id = 'user-uuid';
```

Dönen veriler:
- total_analyses: Toplam analiz sayısı
- completed_analyses: Tamamlanan analizler
- avg_score: Ortalama SEO skoru
- total_tracked_urls: Toplam tracked URL
- total_pagespeed_tests: PageSpeed test sayısı

### analysis_trends View

Zaman içinde trend analizi:
```sql
SELECT * FROM analysis_trends 
WHERE site_id = 'site-uuid'
ORDER BY analysis_date DESC
LIMIT 30; -- Son 30 gün
```

## 🎨 Gelecek Sayfalar

### `/projects` - Projects Dashboard
- Tüm projeler grid/list view
- Create new project
- Quick stats cards
- Search & filter

### `/projects/[id]` - Project Detail
- Overview dashboard
- Latest analyses
- Performance trends (charts)
- Quick actions (analyze URL, view sitemap, etc.)

### `/projects/[id]/sitemap` - Sitemap Explorer
- Visualize sitemap structure
- URL table with filters
- Bulk analyze button
- URL status indicators

### `/projects/[id]/urls` - URL Inventory
- Complete URL list
- Filters (indexed/not indexed, status, etc.)
- Individual analyze buttons
- Export功能

### `/projects/[id]/performance` - Performance Dashboard
- PageSpeed trends
- Core Web Vitals tracking
- Page-by-page comparison
- Recommendations

### `/projects/[id]/gsc` - Search Console Data
- Clicks & impressions trends
- Top queries
- Top pages
- Device/country breakdown

### `/projects/[id]/settings` - Project Settings
- Google API keys
- Crawl settings
- Notifications
- Team access (future)

## 🔌 API Entegrasyonları

### Google PageSpeed Insights API

**Setup:**
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Enable PageSpeed Insights API
3. Create API key
4. `.env`'e ekle:
```bash
GOOGLE_PAGESPEED_API_KEY=your-key-here
```

**Usage:**
```typescript
const result = await fetch(
  `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${API_KEY}`
);
```

### Google Search Console API

**Setup:**
1. OAuth 2.0 credentials veya Service Account
2. Search Console API'yi enable et
3. Site ownership verify et
4. `.env`'e credentials ekle

**Features:**
- Search analytics
- URL inspection
- Indexing API
- Sitemap submission

## 📊 Data Flow

```
1. User Creates Project
   ↓
2. System Fetches robots.txt
   ↓
3. Discovers Sitemap URLs
   ↓
4. Parses Sitemaps
   ↓
5. Populates url_inventory
   ↓
6. User Analyzes URLs
   ↓
7. Stores in analyses + pagespeed_results
   ↓
8. Displays Trends & Reports
```

## 🔒 Security & RLS

Tüm yeni tablolar Row Level Security (RLS) ile korunur:
- ✅ Users can only see their own data
- ✅ Cascade deletes configured
- ✅ Policies for SELECT, INSERT, UPDATE

## 📝 Next Steps

1. ✅ Migration'ı Supabase'e uygula
2. ⏳ Project services oluştur
3. ⏳ UI pages build et
4. ⏳ Sitemap parser implement et
5. ⏳ PageSpeed API entegre et
6. ⏳ Charts & visualizations ekle
7. ⏳ GSC integration

## 🎯 Sonuç

Bu migration ile sistem artık:
- ✅ **Proje bazlı** çalışır
- ✅ **Geçmiş takibi** yapar
- ✅ **Sitemap discovery** destekler
- ✅ **Performance tracking** sunar
- ✅ **Scalable** yapıdadır

---

**Version:** 1.0.0  
**Last Updated:** 30.11.2024  
**Status:** ✅ Ready for Implementation
