# Supabase Migration Uygulama Rehberi

**Migration:** `002_projects_system.sql`  
**Durum:** Henüz uygulanmadı  
**Gerekli mi:** EVET! ✅

## 🎯 Neler Değişecek?

### Yeni Tablolar (4 adet)
1. **sitemaps** - Sitemap URL'leri
2. **pagespeed_results** - PageSpeed test sonuçları
3. **gsc_data** - Google Search Console verileri
4. **url_inventory** - Site URL envanteri

### Güncellenecek Tablolar
1. **sites** - 8 yeni sütun eklenecek

### Yeni Views (3 adet)
1. **site_stats** - Site istatistikleri
2. **recent_analyses_with_sites** - Analizler + site bilgileri
3. **url_performance_summary** - URL performans özeti

## 🚀 Migration Uygulama (3 Yöntem)

### Yöntem 1: Supabase Dashboard (En Kolay) ⭐

#### Adım 1: Supabase Dashboard'a Git

```
https://supabase.com/dashboard
→ Project: your_project_ref
→ SQL Editor
```

#### Adım 2: Migration Dosyasını Kopyala

Local dosyadan tüm içeriği kopyala:
```bash
# Dosya: supabase/migrations/002_projects_system.sql
# Tüm içeriği seç ve kopyala (Cmd+A, Cmd+C)
```

#### Adım 3: SQL Editor'de Çalıştır

1. **New query** tıkla
2. Kopyaladığın SQL'i yapıştır
3. **Run** (veya Cmd+Enter)
4. Başarılı mesajını bekle

#### Adım 4: Kontrol Et

```sql
-- Yeni tabloları kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sitemaps', 'pagespeed_results', 'gsc_data', 'url_inventory');

-- 4 satır dönmeli

-- Sites tablosunu kontrol et
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sites' 
  AND column_name IN ('status', 'description', 'total_tracked_urls');

-- 3 satır dönmeli
```

---

### Yöntem 2: Supabase CLI (Advanced)

#### Adım 1: Supabase CLI Yükle

```bash
# macOS
brew install supabase/tap/supabase

# Diğer
npm install -g supabase
```

#### Adım 2: Login

```bash
supabase login
```

#### Adım 3: Project'i Link Et

```bash
# Project dizininde
supabase link --project-ref your_project_ref
```

#### Adım 4: Migration'ı Push Et

```bash
# Henüz uygulanmamış migration'ları uygula
supabase db push

# Veya spesifik migration
supabase migration up --db-url "postgresql://postgres:[PASSWORD]@db.your_project_ref.supabase.co:5432/postgres"
```

---

### Yöntem 3: Direct SQL Connection (Expert)

#### Connection String

```bash
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

#### psql ile Bağlan

```bash
psql "postgresql://postgres.your_project_ref:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

#### SQL Dosyasını Çalıştır

```bash
\i supabase/migrations/002_projects_system.sql
```

---

## ✅ Migration Başarılı mı Kontrol Et

### Dashboard'dan Kontrol

**Tables Tab:**
```
✅ sitemaps
✅ pagespeed_results
✅ gsc_data
✅ url_inventory
```

**Table Editor → sites:**
```
✅ status
✅ description
✅ total_tracked_urls
✅ total_indexed_urls
✅ avg_performance_score
✅ last_crawl_at
✅ crawl_frequency
✅ robots_txt_url
```

### SQL ile Kontrol

```sql
-- 1. Tüm yeni tabloları listele
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'sitemaps', 
    'pagespeed_results', 
    'gsc_data', 
    'url_inventory'
  );

-- Beklenen: 4 satır

-- 2. Views'ları kontrol et
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN (
    'site_stats',
    'recent_analyses_with_sites',
    'url_performance_summary'
  );

-- Beklenen: 3 satır

-- 3. sites tablosu sütunları
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sites'
ORDER BY ordinal_position;

-- 'status', 'description' vb. görmeli
```

---

## 🐛 Hata Çözümleri

### Hata 1: Permission Denied

```
ERROR: permission denied for schema public
```

**Çözüm:**
- Service role key kullanıyorsun mu kontrol et
- Veya Supabase Dashboard'dan çalıştır (otomatik doğru role ile)

### Hata 2: Table Already Exists

```
ERROR: relation "sitemaps" already exists
```

**Çözüm:**
- Migration daha önce uygulanmış demektir
- Kontrol et:
```sql
SELECT * FROM sitemaps LIMIT 1;
```
- Eğer çalışıyorsa, migration başarılı!

### Hata 3: Foreign Key Constraint

```
ERROR: insert or update on table violates foreign key constraint
```

**Çözüm:**
- users tablosu var mı kontrol et
- sites tablosu var mı kontrol et
- Migration sırasını takip et (002 -> 001'den sonra)

---

## 📊 Migration Sonrası Test

### 1. API'dan Test Et

```bash
# Health check
curl https://seomind.ch/api/health

# Beklenen response içinde "database": "healthy"
```

### 2. Frontend'den Test Et

```
1. https://seomind.ch/projects → Giriş yap
2. "New Project" tıkla
3. Form doldur
4. Submit

Eğer hata alıyorsan → Migration eksik demektir
```

### 3. Direct Database Query

```sql
-- Test data ekle
INSERT INTO sites (user_id, name, domain)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Site',
  'test.com'
);

-- Yeni sütunlar null olmalı (başarı)
SELECT status, description, total_tracked_urls 
FROM sites 
ORDER BY created_at DESC 
LIMIT 1;

-- Cleanup
DELETE FROM sites WHERE domain = 'test.com';
```

---

## 🎯 Önerilen: Dashboard Yöntemi

**En kolay ve güvenli yöntem:**

1. **Supabase Dashboard** → https://supabase.com/dashboard
2. **SQL Editor** (sol menü)
3. **New query**
4. `supabase/migrations/002_projects_system.sql` içeriğini kopyala-yapıştır
5. **Run** (Cmd+Enter)
6. Success mesajını bekle
7. **Tables** tab'ından kontrol et

**Süre:** ~2 dakika  
**Risk:** Minimal  
**Geri alma:** Kolay (migration dosyası hazır)

---

## 🔄 Rollback (Geri Alma)

Eğer bir sorun olursa:

### Yeni Tabloları Sil

```sql
DROP TABLE IF EXISTS url_inventory CASCADE;
DROP TABLE IF EXISTS gsc_data CASCADE;
DROP TABLE IF EXISTS pagespeed_results CASCADE;
DROP TABLE IF EXISTS sitemaps CASCADE;

DROP VIEW IF EXISTS url_performance_summary;
DROP VIEW IF EXISTS recent_analyses_with_sites;
DROP VIEW IF EXISTS site_stats;
```

### sites Tablosunu Eski Haline Döndür

```sql
ALTER TABLE sites 
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS total_tracked_urls,
  DROP COLUMN IF EXISTS total_indexed_urls,
  DROP COLUMN IF EXISTS avg_performance_score,
  DROP COLUMN IF EXISTS last_crawl_at,
  DROP COLUMN IF EXISTS crawl_frequency,
  DROP COLUMN IF EXISTS robots_txt_url;
```

---

## ✅ Checklist

Migration öncesi:
- [ ] Supabase Dashboard'a erişim var
- [ ] Migration dosyası hazır
- [ ] Backup plan var (rollback script)

Migration sırası:
- [ ] SQL Editor'ı aç
- [ ] Migration SQL'ini yapıştır
- [ ] Run tıkla
- [ ] Success mesajı gel

Migration sonrası:
- [ ] Yeni tabloları kontrol et (4 tablo)
- [ ] Views'ları kontrol et (3 view)
- [ ] sites tablosunu kontrol et (8 yeni sütun)
- [ ] Frontend test et
- [ ] API test et

---

## 🎉 Migration Tamamlandı!

Migration başarıyla uygulandıktan sonra:

✅ **Yeni Özellikler Aktif:**
- Sitemap discovery çalışır
- PageSpeed testleri kaydedilir
- URL inventory oluşturulur
- Project stats görünür

✅ **Database Hazır:**
- Production data alabilir
- Frontend ile entegre
- Scalable yapıda

✅ **Sonraki Adım:**
- Frontend deployment
- Integration testing
- Production launch

---

**Önemli:** Migration sadece 1 kez uygulanır. Bir kez başarılı olduktan sonra tekrar uygulamaya gerek YOK!

**Süre:** 2-5 dakika  
**Risk:** Düşük (test edildi)  
**Zorunlu mu:** EVET (yeni features için)
