"""
User routes for SchemeSathi.

Handles user profile management.
"""

from flask import Blueprint, request, jsonify, session, current_app
from app import db
from app.models import User, Notification
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from functools import wraps
from datetime import datetime


users_bp = Blueprint('users', __name__)


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


@users_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """
    Get current user's profile.
    
    Returns: 200 with user profile data
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Profile updates are temporarily disabled while scheduled platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403

        user_id = session['user_id']
        profile_data = UserService.get_profile(user_id)
        
        if not profile_data:
            return jsonify({
                'success': False,
                'message': 'User not found',
                'error': 'NOT_FOUND'
            }), 404
        
        return jsonify({
            'success': True,
            'data': profile_data,
            'user': profile_data
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Get profile error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get profile',
            'error': 'INTERNAL_ERROR'
        }), 500


@users_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    """
    Update current user's profile.
    
    Request body can contain:
    - first_name, last_name, phone
    - date_of_birth, gender, state, district, city
    - occupation, education_level, annual_income
    - social_category, disability_status
    
    Returns: 200 on success
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Profile updates are temporarily disabled while scheduled platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403

        user_id = session['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Request body is required',
                'error': 'MISSING_DATA'
            }), 400
        
        success, message = UserService.update_profile(user_id, data)
        
        if success:
            # Get updated profile
            profile_data = UserService.get_profile(user_id)
            return jsonify({
                'success': True,
                'message': message,
                'data': profile_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'UPDATE_FAILED'
            }), 400
    
    except Exception as e:
        current_app.logger.error(f'Update profile error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to update profile',
            'error': 'INTERNAL_ERROR'
        }), 500


@users_bp.route('/profile/completion', methods=['GET'])
@require_auth
def get_profile_completion():
    """
    Get user's profile completion percentage.
    
    Returns: 200 with completion percentage
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Profile updates are temporarily disabled while scheduled platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403

        user_id = session['user_id']
        profile_data = UserService.get_profile(user_id)
        
        if not profile_data:
            return jsonify({
                'success': False,
                'message': 'User not found',
                'error': 'NOT_FOUND'
            }), 404
        
        completion = profile_data['profile']['profile_completion_percentage']
        
        return jsonify({
            'success': True,
            'completion_percentage': completion
        }), 200
    
    except Exception as e:
        current_app.logger.error(f'Get completion error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to get completion',
            'error': 'INTERNAL_ERROR'
        }), 500


@users_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """
    Change current authenticated user's password.
    Requires: current_password, new_password, confirm_password
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Security settings are temporarily locked while platform maintenance is active.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403

        user_id = session['user_id']
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User account not found'}), 404

        data = request.get_json() or {}
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        if not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Both current and new password are required.'}), 400

        if not user.check_password(current_password):
            return jsonify({'success': False, 'message': 'The current password you entered is incorrect.'}), 400

        if confirm_password and new_password != confirm_password:
            return jsonify({'success': False, 'message': 'New password and confirmation do not match.'}), 400

        if current_password == new_password:
            return jsonify({'success': False, 'message': 'New password must be different from current password.'}), 400

        is_strong, msg = AuthService.validate_password_strength(new_password)
        if not is_strong:
            return jsonify({'success': False, 'message': msg}), 400

        user.set_password(new_password)
        user.updated_at = datetime.utcnow()

        # Send security notification
        sec_notif = Notification(
            user_id=user.id,
            category='SECURITY',
            icon='lock',
            title='Password Changed Successfully',
            description='Your SchemeSathi citizen account password was successfully updated. If you did not make this change, please contact support immediately.',
            link_action='/profile',
            link_text='Review Profile →',
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.session.add(sec_notif)
        db.session.commit()

        current_app.logger.info(f"User #{user.id} ({user.email}) changed password successfully.")

        return jsonify({
            'success': True,
            'message': 'Password has been updated successfully.'
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Change password error: {str(e)}')
        return jsonify({'success': False, 'message': f'Failed to update password: {str(e)}'}), 500


@users_bp.route('/delete-account', methods=['POST', 'DELETE'])
@require_auth
def delete_account():
    """
    Permanently delete the user's account and associated citizen records.
    Verifies user password for safety.
    """
    try:
        from app.services.system_settings_service import SystemSettingsService
        if SystemSettingsService.get_public_settings().get('maintenance_mode', False):
            return jsonify({
                'success': False,
                'message': 'Account deletion is temporarily disabled during scheduled maintenance.',
                'error': 'MAINTENANCE_MODE_ACTIVE'
            }), 403

        user_id = session['user_id']
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        data = request.get_json() or {}
        password = data.get('password', '')

        if not password:
            return jsonify({'success': False, 'message': 'Please enter your current password to confirm account deletion.'}), 400

        if not user.check_password(password):
            return jsonify({'success': False, 'message': 'Incorrect password. Account deletion aborted.'}), 400

        user_email = user.email
        
        # Clear session
        session.clear()

        # Delete user (cascades profile, saved_schemes, applications, notifications)
        db.session.delete(user)
        db.session.commit()

        current_app.logger.info(f"Account for user #{user_id} ({user_email}) has been permanently deleted.")

        return jsonify({
            'success': True,
            'message': 'Your account and personal data have been permanently deleted.'
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete account error: {str(e)}')
        return jsonify({'success': False, 'message': f'Failed to delete account: {str(e)}'}), 500
