"""
Utility functions for the scraper module.
Includes text cleaning, URL manipulation, and data normalization.
"""

import re
import unicodedata
from typing import List, Optional, Any
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

# Common tracking parameters to strip
TRACKING_PARAMS = [
    # Google Analytics / Ads
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'gclsrc', 'dclid',
    # Facebook
    'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source',
    # Microsoft / Bing
    'msclkid',
    # Other common trackers
    'ref', 'referrer', 'source', 'mc_cid', 'mc_eid',
    '_ga', '_gl', '_hsenc', '_hsmi', 'hsa_acc', 'hsa_cam',
    'hsa_grp', 'hsa_ad', 'hsa_src', 'hsa_tgt', 'hsa_kw',
    'hsa_mt', 'hsa_net', 'hsa_ver',
    # Affiliate / tracking
    'affiliate', 'partner', 'campaign_id', 'ad_id',
    # Session / misc
    'sessionid', 'session_id', 'sid', 'PHPSESSID',
]


def clean_text(text: Optional[str]) -> str:
    """
    Clean and normalize text content.
    
    - Removes extra whitespace
    - Strips leading/trailing spaces
    - Normalizes unicode characters
    - Removes control characters
    
    Args:
        text: Input text to clean
        
    Returns:
        Cleaned text string
    """
    if not text:
        return ''
    
    # Convert to string if needed
    text = str(text)
    
    # Normalize unicode
    text = unicodedata.normalize('NFKC', text)
    
    # Remove control characters (except newlines and tabs temporarily)
    text = ''.join(
        char for char in text 
        if unicodedata.category(char) != 'Cc' or char in '\n\t'
    )
    
    # Replace tabs and newlines with spaces
    text = text.replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    # Strip
    text = text.strip()
    
    return text


def normalize_whitespace(text: Optional[str]) -> str:
    """
    Normalize whitespace while preserving paragraph breaks.
    
    Args:
        text: Input text
        
    Returns:
        Text with normalized whitespace
    """
    if not text:
        return ''
    
    # Replace multiple newlines with double newline (paragraph)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Replace single newlines with space
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    
    # Normalize multiple spaces to single space
    text = re.sub(r' +', ' ', text)
    
    # Clean up around newlines
    text = re.sub(r' *\n *', '\n', text)
    
    # Limit consecutive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def dedupe(items: List[Any]) -> List[Any]:
    """
    Remove duplicate items from list while preserving order.
    
    Args:
        items: List of items
        
    Returns:
        List with duplicates removed
    """
    seen = set()
    result = []
    
    for item in items:
        # Handle unhashable types
        try:
            key = item if isinstance(item, (str, int, float, bool, tuple)) else str(item)
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
        tracking_lower = [p.lower() for p in TRACKING_PARAMS]
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
            ''  # Remove fragment too
        ))
        
        return clean_url
        
    except Exception:
        # Return original if parsing fails
        return url


def normalize_url(url: str) -> str:
    """
    Normalize URL for consistent comparison.
    
    - Lowercases scheme and host
    - Removes trailing slashes
    - Removes tracking params
    - Removes fragments
    
    Args:
        url: URL to normalize
        
    Returns:
        Normalized URL
    """
    if not url:
        return ''
    
    try:
        # Strip tracking params first
        url = strip_tracking_params(url)
        
        parsed = urlparse(url)
        
        # Lowercase scheme and netloc
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        
        # Remove default ports
        if netloc.endswith(':80') and scheme == 'http':
            netloc = netloc[:-3]
        elif netloc.endswith(':443') and scheme == 'https':
            netloc = netloc[:-4]
        
        # Normalize path
        path = parsed.path
        if path != '/' and path.endswith('/'):
            path = path.rstrip('/')
        if not path:
            path = '/'
        
        return urlunparse((
            scheme,
            netloc,
            path,
            '',  # params
            parsed.query,
            ''   # fragment
        ))
        
    except Exception:
        return url


def extract_domain(url: str) -> str:
    """
    Extract domain from URL.
    
    Args:
        url: Full URL
        
    Returns:
        Domain name
    """
    if not url:
        return ''
    
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower()
    except:
        return ''


def is_internal_link(url: str, base_domain: str) -> bool:
    """
    Check if URL is internal to the base domain.
    
    Args:
        url: URL to check
        base_domain: Base domain to compare against
        
    Returns:
        True if internal link
    """
    if not url or not base_domain:
        return False
    
    url_domain = extract_domain(url)
    base_domain = base_domain.lower().replace('www.', '')
    url_domain = url_domain.replace('www.', '')
    
    return url_domain == base_domain or url_domain.endswith('.' + base_domain)


def truncate_text(text: str, max_length: int = 200, suffix: str = '...') -> str:
    """
    Truncate text to maximum length at word boundary.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if not text or len(text) <= max_length:
        return text or ''
    
    # Find last space before max_length
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
    """Count sentences in text (approximate)."""
    if not text:
        return 0
    # Count sentence-ending punctuation
    return len(re.findall(r'[.!?]+(?:\s|$)', text))


def extract_numbers(text: str) -> List[float]:
    """Extract all numbers from text."""
    if not text:
        return []
    
    # Match integers and decimals
    numbers = re.findall(r'-?\d+\.?\d*', text)
    result = []
    
    for num in numbers:
        try:
            result.append(float(num))
        except ValueError:
            continue
    
    return result


def sanitize_filename(name: str) -> str:
    """
    Sanitize string for use as filename.
    
    Args:
        name: Original name
        
    Returns:
        Safe filename
    """
    if not name:
        return 'unnamed'
    
    # Remove/replace invalid characters
    name = re.sub(r'[<>:"/\\|?*]', '-', name)
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'-+', '-', name)
    name = re.sub(r'_+', '_', name)
    
    # Limit length
    if len(name) > 200:
        name = name[:200]
    
    return name.strip('-_') or 'unnamed'

