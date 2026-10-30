with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'r') as f:
    lines = f.readlines()

# Find the line with 'Blueprints will be imported' and add admin blueprint before it
output = []
for i, line in enumerate(lines):
    if 'Blueprints will be imported and registered here' in line and i > 0:
        # Add admin blueprint registration before this comment
        output.append('    # Register admin blueprint\n')
        output.append('    try:\n')
        output.append('        from app.routes.admin import admin_bp\n')
        output.append('        app.register_blueprint(admin_bp, url_prefix=\"/api/admin\")\n')
        output.append('    except ImportError as e:\n')
        output.append('        app.logger.warning(\"Admin blueprint not found: {}\".format(e))\n')
        output.append('    \n')
    
    output.append(line)

with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'w') as f:
    f.writelines(output)

print('Added admin blueprint registration')
