"""
Admin routes for SchemeSathi.

Handles admin operations: scheme management, user management, verification, settings.
"""

from flask import Blueprint, request, jsonify, session, current_app, Response
from app import db
from app.models import Notification, User, CitizenQuery, Scheme, SchemeCategory, UserApplication, AdminLog
from app.services.admin_service import AdminService
from datetime import datetime
from functools import wraps


admin_bp = Blueprint('admin', __name__)


def require_admin(f):
    """Decorator to require admin access."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            user_id_hdr = request.headers.get('X-User-Id')
            if user_id_hdr:
                try:
                    u = User.query.get(int(user_id_hdr))
                    if u and u.account_status == 'ACTIVE':
                        session['user_id'] = u.id
                        session['email'] = u.email
                        session['role'] = u.role
                        user_id = u.id
                except Exception:
                    pass

        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Authentication required',
                'error': 'UNAUTHORIZED'
            }), 401
        
        if not AdminService.check_admin_access(int(user_id)):
            return jsonify({
                'success': False,
                'message': 'Admin access required',
                'error': 'FORBIDDEN'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function


# ========== DASHBOARD ==========

@admin_bp.route('/dashboard', methods=['GET'])
@require_admin
def dashboard():
    """Get admin dashboard statistics."""
    try:
        stats = AdminService.get_dashboard_stats()
        
        return jsonify({
            'success': True,
            'data': stats,
            'dashboard': stats
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Dashboard error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get dashboard data',
            'error': 'INTERNAL_ERROR'
        }), 500


# ========== SCHEME MANAGEMENT ==========

@admin_bp.route('/schemes', methods=['GET'])
@require_admin
def list_schemes():
    """Get all schemes (admin view with soft-deleted schemes)."""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 20, type=int), 1000)
        
        if page < 1:
            page = 1
        
        schemes_data, total, pages = AdminService.get_all_schemes_admin(page, limit)
        
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


@admin_bp.route('/schemes', methods=['POST'])
@require_admin
def create_scheme():
    """Create a new scheme."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Request body is required',
                'error': 'MISSING_DATA'
            }), 400
        
        admin_id = session['user_id']
        success, message, scheme_id = AdminService.create_scheme(data, admin_id)
        
        if success:
            try:
                from app.services.system_settings_service import SystemSettingsService
                sys_settings = SystemSettingsService.get_settings()
                if sys_settings.get('auto_broadcast_new_schemes', True):
                    scheme_name = data.get('name', 'New Government Scheme')
                    new_scheme_notif = Notification(
                        user_id=None,  # Broadcast to all citizens
                        category='SCHEME',
                        icon='sparkles',
                        title=f'New Scheme Added: {scheme_name}',
                        description=f'A new government scheme "{scheme_name}" has been published by the administration. Check your eligibility and apply.',
                        link_action=f'/scheme/{scheme_id}',
                        link_text='View Scheme Details →',
                        is_read=False,
                        created_at=datetime.utcnow()
                    )
                    db.session.add(new_scheme_notif)
                    db.session.commit()
            except Exception as notif_err:
                current_app.logger.warning(f"Could not broadcast scheme notification: {notif_err}")

            return jsonify({
                'success': True,
                'message': message,
                'scheme_id': scheme_id
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'CREATE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Create scheme error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to create scheme',
            'error': 'INTERNAL_ERROR'
        }), 500



@admin_bp.route('/schemes/import-template', methods=['GET'])
@require_admin
def download_scheme_import_template():
    """Download official Scheme Import Template (.xlsx or .csv) with sample data and instructions."""
    try:
        file_format = request.args.get('format', 'xlsx').lower()
        if file_format not in ['xlsx', 'csv']:
            file_format = 'xlsx'
        
        file_bytes, mimetype, filename = AdminService.generate_scheme_import_template(file_format=file_format)
        return Response(
            file_bytes,
            mimetype=mimetype,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": mimetype,
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except Exception as e:
        current_app.logger.error(f'Download template error: {str(e)}')
        return jsonify({'success': False, 'message': f'Failed to generate import template: {str(e)}'}), 500


@admin_bp.route('/schemes/import', methods=['POST'])
@require_admin
def import_schemes():
    """Bulk import schemes from uploaded Excel (.xlsx, .xls) or CSV file."""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file was uploaded in request',
                'error': 'NO_FILE'
            }), 400
        
        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({
                'success': False,
                'message': 'Selected file is empty',
                'error': 'EMPTY_FILENAME'
            }), 400
        
        filename = file.filename.lower()
        if not (filename.endswith('.xlsx') or filename.endswith('.xls') or filename.endswith('.csv')):
            return jsonify({
                'success': False,
                'message': 'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.',
                'error': 'INVALID_FILE_TYPE'
            }), 400

        admin_id = session.get('user_id') or int(request.headers.get('X-User-Id', 1))
        success, message, result_data = AdminService.import_schemes_from_file(file, admin_id)

        if success:
            imported_count = result_data.get('imported_count', 0)
            if imported_count > 0:
                try:
                    notif = Notification(
                        user_id=None,
                        category='SCHEME',
                        icon='sparkles',
                        title=f'{imported_count} New Government Scheme(s) Added',
                        description=f'The administration has imported and cataloged {imported_count} new welfare scheme(s) across India.',
                        link_action='/schemes',
                        link_text='Browse Welfare Catalog →',
                        is_read=False,
                        created_at=datetime.utcnow()
                    )
                    db.session.add(notif)
                    db.session.commit()
                except Exception as notif_err:
                    current_app.logger.warning(f"Notification error on batch import: {notif_err}")

            return jsonify({
                'success': True,
                'message': message,
                'data': result_data
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': message,
                'data': result_data
            }), 400

    except Exception as e:
        current_app.logger.error(f'Import schemes error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Failed to process scheme file: {str(e)}',
            'error': 'INTERNAL_ERROR'
        }), 500


@admin_bp.route('/schemes/<int:scheme_id>', methods=['PUT'])
@require_admin
def update_scheme(scheme_id):
    """Update an existing scheme."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Request body is required',
                'error': 'MISSING_DATA'
            }), 400
        
        admin_id = session.get('user_id') or int(request.headers.get('X-User-Id', 1))
        success, message = AdminService.update_scheme(scheme_id, data, admin_id)
        
        if success:
            updated_scheme = Scheme.query.get(scheme_id)
            return jsonify({
                'success': True,
                'message': message,
                'scheme': updated_scheme.to_dict() if updated_scheme else None,
                'data': updated_scheme.to_dict() if updated_scheme else None
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'UPDATE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Update scheme error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to update scheme',
            'error': 'INTERNAL_ERROR'
        }), 500


@admin_bp.route('/schemes/<int:scheme_id>', methods=['DELETE'])
@require_admin
def delete_scheme(scheme_id):
    """Delete (soft delete) a scheme."""
    try:
        admin_id = session['user_id']
        success, message = AdminService.delete_scheme(scheme_id, admin_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'DELETE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Delete scheme error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to delete scheme',
            'error': 'INTERNAL_ERROR'
        }), 500


# ========== USER MANAGEMENT & ANALYTICS ==========

@admin_bp.route('/users/analytics', methods=['GET'])
@admin_bp.route('/analytics/users', methods=['GET'])
@require_admin
def user_analytics():
    """Get comprehensive citizen and user analytics for administration."""
    try:
        analytics = AdminService.get_user_analytics()
        return jsonify({
            'success': True,
            'data': analytics,
            'analytics': analytics
        }), 200
    except Exception as e:
        current_app.logger.error(f'User analytics error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to generate user analytics',
            'error': str(e)
        }), 500


@admin_bp.route('/profile', methods=['GET'])
@require_admin
def get_admin_profile():
    """Get current admin's profile data."""
    try:
        admin_id = int(session.get('user_id') or request.headers.get('X-User-Id'))
        profile_data = AdminService.get_admin_profile(admin_id)
        if not profile_data:
            return jsonify({'success': False, 'message': 'Administrator not found'}), 404
        return jsonify({'success': True, 'data': profile_data, 'user': profile_data}), 200
    except Exception as e:
        current_app.logger.error(f'Get admin profile error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/profile', methods=['PUT'])
@require_admin
def update_admin_profile():
    """Update current admin's personal profile (first_name, last_name, email, phone)."""
    try:
        admin_id = int(session.get('user_id') or request.headers.get('X-User-Id'))
        data = request.get_json() or {}
        success, message, updated_user = AdminService.update_admin_profile(admin_id, data)
        if success:
            if 'email' in data and data['email'].strip():
                session['email'] = data['email'].strip().lower()
            return jsonify({
                'success': True,
                'message': message,
                'user': updated_user,
                'data': updated_user
            }), 200
        else:
            return jsonify({'success': False, 'message': message}), 400
    except Exception as e:
        current_app.logger.error(f'Update admin profile error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/profile/password', methods=['PUT'])
@require_admin
def update_admin_password():
    """Change current admin's password."""
    try:
        admin_id = int(session.get('user_id') or request.headers.get('X-User-Id'))
        data = request.get_json() or {}
        current_pw = data.get('current_password', '')
        new_pw = data.get('new_password', '')
        confirm_pw = data.get('confirm_password', '')
        
        success, message = AdminService.update_admin_password(admin_id, current_pw, new_pw, confirm_pw)
        if success:
            return jsonify({'success': True, 'message': message}), 200
        else:
            return jsonify({'success': False, 'message': message}), 400
    except Exception as e:
        current_app.logger.error(f'Update admin password error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/users/admins', methods=['GET'])
@require_admin
def get_admin_users():
    """List all accounts with ADMIN or SUPERADMIN privileges."""
    try:
        admins = AdminService.get_admin_users()
        return jsonify({'success': True, 'data': admins, 'admins': admins, 'total': len(admins)}), 200
    except Exception as e:
        current_app.logger.error(f'Get admin users error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/users/create-admin', methods=['POST'])
@require_admin
def create_admin_user():
    """Directly provision and register a new Administrator account."""
    try:
        admin_id = int(session.get('user_id') or request.headers.get('X-User-Id'))
        data = request.get_json() or {}
        success, message, new_admin = AdminService.create_admin_user(data, admin_id)
        if success:
            return jsonify({'success': True, 'message': message, 'user': new_admin}), 201
        else:
            return jsonify({'success': False, 'message': message}), 400
    except Exception as e:
        current_app.logger.error(f'Create admin user error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/users', methods=['GET'])
@require_admin
def list_users():
    """Get all users with optional search and role filtering."""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 20, type=int), 100)
        search = request.args.get('search', request.args.get('q', None))
        role = request.args.get('role', None)
        include_analytics = request.args.get('analytics', 'false').lower() == 'true'
        
        if page < 1:
            page = 1
        
        users_data, total, pages = AdminService.get_all_users(page, limit, search=search, role=role)
        response_data = {
            'success': True,
            'data': users_data,
            'users': users_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages
            }
        }

        if include_analytics:
            response_data['analytics'] = AdminService.get_user_analytics()

        return jsonify(response_data), 200
    
    except Exception as e:
        current_app.logger.error(f'List users error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to list users',
            'error': 'INTERNAL_ERROR'
        }), 500


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@require_admin
def update_user_role(user_id):
    """Update user role."""
    try:
        data = request.get_json()
        
        if not data or 'role' not in data:
            return jsonify({
                'success': False,
                'message': 'Role is required',
                'error': 'MISSING_DATA'
            }), 400
        
        admin_id = session['user_id']
        success, message = AdminService.update_user_role(user_id, data['role'], admin_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'UPDATE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Update user role error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to update user role',
            'error': 'INTERNAL_ERROR'
        }), 500


@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@require_admin
def update_user_status(user_id):
    """Update user account status."""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'message': 'Status is required',
                'error': 'MISSING_DATA'
            }), 400
        
        admin_id = session['user_id']
        success, message = AdminService.update_user_status(user_id, data['status'], admin_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'UPDATE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Update user status error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to update user status',
            'error': 'INTERNAL_ERROR'
        }), 500


# ========== CITIZEN QUERIES & GRIEVANCE FEEDBACK MANAGEMENT ==========

@admin_bp.route('/queries', methods=['GET'])
@require_admin
def list_citizen_queries():
    """
    Get citizen queries and feedback with optional status and search filtering.
    Also returns summary counts (total, pending, resolved).
    """
    try:
        status_filter = request.args.get('status', 'all').strip()
        search_query = request.args.get('search', '').strip()

        base_query = CitizenQuery.query

        # Search filter
        if search_query:
            search_pattern = f"%{search_query}%"
            base_query = base_query.filter(
                db.or_(
                    CitizenQuery.ticket_id.ilike(search_pattern),
                    CitizenQuery.citizen_name.ilike(search_pattern),
                    CitizenQuery.citizen_email.ilike(search_pattern),
                    CitizenQuery.subject.ilike(search_pattern),
                    CitizenQuery.category.ilike(search_pattern),
                    CitizenQuery.description.ilike(search_pattern)
                )
            )

        # Status filter
        if status_filter and status_filter.upper() != 'ALL':
            base_query = base_query.filter(CitizenQuery.status == status_filter.upper())

        queries = base_query.order_by(
            # Show PENDING queries first, then by date desc
            db.case((CitizenQuery.status == 'PENDING', 0), else_=1),
            CitizenQuery.created_at.desc()
        ).all()

        # Compute summary stats across all queries
        total_count = CitizenQuery.query.count()
        pending_count = CitizenQuery.query.filter_by(status='PENDING').count()
        resolved_count = CitizenQuery.query.filter_by(status='RESOLVED').count()

        data = [q.to_dict() for q in queries]

        return jsonify({
            'success': True,
            'data': data,
            'queries': data,
            'counts': {
                'total': total_count,
                'pending': pending_count,
                'resolved': resolved_count
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f'List citizen queries error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to list citizen queries',
            'error': str(e)
        }), 500


@admin_bp.route('/queries/<int:query_id>', methods=['GET'])
@require_admin
def get_citizen_query(query_id):
    """Get single citizen query details."""
    try:
        query = CitizenQuery.query.get(query_id)
        if not query:
            return jsonify({'success': False, 'message': 'Query not found'}), 404

        return jsonify({
            'success': True,
            'data': query.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f'Get query error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/queries/<int:query_id>/reply', methods=['POST'])
@require_admin
def reply_to_citizen_query(query_id):
    """
    Submit admin resolution reply to a citizen query.
    Updates status to RESOLVED, saves admin reply, and dispatches real-time notification to the citizen.
    """
    try:
        query = CitizenQuery.query.get(query_id)
        if not query:
            return jsonify({'success': False, 'message': 'Citizen query record not found'}), 404

        data = request.get_json() or {}
        reply_text = (data.get('reply') or data.get('admin_reply') or '').strip()

        if not reply_text:
            return jsonify({
                'success': False,
                'message': 'Reply message cannot be empty'
            }), 400

        admin_id = session.get('user_id')
        now = datetime.utcnow()

        # Update query record
        query.admin_reply = reply_text
        query.status = 'RESOLVED'
        query.replied_by = admin_id
        query.replied_at = now
        query.updated_at = now

        # Target citizen user ID:
        target_user_id = query.user_id
        if not target_user_id and query.citizen_email:
            matching_user = User.query.filter_by(email=query.citizen_email).first()
            if matching_user:
                target_user_id = matching_user.id
                query.user_id = target_user_id

        # Dispatch formal notification to the citizen
        reply_notif = Notification(
            user_id=target_user_id,
            category='SUPPORT',
            icon='headset',
            title=f"Support Desk Replied: Ticket {query.ticket_id}",
            description=f"Admin Response: \"{reply_text[:140]}{'...' if len(reply_text) > 140 else ''}\"",
            link_action='/help',
            link_text='View Full Resolution →',
            is_read=False,
            created_at=now
        )
        db.session.add(reply_notif)
        db.session.commit()

        current_app.logger.info(f"Admin #{admin_id} replied to citizen query #{query.id} ({query.ticket_id})")

        return jsonify({
            'success': True,
            'message': f'Official response sent to citizen for Ticket {query.ticket_id}!',
            'data': query.to_dict(),
            'notification': reply_notif.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Reply query error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to send reply to citizen',
            'error': str(e)
        }), 500


@admin_bp.route('/queries/delete-all', methods=['DELETE', 'POST'])
@admin_bp.route('/queries/all', methods=['DELETE', 'POST'])
@require_admin
def delete_all_citizen_queries():
    """Delete all citizen queries."""
    try:
        admin_id = session.get('user_id')
        deleted_count = CitizenQuery.query.delete(synchronize_session=False)
        db.session.commit()

        current_app.logger.info(f"Admin #{admin_id} deleted all citizen queries ({deleted_count} records removed).")

        return jsonify({
            'success': True,
            'message': f'Successfully deleted all {deleted_count} citizen queries.',
            'deleted_count': deleted_count
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete all queries error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to delete all citizen queries',
            'error': str(e)
        }), 500


@admin_bp.route('/queries/<int:query_id>', methods=['DELETE', 'POST'])
@admin_bp.route('/queries/<int:query_id>/delete', methods=['DELETE', 'POST'])
@require_admin
def delete_citizen_query(query_id):
    """Delete a citizen query record."""
    try:
        query = CitizenQuery.query.get(query_id)
        if not query:
            return jsonify({'success': False, 'message': 'Citizen query record not found'}), 404

        ticket_id = query.ticket_id
        db.session.delete(query)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Grievance ticket #{ticket_id} has been removed successfully.'
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete query error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to delete grievance query',
            'error': str(e)
        }), 500


# Keep /verifications as an alias returning queries or verifications for backwards-compatibility
@admin_bp.route('/verifications', methods=['GET'])
@require_admin
def list_pending_verifications_alias():
    """Alias for backwards compatibility: returns citizen queries."""
    return list_citizen_queries()



# ========== CATEGORY MANAGEMENT ==========

@admin_bp.route('/categories', methods=['GET'])
@require_admin
def list_categories():
    """Get all scheme categories."""
    try:
        categories = AdminService.get_all_categories()
        
        return jsonify({
            'success': True,
            'data': categories,
            'count': len(categories)
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'List categories error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to list categories',
            'error': 'INTERNAL_ERROR'
        }), 500


@admin_bp.route('/categories', methods=['POST'])
@require_admin
def create_category():
    """Create a new scheme category."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Request body is required',
                'error': 'MISSING_DATA'
            }), 400
        
        admin_id = session['user_id']
        success, message, category_id = AdminService.create_category(data, admin_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'category_id': category_id
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'CREATE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Create category error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to create category',
            'error': 'INTERNAL_ERROR'
        }), 500


# ========== ADMIN LOGS ==========

@admin_bp.route('/logs', methods=['GET'])
@require_admin
def get_logs():
    """Get admin action logs."""
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 50, type=int), 200)
        
        if page < 1:
            page = 1
        
        logs, total, pages = AdminService.get_admin_logs(page, limit)
        
        return jsonify({
            'success': True,
            'data': logs,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': pages
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Get logs error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get logs',
            'error': 'INTERNAL_ERROR'
        }), 500


# ========== BROADCAST NOTIFICATIONS ==========

@admin_bp.route('/broadcast', methods=['GET'])
@require_admin
def list_broadcasts():
    """Get all broadcast notifications sent to all citizens."""
    try:
        broadcasts = Notification.query.filter(
            Notification.user_id.is_(None),
            Notification.is_deleted.is_(False)
        ).order_by(Notification.created_at.desc()).limit(50).all()

        return jsonify({
            'success': True,
            'data': [b.to_dict() for b in broadcasts],
            'count': len(broadcasts)
        }), 200
    except Exception as e:
        current_app.logger.error(f'List broadcasts error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/broadcast', methods=['POST'])
@require_admin
def send_broadcast():
    """Broadcast an official notification/announcement to all citizens."""
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        category = data.get('category', 'GENERAL').upper()
        icon = data.get('icon', 'bullhorn')
        link_action = data.get('link_action', '/explore')
        link_text = data.get('link_text', 'View Details →')

        if not title or not description:
            return jsonify({
                'success': False,
                'message': 'Title and description are required'
            }), 400

        broadcast = Notification(
            user_id=None,  # Broadcast to all citizens
            category=category,
            icon=icon,
            title=title,
            description=description,
            link_action=link_action,
            link_text=link_text,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.session.add(broadcast)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Official broadcast sent successfully to all citizens!',
            'data': broadcast.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Send broadcast error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/broadcast/clear', methods=['DELETE'])
@admin_bp.route('/broadcast', methods=['DELETE'])
@require_admin
def clear_all_broadcasts():
    """Permanently delete all broadcast notifications history."""
    try:
        deleted_count = Notification.query.filter(
            Notification.user_id.is_(None)
        ).delete(synchronize_session=False)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Permanently deleted {deleted_count} broadcast message(s) from history.',
            'cleared_count': deleted_count
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Clear broadcasts error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/broadcast/<int:broadcast_id>', methods=['DELETE'])
@require_admin
def delete_single_broadcast(broadcast_id):
    """Delete a single broadcast notification permanently from history."""
    try:
        broadcast = Notification.query.filter(
            Notification.id == broadcast_id,
            Notification.user_id.is_(None)
        ).first()

        if not broadcast:
            return jsonify({'success': False, 'message': 'Broadcast message not found'}), 404

        db.session.delete(broadcast)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Broadcast notification permanently deleted.',
            'broadcast_id': broadcast_id
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete broadcast error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


# ========== SYSTEM SETTINGS & HEALTH ==========

from app.services.system_settings_service import SystemSettingsService

@admin_bp.route('/settings', methods=['GET'])
@require_admin
def get_system_settings():
    """Get system health, environment information, and platform statistics."""
    try:
        import sys
        import platform
        import time
        
        active_admins = User.query.filter(
            User.role.in_(['ADMIN', 'SUPERADMIN']),
            User.account_status == 'ACTIVE'
        ).count()

        db_connected = True
        latency_ms = 0.0
        try:
            t0 = time.perf_counter()
            db.session.execute(db.text('SELECT 1'))
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        except Exception:
            db_connected = False

        stats = AdminService.get_dashboard_stats()
        system_settings = SystemSettingsService.get_settings()

        # Compute accurate real live database counters
        total_schemes = Scheme.query.count()
        active_schemes = Scheme.query.filter(Scheme.deleted_at.is_(None)).count()
        total_users = User.query.count()
        active_users = User.query.filter_by(account_status='ACTIVE').count()
        total_categories = SchemeCategory.query.filter(SchemeCategory.deleted_at.is_(None)).count()
        total_applications = UserApplication.query.count()
        total_queries = CitizenQuery.query.count()
        pending_queries = CitizenQuery.query.filter_by(status='PENDING').count()
        total_broadcasts = Notification.query.filter(Notification.user_id.is_(None)).count()

        live_counts = {
            'total_schemes': total_schemes,
            'active_schemes': active_schemes,
            'total_users': total_users,
            'active_users': active_users,
            'total_categories': total_categories,
            'total_applications': total_applications,
            'total_queries': total_queries,
            'pending_queries': pending_queries,
            'total_broadcasts': total_broadcasts
        }

        return jsonify({
            'success': True,
            'data': {
                'environment': current_app.config.get('ENV', 'development'),
                'debug_mode': current_app.debug,
                'database_status': 'CONNECTED' if db_connected else 'DISCONNECTED',
                'db_latency_ms': latency_ms,
                'active_admins_count': active_admins,
                'python_version': platform.python_version(),
                'platform_os': platform.system(),
                'server_time': datetime.utcnow().isoformat() + 'Z',
                'stats': stats,
                'live_counts': live_counts,
                'system_settings': system_settings
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f'Get settings error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/settings', methods=['POST', 'PUT'])
@require_admin
def update_system_settings():
    """Update configurable platform system settings."""
    try:
        payload = request.get_json() or {}
        current_settings, updated_keys = SystemSettingsService.save_settings(payload)

        # Audit log admin action
        user_id = session.get('user_id')
        try:
            AdminService._log_action(
                admin_id=int(user_id) if user_id else 1,
                action='UPDATE',
                entity_type='SYSTEM_SETTINGS',
                entity_id=0,
                details={'updated_keys': updated_keys}
            )
        except Exception:
            pass

        return jsonify({
            'success': True,
            'message': 'Platform system settings saved successfully.',
            'system_settings': current_settings
        }), 200
    except Exception as e:
        current_app.logger.error(f'Update settings error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/settings/ping', methods=['GET', 'POST'])
@require_admin
def ping_database():
    """Live database round-trip latency test."""
    try:
        import time
        t0 = time.perf_counter()
        db.session.execute(db.text('SELECT 1'))
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return jsonify({
            'success': True,
            'status': 'CONNECTED',
            'latency_ms': latency_ms,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'DISCONNECTED',
            'error': str(e)
        }), 500


# ========== REPORT EXPORTS ==========

@admin_bp.route('/reports/schemes', methods=['GET'])
@require_admin
def export_scheme_catalog_report():
    """
    Export comprehensive Scheme Catalog Report (CSV) containing ALL scheme columns:
    id, name, slug, govt_level, state, ministry, category, application_mode, status,
    description, eligibility, benefits, documents, application_process, exclusions,
    tags, official_url, myscheme_url, applications_count, created_at, last_verified_at.
    """
    try:
        csv_data = AdminService.generate_schemes_catalog_csv()
        date_str = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"SchemeSathi_Scheme_Catalog_Full_Report_{date_str}.csv"
        
        return Response(
            csv_data,
            mimetype="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except Exception as e:
        current_app.logger.error(f'Export schemes error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/reports/citizens', methods=['GET'])
@require_admin
def export_citizen_filing_report():
    """
    Export comprehensive Citizen Filing Report (CSV) containing ALL details about citizens:
    id, email, first_name, last_name, phone, role, status, registered_at, last_login,
    gender, date_of_birth, state, district, city, occupation, education, income,
    social_category, disability_status, residence_type, profile_completion,
    total_saved_schemes, total_applied_schemes, applications_and_statuses.
    """
    try:
        csv_data = AdminService.generate_citizen_filing_csv()
        date_str = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"SchemeSathi_Citizen_Filing_Full_Report_{date_str}.csv"
        
        return Response(
            csv_data,
            mimetype="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except Exception as e:
        current_app.logger.error(f'Export citizens error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/reports/audit', methods=['GET'])
@require_admin
def export_system_audit_report():
    """
    Export comprehensive System Audit Report (CSV) containing ALL audit trail details:
    log_id, timestamp, admin_id, admin_email, admin_name, admin_role, action,
    entity_type, entity_id, entity_name, ip_address, WHAT ACTUALLY CHANGED, raw_details.
    """
    try:
        csv_data = AdminService.generate_system_audit_csv()
        date_str = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"SchemeSathi_System_Audit_Log_Full_Report_{date_str}.csv"
        
        return Response(
            csv_data,
            mimetype="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except Exception as e:
        current_app.logger.error(f'Export audit error: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

