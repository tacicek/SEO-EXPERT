# Technical SEO Analyzer Microservice - Implementation Plan

Bu dokümantasyon, SEO Expert AI Editor platformuna entegre edilecek **Python Technical SEO Analyzer Microservice**'in detaylı implementasyon planını içerir.

## 📋 Genel Bakış

### Servis Spesifikasyonu

```yaml
Service Name: technical-seo-analyzer
Type: Python FastAPI Microservice
Port: 8000
Base URL: /api/v1/technical-seo
Language: Python 3.11+
Framework: FastAPI
AI Provider: Anthropic Claude
Cache: Redis (optional)
```

### Mimari

```
┌────────────────────────────────────────────────────────┐
│           SEO Expert AI Editor (Next.js)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend Components                             │  │
│  │  - TechnicalSEOTab.tsx                           │  │
│  │  - MetaAnalysisPanel.tsx                         │  │
│  │  - HeadingStructurePanel.tsx                     │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes                                      │  │
│  │  - /api/analyze/technical                        │  │
│  │  - /api/analyze (orchestrator)                   │  │
│  └──────────────────────────────────────────────────┘  │
│                         ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase Database                               │  │
│  │  - technical_seo_results table                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST
                          ▼
┌────────────────────────────────────────────────────────┐
│     Technical SEO Analyzer Microservice (Python)       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  FastAPI Application                             │  │
│  │  - /health                                       │  │
│  │  - /analyze                                      │  │
│  │  - /analyze/batch                                │  │
│  │  - /suggestions/*                                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Analysis Modules                                │  │
│  │  - MetaAnalyzer                                  │  │
│  │  - HeadingAnalyzer                               │  │
│  │  - ImageAnalyzer                                 │  │
│  │  - URLAnalyzer                                   │  │
│  │  - SchemaAnalyzer                                │  │
│  │  - ContentQualityAnalyzer                        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AI Suggestion Engine                            │  │
│  │  - Claude API Integration                        │  │
│  │  - Title Suggestion                              │  │
│  │  - Description Suggestion                        │  │
│  │  - Alt Text Suggestion                           │  │
│  │  - Schema Suggestion                             │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## 🎯 Implementation Phases

### Phase 1: Python Microservice Core (Week 1)

**Görevler:**
1. ✅ FastAPI project setup
2. ✅ Project structure oluştur
3. ✅ Dependencies (requirements.txt)
4. ✅ Health check endpoint
5. ✅ Base models (Pydantic)
6. ✅ Error handling middleware
7. ✅ Logging configuration
8. ✅ Docker configuration

**Deliverables:**
- `services/technical-seo-analyzer/` directory
- Running FastAPI service
- `/health` endpoint working
- Docker image build successful

### Phase 2: Analysis Modules (Week 2-3)

**Görevler:**
1. ✅ MetaAnalyzer module
   - Title tag analysis
   - Meta description analysis
   - Canonical URL check
   - Robots meta
   - OG tags
   - Twitter cards

2. ✅ HeadingAnalyzer module
   - H1-H6 structure
   - Hierarchy validation
   - Multiple H1 detection
   - Skipped levels detection

3. ✅ ImageAnalyzer module
   - Alt text presence
   - Missing alt detection
   - Empty alt check
   - Decorative image detection

4. ✅ URLAnalyzer module
   - URL length check
   - Structure validation
   - Parameter detection
   - HTTPS check

5. ✅ SchemaAnalyzer module
   - JSON-LD detection
   - Schema type identification
   - Validation
   - Required property check

6. ✅ ContentQualityAnalyzer module
   - Word count
   - Readability score (Flesch-Kincaid)
   - Paragraph length
   - Sentence complexity
   - Passive voice detection

**Deliverables:**
- All analysis modules working
- Unit tests for each module
- `/analyze` endpoint returning full analysis

### Phase 3: AI Suggestion Engine (Week 4)

**Görevler:**
1. ✅ Anthropic Claude SDK integration
2. ✅ Prompt engineering
   - Title optimization prompt
   - Meta description prompt
   - Alt text prompt
   - Schema markup prompt

3. ✅ Suggestion endpoints
   - `/suggestions/title`
   - `/suggestions/description`
   - `/suggestions/alt-text`
   - `/suggestions/schema`

4. ✅ Response caching (Redis)
5. ✅ Rate limiting
6. ✅ Cost optimization

**Deliverables:**
- Claude API working
- All suggestion endpoints functional
- Caching implemented
- Cost-effective prompts

### Phase 4: Next.js Integration (Week 5)

**Görevler:**
1. ✅ TypeScript types
2. ✅ API route `/api/analyze/technical`
3. ✅ Database migration (technical_seo_results table)
4. ✅ Update main orchestrator
5. ✅ Service client lib
6. ✅ Error handling
7. ✅ Retry logic

**Deliverables:**
- Next.js API calling Python service
- Data saving to Supabase
- Type safety throughout

### Phase 5: Frontend Components (Week 6)

**Görevler:**
1. ✅ TechnicalSEOTab component
2. ✅ ScoreCircle component
3. ✅ IssueCard component
4. ✅ MetaAnalysisPanel
5. ✅ HeadingStructurePanel
6. ✅ SchemaMarkupPanel
7. ✅ Apply suggestion functionality
8. ✅ UI/UX polish

**Deliverables:**
- Beautiful Technical SEO tab in editor
- Interactive suggestion application
- Responsive design

### Phase 6: Testing & Deployment (Week 7)

**Görevler:**
1. ✅ Unit tests (Python)
2. ✅ Integration tests
3. ✅ Load testing
4. ✅ Error scenarios
5. ✅ Docker Compose setup
6. ✅ Coolify deployment config
7. ✅ Monitoring setup (optional)
8. ✅ Documentation

**Deliverables:**
- Test coverage >80%
- Production deployment
- Monitoring dashboard
- Complete documentation

## 📁 Project Structure

```
SEO-EXPERT/
├── services/
│   └── technical-seo-analyzer/        # ◄── YENİ PYTHON MİCROSERVİCE
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py                # FastAPI app
│       │   ├── config.py              # Configuration
│       │   ├── dependencies.py        # Dependency injection
│       │   │
│       │   ├── models/                # Pydantic models
│       │   │   ├── __init__.py
│       │   │   ├── request.py
│       │   │   ├── response.py
│       │   │   └── analysis.py
│       │   │
│       │   ├── analyzers/             # Core analysis modules
│       │   │   ├── __init__.py
│       │   │   ├── meta.py
│       │   │   ├── headings.py
│       │   │   ├── images.py
│       │   │   ├── url.py
│       │   │   ├── schema.py
│       │   │   └── content_quality.py
│       │   │
│       │   ├── ai/                    # AI suggestion engine
│       │   │   ├── __init__.py
│       │   │   ├── claude.py
│       │   │   ├── prompts.py
│       │   │   └── cache.py
│       │   │
│       │   ├── routers/               # API routes
│       │   │   ├── __init__.py
│       │   │   ├── health.py
│       │   │   ├── analyze.py
│       │   │   └── suggestions.py
│       │   │
│       │   └── utils/                 # Utilities
│       │       ├── __init__.py
│       │       ├── fetcher.py         # HTML fetching
│       │       ├── parser.py          # HTML parsing
│       │       └── scorer.py          # Score calculation
│       │
│       ├── tests/                     # Tests
│       │   ├── __init__.py
│       │   ├── test_analyzers.py
│       │   ├── test_ai.py
│       │   └── test_api.py
│       │
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── .env.example
│       └── README.md
│
├── app/
│   └── api/
│       └── analyze/
│           └── technical/
│               └── route.ts           # ◄── YENİ API ROUTE
│
├── lib/
│   ├── types/
│   │   └── technical-seo.ts          # ◄── YENİ TYPES
│   └── services/
│       └── technical-seo-client.ts    # ◄── YENİ SERVICE CLIENT
│
├── components/
│   └── analysis/
│       ├── TechnicalSEOTab.tsx        # ◄── YENİ COMPONENT
│       ├── MetaAnalysisPanel.tsx
│       ├── HeadingStructurePanel.tsx
│       └── SchemaMarkupPanel.tsx
│
└── supabase/
    └── migrations/
        └── 003_technical_seo.sql      # ◄── YENİ MIGRATION
```

## 🔧 Technology Stack

### Python Microservice

```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
anthropic==0.7.0          # Claude API
beautifulsoup4==4.12.2    # HTML parsing
lxml==4.9.3
requests==2.31.0
redis==5.0.1              # Caching
textstat==0.7.3           # Readability scores
python-dotenv==1.0.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.1             # Async HTTP
```

### Next.js Integration

```json
// package.json additions
{
  "dependencies": {
    // Existing...
  }
}
```

## 📊 Database Schema

```sql
-- supabase/migrations/003_technical_seo.sql

CREATE TABLE IF NOT EXISTS technical_seo_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  
  -- Scores (0-100)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  meta_score INTEGER CHECK (meta_score >= 0 AND meta_score <= 100),
  headings_score INTEGER CHECK (headings_score >= 0 AND headings_score <= 100),
  images_score INTEGER CHECK (images_score >= 0 AND images_score <= 100),
  url_score INTEGER CHECK (url_score >= 0 AND url_score <= 100),
  schema_score INTEGER CHECK (schema_score >= 0 AND schema_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  
  -- Detailed Results (JSONB for flexibility)
  meta_analysis JSONB,
  headings_analysis JSONB,
  images_analysis JSONB,
  url_analysis JSONB,
  schema_analysis JSONB,
  content_analysis JSONB,
  
  -- Aggregated
  issues JSONB,               -- Array of issues
  recommendations JSONB,       -- Array of recommendations
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_technical_seo_analysis_id 
  ON technical_seo_results(analysis_id);

CREATE INDEX idx_technical_seo_created_at 
  ON technical_seo_results(created_at DESC);

-- RLS Policies
ALTER TABLE technical_seo_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their technical SEO results"
  ON technical_seo_results FOR SELECT
  USING (
    analysis_id IN (
      SELECT id FROM analyses 
      WHERE site_id IN (
        SELECT id FROM sites WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert technical SEO results"
  ON technical_seo_results FOR INSERT
  WITH CHECK (
    analysis_id IN (
      SELECT id FROM analyses 
      WHERE site_id IN (
        SELECT id FROM sites WHERE user_id = auth.uid()
      )
    )
  );
```

## 🚀 Quick Start Guide

### 1. Python Microservice Setup

```bash
# Navigate to project root
cd SEO-EXPERT

# Create Python service directory
mkdir -p services/technical-seo-analyzer
cd services/technical-seo-analyzer

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your keys

# Run development server
uvicorn app.main:app --reload --port 8000

# Test health endpoint
curl http://localhost:8000/health
```

### 2. Next.js Integration

```bash
# Back to project root
cd ../..

# Run database migration
# Copy migration SQL to Supabase dashboard and execute

# Set environment variable
# Add to .env.local:
TECHNICAL_SEO_SERVICE_URL=http://localhost:8000

# Restart Next.js dev server
npm run dev
```

### 3. Test Full Flow

```bash
# Analyze a URL
curl -X POST http://localhost:3000/api/analyze/technical \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 📚 API Documentation

### Python Microservice Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-11-30T20:00:00Z"
}
```

#### POST /analyze
Full technical SEO analysis.

**Request:**
```json
{
  "url": "https://example.com/page"
}
```

**Response:**
```json
{
  "url": "https://example.com/page",
  "analyzed_at": "2024-11-30T20:00:00Z",
  "score": {
    "overall": 75,
    "meta": 80,
    "headings": 90,
    "images": 60,
    "url_structure": 100,
    "schema": 50,
    "content_quality": 85
  },
  "meta": { ... },
  "headings": { ... },
  "images": { ... },
  "url_structure": { ... },
  "schema_markup": { ... },
  "content_quality": { ... },
  "issues": [ ... ],
  "recommendations": [ ... ]
}
```

#### POST /suggestions/title
AI-powered title tag suggestion.

**Request:**
```json
{
  "url": "https://example.com/page",
  "current_title": "Old Title",
  "topic": "SEO Optimization",
  "h1": "Ultimate Guide to SEO"
}
```

**Response:**
```json
{
  "suggested_title": "SEO Optimization: Ultimate Guide for 2024 | Brand",
  "character_count": 52,
  "explanation": "This title is optimized because..."
}
```

## 🎨 Frontend Integration Example

```typescript
// app/editor/page.tsx
import { TechnicalSEOTab } from '@/components/analysis/TechnicalSEOTab';

export default function EditorPage() {
  const { currentAnalysis, technicalSEO } = useAnalysisStore();
  
  return (
    <MainLayout>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="eeat">E-E-A-T</TabsTrigger>
          <TabsTrigger value="technical">Technical SEO</TabsTrigger>
        </TabsList>
        
        <TabsContent value="technical">
          {technicalSEO ? (
            <TechnicalSEOTab 
              data={technicalSEO}
              onApplySuggestion={handleApplySuggestion}
            />
          ) : (
            <div>Loading technical analysis...</div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
```

## 🔐 Security Considerations

1. **API Key Management**
   - Anthropic API key server-side only
   - Environment variables for sensitive data
   - No keys in frontend code

2. **Rate Limiting**
   - Implement on API gateway
   - Prevent abuse of AI suggestions
   - Cache results when possible

3. **Input Validation**
   - Validate URLs before fetching
   - Sanitize HTML parsing
   - Prevent SSRF attacks

4. **Data Privacy**
   - Don't store fetched HTML long-term
   - RLS policies on database
   - User data isolation

## 📈 Monitoring & Observability

### Metrics to Track

```python
# Key metrics
- Request count by endpoint
- Average response time
- Error rate
- Cache hit rate
- AI API costs
- Queue depth (if using background jobs)
```

### Logging

```python
# Structured logging
import logging

logger = logging.getLogger(__name__)
logger.info("Analysis started", extra={
    "url": url,
    "user_id": user_id,
    "analysis_id": analysis_id
})
```

## ✅ Success Criteria

- [ ] Python service running stably
- [ ] All analysis modules working
- [ ] AI suggestions accurate and helpful
- [ ] Next.js integration seamless
- [ ] Database storing results correctly
- [ ] Frontend displaying data beautifully
- [ ] Tests passing (>80% coverage)
- [ ] Production deployment successful
- [ ] Documentation complete

## 🎯 Next Steps

1. **Start with Phase 1** - Setup Python microservice
2. **Implement one analyzer at a time** - Start with MetaAnalyzer
3. **Test incrementally** - Don't wait until the end
4. **Deploy early** - Get feedback quickly
5. **Iterate** - Improve based on real usage

---

**Status:** 📋 Planning Complete  
**Ready to Start:** Phase 1 - Python Microservice Core  
**Estimated Timeline:** 7 weeks total  
**Last Updated:** 30.11.2024
