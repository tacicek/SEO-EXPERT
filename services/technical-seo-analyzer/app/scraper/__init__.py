"""
Playwright-powered content extractor module for SEO Expert.
Handles JavaScript-rendered pages and extracts structured content.
"""

from .renderer import get_rendered_html, get_rendered_html_async
from .extractor import extract_content, ContentExtractor
from .helpers import clean_text, dedupe, normalize_whitespace, strip_tracking_params

__all__ = [
    'get_rendered_html',
    'get_rendered_html_async', 
    'extract_content',
    'ContentExtractor',
    'clean_text',
    'dedupe',
    'normalize_whitespace',
    'strip_tracking_params'
]

