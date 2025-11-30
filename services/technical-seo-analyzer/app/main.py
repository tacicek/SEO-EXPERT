from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Technical SEO Analyzer",
    description="AI-powered technical SEO analysis microservice",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AnalyzeRequest(BaseModel):
    url: HttpUrl

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str

class AnalyzeResponse(BaseModel):
    url: str
    analyzed_at: str
    score: dict
    meta: dict
    headings: dict
    images: dict
    url_structure: dict
    schema_markup: dict
    content_quality: dict
    issues: list
    recommendations: list

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="Technical SEO Analyzer",
        version="1.0.0"
    )

# Analysis endpoint
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_url(request: AnalyzeRequest):
    """
    Analyze a URL for technical SEO issues.
    Returns comprehensive analysis including meta tags, headings, images, etc.
    """
    try:
        url_str = str(request.url)
        logger.info(f"Analyzing URL: {url_str}")
        
        # Import analyzers (lazy import to avoid startup issues)
        from app.analyzers.meta import MetaAnalyzer
        from app.analyzers.headings import HeadingAnalyzer
        from app.analyzers.images import ImageAnalyzer
        from app.analyzers.url import URLAnalyzer
        from app.analyzers.schema import SchemaAnalyzer
        from app.analyzers.content_quality import ContentQualityAnalyzer
        from app.utils.fetcher import fetch_html
        from app.utils.scorer import calculate_overall_score
        
        # Fetch HTML
        html_content = await fetch_html(url_str)
        
        # Run all analyzers
        meta_analyzer = MetaAnalyzer(url_str, html_content)
        heading_analyzer = HeadingAnalyzer(html_content)
        image_analyzer = ImageAnalyzer(html_content)
        url_analyzer = URLAnalyzer(url_str)
        schema_analyzer = SchemaAnalyzer(html_content)
        content_analyzer = ContentQualityAnalyzer(html_content)
        
        meta_result = meta_analyzer.analyze()
        headings_result = heading_analyzer.analyze()
        images_result = image_analyzer.analyze()
        url_result = url_analyzer.analyze()
        schema_result = schema_analyzer.analyze()
        content_result = content_analyzer.analyze()
        
        # Calculate scores
        scores = calculate_overall_score({
            'meta': meta_result,
            'headings': headings_result,
            'images': images_result,
            'url': url_result,
            'schema': schema_result,
            'content': content_result
        })
        
        # Collect all issues
        all_issues = []
        all_issues.extend(meta_result.get('issues', []))
        all_issues.extend(headings_result.get('issues', []))
        all_issues.extend(images_result.get('issues', []))
        all_issues.extend(url_result.get('issues', []))
        all_issues.extend(schema_result.get('issues', []))
        all_issues.extend(content_result.get('issues', []))
        
        # Generate recommendations
        recommendations = generate_recommendations(all_issues, scores)
        
        return AnalyzeResponse(
            url=url_str,
            analyzed_at=datetime.utcnow().isoformat(),
            score=scores,
            meta=meta_result,
            headings=headings_result,
            images=images_result,
            url_structure=url_result,
            schema_markup=schema_result,
            content_quality=content_result,
            issues=sorted(all_issues, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}.get(x.get('impact', 'low'), 2)),
            recommendations=recommendations[:10]  # Top 10 recommendations
        )
        
    except Exception as e:
        logger.error(f"Analysis failed for {request.url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def generate_recommendations(issues: list, scores: dict) -> list:
    """Generate prioritized recommendations based on issues and scores"""
    recommendations = []
    
    # High priority issues first
    high_priority = [i for i in issues if i.get('impact') == 'high']
    if high_priority:
        for issue in high_priority[:5]:
            recommendations.append(issue.get('recommendation', issue.get('message', '')))
    
    # Score-based recommendations
    if scores.get('meta', 0) < 70:
        recommendations.append("Improve meta tags (title and description) for better SERP appearance")
    
    if scores.get('headings', 0) < 70:
        recommendations.append("Fix heading structure to improve content hierarchy")
    
    if scores.get('images', 0) < 70:
        recommendations.append("Add descriptive alt text to all images for accessibility and SEO")
    
    if scores.get('schema', 0) < 50:
        recommendations.append("Implement structured data (Schema.org) for rich results")
    
    if scores.get('content_quality', 0) < 70:
        recommendations.append("Improve content quality and readability")
    
    return list(dict.fromkeys(recommendations))  # Remove duplicates

# Quick check endpoint (faster, less detailed)
@app.post("/analyze/quick")
async def quick_analyze(request: AnalyzeRequest):
    """Quick analysis focusing on critical issues only"""
    try:
        url_str = str(request.url)
        logger.info(f"Quick analyzing URL: {url_str}")
        
        from app.analyzers.meta import MetaAnalyzer
        from app.utils.fetcher import fetch_html
        
        html_content = await fetch_html(url_str)
        meta_analyzer = MetaAnalyzer(url_str, html_content)
        meta_result = meta_analyzer.analyze()
        
        critical_issues = [i for i in meta_result.get('issues', []) if i.get('impact') == 'high']
        
        return {
            "url": url_str,
            "critical_issues_count": len(critical_issues),
            "critical_issues": critical_issues,
            "meta_score": meta_result.get('score', 0)
        }
        
    except Exception as e:
        logger.error(f"Quick analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Technical SEO Analyzer",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "POST /analyze",
            "quick_analyze": "POST /analyze/quick"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
