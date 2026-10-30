import sys
sys.path.insert(0, r'e:\MyProject\SchemeSathi\backend')

from app import create_app

try:
    app = create_app('development')
    
    print('Checking for admin routes:')
    admin_routes = [rule for rule in app.url_map.iter_rules() if 'admin' in str(rule.rule).lower()]
    
    if admin_routes:
        print('Found {} admin routes:'.format(len(admin_routes)))
        for route in admin_routes[:10]:
            print('  {} {}'.format(route.rule, list(route.methods)))
    else:
        print('NO ADMIN ROUTES FOUND')
        print('\\nAll routes:')
        for rule in app.url_map.iter_rules():
            if 'api' in str(rule.rule):
                print('  ' + str(rule.rule))

except Exception as e:
    print('Error: {}'.format(str(e)))
    import traceback
    traceback.print_exc()
