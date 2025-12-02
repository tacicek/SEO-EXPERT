"""
Playwright-powered content extractor module for SEO Expert.
Handles JavaScript-rendered pages and extracts structured content.

Optimized for WordPress and modern JS-rendered websites.
"""

from .renderer import (
    get_rendered_html,
    get_rendered_html_async,
    cleanup
)

from .extractor import (
    extract_content,
    extract_full_text,
    ContentExtractor
)

from .helpers import (
    clean_text,
    normalize_whitespace,
    dedupe,
    strip_tracking_params,
    normalize_url,
    extract_domain,
    is_internal_link,
    truncate_text,
    count_words,
    count_sentences,
    count_paragraphs,
    extract_first_paragraph,
    sanitize_for_json,
    sanitize_filename
)

__all__ = [
    # Renderer
    'get_rendered_html',
    'get_rendered_html_async',
    'cleanup',
    
    # Extractor
    'extract_content',
    'extract_full_text',
    'ContentExtractor',
    
    # Helpers
    'clean_text',
    'normalize_whitespace',
    'dedupe',
    'strip_tracking_params',
    'normalize_url',
    'extract_domain',
    'is_internal_link',
    'truncate_text',
    'count_words',
    'count_sentences',
    'count_paragraphs',
    'extract_first_paragraph',
    'sanitize_for_json',
    'sanitize_filename',
]

__version__ = '2.0.0'
