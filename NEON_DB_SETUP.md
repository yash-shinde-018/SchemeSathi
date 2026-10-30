# Neon DB Setup Guide for SchemeSathi

## Why Neon DB?

✅ **Serverless PostgreSQL** - No infrastructure management
✅ **Free tier** - Perfect for development (10GB storage, 1 GB RAM)
✅ **Automatic backups** - Built-in data protection
✅ **Branching** - Create test databases easily
✅ **Connection pooling** - Built-in Pooler for better performance
✅ **Easy to scale** - Pay-as-you-go for production

## Step 1: Create Neon Account

1. Visit [https://neon.tech](https://neon.tech)
2. Click "Get started for free" or "Sign up"
3. Sign up with email or GitHub account
4. Verify your email

## Step 2: Create Your First Project

1. After login, click "New project"
2. Configure:
   - **Project name**: `SchemeSathi` (or any name)
   - **Database name**: `schemesathi` (default: neondb)
   - **Region**: Choose closest to your location (us-east-1, eu-west-1, etc.)
   - **Postgres version**: 15 (latest recommended)
3. Click "Create project"

## Step 3: Get Connection String

After project creation, you'll see a dashboard:

1. Click "Connection string" or "Connection details"
2. You'll see three connection types:
   - **Psycopg3** - For Python (recommended)
   - **Prisma** - For Prisma ORM
   - **JDBC** - For Java

3. Select **Psycopg3** and you'll see:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

4. Copy the full connection string (keep it secret!)

## Step 4: Update Your Backend .env

Edit `backend/.env` and replace:

```bash
# OLD (SQLite)
DATABASE_URL=sqlite:///schemesathi_dev.db

# NEW (Neon DB)
DATABASE_URL=postgresql://user:password@ep-xxxxxx.us-east-1.neon.tech/schemesathi?sslmode=require
```

Replace with your actual connection string from Neon.

## Step 5: Install PostgreSQL Driver (if not already installed)

```bash
cd backend

# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Install psycopg2 (PostgreSQL driver for Python)
pip install psycopg2-binary
# or if you have build tools issues:
pip install psycopg2-binary --only-binary :all:

# Update requirements.txt
pip freeze > requirements.txt
```

## Step 6: Initialize Database with Neon

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Upgrade database schema
flask db upgrade

# Seed with sample data
flask seed-db

# Verify connection
python -c "from app.database import db; print('✓ Connected to Neon DB!')"
```

## Step 7: Test Connection

### Using psql (PostgreSQL CLI)

```bash
# Install psql if you don't have it
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: apt-get install postgresql-client

# Connect to your Neon database
psql postgresql://user:password@ep-xxxxxx.us-east-1.neon.tech/schemesathi?sslmode=require

# In psql prompt, run:
\dt  # List all tables
SELECT COUNT(*) FROM "user";  # Check user table
```

### Using Python

```python
from sqlalchemy import create_engine
from app.database import db
from app import create_app

app = create_app('development')
with app.app_context():
    # Try to query
    from app.models import User
    count = User.query.count()
    print(f"Total users: {count}")
```

## Neon DB Console Features

Once connected, visit your Neon dashboard to:

1. **View data** - SQL Editor to run queries directly
2. **Monitor connections** - See active connections
3. **Manage branches** - Create dev/test branches
4. **Backup & restore** - Built-in backup management
5. **Connection pooling** - Enable Pooler for better performance

## Connection Pooling (Important for Production)

For better performance with many concurrent connections:

1. In Neon dashboard, click your project
2. Go to "Connection pooling" settings
3. Enable Pooler
4. Use pooler connection string instead

The pooler URL looks like:
```
postgresql://user:password@ep-xxxxxx-pooler.us-east-1.neon.tech/schemesathi?sslmode=require
```

## Migration: Moving from SQLite to Neon

If you already have data in SQLite:

```bash
# Export from SQLite to SQL file
sqlite3 schemesathi_dev.db .dump > backup.sql

# Connect to Neon and import
psql "postgresql://user:password@host/db" < backup.sql
```

Or use a Python script:

```python
import sqlite3
import psycopg2
from app import create_app
from app.database import db

# Get all data from SQLite
sqlite_conn = sqlite3.connect('instance/schemesathi_dev.db')
cursor = sqlite_conn.cursor()

# ... copy data to Neon database
```

## Troubleshooting

### Connection Refused
```
Error: could not connect to server
```
- Verify connection string is correct
- Check your IP is not blocked (Neon allows all IPs by default)
- Try connection from Neon SQL Editor first

### SSL Certificate Error
```
Error: SSL connection error
```
- Add `?sslmode=require` to your connection string (should already be there)
- Or use `?sslmode=disable` for development only (not recommended)

### Database Does Not Exist
```
Error: database "schemesathi" does not exist
```
- Run `flask db upgrade` to create tables
- Or manually create database in Neon console

### Too Many Connections
```
Error: remaining connection slots reserved
```
- Enable Connection Pooling in Neon dashboard
- Use pooler connection string

## Environment Variables for Production

For production deployment (e.g., Heroku, Railway, Vercel):

```bash
DATABASE_URL=postgresql://user:password@ep-xxxxxx.us-east-1.neon.tech/schemesathi?sslmode=require
SESSION_SECRET=generate-a-secure-random-string-here
FLASK_ENV=production
DEBUG=False
```

## Benefits for SchemeSathi

1. **Cost** - Free tier covers development needs
2. **Reliability** - Automatic backups, 99.9% uptime
3. **Scalability** - Easy to upgrade for production load
4. **Compliance** - GDPR compliant data centers
5. **Performance** - Built-in indexing recommendations

## Next Steps

1. ✅ Create Neon DB account and project
2. ✅ Update backend `.env` with connection string
3. ✅ Install psycopg2 driver
4. ✅ Run `flask db upgrade` to create tables
5. ✅ Run `flask seed-db` to add sample data
6. ✅ Test connection with `python -c "from app import create_app; ..."`
7. ✅ Start backend: `flask run`
8. ✅ Start frontend: `npm run dev`
9. ✅ Begin testing!

## Support

- **Neon Docs**: https://neon.tech/docs
- **Neon Community**: https://discord.gg/SzVT64RdJf
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## Cost Estimation

**Free Tier** (Perfect for development):
- 10 GB storage
- 1 compute unit
- Unlimited databases
- Auto-suspend after 5 minutes inactivity

**Pro Tier** (For production):
- Pay for compute ($0.16/hour) and storage ($0.125/GB/month)
- Example: Small app = ~$50-100/month

---

Once set up, your backend will use Neon DB for all data persistence, and you won't need to manage PostgreSQL locally!
