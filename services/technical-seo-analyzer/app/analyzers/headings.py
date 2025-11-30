from app.utils.fetcher import parse_html, sanitize_text
from app.utils.scorer import calculate_score_from_issues

class HeadingAnalyzer:
    """Analyze heading structure (H1-H6)"""
    
    def __init__(self, html_content: str):
        self.soup = parse_html(html_content)
        self.issues = []
    
    def analyze(self) -> dict:
        """Run full heading analysis"""
        # Extract all headings
        h1 = [sanitize_text(h.get_text().strip()) for h in self.soup.find_all('h1')]
        h2 = [sanitize_text(h.get_text().strip()) for h in self.soup.find_all('h2')]
        h3 = [sanitize_text(h.get_text().strip()) for h in self.soup.find_all('h3')]
        h4 = [sanitize_text(h.get_text().strip()) for h in self.soup.find_all('h4')]
        h5 = [sanitize_text(h.get_text().strip()) for h in self.soup.find_all('h5')]
        h6 = [sanitize_text(h.get_text().strip()) for h in self.soup.find_all('h6')]
        
        # Build hierarchy
        hierarchy = self._build_hierarchy()
        
        # Check for issues
        self._check_h1_count(len(h1))
        self._check_empty_headings()
        structure_valid = self._validate_hierarchy(hierarchy)
        
        score = calculate_score_from_issues(self.issues)
        
        return {
            'score': score,
            'h1': h1,
            'h2': h2,
            'h3': h3,
            'h4': h4,
            'h5': h5,
            'h6': h6,
            'structure_valid': structure_valid,
            'hierarchy': hierarchy,
            'issues': self.issues
        }
    
    def _build_hierarchy(self) -> list:
        """Build heading hierarchy with positions"""
        hierarchy = []
        
        for i in range(1, 7):
            for idx, heading in enumerate(self.soup.find_all(f'h{i}')):
                hierarchy.append({
                    'level': i,
                    'text': sanitize_text(heading.get_text().strip()),
                    'position': len(hierarchy)
                })
        
        return hierarchy
    
    def _check_h1_count(self, count: int):
        """Check H1 count"""
        if count == 0:
            self.issues.append({
                'type': 'error',
                'category': 'headings',
                'message': 'Missing H1 tag',
                'recommendation': 'Add exactly one H1 tag that describes the main topic',
                'impact': 'high'
            })
        elif count > 1:
            self.issues.append({
                'type': 'warning',
                'category': 'headings',
                'message': f'Multiple H1 tags found ({count})',
                'recommendation': 'Use only one H1 tag per page',
                'impact': 'medium'
            })
    
    def _check_empty_headings(self):
        """Check for empty headings"""
        for i in range(1, 7):
            for heading in self.soup.find_all(f'h{i}'):
                if not heading.get_text().strip():
                    self.issues.append({
                        'type': 'warning',
                        'category': 'headings',
                        'message': f'Empty H{i} tag found',
                        'recommendation': 'Remove empty heading or add descriptive text',
                        'impact': 'low'
                    })
    
    def _validate_hierarchy(self, hierarchy: list) -> bool:
        """Validate heading hierarchy (no skipped levels)"""
        if not hierarchy:
            return True
        
        prev_level = 0
        for item in hierarchy:
            level = item['level']
            
            # Check if we skipped a level
            if level > prev_level + 1:
                self.issues.append({
                    'type': 'warning',
                    'category': 'headings',
                    'message': f'Skipped heading level: H{prev_level} to H{level}',
                    'recommendation': f'Use proper heading hierarchy (H{prev_level + 1} before H{level})',
                    'impact': 'low'
                })
                return False
            
            prev_level = level
        
        return True
