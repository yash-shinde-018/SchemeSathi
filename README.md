# 🏛️ SchemeSathi (योजना साथी)

> **AI-Powered Citizen Scheme Discovery & Eligibility Intelligence Platform**  
> Connecting every Indian citizen with central and state government welfare schemes tailored to their demographic profile.

---

## 🌟 Key Features

- **Personalized Citizen Dashboard**: Instant recommendations based on age, income, caste category, occupation, and state.
- **100+ Verified Government Schemes**: Fully categorized schemes spanning Agriculture, Education, Healthcare, Women & Child Development, Housing, and Social Welfare.
- **Bilingual Experience**: Native support for **English** and **Marathi (मराठी)** with instant on-the-fly language switching.
- **Citizen Account & Profile Management**:
  - Secure registration and login with bcrypt encryption.
  - Avatar customization with preset avatars and custom uploads.
  - Real-time profile completion progress calculation.
  - Self-service **Change Password** and permanent **Delete Account** safety controls.
- **Smart Notification Hub**:
  - Official welcome notification upon registration.
  - Security alerts on password updates.
  - Admin broadcast notifications and platform announcements.
- **Administrative Suite (`/admin`)**:
  - Scheme CRUD, category management, citizen query resolutions, and system audit logs.
  - Platform maintenance mode and citizen registration throttle toggles.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: Modern CSS variables, glassmorphism, responsive mobile-first grids
- **Icons & UI**: FontAwesome, Bootstrap icons
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library (134 unit & property-based tests)

### Backend
- **Framework**: [Python Flask](https://flask.palletsprojects.com/) (Application Factory pattern)
- **Database**: [PostgreSQL (Neon Serverless DB)](https://neon.tech/) via SQLAlchemy ORM
- **Authentication**: Bcrypt hashing (salt factor 12), secure session management, rate limiters
- **API**: RESTful JSON architecture with modular Blueprints (`auth`, `schemes`, `users`, `notifications`, `admin`, `health`)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.x or later)
- **Python** (v3.10 or later)
- **PostgreSQL / Neon DB** connection URL

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your DATABASE_URL (Neon PostgreSQL) and SESSION_SECRET

# Run backend development server
python run.py
```
Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

---

### 2. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd schemesathi-landing

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start Vite dev server
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🧪 Running Tests

### Frontend Test Suite
```bash
cd schemesathi-landing
npm run test
```
*Runs all 134 unit and property-based tests across auth, form inputs, modals, buttons, and accessibility.*

### Backend End-to-End Suite
```bash
cd backend
python tests/test_e2e_live.py
```
*Executes live automated validation covering healthcheck, category discovery, scheme pagination, user registration, authentication, profile updates, avatar syncing, password changes, and account deletion.*

---

## 📁 Repository Structure

```
SchemeSathi/
├── backend/                  # Flask REST API & DB models
│   ├── app/
│   │   ├── routes/           # Blueprints: auth, schemes, users, admin, notifications
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── services/         # Business logic & authentication services
│   │   └── database.py       # Neon DB connection & pooling
│   ├── tests/                # Automated test suites
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server entry point
├── schemesathi-landing/      # React 19 Frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── pages/            # Landing, Dashboard, Profile, Admin, Contact
│   │   ├── context/          # AuthContext & LanguageContext
│   │   └── services/         # API client & application services
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.js        # Vite configuration
├── .gitignore                # Global git ignore (protects venv, node_modules, .env)
└── README.md                 # Project documentation
```

---

## 🔒 Security & Environment Protection

- Production credentials, API keys, and database strings are excluded via `.gitignore`.
- Password hashes use industry-standard **bcrypt** (salt rounds 12).
- Sensitive administrative routes are protected by role-based authorization middleware.

