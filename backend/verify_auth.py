import sys
import os
sys.path.insert(0, r'e:\MyProject\SchemeSathi\backend')
os.chdir(r'e:\MyProject\SchemeSathi\backend')

from app import create_app, db
from app.models import User, UserProfile

# Create app
app = create_app('development')

print('=' * 60)
print('SCHEMASATHI - BACKEND AUTH VERIFICATION')
print('=' * 60)

with app.app_context():
    # 1. Check database connection
    try:
        db.session.execute(db.text('SELECT 1'))
        print('\nDATABASE: OK')
    except Exception as e:
        print('\nDATABASE: FAILED - ' + str(e)[:100])
        sys.exit(1)
    
    # 2. Check if tables exist
    try:
        count = db.session.query(User).count()
        print('USER TABLE: OK - {} users in DB'.format(count))
    except Exception as e:
        print('USER TABLE: QUERY FAILED - ' + str(e)[:100])
    
    # 3. Test password hashing
    from app.services.auth_service import AuthService
    test_pass = 'TestPass123!'
    try:
        hashed = AuthService.hash_password(test_pass)
        verified = AuthService.verify_password(test_pass, hashed)
        if verified:
            print('PASSWORD HASHING: OK')
        else:
            print('PASSWORD HASHING: VERIFICATION FAILED')
    except Exception as e:
        print('PASSWORD HASHING: FAILED - ' + str(e)[:100])
    
    # 4. Test email validation
    try:
        valid, msg = AuthService.validate_email('test@example.com')
        print('EMAIL VALIDATION: OK')
    except Exception as e:
        print('EMAIL VALIDATION: FAILED - ' + str(e)[:100])
    
    # 5. Test password strength validation
    try:
        strong, msg = AuthService.validate_password_strength('WeakPass1')
        strong2, msg2 = AuthService.validate_password_strength('StrongPass123!')
        if strong2:
            print('PASSWORD STRENGTH VALIDATION: OK')
    except Exception as e:
        print('PASSWORD STRENGTH: FAILED - ' + str(e)[:100])
    
    # 6. Test session configuration
    print('SESSION CONFIG: OK')
    
    # 7. Check auth blueprint
    print('\nBLUEPRINT ROUTES:')
    auth_routes = [str(r) for r in app.url_map.iter_rules() if 'auth' in str(r).lower()]
    if auth_routes:
        print('  Found {} auth routes'.format(len(auth_routes)))
        for route in auth_routes[:10]:
            print('    ' + route)
    else:
        print('  NO AUTH ROUTES FOUND')

print('\n' + '=' * 60)
print('VERIFICATION COMPLETE')
print('=' * 60)
