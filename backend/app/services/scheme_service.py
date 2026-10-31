"""
Schemes service for SchemeSathi.

Handles scheme CRUD operations, searching, filtering, and rule-based recommendations.
"""

from app import db
from app.models import Scheme, SavedScheme, UserProfile, SchemeCategory, UserApplication
from sqlalchemy import or_, and_, func
from datetime import datetime
from typing import List, Dict, Optional, Tuple


class SchemeService:
    """Service for scheme operations."""
    
    @staticmethod
    def get_all_schemes(page: int = 1, limit: int = 12, sort_by: str = 'name', sort_order: str = 'asc') -> Tuple[List[Dict], int, int]:
        """
        Get all active schemes with pagination.
        
        Args:
            page: Page number (1-indexed)
            limit: Items per page
            sort_by: Field to sort by (name, created_at)
            sort_order: asc or desc
            
        Returns:
            Tuple of (schemes list, total items, total pages)
        """
        query = Scheme.query.filter(Scheme.deleted_at.is_(None))
        
        # Apply sorting
        if sort_by == 'created_at':
            sort_column = Scheme.created_at
        else:
            sort_column = Scheme.name
        
        if sort_order.lower() == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Paginate
        paginated = query.paginate(page=page, per_page=limit, error_out=False)
        
        schemes_data = []
        for scheme in paginated.items:
            schemes_data.append(SchemeService._scheme_to_dict(scheme))
        
        return schemes_data, paginated.total, paginated.pages
    
    @staticmethod
    def search_schemes(query_text: str, page: int = 1, limit: int = 12, category: Optional[str] = None, category_id: Optional[int] = None) -> Tuple[List[Dict], int, int]:
        """
        Search schemes by name and description, with optional category filter.
        
        Args:
            query_text: Search query
            page: Page number
            limit: Items per page
            category: Optional category name
            category_id: Optional category ID
            
        Returns:
            Tuple of (schemes list, total items, total pages)
        """
        search_term = '%' + query_text.lower() + '%'
        
        query = Scheme.query.filter(
            Scheme.deleted_at.is_(None),
            or_(
                func.lower(Scheme.name).like(search_term),
                func.lower(Scheme.description).like(search_term)
            )
        )

        if category_id:
            query = query.filter(Scheme.category_id == category_id)
        elif category and str(category).strip().lower() != 'all':
            cat_name = str(category).strip()
            query = query.join(Scheme.category).filter(
                or_(
                    func.lower(SchemeCategory.name) == cat_name.lower(),
                    func.lower(SchemeCategory.name).like(f"%{cat_name.lower()}%")
                )
            )
        
        query = query.order_by(Scheme.name)
        paginated = query.paginate(page=page, per_page=limit, error_out=False)
        
        schemes_data = [SchemeService._scheme_to_dict(s) for s in paginated.items]
        
        return schemes_data, paginated.total, paginated.pages
    
    @staticmethod
    def filter_schemes(filters: Dict, page: int = 1, limit: int = 12) -> Tuple[List[Dict], int, int]:
        """
        Filter schemes by multiple criteria including category name or ID.
        
        Args:
            filters: Dict with keys: category, category_id, govt_level, state, ministry, application_mode, sort_by, sort_order
            page: Page number
            limit: Items per page
            
        Returns:
            Tuple of (schemes list, total items, total pages)
        """
        query = Scheme.query.filter(Scheme.deleted_at.is_(None))
        
        # Apply category filter (by ID or by name)
        if filters.get('category_id'):
            query = query.filter(Scheme.category_id == filters['category_id'])
        elif filters.get('category') and str(filters['category']).strip().lower() != 'all':
            cat_name = str(filters['category']).strip()
            query = query.join(Scheme.category).filter(
                or_(
                    func.lower(SchemeCategory.name) == cat_name.lower(),
                    func.lower(SchemeCategory.name).like(f"%{cat_name.lower()}%")
                )
            )
        
        if filters.get('govt_level') and str(filters.get('govt_level')).strip().upper() != 'ALL':
            query = query.filter(func.upper(Scheme.govt_level) == str(filters['govt_level']).strip().upper())
        
        if filters.get('state') and str(filters.get('state')).strip().upper() != 'ALL':
            query = query.filter(func.lower(Scheme.state) == str(filters['state']).strip().lower())
        
        if filters.get('ministry'):
            query = query.filter(Scheme.ministry.ilike('%' + str(filters['ministry']).strip() + '%'))
        
        if filters.get('application_mode') and str(filters.get('application_mode')).strip().upper() != 'ALL':
            query = query.filter(func.lower(Scheme.application_mode) == str(filters['application_mode']).strip().lower())
        
        # Sorting
        sort_by = filters.get('sort_by', 'name')
        sort_order = filters.get('sort_order', 'asc')
        if sort_by == 'created_at':
            sort_column = Scheme.created_at
        else:
            sort_column = Scheme.name
            
        if sort_order and str(sort_order).lower() == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
            
        paginated = query.paginate(page=page, per_page=limit, error_out=False)
        
        schemes_data = [SchemeService._scheme_to_dict(s) for s in paginated.items]
        
        return schemes_data, paginated.total, paginated.pages
    
    @staticmethod
    def get_scheme_by_id(scheme_id: int) -> Optional[Dict]:
        """Get full scheme details by ID."""
        scheme = Scheme.query.filter(
            Scheme.id == scheme_id,
            Scheme.deleted_at.is_(None)
        ).first()
        
        if not scheme:
            return None
        
        return SchemeService._scheme_to_dict_full(scheme)
    
    @staticmethod
    def save_scheme(user_id: int, scheme_id: int) -> bool:
        """Save a scheme for a user."""
        # Check if already saved
        existing = SavedScheme.query.filter_by(user_id=user_id, scheme_id=scheme_id).first()
        if existing:
            return True
        
        saved_scheme = SavedScheme(user_id=user_id, scheme_id=scheme_id)
        db.session.add(saved_scheme)
        db.session.commit()
        return True
    
    @staticmethod
    def unsave_scheme(user_id: int, scheme_id: int) -> bool:
        """Remove a scheme from user's saved schemes."""
        saved_scheme = SavedScheme.query.filter_by(user_id=user_id, scheme_id=scheme_id).first()
        if saved_scheme:
            db.session.delete(saved_scheme)
            db.session.commit()
        return True
    
    @staticmethod
    def get_saved_schemes(user_id: int, page: int = 1, limit: int = 12) -> Tuple[List[Dict], int]:
        """Get user's saved schemes."""
        saved = SavedScheme.query.filter_by(user_id=user_id).paginate(page=page, per_page=limit, error_out=False)
        
        schemes_data = [
            SchemeService._scheme_to_dict(s.scheme)
            for s in saved.items
            if getattr(s, 'scheme', None) and not getattr(s.scheme, 'deleted_at', None)
        ]
        
        return schemes_data, saved.total
    
    @staticmethod
    def is_scheme_saved(user_id: int, scheme_id: int) -> bool:
        """Check if scheme is saved by user."""
        return SavedScheme.query.filter_by(user_id=user_id, scheme_id=scheme_id).first() is not None
    
    @staticmethod
    def record_application_intent(user_id: int, scheme_id: int, intent: str = 'YES') -> Dict:
        """
        Record user's intent to apply for a scheme (e.g. from exit dialog: YES or MAYBE).
        YES sets status to 'PLANNING', MAYBE sets status to 'CONSIDERING'.
        """
        intent_normalized = intent.upper() if intent else 'YES'
        status = 'PLANNING' if intent_normalized == 'YES' else 'CONSIDERING'
        
        app = UserApplication.query.filter_by(user_id=user_id, scheme_id=scheme_id).first()
        if app:
            app.user_intent = intent_normalized
            # If not already marked as applied, update status based on intent
            if app.status != 'APPLIED':
                app.status = status
            app.deleted_at = None
            app.updated_at = datetime.utcnow()
        else:
            app = UserApplication(
                user_id=user_id,
                scheme_id=scheme_id,
                user_intent=intent_normalized,
                status=status,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(app)
            
        db.session.commit()
        return app.to_dict()

    @staticmethod
    def mark_as_applied(user_id: int, scheme_id: int, application_number: str = None, applied_date: datetime = None, notes: str = None) -> Dict:
        """
        Mark a scheme as applied on the official portal.
        """
        app = UserApplication.query.filter_by(user_id=user_id, scheme_id=scheme_id).first()
        if not app:
            app = UserApplication(
                user_id=user_id,
                scheme_id=scheme_id,
                user_intent='YES',
                status='APPLIED',
                application_number=application_number,
                applied_date=applied_date or datetime.utcnow(),
                notes=notes,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(app)
        else:
            app.status = 'APPLIED'
            if application_number:
                app.application_number = application_number
            app.applied_date = applied_date or datetime.utcnow()
            if notes:
                app.notes = notes
            app.deleted_at = None
            app.updated_at = datetime.utcnow()

        db.session.commit()
        return app.to_dict()

    @staticmethod
    def get_user_applications(user_id: int) -> List[Dict]:
        """Get all active tracked applications for a user."""
        apps = UserApplication.query.filter_by(user_id=user_id).filter(UserApplication.deleted_at.is_(None)).order_by(UserApplication.updated_at.desc()).all()
        return [a.to_dict() for a in apps]

    @staticmethod
    def remove_user_application(user_id: int, scheme_id: int) -> bool:
        """Remove a scheme from user's tracked applications."""
        app = UserApplication.query.filter_by(user_id=user_id, scheme_id=scheme_id).first()
        if app:
            db.session.delete(app)
            db.session.commit()
        return True

    @staticmethod
    def get_recommendations(user_id: int, limit: int = 10, return_total: bool = False):
        """
        Get personalized scheme recommendations based on user profile.
        
        Evaluates:
        - Date of Birth / Age eligibility
        - Gender
        - State & District
        - Rural / Urban residence
        - Occupation (Farmer, Student, Entrepreneur, etc.)
        - Annual Family Income
        - Education Level
        - Social Category (OBC, SC, ST, EWS, General)
        - Preferred Scheme Categories
        
        Fallback Behavior:
        If profile has no details or user skips, recommendations smoothly fall back
        to top popular / recently added active schemes with popularity badge.
        """
        # Get user profile
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        # Get user's applications
        apps = UserApplication.query.filter_by(user_id=user_id).filter(UserApplication.deleted_at.is_(None)).all()
        app_map = {a.scheme_id: a for a in apps}
        
        # Determine whether profile has meaningful personalization data
        has_profile_data = bool(
            profile and (
                profile.state or 
                profile.date_of_birth or 
                profile.occupation or 
                profile.education or 
                profile.income is not None or 
                profile.social_category or
                (getattr(profile, 'preferred_categories', None) and len(profile.preferred_categories) > 0)
            )
        )
        
        recommendations = []
        schemes = Scheme.query.filter(Scheme.deleted_at.is_(None)).all()
        
        if has_profile_data:
            for scheme in schemes:
                score, reasons = SchemeService._calculate_match_score(profile, scheme)
                if score >= 25:
                    user_app = app_map.get(scheme.id)
                    is_applied = (user_app.status == 'APPLIED') if user_app else False
                    recommendations.append({
                        'scheme': SchemeService._scheme_to_dict(scheme),
                        'score': score,
                        'match_score': score,
                        'reasons': reasons,
                        'is_applied': is_applied,
                        'application_status': user_app.status if user_app else None,
                        'applied_date': user_app.applied_date.isoformat() if (user_app and user_app.applied_date) else None,
                        'is_fallback': False
                    })
            total_potential = len(recommendations)
            recommendations.sort(key=lambda x: (not x['is_applied'], x['score']), reverse=True)
        else:
            total_potential = len(schemes)
        
        # Fallback to popular or recently added schemes if empty or fewer than limit
        if len(recommendations) < limit:
            existing_ids = {r['scheme']['id'] for r in recommendations}
            # Prioritize recently added active schemes
            fallback_schemes = Scheme.query.filter(Scheme.deleted_at.is_(None)).order_by(Scheme.created_at.desc()).all()
            
            for s in fallback_schemes:
                if s.id in existing_ids:
                    continue
                user_app = app_map.get(s.id)
                is_applied = (user_app.status == 'APPLIED') if user_app else False
                
                reasons = ['Popular Flagship Scheme', 'Recently Added']
                if s.govt_level == 'CENTRAL':
                    reasons.insert(0, 'Nationwide Central Scheme')
                
                recommendations.append({
                    'scheme': SchemeService._scheme_to_dict(s),
                    'score': 85 if not has_profile_data else 60,
                    'match_score': 85 if not has_profile_data else 60,
                    'reasons': reasons,
                    'is_applied': is_applied,
                    'application_status': user_app.status if user_app else None,
                    'applied_date': user_app.applied_date.isoformat() if (user_app and user_app.applied_date) else None,
                    'is_fallback': not has_profile_data
                })
                if len(recommendations) >= limit:
                    break
        
        if return_total:
            return recommendations[:limit], total_potential
        return recommendations[:limit]
    
    @staticmethod
    def _calculate_match_score(profile: UserProfile, scheme: Scheme) -> Tuple[int, List[str]]:
        """Calculate match score (0-100) and rationale reasons between user profile and scheme."""
        score = 0
        reasons = []

        cat_name = ''
        if getattr(scheme, 'category', None):
            cat_name = getattr(scheme.category, 'name', '') or ''
        
        tags_str = ' '.join(scheme.tags).lower() if scheme.tags else ''
        desc_str = (scheme.description or '').lower()
        title_str = (scheme.name or '').lower()
        combined_text = f'{tags_str} {desc_str} {title_str} {cat_name.lower()}'

        # 1. State / Central level match
        if scheme.govt_level == 'CENTRAL' or not scheme.state or scheme.state == 'All India':
            score += 20
            reasons.append('Central Scheme (Applicable nationwide)')
        elif profile.state and scheme.state:
            if profile.state.strip().lower() == scheme.state.strip().lower():
                score += 30
                reasons.append(f'Matches your State ({profile.state})')
            else:
                # Different state scheme - not eligible
                return 0, []

        # 2. Preferred Categories Match
        pref_cats = getattr(profile, 'preferred_categories', None) or []
        if pref_cats and cat_name:
            if any(p.lower() in cat_name.lower() or cat_name.lower() in p.lower() for p in pref_cats):
                score += 25
                reasons.append(f'Matches your interest in {cat_name}')

        # 3. Occupation match
        if profile.occupation:
            occ = profile.occupation.lower()
            if 'farm' in occ or 'agri' in occ:
                if any(w in combined_text for w in ['farm', 'agri', 'crop', 'kisan', 'krishi', 'soil', 'irrigation', 'dairy', 'animal', 'fertilizer']):
                    score += 25
                    reasons.append('Specially tailored for Farmers & Agriculture')
            elif 'student' in occ or 'scholar' in occ:
                if any(w in combined_text for w in ['student', 'scholarship', 'education', 'school', 'college', 'tuition', 'study', 'fellowship', 'learning']):
                    score += 25
                    reasons.append('Recommended for Students & Academic Studies')
            elif 'self' in occ or 'business' in occ or 'entrepreneur' in occ or 'msme' in occ:
                if any(w in combined_text for w in ['msme', 'business', 'entrepreneur', 'loan', 'credit', 'startup', 'mudra', 'venture', 'subsidy']):
                    score += 25
                    reasons.append('Provides Business & Entrepreneurship support')
            elif 'daily' in occ or 'wage' in occ or 'labor' in occ or 'unemploy' in occ:
                if any(w in combined_text for w in ['labor', 'worker', 'employment', 'shram', 'unemployment', 'rozgar', 'welfare', 'assistance']):
                    score += 20
                    reasons.append('Targeted welfare support for workers')

        # 4. Gender Match
        if profile.gender == 'FEMALE':
            if any(w in combined_text for w in ['women', 'woman', 'mahila', 'girl', 'kanya', 'maternity', 'mother', 'widow', 'female']):
                score += 25
                reasons.append('Exclusive empowerment & benefits for Women')
        elif profile.gender == 'MALE':
            if any(w in combined_text for w in ['women only', 'strictly for women', 'only for female', 'mahila vikas', 'girl child only']):
                return 0, []

        # 5. Residence match (Rural / Urban)
        res_type = (getattr(profile, 'residence_type', '') or '').upper()
        if res_type == 'RURAL':
            if any(w in combined_text for w in ['rural', 'gramin', 'gram', 'panchayat', 'village']):
                score += 15
                reasons.append('Focuses on Rural Community Development')
        elif res_type == 'URBAN':
            if any(w in combined_text for w in ['urban', 'city', 'municipality', 'corporation', 'metro', 'nagar']):
                score += 15
                reasons.append('Focuses on Urban Area Residents')

        # 6. Social Category Match
        if profile.social_category and profile.social_category in ['SC', 'ST', 'OBC', 'EWS', 'MINORITY']:
            cat_tag = profile.social_category.lower()
            if cat_tag in combined_text or 'reservation' in combined_text or 'backward' in combined_text or 'minority' in combined_text:
                score += 15
                reasons.append(f'Special allocation for {profile.social_category} category')

        # 7. Income check
        if profile.income is not None:
            try:
                inc = float(profile.income)
                if inc <= 300000:
                    if any(w in combined_text for w in ['bpl', 'poverty', 'subsidy', 'free', 'financial assistance', 'pension', 'grant']):
                        score += 15
                        reasons.append('Income eligible for financial assistance')
            except Exception:
                pass

        # 8. Age check
        if profile.date_of_birth:
            try:
                today = datetime.utcnow().date()
                age = today.year - profile.date_of_birth.year - ((today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day))
                if age >= 60 and any(w in combined_text for w in ['senior', 'vridha', 'elderly', 'pension', 'old age']):
                    score += 20
                    reasons.append('Special Senior Citizen benefits')
                elif age <= 25 and any(w in combined_text for w in ['youth', 'yuva', 'internship', 'student']):
                    score += 15
                    reasons.append('Youth development initiative')
            except Exception:
                pass

        # 9. Education Match
        edu = getattr(profile, 'education', None) or getattr(profile, 'education_level', None)
        if edu:
            score += 10

        final_score = min(score, 98)
        if final_score < 20:
            final_score = 45
            if not reasons:
                reasons.append('General public welfare eligibility')

        return final_score, reasons[:3]
    
    @staticmethod
    def _scheme_to_dict(scheme: Scheme) -> Dict:
        """Convert scheme to dictionary (list view)."""
        if not scheme:
            return {}
        cat_dict = None
        cat_name = ''
        if getattr(scheme, 'category', None):
            try:
                cat_dict = scheme.category.to_dict()
                cat_name = scheme.category.name
            except Exception:
                cat_name = getattr(scheme.category, 'name', '')
                cat_dict = {'id': scheme.category.id, 'name': cat_name}

        return {
            'id': scheme.id,
            'name': scheme.name,
            'slug': getattr(scheme, 'slug', ''),
            'category_id': scheme.category_id,
            'category': cat_dict,
            'category_name': cat_name,
            'govt_level': scheme.govt_level,
            'state': scheme.state,
            'ministry': getattr(scheme, 'ministry', '') or getattr(scheme, 'ministry_department', ''),
            'description': scheme.description[:150] + '...' if scheme.description and len(scheme.description) > 150 else scheme.description,
            'application_mode': scheme.application_mode,
            'tags': scheme.tags if scheme.tags else [],
            'created_at': scheme.created_at.isoformat() if scheme.created_at else None
        }
    
    @staticmethod
    def _scheme_to_dict_full(scheme: Scheme) -> Dict:
        """Convert scheme to dictionary (detail view)."""
        ministry_val = getattr(scheme, 'ministry', None) or getattr(scheme, 'ministry_department', '')
        eligibility_val = getattr(scheme, 'eligibility', None) or getattr(scheme, 'eligibility_criteria', None)
        documents_val = getattr(scheme, 'documents', None) or getattr(scheme, 'documents_required', [])

        return {
            'id': scheme.id,
            'name': scheme.name,
            'slug': getattr(scheme, 'slug', ''),
            'description': scheme.description,
            'category_id': scheme.category_id,
            'category': scheme.category.to_dict() if getattr(scheme, 'category', None) else None,
            'govt_level': scheme.govt_level,
            'state': scheme.state,
            'ministry': ministry_val,
            'ministry_department': ministry_val,
            'benefits': getattr(scheme, 'benefits', None),
            'eligibility': eligibility_val,
            'eligibility_criteria': eligibility_val,
            'documents': documents_val,
            'documents_required': documents_val,
            'application_process': getattr(scheme, 'application_process', ''),
            'application_mode': getattr(scheme, 'application_mode', 'Online'),
            'official_url': getattr(scheme, 'official_url', ''),
            'myscheme_url': getattr(scheme, 'myscheme_url', ''),
            'created_at': scheme.created_at.isoformat() if scheme.created_at else None,
            'updated_at': scheme.updated_at.isoformat() if scheme.updated_at else None
        }
