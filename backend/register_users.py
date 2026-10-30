with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'r') as f:
    content = f.read()

# Find where we registered schemes and add users after it
old = '''    # Register schemes blueprint
    try:
        from app.routes.schemes import schemes_bp
        app.register_blueprint(schemes_bp, url_prefix=\"/api/schemes\")
    except ImportError as e:
        app.logger.warning(\"Schemes blueprint not found: {}\".format(e))
    
    # Blueprints will be imported and registered here as they are created'''

new = '''    # Register schemes blueprint
    try:
        from app.routes.schemes import schemes_bp
        app.register_blueprint(schemes_bp, url_prefix=\"/api/schemes\")
    except ImportError as e:
        app.logger.warning(\"Schemes blueprint not found: {}\".format(e))
    
    # Register users blueprint
    try:
        from app.routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix=\"/api/users\")
    except ImportError as e:
        app.logger.warning(\"Users blueprint not found: {}\".format(e))
    
    # Blueprints will be imported and registered here as they are created'''

content = content.replace(old, new)

with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'w') as f:
    f.write(content)

print('Users blueprint registered')
