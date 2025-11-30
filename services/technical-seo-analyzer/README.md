# Technical SEO Analyzer Microservice

AI-powered technical SEO analysis microservice built with FastAPI and Python.

## 🚀 Features

- **Meta Tags Analysis**: Title, description, OG tags, Twitter cards
- **Heading Structure**: H1-H6 hierarchy validation
- **Image Optimization**: Alt text coverage and analysis
- **URL Structure**: SEO-friendly URL validation
- **Structured Data**: Schema.org JSON-LD detection
- **Content Quality**: Readability scores and word count

## 📋 Requirements

- Python 3.11+
- pip or poetry
- (Optional) Docker

## 🛠️ Installation

### Local Development

```bash
# Navigate to service directory
cd services/technical-seo-analyzer

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run the service
python -m uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Build image
docker build -t seo-analyzer .

# Run container
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=your-key \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  seo-analyzer
```

### Docker Compose

```bash
# Create docker-compose.yml (see example below)
docker-compose up -d
```

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-30T21:00:00Z",
  "service": "Technical SEO Analyzer",
  "version": "1.0.0"
}
```

### Full Analysis

```bash
POST /analyze
Content-Type: application/json

{
  "url": "https://example.com"
}
```

Response:
```json
{
  "url": "https://example.com",
  "analyzed_at": "2024-11-30T21:00:00Z",
  "score": {
    "overall": 85,
    "meta": 90,
    "headings": 80,
    "images": 75,
    "url": 95,
    "schema": 70,
    "content": 85
  },
  "meta": {
    "score": 90,
    "title": {
      "value": "Example Domain",
      "length": 14,
      "status": "warning"
    },
    "description": {...}
  },
  "headings": {...},
  "images": {...},
  "url_structure": {...},
  "schema_markup": {...},
  "content_quality": {...},
  "issues": [
    {
      "type": "warning",
      "category": "meta",
      "message": "Title too short: 14 characters",
      "recommendation": "Expand title to 50-60 characters",
      "impact": "medium"
    }
  ],
  "recommendations": [
    "Improve meta tags for better SERP appearance",
    "Add descriptive alt text to all images"
  ]
}
```

### Quick Analysis

```bash
POST /analyze/quick
Content-Type: application/json

{
  "url": "https://example.com"
}
```

Response:
```json
{
  "url": "https://example.com",
  "critical_issues_count": 2,
  "critical_issues": [...],
  "meta_score": 65
}
```

## 📊 Scoring System

### Overall Score (0-100)

Weighted average of all categories:
- **Meta**: 25% - Title, description, OG tags
- **Content**: 25% - Word count, readability
- **Headings**: 15% - H1-H6 structure
- **Schema**: 15% - Structured data
- **Images**: 10% - Alt text coverage
- **URL**: 10% - URL structure

### Issue Impact

- **High**: -25 points
- **Medium**: -10 points
- **Low**: -5 points

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/

# Test specific analyzer
pytest tests/test_meta_analyzer.py
```

### Manual Testing

```bash
# Using curl
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Using httpie
http POST localhost:8000/analyze url=https://example.com
```

## 🐳 Docker Compose Example

```yaml
version: '3.8'

services:
  seo-analyzer:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
      - REQUEST_TIMEOUT=30
      - LOG_LEVEL=INFO
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🚀 Deployment

### Coolify

1. Create new service in Coolify
2. Select "Docker Image" or "Dockerfile"
3. Configure environment variables
4. Deploy

### Manual Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Systemd Service

```ini
[Unit]
Description=Technical SEO Analyzer
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/seo-analyzer
Environment="PATH=/opt/seo-analyzer/venv/bin"
ExecStart=/opt/seo-analyzer/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key for AI suggestions |
| `ALLOWED_ORIGINS` | No | * | CORS allowed origins (comma-separated) |
| `REQUEST_TIMEOUT` | No | 30 | HTTP request timeout in seconds |
| `LOG_LEVEL` | No | INFO | Logging level |
| `REDIS_URL` | No | - | Redis URL for caching |

## 🏗️ Project Structure

```
services/technical-seo-analyzer/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── analyzers/           # Analysis modules
│   │   ├── meta.py
│   │   ├── headings.py
│   │   ├── images.py
│   │   ├── url.py
│   │   ├── schema.py
│   │   └── content_quality.py
│   └── utils/               # Utilities
│       ├── fetcher.py       # HTML fetching
│       └── scorer.py        # Score calculation
├── tests/                   # Test files
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

## 🔗 Integration with Next.js

```typescript
// lib/services/seo-analyzer.ts
export async function analyzePage(url: string) {
  const response = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  return await response.json();
}
```

## 📚 API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🐛 Troubleshooting

### Common Issues

**1. Import errors**
```bash
# Ensure you're in the right directory
cd services/technical-seo-analyzer

# Activate virtual environment
source venv/bin/activate
```

**2. Port already in use**
```bash
# Find process
lsof -ti:8000

# Kill process
kill -9 $(lsof -ti:8000)

# Or use different port
uvicorn app.main:app --port 8001
```

**3. CORS errors**
```bash
# Update ALLOWED_ORIGINS in .env
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

## 📄 License

MIT

## 👥 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 🔄 Changelog

### Version 1.0.0 (2024-11-30)
- Initial release
-  6 analysis modules
- ✅ Docker support
- ✅ Comprehensive API

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 30.11.2024
