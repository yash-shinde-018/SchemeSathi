with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'r') as f:
    content = f.read()

old_text = '''    # Blueprints will be imported and registered here as they are created
    # Example blueprint registration:
    # from app.routes.auth import auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')'''

new_text = '''    # Register auth blueprint
    try:
        from app.routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
    except ImportError as e:
        app.logger.warning(f\"Auth blueprint import failed: {e}\")
    
    # Blueprints will be imported and registered here as they are created
    # Example blueprint registration:'''

content = content.replace(old_text, new_text)

with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'w') as f:
    f.write(content)

print('Auth blueprint enabled')
