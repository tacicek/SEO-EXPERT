# Serper.dev Integration

Bu dokümantasyon, Serper.dev API'sinin projeye nasıl entegre edildiğini açıklar.

## 🎯 Serper.dev Nedir?

Serper.dev, Google arama sonuçlarını ve web scraping işlemlerini API üzerinden sağlayan bir servistir.

**Özellikler:**
- Google Search API
- Web Scraping API
- Hızlı ve güvenilir
- Proxy'ler üzerinden güvenli çalışır

## 🔑 API Key Ayarlama

API anahtarınız `.env` ve `.env.example` dosyalarına eklenmiştir:

```env
SERPER_API_KEY=40f6d73687ffceeac8abebdd40bdf80ca1e8b74a
```

## 📁 Oluşturulan Dosyalar

### 1. Types (`lib/types/serper.ts`)
```typescript
interface SerperScrapeRequest
interface SerperScrapeResponse
interface SerperSearchRequest
interface SerperSearchResponse
```

### 2. Service Layer (`lib/services/serper.ts`)
```typescript
// URL scraping
await serperService.scrapeUrl(url)

// Google search
await serperService.searchGoogle({ q: 'query' })

// Helper functions
serperService.extractTextContent(response)
serperService.extractMetadata(response)
serperService.isScrapableUrl(url)
```

### 3. API Routes

#### `/api/serper/scrape` - URL Scraping
```typescript
POST /api/serper/scrape
Body: { url: string }
Response: {
  success: true,
  data: {
    url: string,
    text: string,
    metadata: {...},
    raw: {...}
  }
}
```

#### `/api/serper/search` - Google Search
```typescript
POST /api/serper/search
Body: {
  q: string,      // search query
  gl?: string,    // country (default: 'us')
  hl?: string,    // language (default: 'en')
  num?: number,   // results count (default: 10)
  page?: number   // page number (default: 1)
}
Response: {
  success: true,
  data: {
    organic: [...],
    searchParameters: {...},
    ...
  }
}
```

## 🔄 Content Fetcher Entegrasyonu

`lib/scraper/content-fetcher.ts` Serper kullanacak şekilde güncellendi:

```typescript
export async function fetchAndParseURL(url: string) {
  // 1. Serper API key varsa ve URL uygunsa Serper kullan
  if (SERPER_API_KEY && isScrapableUrl(url)) {
    const result = await serperService.scrapeUrl(url);
    // ... parse result
  }
  
  // 2. Yoksa normal fetch kullan (fallback)
  else {
    const response = await fetch(url);
    // ... parse HTML
  }
}
```

**Avantajlar:**
- ✅ Serper ile daha güvenilir scraping
- ✅ Otomatik fallback mekanizması
- ✅ Proxy'ler üzerinden güvenli erişim
- ✅ Rate limiting ve blocking sorunlarını azaltır

## 🧪 Test Etme

### Test Script
```bash
npx tsx scripts/test-serper.ts
```

Bu script şunları test eder:
1. URL scraping
2. Google search
3. URL validation
4. Text extraction
5. Metadata extraction

### Manuel Test - API Routes

#### Scrape Test
```bash
curl -X POST http://localhost:3000/api/serper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

#### Search Test
```bash
curl -X POST http://localhost:3000/api/serper/search \
  -H "Content-Type: application/json" \
  -d '{"q":"SEO best practices","num":5}'
```

### Frontend'den Kullanım

```typescript
// Scrape a URL
const scrapeResponse = await fetch('/api/serper/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
const { data } = await scrapeResponse.json();

// Search Google
const searchResponse = await fetch('/api/serper/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ q: 'SEO tips', num: 10 })
});
const { data: results } = await searchResponse.json();
```

## 💡 Kullanım Senaryoları

### 1. URL Analizi
Kullanıcının girdiği URL'i Serper ile scrape edip analiz et:
```typescript
const scrapeResult = await serperService.scrapeUrl(url);
const content = serperService.extractTextContent(scrapeResult);
const metadata = serperService.extractMetadata(scrapeResult);

// Analyze with AI
const analysis = await analyzeContent(content, metadata);
```

### 2. Competitor Araştırması
Belirli bir keyword için Google'da arama yap:
```typescript
const searchResult = await serperService.searchGoogle({
  q: 'best SEO practices 2024',
  num: 20
});

// Analyze top competitors
const topCompetitors = searchResult.organic?.slice(0, 10);
```

### 3. Content Gap Analysis
```typescript
// 1. User'ın içeriğini analiz et
const userAnalysis = await analyzeUrl(userUrl);

// 2. Google'da ilgili terimi ara
const competitors = await serperService.searchGoogle({
  q: userAnalysis.topic
});

// 3. Competitors'ın eksik olduğu konuları bul
const gaps = findContentGaps(userAnalysis, competitors);
```

## 📊 API Limitleri

Serper.dev ücretsiz plan:
- 2,500 ücretsiz search
- Aylık yenilenir
- API key başına limit

**Not:** API kullanımınızı [Serper Dashboard](https://serper.dev/dashboard)'dan takip edin.

## 🛡️ Güvenlik

- ✅ API key environment variable'da saklanır
- ✅ Never commit `.env` file
- ✅ URL validation yapılır
- ✅ Error handling mevcut
- ✅ Rate limiting consideration

## 🔧 Troubleshooting

### API Key Hatası
```
Error: Serper API key is not configured
```
**Çözüm:** `.env` dosyasında `SERPER_API_KEY` ayarlandığından emin olun.

### URL Scraping Hatası
```
Error: Invalid or unsupported URL format
```
**Çözüm:** URL'in http/https ile başladığından ve PDF gibi dosya olmadığından emin olun.

### Rate Limit
```
Error: Serper API error: 429
```
**Çözüm:** API limitinizi aştınız. Bir süre bekleyin veya plan yükseltin.

## 📚 Daha Fazla Bilgi

- [Serper.dev Docs](https://serper.dev/docs)
- [API Playground](https://serper.dev/playground)
- [Pricing](https://serper.dev/pricing)

## ✨ Gelecek İyileştirmeler

- [ ] Cache mekanizması ekle (Redis/Upstash)
- [ ] Batch scraping desteği
- [ ] Rate limiting middleware
- [ ] Retry mechanism with exponential backoff
- [ ] Webhook support for async scraping
