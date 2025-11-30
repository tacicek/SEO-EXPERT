def calculate_overall_score(results: dict) -> dict:
    """
    Calculate overall scores from analysis results
    
    Args:
        results: Dictionary containing all analysis results
        
    Returns:
        Dictionary with calculated scores
    """
    weights = {
        'meta': 0.25,      # Title + Description very important
        'headings': 0.15,  # Structure important
        'images': 0.10,    # Alt text accessibility
        'url': 0.10,       # URL structure
        'schema': 0.15,    # Rich results
        'content': 0.25,   # Content quality critical
    }
    
    scores = {}
    
    # Calculate individual scores
    for category in weights.keys():
        if category in results:
            result = results[category]
            issues = result.get('issues', [])
            
            # Base score
            base_score = 100
            
            # Deduct points for issues
            for issue in issues:
                impact = issue.get('impact', 'low')
                penalty = {
                    'high': 25,
                    'medium': 10,
                    'low': 5
                }.get(impact, 5)
                base_score -= penalty
            
            scores[category] = max(0, base_score)
        else:
            scores[category] = 0
    
    # Calculate weighted overall score
    overall = sum(scores[cat] * weights[cat] for cat in weights.keys())
    
    return {
        'overall': round(overall),
        **{k: round(v) for k, v in scores.items()}
    }

def calculate_score_from_issues(issues: list, max_score: int = 100) -> int:
    """
    Calculate score based on number and severity of issues
    
    Args:
        issues: List of issue dictionaries
        max_score: Maximum possible score
        
    Returns:
        Calculated score (0-max_score)
    """
    score = max_score
    
    for issue in issues:
        impact = issue.get('impact', 'low')
        penalty = {
            'high': 25,
            'medium': 10,
            'low': 5
        }.get(impact, 5)
        score -= penalty
    
    return max(0, min(score, max_score))
