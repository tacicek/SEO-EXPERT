"""
Utility functions for the scraper module.
Includes text cleaning, URL manipulation, and data normalization.
"""

import re
import unicodedata
from typing import List, Optional, Any, TypeVar
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
import html

T = TypeVar('T')

# Common tracking parameters to strip
TRACKING_PARAMS = [
    # Google Analytics / Ads
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
    # Facebook
    'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',
    # Microsoft / Bing
    'msclkid',
    # Twitter
    'twclid',
    # HubSpot
    '_hsenc', '_hsmi', 'hsa_acc', 'hsa_cam', 'hsa_grp', 'hsa_ad',
    'hsa_src', 'hsa_tgt', 'hsa_kw', 'hsa_mt', 'hsa_net', 'hsa_ver',
    # Mailchimp
    'mc_cid', 'mc_eid',
    # Other
    'ref', 'referrer', 'source', '_ga', '_gl',
    'affiliate', 'partner', 'campaign_id', 'ad_id',
    'sessionid', 'session_id', 'sid', 'PHPSESSID',
    'trk', 'clickid', 'zanpid', 'irclickid',
]


def clean_text(text: Optional[str]) -> str:
    """
    Clean and normalize text content.
    
    - Decodes HTML entities
    - Removes control characters
    - Normalizes unicode
    - Collapses whitespace
    - Strips leading/trailing whitespace
    
    Args:
        text: Input text to clean
        
    Returns:
        Cleaned text string
    """
    if not text:
        return ''
    
    # Convert to string
    text = str(text)
    
    # Decode HTML entities
    text = html.unescape(text)
    
    # Normalize unicode (NFKC = compatibility decomposition + canonical composition)
    text = unicodedata.normalize('NFKC', text)
    
    # Remove control characters except newlines/tabs
    text = ''.join(
        char for char in text
        if unicodedata.category(char) != 'Cc' or char in '\n\t\r'
    )
    
    # Replace various whitespace characters with regular space
    text = re.sub(r'[\t\r\f\v]+', ' ', text)
    
    # Replace multiple newlines with double newline
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Replace single newlines with space
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    
    # Collapse multiple spaces
    text = re.sub(r' +', ' ', text)
    
    # Strip
    text = text.strip()
    
    return text


def normalize_whitespace(text: Optional[str]) -> str:
    """
    Normalize whitespace while preserving paragraph structure.
    
    Args:
        text: Input text
        
    Returns:
        Text with normalized whitespace
    """
    if not text:
        return ''
    
    # Replace various whitespace
    text = re.sub(r'[\t\r\f\v]+', ' ', text)
    
    # Normalize multiple newlines to double (paragraph break)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Replace single newlines with space (within paragraph)
    lines = text.split('\n\n')
    cleaned_lines = []
    for line in lines:
        # Within each paragraph, collapse newlines to spaces
        line = re.sub(r'\n', ' ', line)
        # Collapse multiple spaces
        line = re.sub(r' +', ' ', line)
        line = line.strip()
        if line:
            cleaned_lines.append(line)
    
    text = '\n\n'.join(cleaned_lines)
    
    return text.strip()


def dedupe(items: List[T]) -> List[T]:
    """
    Remove duplicate items from list while preserving order.
    
    Args:
        items: List of items
        
    Returns:
        List with duplicates removed
    """
    if not items:
        return []
    
    seen = set()
    result = []
    
    for item in items:
        # Create hashable key
        try:
            if isinstance(item, (str, int, float, bool, tuple)):
                key = item
            elif isinstance(item, dict):
                key = tuple(sorted(item.items()))
            else:
                key = str(item)
        except:
            key = id(item)
        
        if key not in seen:
            seen.add(key)
            result.append(item)
    
    return result


def strip_tracking_params(url: str) -> str:
    """
    Remove tracking parameters from URL.
    
    Args:
        url: URL with potential tracking params
        
    Returns:
        Clean URL without tracking params
    """
    if not url:
        return ''
    
    try:
        parsed = urlparse(url)
        
        # Parse query string
        params = parse_qs(parsed.query, keep_blank_values=False)
        
        # Remove tracking params (case-insensitive)
        tracking_lower = {p.lower() for p in TRACKING_PARAMS}
        clean_params = {
            k: v for k, v in params.items()
            if k.lower() not in tracking_lower
        }
        
        # Reconstruct URL
        clean_query = urlencode(clean_params, doseq=True) if clean_params else ''
        
        clean_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            clean_query,
            ''  # Remove fragment
        ))
        
        return clean_url
        
    except Exception:
        return url


def normalize_url(url: str) -> str:
    """
    Normalize URL for consistent comparison.
    
    Args:
        url: URL to normalize
        
    Returns:
        Normalized URL
    """
    if not url:
        return ''
    
    try:
        # Strip tracking params
        url = strip_tracking_params(url)
        
        parsed = urlparse(url)
        
        # Lowercase scheme and netloc
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        
        # Remove www prefix for comparison
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        
        # Remove default ports
        if ':80' in netloc and scheme == 'http':
            netloc = netloc.replace(':80', '')
        if ':443' in netloc and scheme == 'https':
            netloc = netloc.replace(':443', '')
        
        # Normalize path
        path = parsed.path
        if path != '/' and path.endswith('/'):
            path = path.rstrip('/')
        if not path:
            path = '/'
        
        return urlunparse((
            scheme, netloc, path, '', parsed.query, ''
        ))
        
    except Exception:
        return url


def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    if not url:
        return ''
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return ''


def is_internal_link(url: str, base_domain: str) -> bool:
    """Check if URL is internal to base domain."""
    if not url or not base_domain:
        return False
    
    url_domain = extract_domain(url)
    base_domain = base_domain.lower().replace('www.', '')
    
    return url_domain == base_domain or url_domain.endswith('.' + base_domain)


def truncate_text(text: str, max_length: int = 200, suffix: str = '...') -> str:
    """Truncate text at word boundary."""
    if not text or len(text) <= max_length:
        return text or ''
    
    truncated = text[:max_length]
    last_space = truncated.rfind(' ')
    
    if last_space > max_length // 2:
        truncated = truncated[:last_space]
    
    return truncated.rstrip() + suffix


def count_words(text: str) -> int:
    """Count words in text."""
    if not text:
        return 0
    return len(text.split())


def count_sentences(text: str) -> int:
    """Count sentences (approximate)."""
    if not text:
        return 0
    return len(re.findall(r'[.!?]+(?:\s|$)', text))


def count_paragraphs(text: str) -> int:
    """Count paragraphs (double newline separated)."""
    if not text:
        return 0
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    return len(paragraphs)


def extract_first_paragraph(text: str, min_words: int = 10) -> str:
    """Extract first meaningful paragraph."""
    if not text:
        return ''
    
    paragraphs = text.split('\n\n')
    for p in paragraphs:
        p = p.strip()
        if count_words(p) >= min_words:
            return p
    
    return paragraphs[0].strip() if paragraphs else ''


def sanitize_for_json(text: str) -> str:
    """Sanitize text for safe JSON serialization."""
    if not text:
        return ''
    
    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')
    
    # Escape special characters
    text = text.replace('\\', '\\\\')
    text = text.replace('"', '\\"')
    text = text.replace('\n', '\\n')
    text = text.replace('\r', '\\r')
    text = text.replace('\t', '\\t')
    
    return text


def sanitize_filename(name: str) -> str:
    """Sanitize string for use as filename."""
    if not name:
        return 'unnamed'
    
    # Remove/replace invalid characters
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '-', name)
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'-+', '-', name)
    name = re.sub(r'_+', '_', name)
    
    # Limit length
    if len(name) > 200:
        name = name[:200]
    
    return name.strip('-_') or 'unnamed'
