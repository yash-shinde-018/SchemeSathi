with open(r'e:\MyProject\SchemeSathi\backend\app\routes\users.py', 'r') as f:
    content = f.read()

# Fix the escaped quotes issue
content = content.replace('\\\"', '\"')

with open(r'e:\MyProject\SchemeSathi\backend\app\routes\users.py', 'w') as f:
    f.write(content)

print('Fixed users.py')
