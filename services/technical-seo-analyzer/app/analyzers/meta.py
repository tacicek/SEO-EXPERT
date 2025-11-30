from bs4 import BeautifulSoup
from app.config import settings
from app.utils.fetcher import parse_html
from app.utils.scorer import calculate_score_from_issues

class MetaAnalyzer:
    """Analyze meta tags (title, description, OG tags, etc.)"""
    
    def __init__(self, url: str, html_content: str):
        self.url = url
        self.soup = parse_html(html_content)
        self.issues = []
    
    def analyze(self) -> dict:
        """Run full meta analysis"""
        title_data = self._analyze_title()
        description_data = self._analyze_description()
        canonical_data = self._analyze_canonical()
        robots_data = self._analyze_robots()
        og_tags = self._analyze_og_tags()
        twitter_tags = self._analyze_twitter_tags()
        viewport = self._analyze_viewport()
        language = self._analyze_language()
        charset = self._analyze_charset()
        
        score = calculate_score_from_issues(self.issues)
        
        return {
            'score': score,
            'title': title_data,
            'description': description_data,
            'canonical': canonical_data,
            'robots': robots_data,
            'og_tags': og_tags,
            'twitter_tags': twitter_tags,
            'viewport': viewport,
            'language': language,
            'charset': charset,
            'issues': self.issues
        }
    
    def _analyze_title(self) -> dict:
        """Analyze title tag"""
        title_tag = self.soup.find('title')
        
        if not title_tag:
            self.issues.append({
                'type': 'error',
                'category': 'meta',
                'message': 'Missing title tag',
                'recommendation': 'Add a descriptive title tag (50-60 characters)',
                'impact': 'high'
            })
            return {
                'value': None,
                'length': 0,
                'status': 'error',
                'issues': ['Missing title tag']
            }
        
        title_text = title_tag.get_text().strip()
        title_length = len(title_text)
        status = 'good'
        issues = []
        
        # Check length
        if title_length < settings.TITLE_MIN_LENGTH:
            status = 'warning'
            issues.append(f'Title too short ({title_length} chars, recommended: {settings.TITLE_MIN_LENGTH}-{settings.TITLE_MAX_LENGTH})')
            self.issues.append({
                'type': 'warning',
                'category': 'meta',
                'message': f'Title too short: {title_length} characters',
                'recommendation': f'Expand title to {settings.TITLE_MIN_LENGTH}-{settings.TITLE_MAX_LENGTH} characters',
                'impact': 'medium'
            })
        elif title_length > settings.TITLE_MAX_LENGTH:
            status = 'warning'
            issues.append(f'Title too long ({title_length} chars, recommended: {settings.TITLE_MIN_LENGTH}-{settings.TITLE_MAX_LENGTH})')
            self.issues.append({
                'type': 'warning',
                'category': 'meta',
                'message': f'Title too long: {title_length} characters',
                'recommendation': f'Shorten title to {settings.TITLE_MIN_LENGTH}-{settings.TITLE_MAX_LENGTH} characters',
                'impact': 'medium'
            })
        
        # Check if empty
        if not title_text:
            status = 'error'
            issues.append('Title tag is empty')
            self.issues.append({
                'type': 'error',
                'category': 'meta',
                'message': 'Title tag is empty',
                'recommendation': 'Add descriptive title text',
                'impact': 'high'
            })
        
        return {
            'value': title_text,
            'length': title_length,
            'status': status,
            'issues': issues
        }
    
    def _analyze_description(self) -> dict:
        """Analyze meta description"""
        desc_tag = self.soup.find('meta', attrs={'name': 'description'})
        
        if not desc_tag or not desc_tag.get('content'):
            self.issues.append({
                'type': 'warning',
                'category': 'meta',
                'message': 'Missing meta description',
                'recommendation': 'Add a compelling meta description (150-160 characters)',
                'impact': 'high'
            })
            return {
                'value': None,
                'length': 0,
                'status': 'error',
                'issues': ['Missing meta description']
            }
        
        desc_text = desc_tag.get('content', '').strip()
        desc_length = len(desc_text)
        status = 'good'
        issues = []
        
        # Check length
        if desc_length < settings.DESCRIPTION_MIN_LENGTH:
            status = 'warning'
            issues.append(f'Description too short ({desc_length} chars)')
            self.issues.append({
                'type': 'warning',
                'category': 'meta',
                'message': f'Meta description too short: {desc_length} characters',
                'recommendation': f'Expand to {settings.DESCRIPTION_MIN_LENGTH}-{settings.DESCRIPTION_MAX_LENGTH} characters',
                'impact': 'medium'
            })
        elif desc_length > settings.DESCRIPTION_MAX_LENGTH:
            status = 'warning'
            issues.append(f'Description too long ({desc_length} chars)')
            self.issues.append({
                'type': 'warning',
                'category': 'meta',
                'message': f'Meta description too long: {desc_length} characters',
                'recommendation': f'Shorten to {settings.DESCRIPTION_MIN_LENGTH}-{settings.DESCRIPTION_MAX_LENGTH} characters',
                'impact': 'medium'
            })
        
        return {
            'value': desc_text,
            'length': desc_length,
            'status': status,
            'issues': issues
        }
    
    def _analyze_canonical(self) -> dict:
        """Analyze canonical URL"""
        canonical_tag = self.soup.find('link', attrs={'rel': 'canonical'})
        
        if not canonical_tag:
            return {
                'value': None,
                'is_self_referencing': False,
                'status': 'warning'
            }
        
        canonical_url = canonical_tag.get('href', '')
        is_self_referencing = canonical_url == self.url or canonical_url == self.url.rstrip('/')
        
        return {
            'value': canonical_url,
            'is_self_referencing': is_self_referencing,
            'status': 'good' if canonical_url else 'warning'
        }
    
    def _analyze_robots(self) -> dict:
        """Analyze robots meta tag"""
        robots_tag = self.soup.find('meta', attrs={'name': 'robots'})
        
        if not robots_tag:
            return {
                'value': None,
                'is_indexable': True,
                'is_followable': True
            }
        
        robots_content = robots_tag.get('content', '').lower()
        
        return {
            'value': robots_content,
            'is_indexable': 'noindex' not in robots_content,
            'is_followable': 'nofollow' not in robots_content
        }
    
    def _analyze_og_tags(self) -> dict:
        """Analyze Open Graph tags"""
        og_tags = {}
        
        for tag in self.soup.find_all('meta', attrs={'property': lambda x: x and x.startswith('og:')}):
            property_name = tag.get('property', '')
            content = tag.get('content', '')
            og_tags[property_name] = content
        
        return og_tags
    
    def _analyze_twitter_tags(self) -> dict:
        """Analyze Twitter Card tags"""
        twitter_tags = {}
        
        for tag in self.soup.find_all('meta', attrs={'name': lambda x: x and x.startswith('twitter:')}):
            name = tag.get('name', '')
            content = tag.get('content', '')
            twitter_tags[name] = content
        
        return twitter_tags
    
    def _analyze_viewport(self) -> str:
        """Analyze viewport meta tag"""
        viewport_tag = self.soup.find('meta', attrs={'name': 'viewport'})
        
        if not viewport_tag:
            self.issues.append({
                'type': 'warning',
                'category': 'meta',
                'message': 'Missing viewport meta tag',
                'recommendation': 'Add viewport meta tag for mobile responsiveness',
                'impact': 'low'
            })
            return None
        
        return viewport_tag.get('content', '')
    
    def _analyze_language(self) -> str:
        """Analyze html lang attribute"""
        html_tag = self.soup.find('html')
        
        if not html_tag or not html_tag.get('lang'):
            self.issues.append({
                'type': 'info',
                'category': 'meta',
                'message': 'Missing language declaration',
                'recommendation': 'Add lang attribute to html tag',
                'impact': 'low'
            })
            return None
        
        return html_tag.get('lang', '')
    
    def _analyze_charset(self) -> str:
        """Analyze charset declaration"""
        charset_tag = self.soup.find('meta', attrs={'charset': True})
        
        if charset_tag:
            return charset_tag.get('charset', '')
        
        # Check http-equiv
        content_type_tag = self.soup.find('meta', attrs={'http-equiv': 'Content-Type'})
        if content_type_tag:
            content = content_type_tag.get('content', '')
            if 'charset=' in content:
                return content.split('charset=')[1].split(';')[0].strip()
        
        return None
