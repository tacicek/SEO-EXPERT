import textstat
from app.utils.fetcher import parse_html
from app.utils.scorer import calculate_score_from_issues

class ContentQualityAnalyzer:
    """Analyze content quality (readability, word count, etc.)"""
    
    def __init__(self, html_content: str):
        self.soup = parse_html(html_content)
        self.issues = []
    
    def analyze(self) -> dict:
        """Run full content quality analysis"""
        # Extract main content (remove scripts, styles, nav, footer, etc.)
        for element in self.soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()
        
        # Get text content
        text = self.soup.get_text()
        
        # Clean text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Analyze
        word_count = len(text.split())
        char_count = len(text)
        sentence_count = textstat.sentence_count(text)
        
        # Readability scores
        flesch_reading_ease = textstat.flesch_reading_ease(text) if word_count > 0 else 0
        flesch_kincaid_grade = textstat.flesch_kincaid_grade(text) if word_count > 0 else 0
        
        # Check word count
        if word_count < 300:
            self.issues.append({
                'type': 'warning',
                'category': 'content',
                'message': f'Low word count: {word_count} words',
                'recommendation': 'Add more content (recommended: 300+ words)',
                'impact': 'medium'
            })
        
        # Check readability
        if flesch_reading_ease < 30:
            self.issues.append({
                'type': 'warning',
                'category': 'content',
                'message': 'Content is difficult to read',
                'recommendation': 'Simplify language for better readability',
                'impact': 'low'
            })
        
        # Calculate paragraph count
        paragraphs = self.soup.find_all('p')
        paragraph_count = len(paragraphs)
        
        # Calculate average paragraph length
        avg_paragraph_length = word_count / paragraph_count if paragraph_count > 0 else 0
        
        if avg_paragraph_length > 150:
            self.issues.append({
                'type': 'info',
                'category': 'content',
                'message': 'Long paragraphs detected',
                'recommendation': 'Break up long paragraphs for better readability',
                'impact': 'low'
            })
        
        score = calculate_score_from_issues(self.issues)
        
        return {
            'score': score,
            'word_count': word_count,
            'character_count': char_count,
            'sentence_count': sentence_count,
            'paragraph_count': paragraph_count,
            'avg_paragraph_length': round(avg_paragraph_length, 1),
            'flesch_reading_ease': round(flesch_reading_ease, 1),
            'flesch_kincaid_grade': round(flesch_kincaid_grade, 1),
            'readability_level': self._get_readability_level(flesch_reading_ease),
            'issues': self.issues
        }
    
    def _get_readability_level(self, score: float) -> str:
        """Convert Flesch Reading Ease score to readability level"""
        if score >= 90:
            return 'Very Easy'
        elif score >= 80:
            return 'Easy'
        elif score >= 70:
            return 'Fairly Easy'
        elif score >= 60:
            return 'Standard'
        elif score >= 50:
            return 'Fairly Difficult'
        elif score >= 30:
            return 'Difficult'
        else:
            return 'Very Difficult'
