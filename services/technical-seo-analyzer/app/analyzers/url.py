from urllib.parse import urlparse
from app.utils.scorer import calculate_score_from_issues

class URLAnalyzer:
    """Analyze URL structure and best practices"""
    
    def __init__(self, url: str):
        self.url = url
        self.parsed = urlparse(url)
        self.issues = []
    
    def analyze(self) -> dict:
        """Run full URL analysis"""
        # Extract parts
        scheme = self.parsed.scheme
        domain = self.parsed.netloc
        path = self.parsed.path
        query = self.parsed.query
        fragment = self.parsed.fragment
        
        # Analyze
        is_https = self._check_https(scheme)
        has_www = domain.startswith('www.')
        path_analysis = self._analyze_path(path)
        has_parameters = bool(query)
        has_fragment = bool(fragment)
        is_seo_friendly = self._check_seo_friendly(path)
        
        score = calculate_score_from_issues(self.issues)
        
        return {
            'score': score,
            'full_url': self.url,
            'scheme': scheme,
            'domain': domain,
            'path': path,
            'is_https': is_https,
            'has_www': has_www,
            'path_depth': path_analysis['depth'],
            'path_length': path_analysis['length'],
            'has_parameters': has_parameters,
            'has_fragment': has_fragment,
            'is_seo_friendly': is_seo_friendly,
            'issues': self.issues
        }
    
    def _check_https(self, scheme: str) -> bool:
        """Check if URL uses HTTPS"""
        if scheme != 'https':
            self.issues.append({
                'type': 'warning',
                'category': 'url',
                'message': 'URL is not using HTTPS',
                'recommendation': 'Use HTTPS for security and SEO benefits',
                'impact': 'medium'
            })
            return False
        return True
    
    def _analyze_path(self, path: str) -> dict:
        """Analyze URL path"""
        if not path or path == '/':
            return {'depth': 0, 'length': 0}
        
        # Remove leading/trailing slashes
        clean_path = path.strip('/')
        
        # Calculate depth (number of levels)
        depth = len(clean_path.split('/')) if clean_path else 0
        
        # Check depth
        if depth > 3:
            self.issues.append({
                'type': 'info',
                'category': 'url',
                'message': f'Deep URL structure (depth: {depth})',
                'recommendation': 'Consider flatter URL structure for better crawlability',
                'impact': 'low'
            })
        
        # Check length
        length = len(path)
        if length > 100:
            self.issues.append({
                'type': 'warning',
                'category': 'url',
                'message': f'Long URL path ({length} characters)',
                'recommendation': 'Keep URLs concise (under 100 characters)',
                'impact': 'low'
            })
        
        return {'depth': depth, 'length': length}
    
    def _check_seo_friendly(self, path: str) -> bool:
        """Check if URL is SEO-friendly (readable, lowercase, hyphens)"""
        if not path or path == '/':
            return True
        
        clean_path = path.strip('/')
        
        # Check for underscores (hyphens preferred)
        if '_' in clean_path:
            self.issues.append({
                'type': 'info',
                'category': 'url',
                'message': 'URL contains underscores',
                'recommendation': 'Use hyphens instead of underscores in URLs',
                'impact': 'low'
            })
            return False
        
        # Check for uppercase
        if clean_path != clean_path.lower():
            self.issues.append({
                'type': 'info',
                'category': 'url',
                'message': 'URL contains uppercase letters',
                'recommendation': 'Use lowercase letters in URLs',
                'impact': 'low'
            })
            return False
        
        # Check for special characters
        allowed_chars = set('abcdefghijklmnopqrstuvwxyz0123456789-/')
        if not all(c in allowed_chars for c in clean_path):
            self.issues.append({
                'type': 'info',
                'category': 'url',
                'message': 'URL contains special characters',
                'recommendation': 'Use only letters, numbers, and hyphens in URLs',
                'impact': 'low'
            })
            return False
        
        return True
