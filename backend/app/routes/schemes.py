"""
Schemes routes for SchemeSathi.

Handles scheme listing, searching, filtering, details, and recommendations.
"""

from flask import Blueprint, request, jsonify, session, current_app
from app import db
from app.models import Scheme, SavedScheme, SchemeCategory, User
from app.services.scheme_service import SchemeService
from functools import wraps
from sqlalchemy.exc import SQLAlchemyError


schemes_bp = Blueprint('schemes', __name__)


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # Check for X-User-Id header for seamless session restoration
            user_id_hdr = request.headers.get('X-User-Id')
            if user_id_hdr:
                try:
                    u = User.query.get(int(user_id_hdr))
                    if u and u.account_status == 'ACTIVE':
                        session['user_id'] = u.id
                        session['email'] = u.email
                        session['role'] = u.role
                        return f(*args, **kwargs)
                except Exception:
                    pass
            return jsonify({
                'success': False,
                'message': 'Authentication required',
                'error': 'UNAUTHORIZED'
            }), 401
        return f(*args, **kwargs)
    return decorated_function


@schemes_bp.route('', methods=['GET'])
def list_schemes():
    """
    List all schemes with pagination and sorting. Supports optional query filters.
    
    Query parameters:
    - page: Page number (default 1)
    - limit: Items per page (default 12, max 100)
    - sort_by: Sort field (name, created_at) default name
    - sort_order: asc or desc (default asc)
    - category: Category name (e.g., 'Healthcare', 'Education & Scholarships')
    - category_id: Category ID
    - govt_level: CENTRAL or STATE
    - application_mode: Online, Offline, Both
    - state: State name
    
    Returns: 200 with paginated schemes list
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 12, type=int), 1000)
        sort_by = request.args.get('sort_by', 'name', type=str)
        sort_order = request.args.get('sort_order', 'asc', type=str)
        category = request.args.get('category', type=str)
        category_id = request.args.get('category_id', type=int)
        govt_level = request.args.get('govt_level', type=str)
        application_mode = request.args.get('application_mode', type=str)
        state = request.args.get('state', type=str)
        
        if page < 1:
            page = 1
        if limit < 1:
            limit = 12
        
        # If any filters are specified, delegate directly to filter_schemes
        if (category and category.lower() != 'all') or category_id or (govt_level and govt_level.upper() != 'ALL') or (application_mode and application_mode.upper() != 'ALL') or state:
            filters = {
                'category': category,
                'category_id': category_id,
                'govt_level': govt_level,
                'application_mode': application_mode,
                'state': state,
                'sort_by': sort_by,
                'sort_order': sort_order
            }
            filters = {k: v for k, v in filters.items() if v is not None}
            schemes_data, total, pages = SchemeService.filter_schemes(filters, page, limit)
        else:
            schemes_data, total, pages = SchemeService.get_all_schemes(page, limit, sort_by, sort_order)
        
        return jsonify({
            'success': True,
            'data': schemes_data,
            'schemes': schemes_data,
            'total': total,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'List schemes error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to list schemes',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/search', methods=['GET'])
def search_schemes():
    """
    Search schemes by name and description with optional category filter.
    
    Query parameters:
    - q: Search query (required, minimum 2 characters)
    - page: Page number (default 1)
    - limit: Items per page (default 12, max 100)
    - category: Optional category name
    - category_id: Optional category ID
    
    Returns: 200 with matching schemes
    """
    try:
        query_text = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 12, type=int), 100)
        category = request.args.get('category', type=str)
        category_id = request.args.get('category_id', type=int)
        
        if not query_text or len(query_text) < 2:
            return jsonify({
                'success': False,
                'message': 'Search query must be at least 2 characters',
                'error': 'INVALID_INPUT'
            }), 400
        
        if page < 1:
            page = 1
        
        schemes_data, total, pages = SchemeService.search_schemes(query_text, page, limit, category=category, category_id=category_id)
        
        return jsonify({
            'success': True,
            'data': schemes_data,
            'schemes': schemes_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Search schemes error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Search failed',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/filter', methods=['GET'])
def filter_schemes():
    """
    Filter schemes by multiple criteria.
    
    Query parameters:
    - category: Filter by category name (e.g. 'Healthcare', 'Education & Scholarships')
    - category_id: Filter by category ID
    - govt_level: Filter by government level (CENTRAL, STATE)
    - state: Filter by state
    - ministry: Filter by ministry/department
    - application_mode: Filter by application mode (Online, Offline, Both)
    - sort_by: Sort field (name, created_at)
    - sort_order: asc or desc
    - page: Page number (default 1)
    - limit: Items per page (default 12, max 100)
    
    Returns: 200 with filtered schemes
    """
    try:
        filters = {
            'category': request.args.get('category', type=str),
            'category_id': request.args.get('category_id', type=int),
            'govt_level': request.args.get('govt_level', type=str),
            'state': request.args.get('state', type=str),
            'ministry': request.args.get('ministry', type=str),
            'application_mode': request.args.get('application_mode', type=str),
            'sort_by': request.args.get('sort_by', 'name', type=str),
            'sort_order': request.args.get('sort_order', 'asc', type=str)
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 12, type=int), 100)
        
        if page < 1:
            page = 1
        
        schemes_data, total, pages = SchemeService.filter_schemes(filters, page, limit)
        
        return jsonify({
            'success': True,
            'data': schemes_data,
            'schemes': schemes_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Filter schemes error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Filter failed',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/categories', methods=['GET'])
def get_public_categories():
    """
    Get all scheme categories with live scheme counts from database.
    
    Returns: 200 with categories list
    """
    try:
        categories = SchemeCategory.query.filter(SchemeCategory.deleted_at.is_(None)).order_by(SchemeCategory.id).all()
        total_schemes = Scheme.query.filter(Scheme.deleted_at.is_(None)).count()
        
        cat_list = [{
            'id': 'all',
            'name': 'All',
            'count': total_schemes
        }]
        for c in categories:
            cnt = Scheme.query.filter(Scheme.category_id == c.id, Scheme.deleted_at.is_(None)).count()
            cat_list.append({
                'id': c.id,
                'name': c.name,
                'count': cnt,
                'description': c.description,
                'icon': c.icon,
                'color': c.color
            })
            
        return jsonify({
            'success': True,
            'data': cat_list,
            'categories': cat_list
        }), 200
    except Exception as e:
        current_app.logger.error(f'Get categories error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to fetch categories',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/<int:scheme_id>', methods=['GET'])
def get_scheme_details(scheme_id):
    """
    Get full details of a single scheme.
    
    Path parameters:
    - scheme_id: ID of the scheme
    
    Returns: 200 with full scheme details or 404 if not found
    """
    try:
        scheme_data = SchemeService.get_scheme_by_id(scheme_id)
        
        if not scheme_data:
            return jsonify({
                'success': False,
                'message': 'Scheme not found',
                'error': 'NOT_FOUND'
            }), 404
        
        # Check if user has saved this scheme (if authenticated)
        is_saved = False
        user_id = session.get('user_id')
        if not user_id:
            x_uid = request.headers.get('X-User-Id')
            if x_uid:
                try:
                    user_id = int(x_uid)
                except (ValueError, TypeError):
                    pass
        if user_id:
            is_saved = SchemeService.is_scheme_saved(user_id, scheme_id)
        
        scheme_data['is_saved'] = is_saved
        
        return jsonify({
            'success': True,
            'data': scheme_data,
            'scheme': scheme_data
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Get scheme details error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get scheme details',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/<int:scheme_id>/save', methods=['POST'])
@require_auth
def save_scheme(scheme_id):
    from app.services.system_settings_service import SystemSettingsService
    if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
        return jsonify({
            'success': False,
            'message': 'Scheme bookmarking is temporarily disabled while scheduled platform maintenance is active.',
            'error': 'MAINTENANCE_MODE_ACTIVE'
        }), 403
    """
    Save a scheme for the authenticated user.
    
    Path parameters:
    - scheme_id: ID of the scheme to save
    
    Returns: 200 on success or 404 if scheme not found
    """
    try:
        # Check if scheme exists
        scheme = Scheme.query.get(scheme_id)
        if not scheme:
            return jsonify({
                'success': False,
                'message': 'Scheme not found',
                'error': 'NOT_FOUND'
            }), 404
        
        user_id = session['user_id']
        SchemeService.save_scheme(user_id, scheme_id)
        
        return jsonify({
            'success': True,
            'message': 'Scheme saved successfully'
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Save scheme error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to save scheme',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/<int:scheme_id>/unsave', methods=['POST'])
@require_auth
def unsave_scheme(scheme_id):
    from app.services.system_settings_service import SystemSettingsService
    if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
        return jsonify({
            'success': False,
            'message': 'Scheme bookmarking is temporarily disabled while scheduled platform maintenance is active.',
            'error': 'MAINTENANCE_MODE_ACTIVE'
        }), 403
    """
    Remove a scheme from user's saved schemes.
    
    Path parameters:
    - scheme_id: ID of the scheme to unsave
    
    Returns: 200 on success
    """
    try:
        user_id = session['user_id']
        SchemeService.unsave_scheme(user_id, scheme_id)
        
        return jsonify({
            'success': True,
            'message': 'Scheme removed from saved'
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Unsave scheme error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to remove scheme',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/saved', methods=['GET'])
@require_auth
def get_saved_schemes():
    """
    Get user's saved schemes.
    
    Query parameters:
    - page: Page number (default 1)
    - limit: Items per page (default 12, max 100)
    
    Returns: 200 with saved schemes
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 12, type=int), 100)
        
        if page < 1:
            page = 1
        
        user_id = session['user_id']
        schemes_data, total = SchemeService.get_saved_schemes(user_id, page, limit)
        
        return jsonify({
            'success': True,
            'data': schemes_data,
            'schemes': schemes_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Get saved schemes error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get saved schemes',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/recommendations', methods=['GET'])
@require_auth
def get_recommendations():
    """
    Get personalized scheme recommendations based on user profile.
    
    Query parameters:
    - limit: Maximum recommendations (default 10, max 50)
    
    Returns: 200 with recommended schemes and match scores
    """
    try:
        limit = min(request.args.get('limit', 10, type=int), 50)
        if limit < 1:
            limit = 10
        
        user_id = session['user_id']
        recommendations, total_potential = SchemeService.get_recommendations(user_id, limit, return_total=True)
        
        return jsonify({
            'success': True,
            'data': recommendations,
            'count': len(recommendations),
            'total_potential': total_potential
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Get recommendations error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get recommendations',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/<int:scheme_id>/apply-intent', methods=['POST'])
@require_auth
def record_apply_intent(scheme_id):
    """
    Record user's intent to apply for a scheme (e.g. from exit dialog: YES or MAYBE).
    """
    try:
        data = request.get_json() or {}
        intent = data.get('intent', 'YES')
        user_id = session['user_id']
        
        app_record = SchemeService.record_application_intent(user_id, scheme_id, intent)
        return jsonify({
            'success': True,
            'message': 'Application intent recorded successfully',
            'data': app_record
        }), 200
    except Exception as e:
        current_app.logger.error(f'Record apply intent error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to record application intent',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/<int:scheme_id>/mark-applied', methods=['POST'])
@require_auth
def mark_scheme_applied(scheme_id):
    """
    Mark a scheme as applied on the official portal.
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Application tracking is temporarily disabled while scheduled platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403
        data = request.get_json() or {}
        app_number = data.get('application_number')
        applied_date_str = data.get('applied_date')
        notes = data.get('notes')
        
        applied_date = None
        if applied_date_str:
            try:
                applied_date = datetime.fromisoformat(applied_date_str.replace('Z', '+00:00'))
            except Exception:
                applied_date = datetime.utcnow()
                
        user_id = session['user_id']
        app_record = SchemeService.mark_as_applied(
            user_id=user_id,
            scheme_id=scheme_id,
            application_number=app_number,
            applied_date=applied_date,
            notes=notes
        )
        return jsonify({
            'success': True,
            'message': 'Scheme marked as applied',
            'data': app_record
        }), 200
    except Exception as e:
        current_app.logger.error(f'Mark applied error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to mark scheme as applied',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/applications', methods=['GET'])
@require_auth
def get_user_applications():
    """
    Get all tracked scheme applications for the current user.
    """
    try:
        user_id = session['user_id']
        apps = SchemeService.get_user_applications(user_id)
        return jsonify({
            'success': True,
            'data': apps,
            'count': len(apps)
        }), 200
    except Exception as e:
        current_app.logger.error(f'Get user applications error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get user applications',
            'error': 'INTERNAL_ERROR'
        }), 500


@schemes_bp.route('/<int:scheme_id>/application', methods=['DELETE'])
@require_auth
def delete_user_application(scheme_id):
    """
    Remove a scheme from user's tracked applications.
    """
    try:
        user_id = session['user_id']
        SchemeService.remove_user_application(user_id, scheme_id)
        return jsonify({
            'success': True,
            'message': 'Application removed successfully'
        }), 200
    except Exception as e:
        current_app.logger.error(f'Delete application error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to delete application',
            'error': 'INTERNAL_ERROR'
        }), 500


# Persistent translation cache for multilingual scheme support
import os
import json
import urllib.request
import urllib.parse

TRANSLATIONS_CACHE_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'translations_cache.json')
_memory_cache = {}

def _load_trans_cache():
    global _memory_cache
    if not _memory_cache and os.path.exists(TRANSLATIONS_CACHE_FILE):
        try:
            with open(TRANSLATIONS_CACHE_FILE, 'r', encoding='utf-8') as f:
                _memory_cache = json.load(f)
        except Exception:
            _memory_cache = {}
    return _memory_cache

def _save_trans_cache():
    try:
        with open(TRANSLATIONS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(_memory_cache, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def _fetch_external_translation(text, target_lang):
    if not text or not text.strip():
        return text
    clean_text = text.strip()
    try:
        # Avoid translation if text is already non-Latin (already in vernacular script)
        if any('\u0900' <= char <= '\u0dff' for char in clean_text[:30]):
            return clean_text

        # 1. Primary: High-speed Google Translate single API (no auth, 100-300ms latency)
        try:
            encoded = urllib.parse.quote(clean_text[:1500])
            gtx_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={encoded}"
            req = urllib.request.Request(gtx_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=3) as res:
                data = json.loads(res.read().decode('utf-8'))
                if data and data[0]:
                    parts = [p[0] for p in data[0] if p and p[0]]
                    translated = ''.join(parts).strip()
                    if translated:
                        return translated
        except Exception:
            pass

        # 2. Fallback: MyMemory API
        encoded = urllib.parse.quote(clean_text[:500])
        url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair=en|{target_lang}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=3) as res:
            data = json.loads(res.read().decode('utf-8'))
            if data and data.get('responseData') and data['responseData'].get('translatedText'):
                translated = data['responseData']['translatedText'].strip()
                if not translated.startswith('MYMEMORY WARNING') and not translated.startswith('PLEASE SELECT TWO DISTINCT LANGUAGES'):
                    return translated
    except Exception as e:
        current_app.logger.warning(f"Translation failed for '{clean_text[:30]}': {e}")
    return clean_text

@schemes_bp.route('/translate', methods=['POST'])
def batch_translate_texts():
    """
    Translates an array of text strings into target language.
    Body:
    {
        "texts": ["Text 1", "Text 2", ...],
        "target_lang": "mr" # or hi, ta, te, bn
    }
    """
    try:
        body = request.get_json() or {}
        texts = body.get('texts', [])
        target_lang = body.get('target_lang', 'en').lower()

        if target_lang == 'en' or not texts:
            return jsonify({
                'success': True,
                'translations': {t: t for t in texts}
            }), 200

        cache = _load_trans_cache()
        if target_lang not in cache:
            cache[target_lang] = {}

        lang_cache = cache[target_lang]
        results = {}
        missing_texts = []

        for t in texts:
            if not t or not isinstance(t, str):
                continue
            t_clean = t.strip()
            if not t_clean:
                results[t] = t
                continue
            
            if t_clean in lang_cache:
                results[t] = lang_cache[t_clean]
            else:
                missing_texts.append(t)

        if missing_texts:
            cache_updated = False
            from concurrent.futures import ThreadPoolExecutor, as_completed
            
            def fetch_single(item):
                clean = item.strip()
                trans = _fetch_external_translation(clean, target_lang)
                return item, clean, trans

            with ThreadPoolExecutor(max_workers=8) as executor:
                future_to_text = {executor.submit(fetch_single, txt): txt for txt in missing_texts}
                for future in as_completed(future_to_text):
                    try:
                        orig_item, clean_item, translated = future.result()
                        lang_cache[clean_item] = translated
                        results[orig_item] = translated
                        cache_updated = True
                    except Exception as fe:
                        txt = future_to_text[future]
                        results[txt] = txt

            if cache_updated:
                _save_trans_cache()

        return jsonify({
            'success': True,
            'translations': results
        }), 200
    except Exception as e:
        current_app.logger.error(f"Batch translate error: {str(e)}")
        return jsonify({
            'success': False,
            'translations': {}
        }), 200

