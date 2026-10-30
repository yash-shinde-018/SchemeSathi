import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import './DashboardLayout.css';
import './AdminLayout.css';

/**
 * AdminLayout - Unified App Shell for Administrators
 * Uses the EXACT SAME Neumorphic & Soft Organic UI design as DashboardLayout (citizen)
 * - Identical floating shelf navbar (light organic sage/stone background)
 * - Identical sidebar tactile rail (with strictly admin-only links)
 * - Identical typography, avatar pill, and tactile shadows
 */
export default function AdminLayout({ 
  children, 
  activePage = 'overview', 
  searchPlaceholder = 'Search schemes, citizens, or ministries...'
}) {
  const { user, logout } = useAuth();
  const { currentLanguage, currentLanguageData, languages, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  // Guard: if non-admin or not logged in, bounce out
  useEffect(() => {
    if (!user) return;
    const role = (user?.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAdminMenuOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/schemes?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/admin/schemes');
    }
  };

  const adminName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'System Administrator';

  return (
    <div className="dashboard-shell admin-app-shell">
      {/* ===== TOP NAVBAR (EXACT MATCH TO CITIZEN DASHBOARD) ===== */}
      <header className="navbar" role="banner">
        <div className="navbar-brand">
          <NavLink to="/admin" className="brand-logo-link">
            <img src="/logo.png" alt="SchemeSathi Logo" className="brand-img" />
          </NavLink>
          <div className="brand-text">
            <span className="brand-name">SchemeSathi</span>
            <span className="brand-tagline">Government Schemes Made Simple</span>
          </div>
        </div>

        {/* Global Admin Search Bar (Neumorphic Inset) */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <i className="fa fa-search search-icon" aria-hidden="true"></i>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search administrative database"
          />
        </form>

        {/* Navbar Right Actions */}
        <div className="navbar-right">
          {/* Language Selector */}
          <div className="lang-dropdown-wrapper" ref={langDropdownRef}>
            <div 
              className="lang-selector" 
              id="language-selector-btn"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              tabIndex="0"
              role="button"
              aria-haspopup="true"
              aria-expanded={langMenuOpen}
            >
              <i className="fa fa-globe"></i>
              <span id="current-language-label">{currentLanguageData?.nativeLabel || 'English'}</span>
              <i className={`fa fa-chevron-${langMenuOpen ? 'up' : 'down'}`}></i>
            </div>
            {langMenuOpen && (
              <div className="dropdown-menu lang-menu" id="language-dropdown-menu">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code}`}
                    type="button"
                    className={`dropdown-item ${currentLanguage === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setLangMenuOpen(false);
                    }}
                  >
                    <span>{lang.nativeLabel} ({lang.label})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="nav-divider"></div>

          {/* Notifications Icon Button */}
          <NavLink to="/admin/broadcast" className="notif-btn" title="Broadcast Notifications">
            <i className="fa fa-bell"></i>
          </NavLink>

          {/* User Profile Button / Dropdown (Exact Neumorphic Pill) */}
          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            <button 
              type="button" 
              className="user-profile-btn"
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              aria-haspopup="true"
              aria-expanded={adminMenuOpen}
            >
              <div className="user-avatar">
                <i className="fa fa-user"></i>
              </div>
              <div className="user-info">
                <span className="user-name">{adminName}</span>
                <span className="user-role" style={{ color: '#0d9488', fontWeight: 700 }}>
                  ADMIN
                </span>
              </div>
              <i className={`fa fa-chevron-${adminMenuOpen ? 'up' : 'down'}`}></i>
            </button>

            {adminMenuOpen && (
              <div className="dropdown-menu user-menu" style={{ width: '250px' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1b2d22' }}>{adminName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>{user?.email || 'admin@schemesathi.in'}</div>
                </div>

                <NavLink 
                  to="/admin" 
                  className={`dropdown-item ${activePage === 'overview' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-chart-pie"></i> Overview & Analytics
                </NavLink>

                <NavLink 
                  to="/admin/schemes" 
                  className={`dropdown-item ${activePage === 'schemes' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-landmark"></i> Scheme Catalog
                </NavLink>

                <NavLink 
                  to="/admin/add-scheme" 
                  className={`dropdown-item ${activePage === 'add-scheme' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-circle-plus"></i> Add New Scheme
                </NavLink>

                <NavLink 
                  to="/admin/users" 
                  className={`dropdown-item ${activePage === 'users' || activePage === 'analytics' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-chart-line"></i> User Analytics
                </NavLink>

                <NavLink 
                  to="/admin/queries" 
                  className={`dropdown-item ${activePage === 'queries' || activePage === 'verifications' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-headset"></i> Citizen Queries & Feedback
                </NavLink>

                <NavLink 
                  to="/admin/broadcast" 
                  className={`dropdown-item ${activePage === 'broadcast' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-bullhorn"></i> Broadcast Alerts
                </NavLink>

                <NavLink 
                  to="/admin/settings" 
                  className={`dropdown-item ${activePage === 'settings' ? 'active' : ''}`}
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-sliders"></i> System & Settings
                </NavLink>

                <NavLink 
                  to="/admin/settings?tab=profile" 
                  className="dropdown-item"
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-user-gear"></i> Admin Profile & Password
                </NavLink>

                <NavLink 
                  to="/admin/settings?tab=team" 
                  className="dropdown-item"
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <i className="fa fa-user-shield"></i> Admin Team & Accounts
                </NavLink>

                <div className="dropdown-divider"></div>

                <button 
                  type="button" 
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <i className="fa fa-sign-out-alt"></i> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN LAYOUT: SIDEBAR + CONTENT ===== */}
      <div className="main-layout">
        {/* ===== LEFT SIDEBAR (EXACT MATCH TO CITIZEN DASHBOARD) ===== */}
        <aside className="sidebar" aria-label="Administrator Navigation">
          <nav className="sidebar-nav">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `nav-item ${isActive || activePage === 'overview' ? 'active' : ''}`}
            >
              <i className="fa fa-chart-pie"></i>
              <span>Overview & Analytics</span>
            </NavLink>

            <NavLink
              to="/admin/schemes"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'schemes' ? 'active' : ''}`}
            >
              <i className="fa fa-landmark"></i>
              <span>Scheme Catalog</span>
            </NavLink>

            <NavLink
              to="/admin/add-scheme"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'add-scheme' ? 'active' : ''}`}
            >
              <i className="fa fa-circle-plus"></i>
              <span>Add Scheme</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'users' || activePage === 'analytics' ? 'active' : ''}`}
            >
              <i className="fa fa-chart-line"></i>
              <span>User Analytics</span>
            </NavLink>

            <NavLink
              to="/admin/queries"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'queries' || activePage === 'verifications' ? 'active' : ''}`}
            >
              <i className="fa fa-headset"></i>
              <span>Queries & Feedback</span>
            </NavLink>

            <NavLink
              to="/admin/broadcast"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'broadcast' ? 'active' : ''}`}
            >
              <i className="fa fa-bullhorn"></i>
              <span>Broadcast Alerts</span>
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'settings' ? 'active' : ''}`}
            >
              <i className="fa fa-sliders"></i>
              <span>System & Settings</span>
            </NavLink>
          </nav>

          {/* Bottom System Status Widget */}
          <div className="admin-sidebar-status-card">
            <div className="status-email-row">
              <i className="fa fa-shield"></i>
              <span>{user?.email || 'admin@schemesathi.in'}</span>
            </div>
            <button 
              type="button" 
              className="admin-sidebar-logout-pill"
              onClick={handleLogout}
              title="Sign Out"
            >
              <i className="fa fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </aside>

        {/* ===== ADMIN PAGE CONTENT ===== */}
        <main className="content" id="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
