# SchemeSathi API Implementation Summary

## Backend Architecture

### Project Structure
```
backend/
├── app/
│   ├── __init__.py           # App factory with blueprint registration
│   ├── models/               # SQLAlchemy models
│   ├── services/             # Business logic
│   │   ├── auth_service.py   # Auth, password hashing, rate limiting
│   │   └── matching_service.py  # Rule-based scheme recommendations
│   ├── routes/               # API blueprints
│   │   ├── health.py         # Health checks
│   │   ├── auth.py           # Authentication (register, login, logout)
│   │   ├── schemes.py        # Scheme CRUD and search
│   │   ├── users.py          # User profile and recommendations
│   │   └── admin.py          # Admin dashboard and management
│   ├── database.py           # SQLAlchemy config
│   ├── cli.py                # CLI commands
│   └── utils/                # Utility functions
├── config.py                 # Environment-based config
├── wsgi.py                   # Production WSGI entry point
├── requirements.txt          # Python dependencies
└── .env.example              # Environment template
```

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication Routes (`/auth`)

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+91XXXXXXXXXX"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "citizen",
    "account_status": "active"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "citizen",
    "last_login": "2024-01-15T10:30:00Z"
  }
}

Error: 429 Too Many Requests (rate limited - 5 attempts per 15 minutes)
Error: 401 Unauthorized (invalid credentials)
```

#### Logout
```
POST /api/auth/logout
Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Check Auth Status
```
GET /api/auth/me
Response: 200 OK
{
  "success": true,
  "user": { ... }
}

Error: 401 Unauthorized (not logged in)
```

### Schemes Routes (`/schemes`)

#### List Schemes
```
GET /api/schemes?page=1&limit=10&category=agriculture&level=central&sort=name
Response: 200 OK
{
  "success": true,
  "schemes": [
    {
      "id": 1,
      "name": "Pradhan Mantri Kisan Samman Nidhi",
      "description": "...",
      "category": "agriculture",
      "govt_level": "central",
      "is_active": true
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 5
}
```

#### Search Schemes
```
GET /api/schemes/search?q=farmer&limit=5
Response: 200 OK
{
  "success": true,
  "schemes": [...]
}
```

#### Get Scheme Details
```
GET /api/schemes/:id
Response: 200 OK
{
  "success": true,
  "scheme": {
    "id": 1,
    "name": "Pradhan Mantri Kisan Samman Nidhi",
    "description": "...",
    "category": "agriculture",
    "eligibility_rules": { ... },
    "benefits": "...",
    "application_process": "...",
    "documents_required": [...]
  }
}

Error: 404 Not Found
```

#### Save Scheme
```
POST /api/schemes/:id/save
Response: 201 Created
{
  "success": true,
  "message": "Scheme saved successfully"
}

Error: 409 Conflict (already saved)
```

#### Unsave Scheme
```
DELETE /api/schemes/:id/save
Response: 200 OK
{
  "success": true,
  "message": "Scheme removed from saved"
}

Error: 404 Not Found (not saved)
```

### Users Routes (`/users`)

#### Get Profile
```
GET /api/users/profile
Response: 200 OK
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+91XXXXXXXXXX",
    "role": "citizen",
    "account_status": "active",
    "profile": {
      "state_code": "MH",
      "district": "Mumbai",
      "family_size": 4,
      "occupation": "farmer",
      "annual_income": 250000,
      "age": 35
    },
    "saved_schemes_count": 5
  }
}

Error: 401 Unauthorized (not logged in)
```

#### Update Profile
```
PUT /api/users/profile
Content-Type: application/json

{
  "first_name": "John",
  "phone": "+91XXXXXXXXXX",
  "profile": {
    "state_code": "MH",
    "district": "Mumbai",
    "family_size": 4,
    "occupation": "farmer",
    "annual_income": 250000,
    "age": 35
  }
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### Get Recommendations
```
GET /api/users/recommendations?limit=5&offset=0
Response: 200 OK
{
  "success": true,
  "recommendations": [
    {
      "scheme_id": 1,
      "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
      "category": "agriculture",
      "score": 95,
      "match_reasons": ["Family size matches", "Occupation is farmer"]
    }
  ],
  "total": 12
}
```

#### Get Saved Schemes
```
GET /api/users/saved-schemes?limit=10&offset=0
Response: 200 OK
{
  "success": true,
  "schemes": [
    {
      "id": 1,
      "name": "Pradhan Mantri Kisan Samman Nidhi",
      "description": "...",
      "category": "agriculture",
      "saved_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 3
}
```

### Admin Routes (`/admin`)

#### Dashboard Stats (Admin only)
```
GET /api/admin/dashboard
Response: 200 OK
{
  "success": true,
  "dashboard": {
    "total_users": 1250,
    "active_users": 980,
    "total_schemes": 500,
    "active_schemes": 475,
    "pending_verifications": 12
  }
}

Error: 403 Forbidden (non-admin)
```

#### List Schemes (Admin only)
```
GET /api/admin/schemes?page=1&limit=10&status=active
Response: 200 OK
{
  "success": true,
  "schemes": [...]
}
```

#### Create Scheme (Admin only)
```
POST /api/admin/schemes
Content-Type: application/json

{
  "name": "New Scheme",
  "description": "...",
  "category_id": 1,
  "govt_level": "central",
  "is_active": true,
  "benefits": "...",
  "application_process": "..."
}

Response: 201 Created
```

#### Update Scheme (Admin only)
```
PUT /api/admin/schemes/:id
```

#### Delete Scheme (Admin only - soft delete)
```
DELETE /api/admin/schemes/:id
Response: 200 OK
```

#### List Users (Admin only)
```
GET /api/admin/users?page=1&limit=10&role=citizen&status=active
```

#### Get User Details (Admin only)
```
GET /api/admin/users/:id
```

#### Update User (Admin only)
```
PUT /api/admin/users/:id
Content-Type: application/json

{
  "role": "citizen",
  "account_status": "active",
  "first_name": "John"
}
```

#### List Verifications (Admin only)
```
GET /api/admin/verifications?page=1&limit=10&status=pending
```

#### Update Verification (Admin only)
```
PUT /api/admin/verifications/:id
Content-Type: application/json

{
  "status": "approved",
  "comments": "Verified by admin"
}
```

#### Admin Logs
```
GET /api/admin/logs?page=1&limit=20
```

## HTTP Status Codes

- **200 OK**: Successful GET/PUT/DELETE operation
- **201 Created**: Successful POST operation (resource created)
- **400 Bad Request**: Invalid input or missing required fields
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (e.g., non-admin accessing admin endpoint)
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists (e.g., duplicate email, already saved)
- **429 Too Many Requests**: Rate limit exceeded (e.g., login attempts)
- **500 Internal Server Error**: Unexpected server error

## Authentication & Security

- **Session-based authentication** using Flask sessions with secure cookies
- **Password hashing**: bcrypt with salt factor 12
- **Rate limiting**: 
  - Login: 5 attempts per 15 minutes
  - Registration: 10 attempts per hour
  - Password reset: 3 attempts per hour
- **Input validation**: All endpoints validate and sanitize input
- **CORS**: Configure in production environment
- **HTTPS**: Use in production

## Recommendation Engine

The matching service implements a rule-based recommendation algorithm:

**Scoring Criteria (max 100 points):**
- Family size match: up to 15 points
- Occupation match: up to 20 points
- Income range match: up to 25 points
- Age eligibility: up to 15 points
- Location/state match: up to 15 points
- Caste/category match: up to 10 points

**Threshold**: Schemes with score >= 30 are recommended

**Caching**: Recommendations cached for 24 hours per user

## Database Models

### User
```python
- id (PK)
- email (unique)
- password_hash
- first_name
- last_name
- phone
- role (citizen/admin)
- account_status (active/inactive/suspended)
- last_login
- created_at
- updated_at
- soft_delete (deleted_at)
```

### UserProfile
```python
- id (PK)
- user_id (FK)
- state_code
- district
- family_size
- occupation
- annual_income
- caste
- gender
- age
- preferences (JSON)
```

### Scheme
```python
- id (PK)
- name
- description
- category_id (FK)
- govt_level (central/state/local)
- state_id (FK) - nullable
- is_active
- eligibility_rules (JSON)
- benefits
- application_process
- documents_required (JSON)
- created_at
- updated_at
```

### SavedScheme
```python
- id (PK)
- user_id (FK)
- scheme_id (FK)
- created_at
```

### SchemeVerification
```python
- id (PK)
- scheme_id (FK)
- status (pending/approved/rejected)
- reviewed_by (FK to admin)
- reviewed_at
- comments
- created_at
```

### AdminLog
```python
- id (PK)
- admin_id (FK)
- action (CREATE/UPDATE/DELETE/VERIFY)
- entity_type
- entity_id
- description
- created_at
```

## Environment Variables

**Backend (.env)**
```
FLASK_ENV=development|production
DATABASE_URL=postgresql://user:pass@localhost/schemesathi
SESSION_SECRET=your-secret-key-here
BCRYPT_LOG_ROUNDS=12
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:5000/api
```

## Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Set up database
flask db upgrade

# Seed initial data
flask seed-db

# Run development server
flask run

# Run with Gunicorn (production)
gunicorn wsgi:app
```

## Testing API Endpoints

Using curl:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","first_name":"Test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}' \
  -c cookies.txt

# List schemes (with session)
curl http://localhost:5000/api/schemes \
  -b cookies.txt
```

## Frontend Integration

The frontend uses:
- **React Context** for authentication state management (`AuthContext`)
- **Centralized fetch wrapper** for API calls (`apiClient.js`)
- **Protected routes** for authenticated pages
- **Error handling and loading states** in all components

See `Frontend Implementation` section for details on React components and pages.
