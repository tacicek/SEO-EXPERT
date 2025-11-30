import httpx
from bs4 import BeautifulSoup
from app.config import settings
import logging

logger = logging.getLogger(__name__)

async def fetch_html(url: str) -> str:
    """
    Fetch HTML content from a URL
    
    Args:
        url: The URL to fetch
        
    Returns:
        HTML content as string
        
    Raises:
        Exception: If fetching fails
    """
    try:
        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SEO-Expert-Bot/1.0)'
            }
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Check content length
            content_length = len(response.content)
            if content_length > settings.MAX_CONTENT_LENGTH:
                raise Exception(f"Content too large: {content_length} bytes")
            
            return response.text
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching {url}: {e}")
        raise Exception(f"Failed to fetch URL (HTTP {e.response.status_code})")
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching {url}")
        raise Exception("Request timeout")
    except Exception as e:
        logger.error(f"Error fetching {url}: {str(e)}")
        raise Exception(f"Failed to fetch URL: {str(e)}")

def parse_html(html_content: str) -> BeautifulSoup:
    """
    Parse HTML content with BeautifulSoup
    
    Args:
        html_content: HTML string
        
    Returns:
        BeautifulSoup object
    """
    return BeautifulSoup(html_content, 'lxml')

def sanitize_text(text: str) -> str:
    """
    Sanitize text for JSON serialization
    Remove or escape problematic characters
    
    Args:
        text: Input text
        
    Returns:
        Sanitized text safe for JSON
    """
    if not text:
        return text
    
    # Remove control characters and fix quotes
    text = text.replace('\r', ' ').replace('\n', ' ')
    text = text.replace('\t', ' ')
    # Replace multiple spaces with single space
    text = ' '.join(text.split())
    # Limit length to prevent huge responses
    if len(text) > 5000:
        text = text[:5000] + '...'
    return text
