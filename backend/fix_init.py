# Read the entire file
with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'r') as f:
    lines = f.readlines()

# Find the line with 'Example blueprint registration:' and modify the lines after
output = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # If we find the comment about example blueprint, modify it
    if 'Blueprints will be imported and registered here' in line:
        # Add auth blueprint registration before this line
        output.append('    # Register auth blueprint\n')
        output.append('    try:\n')
        output.append('        from app.routes.auth import auth_bp\n')
        output.append('        app.register_blueprint(auth_bp, url_prefix=\"/api/auth\")\n')
        output.append('    except ImportError as e:\n')
        output.append('        app.logger.warning(\"Auth blueprint not found: {}\".format(e))\n')
        output.append('    \n')
        output.append(line)  # Then add the original comment line
        i += 1
        # Skip the commented auth blueprint lines
        while i < len(lines) and not ('schemes_bp' in lines[i]):
            i += 1
    else:
        output.append(line)
        i += 1

# Write back
with open(r'e:\MyProject\SchemeSathi\backend\app\__init__.py', 'w') as f:
    f.writelines(output)

print('Fixed __init__.py')
