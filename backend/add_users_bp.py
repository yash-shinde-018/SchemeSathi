clean_blueprints = '''    # Register health check endpoints
    from app.routes.health import health_bp
    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Register auth blueprint
    try:
        from app.routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
    except ImportError as e:
        app.logger.warning("Auth blueprint not found: {}".format(e))
    
    # Register schemes blueprint
    try:
        from app.routes.schemes import schemes_bp
        app.register_blueprint(schemes_bp, url_prefix="/api/schemes")
    except ImportError as e:
        app.logger.warning("Schemes blueprint not found: {}".format(e))
    
    # Register admin blueprint
    try:
        from app.routes.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix="/api/admin")
    except ImportError as e:
        app.logger.warning("Admin blueprint not found: {}".format(e))

    # Register users blueprint
    try:
        from app.routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix="/api/users")
    except ImportError as e:
        app.logger.warning("Users blueprint not found: {}".format(e))

    app.logger.info("Blueprints registered")'''

with open(r'app/__init__.py', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('    # Register health check endpoints')
end = text.find('    app.logger.info("Blueprints registered")') + len('    app.logger.info("Blueprints registered")')

new_text = text[:start] + clean_blueprints + text[end:]

with open(r'app/__init__.py', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Cleaned and registered all blueprints!')
