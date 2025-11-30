# Supabase Database Setup

Bu dosya Supabase veritabanınızı kurmak için gerekli adımları içerir.

## 1. Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. Yeni bir proje oluşturun veya mevcut projenizi seçin
3. Proje ayarlarından API anahtarlarınızı ve URL'nizi kopyalayın

## 2. Environment Variables Ayarlama

`.env` dosyanız zaten oluşturuldu ve aşağıdaki değişkenleri içeriyor:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. Veritabanı Şemasını Oluşturma

Supabase Dashboard'unuzda:

1. Sol menüden **SQL Editor**'ü açın
2. "New Query" butonuna tıklayın
3. `supabase/schema.sql` dosyasının içeriğini kopyalayıp SQL editor'e yapıştırın
4. **Run** butonuna tıklayarak şemayı oluşturun

### Alternatif: Supabase CLI ile

Eğer Supabase CLI kuruluysa:

```bash
# Supabase CLI'yi kur (eğer yoksa)
npm install -g supabase

# Login
supabase login

# Projeyi bağla
supabase link --project-ref your_project_ref

# Migration'ı çalıştır
supabase db push
```

## 4. Oluşturulan Tablolar

### `sites` Tablosu
- Website'leri saklar
- Her site için domain ve isim bilgisi
- Otomatik timestamp tracking (created_at, updated_at)

### `analyses` Tablosu
- Yapılan SEO analizlerini saklar
- URL, içerik, analiz sonuçları (JSONB)
- Status tracking (pending, processing, completed, failed)
- Site ile ilişkili (foreign key)

### `site_stats` View
- Site başına istatistikler
- Otomatik hesaplanan metrikler (toplam analiz, ortalama skor, vb.)
- `security_invoker = on` ayarı ile güvenli sorgu yürütme (kullanıcı izinleriyle çalışır)

## 5. Veritabanını Test Etme

Aşağıdaki komutu çalıştırarak bağlantıyı test edebilirsiniz:

```bash
npm run dev
```

Sonra tarayıcınızda konsolu açın ve aşağıdaki kodu çalıştırın:

```javascript
// Supabase bağlantısını test et
const { supabase } = await import('./lib/db/supabase');

// Sites tablosunu kontrol et
const { data, error } = await supabase.from('sites').select('*');
console.log('Sites:', data, error);

// Analyses tablosunu kontrol et  
const { data: analyses, error: analysesError } = await supabase.from('analyses').select('*');
console.log('Analyses:', analyses, analysesError);
```

## 6. Row Level Security (RLS) Policies

Şema dosyası aşağıdaki politikaları içerir:

- **Public Read**: Herkes veriyi okuyabilir
- **Public Write**: Herkes veri ekleyebilir/güncelleyebilir

> **Not**: Production ortamında bu politikaları authentication gerektirecek şekilde güncellemeniz önerilir.

## 7. Indexes

Performans için aşağıdaki indexler oluşturulmuştur:

- Domain, user_id, created_at (sites)
- URL, site_id, user_id, status, score (analyses)

## 8. Veritabanı Yapısı

```
sites
├── id (UUID, PK)
├── created_at (timestamp)
├── updated_at (timestamp)
├── domain (text, unique)
├── name (text)
└── user_id (UUID, nullable)

analyses
├── id (UUID, PK)
├── created_at (timestamp)
├── updated_at (timestamp)
├── url (text)
├── title (text, nullable)
├── site_id (UUID, FK → sites)
├── user_id (UUID, nullable)
├── content (text, nullable)
├── analysis_data (JSONB, nullable)
├── overall_score (integer 0-100, nullable)
├── status (text: pending|processing|completed|failed)
└── error_message (text, nullable)
```

## 9. Sonraki Adımlar

1. ✅ Supabase şemasını oluştur
2. ✅ `.env` dosyasını kontrol et
3. 🔄 Development server'ı çalıştır (`npm run dev`)
4. 🔄 Bir analiz yaparak veritabanı entegrasyonunu test et
5. 🔄 `/analyses` ve `/sites` sayfalarında gerçek verileri göster

## Troubleshooting

### Bağlantı Hatası
- `.env` dosyasındaki URL ve API key'leri kontrol edin
- Supabase projesinin aktif olduğundan emin olun

### RLS Policy Hataları
- SQL Editor'de policy'leri tekrar çalıştırın
- Authentication kullanıyorsanız policy'leri güncelleyin

### Schema Hataları
- Mevcut tabloları silip tekrar oluşturun:
  ```sql
  DROP TABLE IF EXISTS analyses;
  DROP TABLE IF EXISTS sites;
  ```
  Sonra schema.sql'i tekrar çalıştırın
