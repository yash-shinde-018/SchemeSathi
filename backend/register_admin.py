with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'r') as f:
    content = f.read()

# Find where we registered users and add admin after it
old = '''    # Register users blueprint
    try:
        from app.routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix=\"/api/users\")
    except ImportError as e:
        app.logger.warning(\"Users blueprint not found: {}\".format(e))
    
    # Blueprints will be imported and registered here as they are created'''

new = '''    # Register users blueprint
    try:
        from app.routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix=\"/api/users\")
    except ImportError as e:
        app.logger.warning(\"Users blueprint not found: {}\".format(e))
    
    # Register admin blueprint
    try:
        from app.routes.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix=\"/api/admin\")
    except ImportError as e:
        app.logger.warning(\"Admin blueprint not found: {}\".format(e))
    
    # Blueprints will be imported and registered here as they are created'''

content = content.replace(old, new)

with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'w') as f:
    f.write(content)

print('Admin blueprint registered')
