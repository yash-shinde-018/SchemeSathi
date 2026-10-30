"""
User service for SchemeSathi.

Handles user profile operations and updates.
"""

from app import db
from app.models import User, UserProfile
from typing import Dict, Optional, Tuple


class UserService:
    """Service for user operations."""
    
    @staticmethod
    def get_profile(user_id: int) -> Optional[Dict]:
        """Get user profile by ID."""
        user = User.query.get(user_id)
        if not user:
            return None
        
        profile = user.profile
        
        return {
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'role': user.role,
            'account_status': user.account_status,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'profile': {
                'date_of_birth': profile.date_of_birth.isoformat() if profile and profile.date_of_birth else None,
                'gender': profile.gender if profile else None,
                'state': profile.state if profile else None,
                'district': profile.district if profile else None,
                'city': profile.city if profile else None,
                'occupation': profile.occupation if profile else None,
                'education_level': (getattr(profile, 'education', None) or getattr(profile, 'education_level', None)) if profile else None,
                'education': (getattr(profile, 'education', None) or getattr(profile, 'education_level', None)) if profile else None,
                'annual_income': (float(profile.income) if getattr(profile, 'income', None) is not None else getattr(profile, 'annual_income', None)) if profile else None,
                'income': (float(profile.income) if getattr(profile, 'income', None) is not None else getattr(profile, 'annual_income', None)) if profile else None,
                'social_category': profile.social_category if profile else None,
                'disability_status': profile.disability_status if profile else None,
                'residence_type': getattr(profile, 'residence_type', None) if profile else None,
                'preferred_categories': getattr(profile, 'preferred_categories', []) if (profile and getattr(profile, 'preferred_categories', None)) else [],
                'profile_picture': getattr(profile, 'profile_picture', None) if profile else None,
                'profile_completion_percentage': profile.profile_completion_percentage if profile else 0
            }
        }
    
    @staticmethod
    def update_profile(user_id: int, data: Dict) -> Tuple[bool, str]:
        """
        Update user profile.
        
        Args:
            user_id: User ID
            data: Dictionary with profile fields to update
            
        Returns:
            Tuple of (success, message)
        """
        user = User.query.get(user_id)
        if not user:
            return False, 'User not found'
        
        # Update user fields
        if 'first_name' in data and data['first_name']:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data and data['last_name']:
            user.last_name = data['last_name'].strip()
        if 'phone' in data and data['phone']:
            user.phone = data['phone'].strip()
        
        # Update profile fields
        profile = user.profile
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        
        if 'date_of_birth' in data:
            profile.date_of_birth = data['date_of_birth'] if data['date_of_birth'] else None
        if 'gender' in data:
            profile.gender = data['gender'].strip() if (data['gender'] and str(data['gender']).strip()) else None
        if 'state' in data:
            profile.state = data['state'].strip() if (data['state'] and str(data['state']).strip()) else None
        if 'district' in data:
            profile.district = data['district'].strip() if (data['district'] and str(data['district']).strip()) else None
        if 'city' in data:
            profile.city = data['city'].strip() if (data['city'] and str(data['city']).strip()) else None
        if 'occupation' in data:
            profile.occupation = data['occupation'].strip() if (data['occupation'] and str(data['occupation']).strip()) else None
        if 'education_level' in data or 'education' in data:
            edu_raw = data.get('education_level') or data.get('education')
            edu_val = edu_raw.strip() if (edu_raw and str(edu_raw).strip()) else None
            if hasattr(profile, 'education'):
                profile.education = edu_val
            if hasattr(profile, 'education_level'):
                profile.education_level = edu_val
        if 'annual_income' in data or 'income' in data:
            inc_raw = data.get('annual_income') if data.get('annual_income') is not None else data.get('income')
            try:
                inc_val = float(inc_raw) if (inc_raw is not None and str(inc_raw).strip() != '') else None
            except Exception:
                inc_val = None
            if hasattr(profile, 'income'):
                profile.income = inc_val
            if hasattr(profile, 'annual_income'):
                profile.annual_income = inc_val
        if 'social_category' in data:
            profile.social_category = data['social_category'].strip() if (data['social_category'] and str(data['social_category']).strip()) else None
        if 'disability_status' in data:
            profile.disability_status = data['disability_status'].strip() if (data['disability_status'] and str(data['disability_status']).strip()) else 'NO'
        if 'residence_type' in data or 'area' in data:
            res_raw = data.get('residence_type') or data.get('area')
            profile.residence_type = res_raw.strip() if (res_raw and str(res_raw).strip()) else None
        if 'preferred_categories' in data:
            profile.preferred_categories = data['preferred_categories'] if isinstance(data['preferred_categories'], list) else []
        if 'profile_picture' in data:
            profile.profile_picture = data['profile_picture']
        
        # Calculate profile completion
        profile.profile_completion_percentage = UserService._calculate_completion(profile)
        
        try:
            db.session.commit()
            return True, 'Profile updated successfully'
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def _calculate_completion(profile: UserProfile) -> int:
        """Calculate profile completion percentage."""
        if not profile:
            return 0
        
        total_fields = 11
        completed = 0
        
        if profile.date_of_birth:
            completed += 1
        if profile.gender:
            completed += 1
        if profile.state:
            completed += 1
        if profile.district:
            completed += 1
        if profile.city:
            completed += 1
        if profile.occupation:
            completed += 1
        if getattr(profile, 'education', None) or getattr(profile, 'education_level', None):
            completed += 1
        if getattr(profile, 'income', None) is not None or getattr(profile, 'annual_income', None) is not None:
            completed += 1
        if profile.social_category:
            completed += 1
        if getattr(profile, 'residence_type', None):
            completed += 1
        if getattr(profile, 'preferred_categories', None) and len(profile.preferred_categories) > 0:
            completed += 1
        
        return int((completed / total_fields) * 100)
