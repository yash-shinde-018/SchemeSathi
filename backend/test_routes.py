import sys
sys.path.insert(0, r'e:\MyProject\SchemeSathi\backend')

from app import create_app

app = create_app('development')

print('\\n=== ALL REGISTERED ROUTES ===\\n')
for rule in app.url_map.iter_rules():
    print('{:<40} {} {}'.format(str(rule.rule), list(rule.methods), rule.endpoint))

print('\\n=== AUTH ROUTES ===\\n')
auth_routes = [rule for rule in app.url_map.iter_rules() if 'auth' in str(rule.rule)]
if auth_routes:
    print('Found {} auth routes:'.format(len(auth_routes)))
    for rule in auth_routes:
        print('  {} {}'.format(str(rule.rule), list(rule.methods)))
else:
    print('NO AUTH ROUTES FOUND!')
