"""
Matching service for rule-based scheme recommendations.

Implements deterministic algorithm matching schemes to user profiles
based on eligibility criteria. No AI/ML - pure rule-based logic.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime


class MatchingService:
    """Service for rule-based scheme recommendations."""
    
    # Scoring weights for different criteria
    SCORES = {
        'age_match': 25,
        'occupation_match': 15,
        'education_match': 15,
        'income_match': 15,
        'state_match': 15,
        'gender_match': 10,
        'social_category_match': 10,
        'category_preference_match': 15,
    }
    
    MAX_SCORE = 100
    MIN_RECOMMENDATION_SCORE = 30
    
    @staticmethod
    def calculate_match_score(user_profile: Dict[str, Any], scheme: Dict[str, Any]) -> Tuple[int, List[str]]:
        """
        Calculate match score between user profile and scheme.
        
        Args:
            user_profile: User profile data (age, state, occupation, etc.)
            scheme: Scheme data with eligibility criteria
            
        Returns:
            Tuple of (score, list of matching criteria)
        """
        score = 0
        matching_criteria = []
        
        # Age match
        if 'age' in user_profile and scheme.get('eligibility_age_range'):
            age_min, age_max = scheme['eligibility_age_range']
            if age_min <= user_profile['age'] <= age_max:
                score += MatchingService.SCORES['age_match']
                matching_criteria.append('age_range_matches')
        
        # Occupation match
        if 'occupation' in user_profile and scheme.get('target_occupations'):
            if user_profile['occupation'] in scheme['target_occupations']:
                score += MatchingService.SCORES['occupation_match']
                matching_criteria.append('occupation_matches')
        
        # Education match
        if 'education' in user_profile and scheme.get('target_education'):
            if user_profile['education'] in scheme['target_education']:
                score += MatchingService.SCORES['education_match']
                matching_criteria.append('education_matches')
        
        # Income match
        if 'annual_income' in user_profile and scheme.get('income_limit'):
            if user_profile['annual_income'] <= scheme['income_limit']:
                score += MatchingService.SCORES['income_match']
                matching_criteria.append('income_eligible')
        
        # State match
        if 'state' in user_profile and scheme.get('applicable_states'):
            if user_profile['state'] in scheme['applicable_states'] or 'ALL' in scheme['applicable_states']:
                score += MatchingService.SCORES['state_match']
                matching_criteria.append('state_eligible')
        
        # Gender match
        if 'gender' in user_profile and scheme.get('target_gender'):
            if user_profile['gender'] in scheme['target_gender']:
                score += MatchingService.SCORES['gender_match']
                matching_criteria.append('gender_matches')
        
        # Social category match
        if 'social_category' in user_profile and scheme.get('target_social_category'):
            if user_profile['social_category'] in scheme['target_social_category']:
                score += MatchingService.SCORES['social_category_match']
                matching_criteria.append('social_category_matches')
        
        # Category preference match
        if 'category_interests' in user_profile and scheme.get('category_id'):
            if scheme['category_id'] in user_profile['category_interests']:
                score += MatchingService.SCORES['category_preference_match']
                matching_criteria.append('category_preference_matches')
        
        # Cap score at MAX_SCORE
        score = min(score, MatchingService.MAX_SCORE)
        
        return score, matching_criteria
    
    @staticmethod
    def get_recommendations(user_profile: Dict[str, Any], schemes: List[Dict[str, Any]], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recommended schemes for a user.
        
        Args:
            user_profile: User profile data
            schemes: List of available schemes
            limit: Maximum number of recommendations (default 10)
            
        Returns:
            List of recommended schemes with scores, sorted by score descending
        """
        recommendations = []
        
        for scheme in schemes:
            score, criteria = MatchingService.calculate_match_score(user_profile, scheme)
            
            # Only include if meets minimum threshold
            if score >= MatchingService.MIN_RECOMMENDATION_SCORE:
                recommendations.append({
                    'scheme_id': scheme.get('id'),
                    'scheme_name': scheme.get('name'),
                    'category': scheme.get('category'),
                    'match_score': score,
                    'match_percentage': (score / MatchingService.MAX_SCORE) * 100,
                    'matching_criteria': criteria,
                    'match_reason': MatchingService._generate_match_reason(criteria),
                })
        
        # Sort by score descending
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Return top N
        return recommendations[:limit]
    
    @staticmethod
    def _generate_match_reason(criteria: List[str]) -> str:
        """
        Generate human-readable match reason from criteria list.
        
        Args:
            criteria: List of matching criteria
            
        Returns:
            Human-readable match reason string
        """
        if not criteria:
            return "General recommendation"
        
        reason_parts = []
        criteria_names = {
            'age_range_matches': 'your age range',
            'occupation_matches': 'your occupation',
            'education_matches': 'your education',
            'income_eligible': 'your income level',
            'state_eligible': 'your state',
            'gender_matches': 'your gender',
            'social_category_matches': 'your social category',
            'category_preference_matches': 'your interests',
        }
        
        for criterion in criteria:
            if criterion in criteria_names:
                reason_parts.append(criteria_names[criterion])
        
        if len(reason_parts) == 0:
            return "Matches your profile"
        elif len(reason_parts) == 1:
            return f"Matches {reason_parts[0]}"
        else:
            return f"Matches {', '.join(reason_parts[:-1])} and {reason_parts[-1]}"
    
    @staticmethod
    def validate_user_profile(profile: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate user profile completeness and correctness.
        
        Args:
            profile: User profile to validate
            
        Returns:
            Tuple of (is_valid, list of missing/invalid fields)
        """
        required_fields = ['age', 'state', 'gender']
        errors = []
        
        for field in required_fields:
            if field not in profile or profile[field] is None:
                errors.append(f"Missing required field: {field}")
        
        # Validate age
        if 'age' in profile:
            age = profile['age']
            if not isinstance(age, int) or age < 0 or age > 150:
                errors.append("Age must be a number between 0 and 150")
        
        return len(errors) == 0, errors


class CacheManager:
    """Simple cache manager for recommendations."""
    
    def __init__(self, ttl_hours: int = 24):
        """
        Initialize cache manager.
        
        Args:
            ttl_hours: Time-to-live for cache entries in hours
        """
        self.ttl_hours = ttl_hours
        self.cache = {}  # In production, use Redis
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if expired/not found
        """
        if key not in self.cache:
            return None
        
        value, expiry_time = self.cache[key]
        
        if datetime.utcnow() > expiry_time:
            del self.cache[key]
            return None
        
        return value
    
    def set(self, key: str, value: Any) -> None:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        from datetime import timedelta
        expiry_time = datetime.utcnow() + timedelta(hours=self.ttl_hours)
        self.cache[key] = (value, expiry_time)
    
    def delete(self, key: str) -> None:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
        """
        if key in self.cache:
            del self.cache[key]
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()


# Global cache instance for recommendations
recommendation_cache = CacheManager(ttl_hours=24)
