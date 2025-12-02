"""
Full DOM text extractor optimized for WordPress/Gutenberg/Elementor.

Key features:
- Full DOM text walker (every visible text node)
- Gutenberg block comment extraction
- Multiple fallback strategies
- Content validation
- No premature filtering
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Set, Tuple
from bs4 import BeautifulSoup, Tag, NavigableString, Comment
from .helpers import clean_text, normalize_whitespace, dedupe

logger = logging.getLogger(__name__)

# Tags to skip completely
SKIP_TAGS: Set[str] = {
    'script', 'style', 'noscript', 'meta', 'link',
    'svg', 'path', 'canvas', 'video', 'audio', 'source',
    'template', 'iframe',
}

# Content container selectors (priority order)
CONTENT_SELECTORS = [
    'article',
    '[role="main"]',
    'main',
    '.entry-content',
    '.post-content', 
    '.article-content',
    '.content-area',
    '.page-content',
    '.main-content',
    '.wp-block-post-content',
    '.elementor-widget-theme-post-content',
    '.et_pb_post_content',
    '#content',
    '.content',
    '.post',
    '.article',
    '.hentry',
    '.single-post',
    '.blog-post',
]

# Noise patterns - elements to skip
NOISE_PATTERNS = [
    r'^nav$', r'^menu', r'^sidebar', r'^widget', r'^footer$', r'^header$',
    r'comment', r'social', r'share', r'related-post', r'advertisement',
    r'^ad-', r'^ads', r'cookie', r'popup', r'modal', r'overlay',
]


def _is_noise_element(tag: Tag) -> bool:
    """Check if element is navigation/sidebar noise."""
    if not isinstance(tag, Tag):
        return False
    
    if tag.name in {'nav', 'footer', 'aside'}:
        return True
    
    classes = ' '.join(tag.get('class', []))
    element_id = tag.get('id', '')
    combined = f"{classes} {element_id}".lower()
    
    for pattern in NOISE_PATTERNS:
        if re.search(pattern, combined):
            return True
    
    role = tag.get('role', '').lower()
    if role in {'navigation', 'banner', 'contentinfo', 'complementary'}:
        return True
    
    return False


def _is_hidden(tag: Tag) -> bool:
    """Check if element is hidden."""
    if not isinstance(tag, Tag):
        return False
    
    style = tag.get('style', '').lower()
    if 'display:none' in style.replace(' ', '') or 'visibility:hidden' in style.replace(' ', ''):
        return True
    
    if tag.has_attr('hidden') or tag.get('aria-hidden') == 'true':
        return True
    
    return False


def extract_gutenberg_content(html: str) -> str:
    """
    Extract content from Gutenberg block comments.
    
    Gutenberg stores content in comments like:
    <!-- wp:paragraph -->
    <p>Content here</p>
    <!-- /wp:paragraph -->
    
    Some blocks also store JSON data in comments.
    """
    texts = []
    
    # Find all Gutenberg block comments
    block_pattern = r'<!--\s*wp:(\w+)(?:\s+({[^>]*}))?\s*-->(.*?)<!--\s*/wp:\1\s*-->'
    
    for match in re.finditer(block_pattern, html, re.DOTALL):
        block_type = match.group(1)
        block_attrs = match.group(2)
        block_content = match.group(3)
        
        # Extract text from block content
        soup = BeautifulSoup(block_content, 'lxml')
        text = soup.get_text(separator=' ', strip=True)
        if text:
            texts.append(text)
        
        # Some blocks store content in JSON attributes
        if block_attrs:
            try:
                attrs = json.loads(block_attrs)
                if 'content' in attrs:
                    texts.append(clean_text(attrs['content']))
                if 'text' in attrs:
                    texts.append(clean_text(attrs['text']))
                if 'caption' in attrs:
                    texts.append(clean_text(attrs['caption']))
            except:
                pass
    
    return '\n\n'.join(texts)


def extract_from_data_attributes(soup: BeautifulSoup) -> str:
    """Extract text from data attributes that might contain content."""
    texts = []
    
    # Common data attributes that might contain content
    data_attrs = ['data-content', 'data-text', 'data-caption', 'data-title', 'data-description']
    
    for attr in data_attrs:
        for element in soup.find_all(attrs={attr: True}):
            value = element.get(attr, '')
            if value and len(value) > 10:
                # Check if it's HTML
                if '<' in value:
                    inner_soup = BeautifulSoup(value, 'lxml')
                    text = inner_soup.get_text(separator=' ', strip=True)
                else:
                    text = clean_text(value)
                
                if text:
                    texts.append(text)
    
    return '\n\n'.join(texts)


def extract_from_json_ld(soup: BeautifulSoup) -> str:
    """Extract article content from JSON-LD structured data."""
    texts = []
    
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            
            # Handle both single object and array
            items = data if isinstance(data, list) else [data]
            
            for item in items:
                if isinstance(item, dict):
                    # Article body
                    if 'articleBody' in item:
                        texts.append(clean_text(item['articleBody']))
                    if 'text' in item:
                        texts.append(clean_text(item['text']))
                    if 'description' in item:
                        texts.append(clean_text(item['description']))
        except:
            pass
    
    return '\n\n'.join(texts)


def walk_text_nodes(element, skip_noise: bool = True) -> List[str]:
    """
    Walk through all text nodes in an element.
    This is the most thorough extraction method.
    """
    texts = []
    
    def walk(node):
        if node is None:
            return
        
        for child in node.children:
            if isinstance(child, NavigableString):
                # Skip comments but don't remove them
                if isinstance(child, Comment):
                    continue
                
                text = str(child).strip()
                if text and len(text) > 1:
                    texts.append(text)
                    
            elif isinstance(child, Tag):
                # Skip certain tags
                if child.name in SKIP_TAGS:
                    continue
                
                # Skip hidden elements
                if _is_hidden(child):
                    continue
                
                # Optionally skip noise
                if skip_noise and _is_noise_element(child):
                    continue
                
                # Recurse
                walk(child)
                
                # Add spacing after block elements
                if child.name in {'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                                  'li', 'tr', 'blockquote', 'section', 'article'}:
                    if texts and texts[-1] != '\n':
                        texts.append('\n')
    
    walk(element)
    return texts


def extract_full_text(html: str, include_noise: bool = False) -> str:
    """
    Extract ALL visible text from HTML using multiple strategies.
    
    Strategies (in order):
    1. Direct text node walking
    2. Gutenberg block extraction
    3. Data attribute extraction
    4. JSON-LD extraction
    
    Returns the longest/most complete result.
    """
    if not html:
        return ''
    
    soup = BeautifulSoup(html, 'lxml')
    results = []
    
    # Strategy 1: Find main content and walk text nodes
    main_content = None
    for selector in CONTENT_SELECTORS:
        candidate = soup.select_one(selector)
        if candidate:
            main_content = candidate
            break
    
    # Use body if no main content found
    search_area = main_content or soup.body or soup
    
    # Walk text nodes
    text_nodes = walk_text_nodes(search_area, skip_noise=not include_noise)
    strategy1_text = normalize_whitespace(' '.join(text_nodes))
    results.append(('DOM walk', strategy1_text))
    
    # Strategy 2: Gutenberg blocks
    gutenberg_text = extract_gutenberg_content(html)
    if gutenberg_text:
        results.append(('Gutenberg', gutenberg_text))
    
    # Strategy 3: Data attributes
    data_text = extract_from_data_attributes(soup)
    if data_text:
        results.append(('Data attrs', data_text))
    
    # Strategy 4: JSON-LD
    jsonld_text = extract_from_json_ld(soup)
    if jsonld_text:
        results.append(('JSON-LD', jsonld_text))
    
    # Strategy 5: Fallback - get ALL text from body
    if soup.body:
        all_text_nodes = walk_text_nodes(soup.body, skip_noise=False)
        fallback_text = normalize_whitespace(' '.join(all_text_nodes))
        results.append(('Full body', fallback_text))
    
    # Choose best result (longest with reasonable structure)
    best_text = ''
    best_word_count = 0
    best_strategy = ''
    
    for strategy_name, text in results:
        word_count = len(text.split())
        logger.debug(f"Strategy '{strategy_name}': {word_count} words")
        
        if word_count > best_word_count:
            best_word_count = word_count
            best_text = text
            best_strategy = strategy_name
    
    logger.info(f"Best extraction: '{best_strategy}' with {best_word_count} words")
    
    return best_text


def extract_content(html: str) -> Dict[str, Any]:
    """
    Extract structured content from HTML.
    
    Returns:
        Dictionary with headings, paragraphs, lists, tables, full_text, etc.
    """
    if not html:
        return _empty_result()
    
    soup = BeautifulSoup(html, 'lxml')
    
    # Remove only script/style (keep comments for Gutenberg)
    for tag in soup.find_all(['script', 'style', 'noscript']):
        tag.decompose()
    
    # Find main content
    main_content = None
    for selector in CONTENT_SELECTORS:
        candidate = soup.select_one(selector)
        if candidate:
            main_content = candidate
            logger.debug(f"Using content selector: {selector}")
            break
    
    search_area = main_content or soup.body or soup
    
    # Extract full text using best strategy
    full_text = extract_full_text(html, include_noise=False)
    
    # If text is too short, try with noise included
    if len(full_text.split()) < 100:
        logger.warning("Content too short, trying with noise included")
        full_text_with_noise = extract_full_text(html, include_noise=True)
        if len(full_text_with_noise.split()) > len(full_text.split()) * 1.5:
            full_text = full_text_with_noise
    
    # Extract structured elements
    headings = _extract_headings(search_area)
    paragraphs = _extract_paragraphs(search_area)
    lists = _extract_lists(search_area)
    tables = _extract_tables(search_area)
    blockquotes = _extract_blockquotes(search_area)
    elements_in_order = _extract_elements_in_order(search_area)
    
    # Calculate stats
    word_count = len(full_text.split())
    char_count = len(full_text)
    sentence_count = len(re.findall(r'[.!?]+(?:\s|$)', full_text))
    
    result = {
        'headings': headings,
        'paragraphs': paragraphs,
        'lists': lists,
        'tables': tables,
        'blockquotes': blockquotes,
        'emphasis': _extract_emphasis(search_area),
        'full_text': full_text,
        'html': str(search_area),
        'elements_in_order': elements_in_order,
        'metadata': {
            'title': _extract_title(soup),
            'meta_description': _extract_meta_description(soup),
            'word_count': word_count,
            'character_count': char_count,
            'sentence_count': sentence_count,
        }
    }
    
    logger.info(f"Extracted: {word_count} words, {len(headings)} headings, "
               f"{len(paragraphs)} paragraphs, {len(lists)} lists")
    
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


def _extract_headings(soup) -> List[Dict[str, Any]]:
    """Extract all headings in order."""
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


def _extract_paragraphs(soup) -> List[Dict[str, Any]]:
    """Extract all paragraphs and paragraph-like content."""
    paragraphs = []
    seen_texts = set()
    
    # Get <p> tags
    for p in soup.find_all('p'):
        text = clean_text(p.get_text())
        if text and len(text) > 10 and text not in seen_texts:
            seen_texts.add(text)
            paragraphs.append({
                'text': text,
                'html': str(p),
                'word_count': len(text.split())
            })
    
    # Also check divs that look like paragraphs (no block children)
    for div in soup.find_all('div'):
        if div.find(['p', 'div', 'ul', 'ol', 'table', 'article', 'section']):
            continue
        
        text = clean_text(div.get_text())
        if text and len(text) > 30 and text not in seen_texts:
            seen_texts.add(text)
            paragraphs.append({
                'text': text,
                'html': str(div),
                'word_count': len(text.split())
            })
    
    return paragraphs


def _extract_lists(soup) -> List[Dict[str, Any]]:
    """Extract lists."""
    lists = []
    for list_tag in soup.find_all(['ul', 'ol']):
        if list_tag.parent and list_tag.parent.name in ['li', 'ul', 'ol']:
            continue
        
        items = []
        for li in list_tag.find_all('li', recursive=False):
            text = clean_text(li.get_text())
            if text:
                items.append({'text': text, 'html': str(li)})
        
        if items:
            lists.append({
                'type': 'ordered' if list_tag.name == 'ol' else 'unordered',
                'tag': list_tag.name,
                'items': items,
                'html': str(list_tag)
            })
    
    return lists


def _extract_tables(soup) -> List[Dict[str, Any]]:
    """Extract tables."""
    tables = []
    for table in soup.find_all('table'):
        headers = []
        rows = []
        
        thead = table.find('thead')
        if thead:
            for th in thead.find_all('th'):
                headers.append(clean_text(th.get_text()))
        
        tbody = table.find('tbody') or table
        for tr in tbody.find_all('tr'):
            row = [clean_text(td.get_text()) for td in tr.find_all(['td', 'th'])]
            if row and not (not headers and tr == table.find('tr')):
                rows.append(row)
        
        if headers or rows:
            tables.append({'headers': headers, 'rows': rows, 'html': str(table)})
    
    return tables


def _extract_blockquotes(soup) -> List[Dict[str, Any]]:
    """Extract blockquotes."""
    blockquotes = []
    for bq in soup.find_all('blockquote'):
        text = clean_text(bq.get_text())
        if text:
            cite = bq.find('cite')
            blockquotes.append({
                'text': text,
                'citation': clean_text(cite.get_text()) if cite else '',
                'html': str(bq)
            })
    return blockquotes


def _extract_emphasis(soup) -> Dict[str, List[str]]:
    """Extract emphasized text."""
    strong = [clean_text(t.get_text()) for t in soup.find_all(['strong', 'b']) if clean_text(t.get_text())]
    em = [clean_text(t.get_text()) for t in soup.find_all(['em', 'i']) if clean_text(t.get_text())]
    return {'strong': dedupe(strong), 'em': dedupe(em)}


def _extract_elements_in_order(soup) -> List[Dict[str, Any]]:
    """Extract elements in DOM order."""
    elements = []
    for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'table']):
        if tag.parent and tag.parent.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote']:
            continue
        
        text = clean_text(tag.get_text())
        if not text or len(text) < 3:
            continue
        
        elem_type = 'heading' if tag.name.startswith('h') else tag.name
        if tag.name in ['ul', 'ol']:
            elem_type = 'list'
        
        item = {'type': elem_type, 'tag': tag.name, 'text': text, 'html': str(tag)}
        
        if elem_type == 'heading':
            item['level'] = int(tag.name[1])
        elif elem_type == 'list':
            item['list_type'] = 'ordered' if tag.name == 'ol' else 'unordered'
            item['items'] = [clean_text(li.get_text()) for li in tag.find_all('li', recursive=False)]
        
        elements.append(item)
    
    return elements


def _extract_title(soup) -> str:
    """Extract page title."""
    title = soup.find('title')
    if title:
        return clean_text(title.get_text())
    h1 = soup.find('h1')
    if h1:
        return clean_text(h1.get_text())
    return ''


def _extract_meta_description(soup) -> str:
    """Extract meta description."""
    meta = soup.find('meta', attrs={'name': 'description'})
    if meta:
        return clean_text(meta.get('content', ''))
    og = soup.find('meta', property='og:description')
    if og:
        return clean_text(og.get('content', ''))
    return ''


class ContentExtractor:
    """Class-based interface for backwards compatibility."""
    
    def __init__(self, html: str):
        self.html = html
    
    def extract(self) -> Dict[str, Any]:
        return extract_content(self.html)
    
    def extract_full_text(self) -> str:
        return extract_full_text(self.html)
