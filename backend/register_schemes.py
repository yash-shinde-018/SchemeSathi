with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'r') as f:
    content = f.read()

# Find where we registered auth and add schemes after it
old = '''    # Register auth blueprint
    try:
        from app.routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix=\"/api/auth\")
    except ImportError as e:
        app.logger.warning(\"Auth blueprint not found: {}\".format(e))'''

new = '''    # Register auth blueprint
    try:
        from app.routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix=\"/api/auth\")
    except ImportError as e:
        app.logger.warning(\"Auth blueprint not found: {}\".format(e))
    
    # Register schemes blueprint
    try:
        from app.routes.schemes import schemes_bp
        app.register_blueprint(schemes_bp, url_prefix=\"/api/schemes\")
    except ImportError as e:
        app.logger.warning(\"Schemes blueprint not found: {}\".format(e))'''

content = content.replace(old, new)

with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'w') as f:
    f.write(content)

print('Schemes blueprint registered')
