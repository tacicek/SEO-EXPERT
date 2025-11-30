import json
from app.utils.fetcher import parse_html
from app.utils.scorer import calculate_score_from_issues

class SchemaAnalyzer:
    """Analyze structured data (Schema.org JSON-LD)"""
    
    def __init__(self, html_content: str):
        self.soup = parse_html(html_content)
        self.issues = []
    
    def analyze(self) -> dict:
        """Run full schema analysis"""
        # Find all JSON-LD scripts
        json_ld_scripts = self.soup.find_all('script', type='application/ld+json')
        
        schemas = []
        schema_types = []
        valid_count = 0
        invalid_count = 0
        
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                
                # Handle @graph
                if isinstance(data, dict) and '@graph' in data:
                    items = data['@graph']
                elif isinstance(data, list):
                    items = data
                else:
                    items = [data]
                
                for item in items:
                    if isinstance(item, dict) and '@type' in item:
                        schema_type = item['@type']
                        schema_types.append(schema_type)
                        schemas.append({
                            'type': schema_type,
                            'valid': True,
                            'data': item
                        })
                        valid_count += 1
                    
            except json.JSONDecodeError:
                invalid_count += 1
                self.issues.append({
                    'type': 'error',
                    'category': 'schema',
                    'message': 'Invalid JSON-LD syntax',
                    'recommendation': 'Fix JSON-LD syntax errors',
                    'impact': 'medium'
                })
        
        # Check if schema exists
        if not schemas:
            self.issues.append({
                'type': 'info',
                'category': 'schema',
                'message': 'No structured data found',
                'recommendation': 'Add Schema.org structured data for rich results',
                'impact': 'medium'
            })
        
        # Check for important schema types
        recommended_types = ['Organization', 'WebSite', 'WebPage', 'Article', 'Product', 'BreadcrumbList']
        missing_recommended = [t for t in recommended_types if t not in schema_types]
        
        score = calculate_score_from_issues(self.issues)
        
        return {
            'score': score,
            'has_schema': len(schemas) > 0,
            'total_schemas': len(schemas),
            'valid_schemas': valid_count,
            'invalid_schemas': invalid_count,
            'schema_types': list(set(schema_types)),
            'schemas': schemas[:5],  # Limit for response size
            'missing_recommended': missing_recommended,
            'issues': self.issues
        }
