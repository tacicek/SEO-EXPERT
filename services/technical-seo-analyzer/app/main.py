from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Technical SEO Analyzer",
    description="AI-powered technical SEO analysis microservice with Playwright rendering",
    version="2.0.0"
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
    use_playwright: Optional[bool] = True  # Use Playwright by default
    wait_for_network: Optional[bool] = True
    handle_cookies: Optional[bool] = True

class ScrapeRequest(BaseModel):
    url: HttpUrl
    use_playwright: Optional[bool] = True
    wait_for_network: Optional[bool] = True
    handle_cookies: Optional[bool] = True
    block_resources: Optional[bool] = True

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str
    playwright_ready: bool

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
    # New fields from scraper
    extracted_content: Optional[Dict[str, Any]] = None

class ScrapeResponse(BaseModel):
    url: str
    scraped_at: str
    success: bool
    content: Dict[str, Any]
    metadata: Dict[str, Any]

# Startup event - initialize Playwright
@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup."""
    logger.info("Starting Technical SEO Analyzer with Playwright support")

# Shutdown event - cleanup Playwright
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    try:
        from app.scraper.renderer import cleanup
        await cleanup()
        logger.info("Playwright cleaned up successfully")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    playwright_ready = False
    try:
        # Quick check if playwright is importable
        from app.scraper.renderer import _browser
        playwright_ready = True
    except:
        pass
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="Technical SEO Analyzer",
        version="2.0.0",
        playwright_ready=playwright_ready
    )

# New scrape-only endpoint
@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    """
    Scrape and extract content from a URL using Playwright.
    Returns structured content including headings, paragraphs, lists, etc.
    """
    try:
        url_str = str(request.url)
        logger.info(f"Scraping URL: {url_str}")
        
        from app.scraper.renderer import get_rendered_html_async
        from app.scraper.extractor import extract_content
        from app.utils.fetcher import fetch_html
        
        # Fetch HTML
        if request.use_playwright:
            html_content = await get_rendered_html_async(
                url_str,
                wait_for_network=request.wait_for_network,
                handle_cookies=request.handle_cookies,
                block_resources=request.block_resources
            )
        else:
            html_content = await fetch_html(url_str)
        
        # Extract content
        content_data = extract_content(html_content)
        
        return ScrapeResponse(
            url=url_str,
            scraped_at=datetime.utcnow().isoformat(),
            success=True,
            content=content_data,
            metadata={
                "word_count": content_data.get('metadata', {}).get('word_count', 0),
                "character_count": content_data.get('metadata', {}).get('character_count', 0),
                "sentence_count": content_data.get('metadata', {}).get('sentence_count', 0),
                "headings_count": len(content_data.get('headings', [])),
                "paragraphs_count": len(content_data.get('paragraphs', [])),
                "lists_count": len(content_data.get('lists', [])),
                "tables_count": len(content_data.get('tables', [])),
                "used_playwright": request.use_playwright,
            }
        )
        
    except Exception as e:
        logger.error(f"Scraping failed for {request.url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

# Analysis endpoint with Playwright integration
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_url(request: AnalyzeRequest):
    """
    Analyze a URL for technical SEO issues.
    Uses Playwright for JavaScript rendering when enabled.
    Returns comprehensive analysis including meta tags, headings, images, etc.
    """
    try:
        url_str = str(request.url)
        logger.info(f"Analyzing URL: {url_str} (Playwright: {request.use_playwright})")
        
        # Import analyzers (lazy import to avoid startup issues)
        from app.analyzers.meta import MetaAnalyzer
        from app.analyzers.headings import HeadingAnalyzer
        from app.analyzers.images import ImageAnalyzer
        from app.analyzers.url import URLAnalyzer
        from app.analyzers.schema import SchemaAnalyzer
        from app.analyzers.content_quality import ContentQualityAnalyzer
        from app.utils.fetcher import fetch_html
        from app.utils.scorer import calculate_overall_score
        
        # Fetch HTML using Playwright or standard HTTP
        if request.use_playwright:
            from app.scraper.renderer import get_rendered_html_async
            from app.scraper.extractor import extract_content
            
            html_content = await get_rendered_html_async(
                url_str,
                wait_for_network=request.wait_for_network,
                handle_cookies=request.handle_cookies,
                block_resources=True  # Block for analysis (faster)
            )
            
            # Extract structured content
            extracted_content = extract_content(html_content)
        else:
            html_content = await fetch_html(url_str)
            extracted_content = None
        
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
        
        # If we have extracted content, enhance content_result
        if extracted_content:
            content_result['extracted'] = {
                'full_text': extracted_content.get('full_text', ''),
                'word_count': extracted_content.get('metadata', {}).get('word_count', 0),
                'headings': extracted_content.get('headings', []),
                'paragraphs': [p.get('text', '') for p in extracted_content.get('paragraphs', [])],
                'lists': extracted_content.get('lists', []),
                'tables': extracted_content.get('tables', []),
                'blockquotes': extracted_content.get('blockquotes', []),
                'elements_in_order': extracted_content.get('elements_in_order', []),
            }
        
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
            recommendations=recommendations[:10],  # Top 10 recommendations
            extracted_content=extracted_content
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
        
        # Use standard HTTP for quick analysis (faster)
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

# Content extraction endpoint (for EEAT analysis)
@app.post("/extract")
async def extract_content_endpoint(request: ScrapeRequest):
    """
    Extract content from URL for EEAT analysis.
    Returns full_text suitable for AI analysis.
    """
    try:
        url_str = str(request.url)
        logger.info(f"Extracting content from: {url_str}")
        
        from app.scraper.renderer import get_rendered_html_async
        from app.scraper.extractor import extract_content
        from app.utils.fetcher import fetch_html
        
        # Fetch HTML
        if request.use_playwright:
            html_content = await get_rendered_html_async(
                url_str,
                wait_for_network=request.wait_for_network,
                handle_cookies=request.handle_cookies,
                block_resources=request.block_resources
            )
        else:
            html_content = await fetch_html(url_str)
        
        # Extract content
        content_data = extract_content(html_content)
        
        return {
            "url": url_str,
            "extracted_at": datetime.utcnow().isoformat(),
            "title": content_data.get('metadata', {}).get('title', ''),
            "meta_description": content_data.get('metadata', {}).get('meta_description', ''),
            "full_text": content_data.get('full_text', ''),
            "headings": content_data.get('headings', []),
            "paragraphs": content_data.get('paragraphs', []),
            "lists": content_data.get('lists', []),
            "tables": content_data.get('tables', []),
            "blockquotes": content_data.get('blockquotes', []),
            "elements_in_order": content_data.get('elements_in_order', []),
            "html": content_data.get('html', ''),
            "statistics": {
                "word_count": content_data.get('metadata', {}).get('word_count', 0),
                "character_count": content_data.get('metadata', {}).get('character_count', 0),
                "sentence_count": content_data.get('metadata', {}).get('sentence_count', 0),
            },
            "used_playwright": request.use_playwright,
        }
        
    except Exception as e:
        logger.error(f"Content extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Technical SEO Analyzer",
        "version": "2.0.0",
        "features": [
            "Playwright-powered JavaScript rendering",
            "Cookie consent auto-handling",
            "Structured content extraction",
            "Technical SEO analysis"
        ],
        "endpoints": {
            "health": "/health",
            "analyze": "POST /analyze (full analysis with Playwright)",
            "quick_analyze": "POST /analyze/quick (fast, basic analysis)",
            "scrape": "POST /scrape (content scraping only)",
            "extract": "POST /extract (content extraction for EEAT)"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
