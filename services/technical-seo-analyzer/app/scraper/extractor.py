"""
Full DOM text walker extractor for WordPress and JS-rendered sites.
Extracts ALL visible text content, not just specific tags.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Set
from bs4 import BeautifulSoup, Tag, NavigableString, Comment
from .helpers import clean_text, normalize_whitespace, dedupe

logger = logging.getLogger(__name__)

# Tags to completely skip (no text extraction)
SKIP_TAGS: Set[str] = {
    'script', 'style', 'noscript', 'meta', 'head', 'link',
    'svg', 'canvas', 'iframe', 'object', 'embed', 'applet',
    'audio', 'video', 'source', 'track', 'map', 'area',
    'template', 'slot', 'base', 'basefont', 'bgsound',
    'command', 'keygen', 'param', 'wbr'
}

# Tags that typically contain navigation/non-content
NOISE_TAGS: Set[str] = {
    'nav', 'header', 'footer', 'aside', 'menu', 'menuitem',
}

# Class/ID patterns that indicate non-content areas
NOISE_PATTERNS = [
    r'nav', r'menu', r'sidebar', r'widget', r'footer', r'header',
    r'comment', r'social', r'share', r'related', r'advertisement',
    r'ad-', r'ads-', r'banner', r'cookie', r'popup', r'modal',
    r'breadcrumb', r'pagination', r'search', r'login', r'signup',
    r'newsletter', r'subscribe', r'author-bio', r'tags?-', r'category',
]

# Main content selectors (priority order)
MAIN_CONTENT_SELECTORS = [
    'article',
    '[role="main"]',
    'main',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.content-area',
    '.page-content',
    '.main-content',
    '#content',
    '.content',
    '.post',
    '.article',
    '#main',
    '.site-content',
    '.blog-post',
    '.single-content',
    '.hentry',
    '.type-post',
    '.type-page',
    # WordPress specific
    '.wp-block-post-content',
    '.elementor-widget-theme-post-content',
    '.et_pb_post_content',
]


def _is_noise_element(tag: Tag) -> bool:
    """Check if element is likely noise (nav, sidebar, etc.)."""
    if not isinstance(tag, Tag):
        return False
    
    # Check tag name
    if tag.name in NOISE_TAGS:
        return True
    
    # Check class and id
    classes = ' '.join(tag.get('class', []))
    element_id = tag.get('id', '')
    combined = f"{classes} {element_id}".lower()
    
    for pattern in NOISE_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            return True
    
    # Check ARIA roles
    role = tag.get('role', '').lower()
    if role in ['navigation', 'banner', 'contentinfo', 'complementary', 'search']:
        return True
    
    return False


def _is_visible_text(tag: Tag) -> bool:
    """Check if element would be visible (not hidden)."""
    if not isinstance(tag, Tag):
        return True
    
    # Check style attribute
    style = tag.get('style', '').lower()
    if 'display: none' in style or 'display:none' in style:
        return False
    if 'visibility: hidden' in style or 'visibility:hidden' in style:
        return False
    
    # Check hidden attribute
    if tag.has_attr('hidden'):
        return False
    
    # Check aria-hidden
    if tag.get('aria-hidden') == 'true':
        return False
    
    return True


def extract_full_text(html: str, include_noise: bool = False) -> str:
    """
    Extract ALL visible text from HTML using full DOM traversal.
    
    This walks through every text node in the document and collects
    visible text, which ensures we capture content from any tag structure
    (WordPress themes, page builders, custom HTML, etc.)
    
    Args:
        html: Raw HTML string
        include_noise: If True, include nav/sidebar/footer text
        
    Returns:
        Complete text content as a single string
    """
    if not html:
        return ''
    
    soup = BeautifulSoup(html, 'lxml')
    
    # Remove script/style tags completely first
    for tag in soup.find_all(SKIP_TAGS):
        tag.decompose()
    
    # Remove comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    
    # Try to find main content area
    main_content = None
    for selector in MAIN_CONTENT_SELECTORS:
        main_content = soup.select_one(selector)
        if main_content and len(main_content.get_text(strip=True)) > 200:
            logger.debug(f"Found main content: {selector}")
            break
        main_content = None
    
    # Use main content if found, otherwise use body or entire soup
    search_area = main_content or soup.body or soup
    
    # Collect all text nodes
    texts: List[str] = []
    
    def walk_tree(element):
        """Recursively walk DOM tree and collect text."""
        if element is None:
            return
        
        for child in element.children:
            if isinstance(child, NavigableString):
                # It's a text node
                if not isinstance(child, Comment):
                    text = str(child).strip()
                    if text and len(text) > 0:
                        texts.append(text)
                        
            elif isinstance(child, Tag):
                # Skip certain tags
                if child.name in SKIP_TAGS:
                    continue
                
                # Skip hidden elements
                if not _is_visible_text(child):
                    continue
                
                # Optionally skip noise elements
                if not include_noise and _is_noise_element(child):
                    continue
                
                # Recurse into children
                walk_tree(child)
                
                # Add line break after block elements
                if child.name in ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                  'li', 'tr', 'blockquote', 'pre', 'section', 'article']:
                    texts.append('\n')
    
    walk_tree(search_area)
    
    # Join and clean
    full_text = ' '.join(texts)
    full_text = normalize_whitespace(full_text)
    
    # Log stats
    word_count = len(full_text.split())
    logger.info(f"Extracted {word_count} words, {len(full_text)} characters")
    
    return full_text


def extract_content(html: str) -> Dict[str, Any]:
    """
    Extract structured content from HTML.
    
    Returns both full_text (via DOM walker) and structured elements
    (headings, paragraphs, lists, etc.)
    
    Args:
        html: Raw HTML string
        
    Returns:
        Dictionary with extracted content
    """
    if not html:
        return _empty_result()
    
    soup = BeautifulSoup(html, 'lxml')
    raw_html = html
    
    # Remove unwanted elements
    for tag in soup.find_all(SKIP_TAGS):
        tag.decompose()
    
    # Remove comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    
    # Find main content
    main_content = None
    for selector in MAIN_CONTENT_SELECTORS:
        candidate = soup.select_one(selector)
        if candidate and len(candidate.get_text(strip=True)) > 100:
            main_content = candidate
            logger.debug(f"Main content found: {selector}")
            break
    
    if not main_content:
        main_content = soup.body or soup
    
    # Remove noise from main content clone
    content_clone = BeautifulSoup(str(main_content), 'lxml')
    for tag in content_clone.find_all(_is_noise_element):
        tag.decompose()
    
    # Extract full text using DOM walker
    full_text = extract_full_text(str(content_clone), include_noise=False)
    
    # Also try extracting from original with noise for completeness
    full_text_with_noise = extract_full_text(html, include_noise=True)
    
    # Use the longer one (sometimes main content detection fails)
    if len(full_text_with_noise.split()) > len(full_text.split()) * 1.5:
        logger.info("Using full page text (main content may have been too restrictive)")
        full_text = full_text_with_noise
    
    # Extract structured elements
    headings = _extract_headings(content_clone)
    paragraphs = _extract_paragraphs(content_clone)
    lists = _extract_lists(content_clone)
    tables = _extract_tables(content_clone)
    blockquotes = _extract_blockquotes(content_clone)
    emphasis = _extract_emphasis(content_clone)
    elements_in_order = _extract_elements_in_order(content_clone)
    
    # Calculate statistics
    word_count = len(full_text.split())
    char_count = len(full_text)
    sentence_count = len(re.findall(r'[.!?]+(?:\s|$)', full_text))
    
    result = {
        'headings': headings,
        'paragraphs': paragraphs,
        'lists': lists,
        'tables': tables,
        'blockquotes': blockquotes,
        'emphasis': emphasis,
        'full_text': full_text,
        'html': str(main_content) if main_content else '',
        'elements_in_order': elements_in_order,
        'metadata': {
            'title': _extract_title(soup),
            'meta_description': _extract_meta_description(soup),
            'word_count': word_count,
            'character_count': char_count,
            'sentence_count': sentence_count,
        }
    }
    
    logger.info(f"Content extraction complete: {word_count} words, "
               f"{len(headings)} headings, {len(paragraphs)} paragraphs, "
               f"{len(lists)} lists")
    
    return result


def _empty_result() -> Dict[str, Any]:
    """Return empty result structure."""
    return {
        'headings': [],
        'paragraphs': [],
        'lists': [],
        'tables': [],
        'blockquotes': [],
        'emphasis': {'strong': [], 'em': []},
        'full_text': '',
        'html': '',
        'elements_in_order': [],
        'metadata': {
            'title': '',
            'meta_description': '',
            'word_count': 0,
            'character_count': 0,
            'sentence_count': 0,
        }
    }


def _extract_headings(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract all headings in document order."""
    headings = []
    
    for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        text = clean_text(tag.get_text())
        if text and len(text) > 1:
            headings.append({
                'level': int(tag.name[1]),
                'tag': tag.name,
                'text': text,
                'id': tag.get('id', ''),
                'html': str(tag)
            })
    
    return headings


def _extract_paragraphs(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract all paragraphs."""
    paragraphs = []
    
    for p in soup.find_all('p'):
        text = clean_text(p.get_text())
        if text and len(text) > 10:
            paragraphs.append({
                'text': text,
                'html': str(p),
                'word_count': len(text.split())
            })
    
    # Also get text from divs that look like paragraphs
    for div in soup.find_all('div'):
        # Only if div has direct text and no block children
        if div.find(['p', 'div', 'section', 'article', 'ul', 'ol', 'table']):
            continue
        
        text = clean_text(div.get_text())
        if text and len(text) > 50:  # Longer threshold for divs
            # Check it's not already captured
            if not any(p['text'] == text for p in paragraphs):
                paragraphs.append({
                    'text': text,
                    'html': str(div),
                    'word_count': len(text.split())
                })
    
    return paragraphs


def _extract_lists(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract lists with items."""
    lists = []
    
    for list_tag in soup.find_all(['ul', 'ol']):
        # Skip nested lists
        if list_tag.parent and list_tag.parent.name in ['li', 'ul', 'ol']:
            continue
        
        items = []
        for li in list_tag.find_all('li', recursive=False):
            text = clean_text(li.get_text())
            if text:
                items.append({
                    'text': text,
                    'html': str(li)
                })
        
        if items:
            lists.append({
                'type': 'ordered' if list_tag.name == 'ol' else 'unordered',
                'tag': list_tag.name,
                'items': items,
                'html': str(list_tag)
            })
    
    return lists


def _extract_tables(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract tables with headers and rows."""
    tables = []
    
    for table in soup.find_all('table'):
        headers = []
        rows = []
        
        # Headers
        thead = table.find('thead')
        if thead:
            for th in thead.find_all('th'):
                headers.append(clean_text(th.get_text()))
        else:
            first_row = table.find('tr')
            if first_row:
                for cell in first_row.find_all(['th', 'td']):
                    headers.append(clean_text(cell.get_text()))
        
        # Rows
        tbody = table.find('tbody') or table
        for tr in tbody.find_all('tr'):
            if not thead and tr == table.find('tr'):
                continue  # Skip header row
            
            row = []
            for td in tr.find_all(['td', 'th']):
                row.append(clean_text(td.get_text()))
            
            if row:
                rows.append(row)
        
        if headers or rows:
            tables.append({
                'headers': headers,
                'rows': rows,
                'html': str(table)
            })
    
    return tables


def _extract_blockquotes(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract blockquotes."""
    blockquotes = []
    
    for bq in soup.find_all('blockquote'):
        text = clean_text(bq.get_text())
        if text:
            cite = bq.find('cite')
            citation = clean_text(cite.get_text()) if cite else ''
            
            blockquotes.append({
                'text': text,
                'citation': citation,
                'html': str(bq)
            })
    
    return blockquotes


def _extract_emphasis(soup: BeautifulSoup) -> Dict[str, List[str]]:
    """Extract emphasized text."""
    strong_texts = []
    em_texts = []
    
    for tag in soup.find_all(['strong', 'b']):
        text = clean_text(tag.get_text())
        if text and len(text) > 2:
            strong_texts.append(text)
    
    for tag in soup.find_all(['em', 'i']):
        text = clean_text(tag.get_text())
        if text and len(text) > 2:
            em_texts.append(text)
    
    return {
        'strong': dedupe(strong_texts),
        'em': dedupe(em_texts)
    }


def _extract_elements_in_order(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extract content elements in DOM order."""
    elements = []
    target_tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote']
    
    for element in soup.find_all(target_tags):
        # Skip nested
        if element.parent and element.parent.name in target_tags:
            continue
        
        text = clean_text(element.get_text())
        if not text or len(text) < 3:
            continue
        
        elem_type = 'heading' if element.name.startswith('h') else element.name
        if element.name in ['ul', 'ol']:
            elem_type = 'list'
        
        item = {
            'type': elem_type,
            'tag': element.name,
            'text': text,
            'html': str(element)
        }
        
        if elem_type == 'heading':
            item['level'] = int(element.name[1])
        elif elem_type == 'list':
            item['list_type'] = 'ordered' if element.name == 'ol' else 'unordered'
            item['items'] = [
                clean_text(li.get_text())
                for li in element.find_all('li', recursive=False)
                if clean_text(li.get_text())
            ]
        
        elements.append(item)
    
    return elements


def _extract_title(soup: BeautifulSoup) -> str:
    """Extract page title."""
    title_tag = soup.find('title')
    if title_tag:
        return clean_text(title_tag.get_text())
    
    h1 = soup.find('h1')
    if h1:
        return clean_text(h1.get_text())
    
    og_title = soup.find('meta', property='og:title')
    if og_title:
        return clean_text(og_title.get('content', ''))
    
    return ''


def _extract_meta_description(soup: BeautifulSoup) -> str:
    """Extract meta description."""
    meta = soup.find('meta', attrs={'name': 'description'})
    if meta:
        return clean_text(meta.get('content', ''))
    
    og_desc = soup.find('meta', property='og:description')
    if og_desc:
        return clean_text(og_desc.get('content', ''))
    
    return ''


class ContentExtractor:
    """Class-based extractor for backwards compatibility."""
    
    def __init__(self, html: str):
        self.html = html
        self.soup = BeautifulSoup(html, 'lxml') if html else None
    
    def extract(self) -> Dict[str, Any]:
        return extract_content(self.html)
    
    def extract_full_text(self) -> str:
        return extract_full_text(self.html)
