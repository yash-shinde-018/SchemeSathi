import { useState } from 'react'
import './App.css'

// Layout Components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Section Components
import HeroSection from './components/sections/HeroSection'
import TrustStripSection from './components/sections/TrustStripSection'
import ExploreCategoriesSection from './components/sections/ExploreCategoriesSection'
import HowItWorksSection from './components/sections/HowItWorksSection'
import WhySchemeSathiSection from './components/sections/WhySchemeSathiSection'
import TrustSection from './components/sections/TrustSection'
import CTASection from './components/sections/CTASection'

// Page Components
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Modal Component
import Modal from './components/common/Modal'

// Auth Form Components
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'

/**
 * App Component - SchemeSathi Landing Page Application
 * 
 * Main application component with routing between landing page and modal-based authentication.
 * 
 * Features:
 * - Clean landing page optimized for user engagement
 * - Modal-based login and registration
 * - Hero section with 3D animation
 * - How it works explanation
 * - Why choose SchemeSathi benefits
 * - Trust and credibility messaging
 * - Call-to-action section
 * - Full keyboard accessibility and focus management
 */
function App() {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language)
    console.log('Language changed to:', language)
    // TODO: In Phase 2, dispatch language change to i18n context or Redux store
  }

  const handleNavigate = (page) => {
    // Handle modal-based navigation
    if (page === 'login') {
      setAuthMode('login')
      setIsAuthModalOpen(true)
    } else if (page === 'register') {
      setAuthMode('register')
      setIsAuthModalOpen(true)
    } else {
      // Other page navigation
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const handleAuthSuccess = () => {
    // Close modal after successful authentication
    handleCloseAuthModal()
  }

  // Render Landing Page with Modal Authentication (default)
  return (
    <div className="app">
      {/* Skip to Main Content Link - for keyboard accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Header with Navigation */}
      <Header 
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <main role="main" id="main-content">
        {/* Hero Section - Eye-catching introduction */}
        <HeroSection onNavigate={handleNavigate} />

        {/* Trust Strip Section - Minimalist trust indicators */}
        <TrustStripSection />

        {/* Explore Categories Section - Grid of category cards */}
        <ExploreCategoriesSection />

        {/* How It Works Section - Simple process explanation */}
        <HowItWorksSection />

        {/* Why SchemeSathi Section - Key benefits with modern design */}
        <WhySchemeSathiSection />

        {/* Trust & Verification Section - Build credibility */}
        <TrustSection />

        {/* Final CTA Section - Conversion focused */}
        <CTASection onNavigate={handleNavigate} />
      </main>

      {/* Footer */}
      <Footer
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onNavigate={handleNavigate}
      />

      {/* Authentication Modal - Login or Register */}
      <Modal 
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        title={authMode === 'login' ? 'Sign In' : 'Create Account'}
        showHeader={true}
      >
        {authMode === 'login' ? (
          <LoginForm 
            onSubmit={handleAuthSuccess}
            onNavigate={handleNavigate}
          />
        ) : (
          <RegisterForm 
            onSubmit={handleAuthSuccess}
            onNavigate={handleNavigate}
          />
        )}
      </Modal>
    </div>
  )
}

export default App
