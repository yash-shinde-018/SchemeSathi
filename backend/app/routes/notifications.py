"""
Notifications routes for SchemeSathi.

Provides endpoints for managing citizen notifications, welcome alerts,
admin scheme broadcast alerts, and support query replies.
"""

from datetime import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, session, current_app
from app import db
from app.models import Notification, User, CitizenQuery

notifications_bp = Blueprint('notifications', __name__)


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
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


def _get_active_user_id():
    """Helper to retrieve user_id from session or X-User-Id header."""
    user_id = session.get('user_id')
    if not user_id:
        header_uid = request.headers.get('X-User-Id')
        if header_uid and header_uid.isdigit():
            user_id = int(header_uid)
    return user_id


@notifications_bp.route('', methods=['GET'], strict_slashes=False)
@notifications_bp.route('/', methods=['GET'], strict_slashes=False)
def get_notifications():
    """
    Get all notifications for the current user.
    If a user has 0 notifications (e.g. newly registered), automatically creates
    the single official Welcome notification.
    """
    try:
        user_id = _get_active_user_id()
        if not user_id:
            return jsonify({
                'success': True,
                'data': [],
                'unread_count': 0
            }), 200

        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': True,
                'data': [],
                'unread_count': 0
            }), 200

        user_created_at = user.created_at

        # A user should only receive:
        # 1. Direct notifications addressed to their user_id
        # 2. System-wide broadcast notifications (user_id IS NULL) that were published AT OR AFTER the user registered
        # Broadcasts published BEFORE the user registered must never be delivered to new users.
        if user_created_at:
            notif_filter = (
                (Notification.user_id == user_id) |
                ((Notification.user_id.is_(None)) & (Notification.created_at >= user_created_at))
            )
        else:
            notif_filter = (Notification.user_id == user_id)

        notifs = Notification.query.filter(
            notif_filter,
            Notification.is_deleted.is_(False)
        ).order_by(Notification.created_at.desc()).all()

        # Seed Welcome notification ONLY if user has NEVER received a Welcome notification before
        welcome_record = Notification.query.filter_by(
            user_id=user_id,
            category='WELCOME'
        ).first()

        if welcome_record is None:
            user_name = user.first_name if user and user.first_name else 'Citizen'

            welcome_notif = Notification(
                user_id=user_id,
                category='WELCOME',
                icon='hands-clapping',
                title=f'Welcome to SchemeSathi, {user_name}! 🎉',
                description='Welcome to SchemeSathi! Start exploring government schemes tailored for you. Complete your profile for 100% accurate recommendations.',
                link_action='/profile',
                link_text='Complete Profile →',
                is_read=False,
                is_deleted=False,
                created_at=datetime.utcnow()
            )
            db.session.add(welcome_notif)
            db.session.commit()
            notifs = [welcome_notif] + [n for n in notifs if n.id != welcome_notif.id]

        data = [n.to_dict() for n in notifs]
        unread_count = sum(1 for n in notifs if not n.is_read)

        return jsonify({
            'success': True,
            'data': data,
            'unread_count': unread_count
        }), 200

    except Exception as e:
        current_app.logger.error(f'Error fetching notifications: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to fetch notifications',
            'error': str(e)
        }), 500


@notifications_bp.route('/query', methods=['POST'], strict_slashes=False)
def submit_query_notification():
    """
    Register a citizen inquiry/doubt/grievance into CitizenQuery model,
    and create an initial tracking notification for the citizen.
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        public_settings = SystemSettingsService.get_public_settings()
        if public_settings.get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Citizen query and grievance submissions are temporarily disabled while scheduled platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403

        if not public_settings.get('allow_citizen_queries', True):
            return jsonify({
                'success': False,
                'message': 'Citizen query and grievance submissions are temporarily paused by platform administrators. Please check back shortly.',
                'error': 'QUERIES_PAUSED'
            }), 403

        user_id = _get_active_user_id()
        data = request.get_json() or {}

        ticket_id = data.get('ticket_id') or f"GRV-{int(datetime.utcnow().timestamp()) % 1000000}"
        subject = (data.get('subject') or 'Government Scheme Inquiry').strip()
        category = (data.get('category') or 'General Support').strip()
        description = (data.get('description') or '').strip()
        application_id = (data.get('application_id') or data.get('applicationId') or '').strip() or None

        # Fetch citizen details if user_id is active
        citizen_name = (data.get('name') or '').strip()
        citizen_email = (data.get('email') or '').strip()
        if user_id:
            user = User.query.get(user_id)
            if user:
                if not citizen_name:
                    first = getattr(user, 'first_name', '') or ''
                    last = getattr(user, 'last_name', '') or ''
                    citizen_name = f"{first} {last}".strip() or 'Citizen User'
                if not citizen_email:
                    citizen_email = user.email or ''

        if not citizen_name:
            citizen_name = 'Citizen User'
        if not citizen_email:
            citizen_email = 'citizen@schemesathi.in'

        # 1. Create persistent CitizenQuery record in database
        new_query = CitizenQuery(
            ticket_id=ticket_id,
            user_id=user_id,
            citizen_name=citizen_name,
            citizen_email=citizen_email,
            category=category,
            application_id=application_id,
            subject=subject,
            description=description,
            status='PENDING',
            created_at=datetime.utcnow()
        )
        db.session.add(new_query)

        # 2. Citizen Query Acknowledged Notification
        submission_notif = Notification(
            user_id=user_id,
            category='SUPPORT',
            icon='question-circle',
            title=f"Query Registered: {ticket_id}",
            description=f"Your inquiry regarding \"{subject}\" ({category}) has been logged with SchemeSathi Help Desk. An admin officer will review and reply.",
            link_action='/help',
            link_text='Track Ticket Status →',
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.session.add(submission_notif)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Citizen query registered successfully',
            'ticket_id': ticket_id,
            'data': new_query.to_dict(),
            'notifications': [submission_notif.to_dict()]
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error creating query: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to create query',
            'error': str(e)
        }), 500


@notifications_bp.route('/my-queries', methods=['GET'], strict_slashes=False)
def get_my_queries():
    """Get all queries submitted by the logged-in citizen."""
    try:
        user_id = _get_active_user_id()
        if not user_id:
            return jsonify({'success': True, 'data': []}), 200

        user = User.query.get(user_id)
        email = user.email if user else None

        # Query by user_id or matching email
        query_filter = CitizenQuery.user_id == user_id
        if email:
            query_filter = db.or_(CitizenQuery.user_id == user_id, CitizenQuery.citizen_email == email)

        queries = CitizenQuery.query.filter(query_filter).order_by(CitizenQuery.created_at.desc()).all()

        return jsonify({
            'success': True,
            'data': [q.to_dict() for q in queries],
            'count': len(queries)
        }), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching my queries: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@notifications_bp.route('/track-query/<ticket_id>', methods=['GET'], strict_slashes=False)
def track_query_by_id(ticket_id):
    """Public/Citizen endpoint to track a query by ticket ID."""
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Ticket tracking is temporarily disabled while scheduled platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403
        query = CitizenQuery.query.filter_by(ticket_id=ticket_id.strip()).first()
        if not query:
            return jsonify({'success': False, 'message': 'Ticket not found'}), 404

        return jsonify({
            'success': True,
            'data': query.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f'Error tracking query: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500


@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'], strict_slashes=False)
def mark_notification_read(notif_id):
    """Mark a single notification as read."""
    try:
        user_id = _get_active_user_id()
        notif = Notification.query.get(notif_id)

        if not notif:
            return jsonify({'success': False, 'message': 'Notification not found'}), 404

        notif.is_read = True
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Notification marked as read',
            'data': notif.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/read-all', methods=['PUT'], strict_slashes=False)
def mark_all_read():
    """Mark all notifications as read for current user."""
    try:
        user_id = _get_active_user_id()
        if user_id:
            user = User.query.get(user_id)
            user_created_at = user.created_at if user else None

            if user_created_at:
                notif_filter = (
                    (Notification.user_id == user_id) |
                    ((Notification.user_id.is_(None)) & (Notification.created_at >= user_created_at))
                )
            else:
                notif_filter = (Notification.user_id == user_id)

            Notification.query.filter(
                notif_filter,
                Notification.is_deleted.is_(False)
            ).update({'is_read': True}, synchronize_session=False)
            db.session.commit()

        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/<int:notif_id>', methods=['DELETE'], strict_slashes=False)
def delete_notification(notif_id):
    """Delete a notification (soft delete to preserve history and prevent re-creation)."""
    try:
        notif = Notification.query.get(notif_id)
        if not notif:
            return jsonify({'success': False, 'message': 'Notification not found'}), 404

        notif.is_deleted = True
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Notification deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/clear-read', methods=['DELETE'], strict_slashes=False)
def clear_read_notifications():
    """Clear all read notifications for current user."""
    try:
        user_id = _get_active_user_id()
        if user_id:
            Notification.query.filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(True)
            ).update({'is_deleted': True}, synchronize_session=False)
            db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Read notifications cleared successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
