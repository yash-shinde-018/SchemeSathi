import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { SystemSettingsProvider } from './context/SystemSettingsContext'
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute'

// Landing Page & Public Navigation Pages
import App from './App'
import PublicExplorePage from './pages/PublicExplorePage'
import HowItWorksPage from './pages/HowItWorksPage'
import ContactPage from './pages/ContactPage'

// Auth Pages
import LoginPage from './pages/LoginPage'

// 7 Sidebar Navigation Pages & Details
import DashboardPage from './pages/DashboardPage'
import UserProfilePage from './pages/UserProfilePage'
import ExploreSchemes from './pages/ExploreSchemes'
import SavedSchemesPage from './pages/SavedSchemesPage'
import MyApplicationsPage from './pages/MyApplicationsPage'
import NotificationsPage from './pages/NotificationsPage'
import HelpSupportPage from './pages/HelpSupportPage'
import SchemeDetailsPage from './pages/SchemeDetailsPage'

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <SystemSettingsProvider>
          <AuthProvider>
            <Routes>
          {/* Landing & Public Navigation Pages */}
          <Route path='/' element={<App />} />
          <Route path='/explore' element={<PublicExplorePage />} />
          <Route path='/how-it-works' element={<HowItWorksPage />} />
          <Route path='/contact' element={<ContactPage />} />
          <Route path='/about' element={<HowItWorksPage />} />
          <Route path='/login' element={<LoginPage />} />

          {/* 1. Dashboard */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 2. My Profile */}
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 3. Find Schemes */}
          <Route
            path='/dashboard/explore'
            element={
              <ProtectedRoute>
                <ExploreSchemes />
              </ProtectedRoute>
            }
          />
          <Route
            path='/schemes/explore'
            element={<PublicExplorePage />}
          />

          {/* Scheme Details (Accessible by both Citizens and Admins) */}
          <Route
            path='/scheme/:id'
            element={
              <ProtectedRoute allowAdmin={true}>
                <SchemeDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/schemes/:id'
            element={
              <ProtectedRoute allowAdmin={true}>
                <SchemeDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* 4. Saved Schemes (and /schemes/saved alias) */}
          <Route
            path='/saved-schemes'
            element={
              <ProtectedRoute>
                <SavedSchemesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/schemes/saved'
            element={
              <ProtectedRoute>
                <SavedSchemesPage />
              </ProtectedRoute>
            }
          />

          {/* 5. My Applications */}
          <Route
            path='/applications'
            element={
              <ProtectedRoute>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* 6. Notifications */}
          <Route
            path='/notifications'
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* 7. Help & Support (and /help-support alias) */}
          <Route
            path='/help'
            element={
              <ProtectedRoute>
                <HelpSupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/help-support'
            element={
              <ProtectedRoute>
                <HelpSupportPage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Administration Pages (Admin Only - No Citizen Pages) */}
          <Route
            path='/admin'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/overview'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/schemes'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/add-scheme'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/users'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/analytics'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/queries'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/verifications'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/broadcast'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path='/admin/settings'
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* 404 - Not Found */}
          <Route path='*' element={<div style={{ padding: '40px', textAlign: 'center' }}><h2>Page not found</h2><a href="/dashboard" style={{ color: '#2e7d32' }}>Return to Dashboard</a></div>} />
        </Routes>
          </AuthProvider>
        </SystemSettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
