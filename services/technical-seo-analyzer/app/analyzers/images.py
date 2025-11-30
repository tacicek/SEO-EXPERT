from app.utils.fetcher import parse_html
from app.utils.scorer import calculate_score_from_issues

class ImageAnalyzer:
    """Analyze images (alt text, dimensions, etc.)"""
    
    def __init__(self, html_content: str):
        self.soup = parse_html(html_content)
        self.issues = []
    
    def analyze(self) -> dict:
        """Run full image analysis"""
        images = self.soup.find_all('img')
        
        total_images = len(images)
        images_with_alt = 0
        images_without_alt = 0
        empty_alt = 0
        
        image_data = []
        
        for img in images:
            alt = img.get('alt')
            src = img.get('src', '')
            
            img_info = {
                'src': src,
                'alt': alt,
                'has_alt': alt is not None,
                'alt_empty': alt == '',
                'width': img.get('width'),
                'height': img.get('height')
            }
            
            image_data.append(img_info)
            
            if alt is not None:
                images_with_alt += 1
                if alt == '':
                    empty_alt += 1
            else:
                images_without_alt += 1
                self.issues.append({
                    'type': 'warning',
                    'category': 'images',
                    'message': f'Image missing alt text: {src[:50]}...',
                    'recommendation': 'Add descriptive alt text for accessibility and SEO',
                    'impact': 'medium'
                })
        
        # Calculate coverage
        alt_coverage = (images_with_alt / total_images * 100) if total_images > 0 else 100
        
        score = calculate_score_from_issues(self.issues)
        
        return {
            'score': score,
            'total_images': total_images,
            'images_with_alt': images_with_alt,
            'images_without_alt': images_without_alt,
            'empty_alt': empty_alt,
            'alt_coverage': round(alt_coverage, 1),
            'images': image_data[:20],  # Limit to first 20 for response size
            'issues': self.issues
        }
