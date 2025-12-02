"""
BeautifulSoup-based content extractor.
Parses HTML and extracts structured content in DOM order.
"""

import re
import logging
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup, Tag, NavigableString
from .helpers import clean_text, normalize_whitespace, dedupe

logger = logging.getLogger(__name__)

# Elements to remove before extraction
REMOVE_ELEMENTS = [
    'script', 'style', 'noscript', 'svg', 'canvas', 'iframe',
    'nav', 'header', 'footer', 'aside', 'form', 'button',
    'input', 'select', 'textarea', '[role="navigation"]',
    '[role="banner"]', '[role="contentinfo"]', '.sidebar',
    '.navigation', '.menu', '.ad', '.advertisement', '.social-share',
    '.related-posts', '.comments', '#comments', '.breadcrumb'
]

# Main content selectors (priority order)
MAIN_CONTENT_SELECTORS = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    '.post',
    '.article',
    '#main',
    '.main-content',
    '.page-content',
    '.single-content',
    '.blog-post',
]


class ContentExtractor:
    """
    Extract structured content from HTML.
    Preserves DOM order and extracts headings, paragraphs, lists, tables, etc.
    """
    
    def __init__(self, html: str):
        """
        Initialize extractor with HTML content.
        
        Args:
            html: Raw HTML string to parse
        """
        self.soup = BeautifulSoup(html, 'lxml')
        self.raw_html = html
        self._clean_soup()
        
    def _clean_soup(self) -> None:
        """Remove unwanted elements from the soup."""
        for selector in REMOVE_ELEMENTS:
            for element in self.soup.select(selector):
                element.decompose()
    
    def _get_main_content(self) -> Tag:
        """
        Find the main content area of the page.
        Returns the body if no main content container found.
        """
        for selector in MAIN_CONTENT_SELECTORS:
            main = self.soup.select_one(selector)
            if main:
                logger.debug(f"Found main content with selector: {selector}")
                return main
        
        # Fallback to body
        body = self.soup.body
        return body if body else self.soup
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract all content from HTML.
        
        Returns:
            Dictionary containing:
            - headings: List of heading objects {level, text, id}
            - paragraphs: List of paragraph texts
            - lists: List of list objects {type, items}
            - tables: List of table objects {headers, rows}
            - blockquotes: List of blockquote texts
            - emphasis: Dict of {strong, em} text lists
            - full_text: Complete readable text
            - html: Raw HTML of main content
            - metadata: Extraction metadata
        """
        main_content = self._get_main_content()
        
        result = {
            'headings': self._extract_headings(main_content),
            'paragraphs': self._extract_paragraphs(main_content),
            'lists': self._extract_lists(main_content),
            'tables': self._extract_tables(main_content),
            'blockquotes': self._extract_blockquotes(main_content),
            'emphasis': self._extract_emphasis(main_content),
            'full_text': self._extract_full_text(main_content),
            'html': str(main_content) if main_content else '',
            'elements_in_order': self._extract_in_dom_order(main_content),
            'metadata': {
                'title': self._extract_title(),
                'meta_description': self._extract_meta_description(),
                'word_count': 0,
                'character_count': 0,
                'sentence_count': 0,
            }
        }
        
        # Calculate statistics
        full_text = result['full_text']
        result['metadata']['word_count'] = len(full_text.split())
        result['metadata']['character_count'] = len(full_text)
        result['metadata']['sentence_count'] = len(re.findall(r'[.!?]+', full_text))
        
        logger.info(f"Extracted content: {result['metadata']['word_count']} words, "
                   f"{len(result['headings'])} headings, "
                   f"{len(result['paragraphs'])} paragraphs")
        
        return result
    
    def _extract_headings(self, container: Tag) -> List[Dict[str, Any]]:
        """Extract all headings (h1-h6) in order."""
        headings = []
        
        for level in range(1, 7):
            for heading in container.find_all(f'h{level}'):
                text = clean_text(heading.get_text())
                if text:
                    headings.append({
                        'level': level,
                        'tag': f'h{level}',
                        'text': text,
                        'id': heading.get('id', ''),
                        'html': str(heading)
                    })
        
        # Sort by DOM position
        all_heading_tags = container.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        ordered_headings = []
        for tag in all_heading_tags:
            text = clean_text(tag.get_text())
            if text:
                ordered_headings.append({
                    'level': int(tag.name[1]),
                    'tag': tag.name,
                    'text': text,
                    'id': tag.get('id', ''),
                    'html': str(tag)
                })
        
        return ordered_headings
    
    def _extract_paragraphs(self, container: Tag) -> List[Dict[str, Any]]:
        """Extract all paragraphs."""
        paragraphs = []
        
        for p in container.find_all('p'):
            text = clean_text(p.get_text())
            if text and len(text) > 10:  # Skip very short paragraphs
                paragraphs.append({
                    'text': text,
                    'html': str(p),
                    'word_count': len(text.split())
                })
        
        return paragraphs
    
    def _extract_lists(self, container: Tag) -> List[Dict[str, Any]]:
        """Extract all lists (ul, ol) with their items."""
        lists = []
        
        for list_tag in container.find_all(['ul', 'ol']):
            # Skip nested lists (they'll be included in parent)
            if list_tag.parent and list_tag.parent.name in ['li', 'ul', 'ol']:
                continue
            
            items = []
            for li in list_tag.find_all('li', recursive=False):
                item_text = clean_text(li.get_text())
                if item_text:
                    items.append({
                        'text': item_text,
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
    
    def _extract_tables(self, container: Tag) -> List[Dict[str, Any]]:
        """Extract all tables with headers and rows."""
        tables = []
        
        for table in container.find_all('table'):
            headers = []
            rows = []
            
            # Extract headers
            thead = table.find('thead')
            if thead:
                for th in thead.find_all('th'):
                    headers.append(clean_text(th.get_text()))
            else:
                # Try first row as headers
                first_row = table.find('tr')
                if first_row:
                    for cell in first_row.find_all(['th', 'td']):
                        headers.append(clean_text(cell.get_text()))
            
            # Extract rows
            tbody = table.find('tbody') or table
            for tr in tbody.find_all('tr'):
                # Skip header row if we used it
                if not thead and tr == table.find('tr'):
                    continue
                
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
    
    def _extract_blockquotes(self, container: Tag) -> List[Dict[str, Any]]:
        """Extract all blockquotes."""
        blockquotes = []
        
        for bq in container.find_all('blockquote'):
            text = clean_text(bq.get_text())
            if text:
                # Try to find citation
                cite = bq.find('cite')
                citation = clean_text(cite.get_text()) if cite else ''
                
                blockquotes.append({
                    'text': text,
                    'citation': citation,
                    'html': str(bq)
                })
        
        return blockquotes
    
    def _extract_emphasis(self, container: Tag) -> Dict[str, List[str]]:
        """Extract emphasized text (strong, em, b, i)."""
        strong_texts = []
        em_texts = []
        
        for strong in container.find_all(['strong', 'b']):
            text = clean_text(strong.get_text())
            if text and len(text) > 2:
                strong_texts.append(text)
        
        for em in container.find_all(['em', 'i']):
            text = clean_text(em.get_text())
            if text and len(text) > 2:
                em_texts.append(text)
        
        return {
            'strong': dedupe(strong_texts),
            'em': dedupe(em_texts)
        }
    
    def _extract_full_text(self, container: Tag) -> str:
        """
        Extract complete readable text from container.
        Preserves some structure with line breaks.
        """
        if not container:
            return ''
        
        # Clone to avoid modifying original
        clone = BeautifulSoup(str(container), 'lxml')
        
        # Add line breaks before block elements
        block_elements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                         'li', 'div', 'br', 'tr', 'blockquote']
        
        for elem in clone.find_all(block_elements):
            elem.insert_before('\n')
            elem.insert_after('\n')
        
        # Get text
        text = clone.get_text(separator=' ')
        
        # Clean up
        text = normalize_whitespace(text)
        
        return text
    
    def _extract_in_dom_order(self, container: Tag) -> List[Dict[str, Any]]:
        """
        Extract all content elements in DOM order.
        Returns a list of elements preserving their original document order.
        """
        elements = []
        
        if not container:
            return elements
        
        # Tags we want to extract
        target_tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote']
        
        for element in container.find_all(target_tags):
            # Skip nested elements (e.g., p inside blockquote)
            if element.parent and element.parent.name in target_tags:
                continue
            
            text = clean_text(element.get_text())
            if not text or len(text) < 5:
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
            
            # Add extra info based on type
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
    
    def _extract_title(self) -> str:
        """Extract page title."""
        title = self.soup.find('title')
        if title:
            return clean_text(title.get_text())
        
        h1 = self.soup.find('h1')
        if h1:
            return clean_text(h1.get_text())
        
        return ''
    
    def _extract_meta_description(self) -> str:
        """Extract meta description."""
        meta = self.soup.find('meta', attrs={'name': 'description'})
        if meta:
            return clean_text(meta.get('content', ''))
        
        # Try og:description
        og_meta = self.soup.find('meta', attrs={'property': 'og:description'})
        if og_meta:
            return clean_text(og_meta.get('content', ''))
        
        return ''


def extract_content(html: str) -> Dict[str, Any]:
    """
    Convenience function to extract content from HTML.
    
    Args:
        html: Raw HTML string
        
    Returns:
        Dictionary with extracted content
    """
    extractor = ContentExtractor(html)
    return extractor.extract()

