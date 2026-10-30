import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { fetchDynamicTranslations, translateAnnouncement } from '../../utils/dynamicTranslator';
import apiClient from '../../services/apiClient';
import notificationService, { NOTIFICATIONS_UPDATED_EVENT, NEW_BROADCAST_ALERT_EVENT } from '../../services/notificationService';
import './DashboardLayout.css';

function resolveAnnouncement(config, lang, translatedState) {
  if (!config?.system_announcement) return '';
  const raw = String(config.system_announcement).trim();
  if (!raw || lang === 'en') return raw;

  // 1. Backend pre-translation map (automatically computed for any custom announcement)
  const backendTrans = config.system_announcement_translations;
  if (backendTrans && typeof backendTrans === 'object' && backendTrans[lang]) {
    return backendTrans[lang];
  }

  // 2. React state translation if valid
  if (translatedState && translatedState !== raw) {
    return translatedState;
  }

  // 3. Client instant dictionary
  const dict = translateAnnouncement(raw, lang);
  if (dict && dict !== raw) {
    return dict;
  }

  return raw;
}

/**
 * DashboardLayout - Unified App Shell for all authenticated pages
 * Features:
 * - Fixed Top Navigation Bar with brand, search, language, notifications, user avatar
 * - Left Navigation Sidebar matching exact design specifications:
 *   1. Dashboard (/dashboard)
 *   2. My Profile (/profile)
 *   3. Find Schemes (/explore)
 *   4. Saved Schemes (/saved-schemes)
 *   5. My Applications (/applications)
 *   6. Notifications (/notifications, dynamic badge)
 *   7. Help & Support (/help)
 */
export default function DashboardLayout({ children, activePage = '', searchPlaceholder }) {
  const { user, logout } = useAuth();
  const { currentLanguage, currentLanguageData, languages, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(() => notificationService.getUnreadCount(user?.id));
  const [isBellRinging, setIsBellRinging] = useState(false);
  const { settings: systemConfig, isMaintenanceMode } = useSystemSettings();
  const [translatedAnnouncement, setTranslatedAnnouncement] = useState(() => {
    return resolveAnnouncement(systemConfig, currentLanguage, '');
  });
  const langDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const raw = systemConfig?.system_announcement;
    if (!raw || !raw.trim()) {
      setTranslatedAnnouncement('');
      return;
    }
    const clean = raw.trim();
    if (currentLanguage === 'en') {
      setTranslatedAnnouncement(clean);
      return;
    }

    // 1. Check backend pre-translations map
    if (systemConfig?.system_announcement_translations?.[currentLanguage]) {
      setTranslatedAnnouncement(systemConfig.system_announcement_translations[currentLanguage]);
      return;
    }

    // 2. Instant dictionary lookup
    const instant = translateAnnouncement(clean, currentLanguage);
    if (instant && instant !== clean) {
      setTranslatedAnnouncement(instant);
      return;
    }

    // 3. Dynamic async fetch from backend
    let isMounted = true;
    fetchDynamicTranslations([clean], currentLanguage)
      .then(res => {
        if (isMounted && res) {
          const trans = res[clean] || res[raw];
          if (trans) {
            setTranslatedAnnouncement(trans);
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [systemConfig?.system_announcement, systemConfig?.system_announcement_translations, currentLanguage]);

  useEffect(() => {
    const handleLang = (e) => {
      const lang = e?.detail?.language || currentLanguage;
      const res = resolveAnnouncement(systemConfig, lang, '');
      setTranslatedAnnouncement(res);
      if (lang !== 'en' && res === systemConfig?.system_announcement && systemConfig?.system_announcement) {
        fetchDynamicTranslations([systemConfig.system_announcement.trim()], lang)
          .then(data => {
            const trans = data?.[systemConfig.system_announcement.trim()];
            if (trans) setTranslatedAnnouncement(trans);
          })
          .catch(() => {});
      }
    };
    window.addEventListener('schemesathi-language-changed', handleLang);
    return () => window.removeEventListener('schemesathi-language-changed', handleLang);
  }, [systemConfig?.system_announcement, systemConfig?.system_announcement_translations, currentLanguage]);

  useEffect(() => {
    // Start active real-time background sync (polls every 3.5s + cross-tab BroadcastChannel)
    notificationService.startPolling(user?.id);

    const handleNotifsUpdate = () => {
      setUnreadNotifCount(notificationService.getUnreadCount(user?.id));
    };

    const handleNewBroadcast = () => {
      // Trigger subtle bell ringing wiggle animation without popup
      setIsBellRinging(true);
      setTimeout(() => setIsBellRinging(false), 2400);
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotifsUpdate);
    window.addEventListener(NEW_BROADCAST_ALERT_EVENT, handleNewBroadcast);

    return () => {
      notificationService.stopPolling();
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotifsUpdate);
      window.removeEventListener(NEW_BROADCAST_ALERT_EVENT, handleNewBroadcast);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect admin users immediately away from citizen pages to the Admin Portal
  useEffect(() => {
    const role = (user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'SUPERADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const defaultSearchPlaceholder = t('searchPlaceholder', 'Search schemes by name, keyword or category...');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/');
    }
  };

  const userName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.email ? user.email.split('@')[0] : t('citizen', 'Citizen'));

  const userRole = (user?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  const userProfilePic = user?.profile?.profile_picture || user?.profile_picture || (() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem('schemesathi_user_profile') || '{}');
      return cached?.profile?.profile_picture || cached?.profile_picture || null;
    } catch (e) {
      return null;
    }
  })();

  return (
    <div className="dashboard-shell">
      {/* ===== TOP NAVBAR ===== */}
      <header className="navbar" role="banner">
        <div className="navbar-brand">
          <NavLink to="/dashboard" className="brand-logo-link">
            <img src="/logo.png" alt="SchemeSathi Logo" className="brand-img" />
          </NavLink>
          <div className="brand-text">
            <span className="brand-name">{t('brandName', 'SchemeSathi')}</span>
            <span className="brand-tagline">{t('tagline', 'Government Schemes Made Simple')}</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <i className="fa fa-search search-icon" aria-hidden="true"></i>
          <input
            type="text"
            placeholder={searchPlaceholder || defaultSearchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search government schemes"
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

          {/* Notifications Icon Button with Live Ringing Animation */}
          <NavLink 
            to="/notifications" 
            className={`notif-btn ${isBellRinging ? 'bell-ringing' : ''}`} 
            title={t('navNotifications', 'Notifications')}
          >
            <i className={`fa fa-bell ${isBellRinging ? 'fa-shake' : ''}`}></i>
            {unreadNotifCount > 0 && <span className="notif-badge">{unreadNotifCount}</span>}
          </NavLink>

          {/* User Profile Button / Dropdown */}
          <div className="user-dropdown-wrapper" ref={userDropdownRef}>
            <button 
              type="button" 
              className="user-profile-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {userProfilePic ? (
                  <img 
                    src={userProfilePic} 
                    alt={userName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                  />
                ) : (
                  <i className="fa fa-user"></i>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role" style={isAdmin ? { color: '#0d9488', fontWeight: 700 } : {}}>
                  {isAdmin ? 'ADMIN' : t('userRole', 'USER')}
                </span>
              </div>
              <i className={`fa fa-chevron-${userMenuOpen ? 'up' : 'down'}`}></i>
            </button>

            {userMenuOpen && (
              <div className="dropdown-menu user-menu">
                <NavLink 
                  to="/profile" 
                  className="dropdown-item" 
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="fa fa-id-card"></i> {t('navProfile', 'My Profile')}
                </NavLink>
                <NavLink 
                  to="/saved-schemes" 
                  className="dropdown-item" 
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="fa fa-bookmark"></i> {t('navSaved', 'Saved Schemes')}
                </NavLink>
                <NavLink 
                  to="/applications" 
                  className="dropdown-item" 
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="fa fa-file-alt"></i> {t('navApplications', 'My Applications')}
                </NavLink>
                <div className="dropdown-divider"></div>
                <button 
                  type="button" 
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <i className="fa fa-sign-out-alt"></i> {t('logout', 'Sign Out')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="main-layout">
        {/* ===== LEFT SIDEBAR (EXACT MATCH TO DESIGN) ===== */}
        <aside className="sidebar" aria-label="Main Navigation">
          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'dashboard' ? 'active' : ''}`}
            >
              <i className="fa fa-home"></i>
              <span>{t('navDashboard', 'Dashboard')}</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'profile' ? 'active' : ''}`}
            >
              <i className="fa fa-user"></i>
              <span>{t('navProfile', 'My Profile')}</span>
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'explore' ? 'active' : ''}`}
            >
              <i className="fa fa-search"></i>
              <span>{t('navExplore', 'Find Schemes')}</span>
            </NavLink>

            <NavLink
              to="/saved-schemes"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'saved' ? 'active' : ''}`}
            >
              <i className="fa fa-bookmark"></i>
              <span>{t('navSaved', 'Saved Schemes')}</span>
            </NavLink>

            <NavLink
              to="/applications"
              className={({ isActive }) => `nav-item ${isActive || activePage === 'applications' ? 'active' : ''}`}
              title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : ''}
            >
              <i className="fa fa-file-alt"></i>
              <span>{t('navApplications', 'My Applications')}</span>
              {isMaintenanceMode && (
                <i 
                  className="fa fa-lock" 
                  style={{ marginLeft: 'auto', fontSize: '11px', color: '#dc2626' }}
                  title={t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance')}
                ></i>
              )}
            </NavLink>

            <NavLink
              to="/notifications"
              className={({ isActive }) => `nav-item notif-nav ${isActive || activePage === 'notifications' ? 'active' : ''}`}
            >
              <i className="fa fa-bell"></i>
              <span>{t('navNotifications', 'Notifications')}</span>
              {unreadNotifCount > 0 && <span className="nav-badge">{unreadNotifCount}</span>}
            </NavLink>

            <NavLink
              to="/help"
              className={({ isActive }) => `nav-item help-nav ${isActive || activePage === 'help' ? 'active' : ''}`}
            >
              <i className="fa fa-question-circle"></i>
              <span>{t('navHelp', 'Help & Support')}</span>
            </NavLink>
          </nav>

          {/* User Account / Sign Out Widget */}
          <div className="sidebar-user-card">
            <div className="user-email-row">
              <i className="fa fa-user-circle"></i>
              <span>{user?.email || (user?.phone ? `+91 ${user.phone}` : 'citizen@schemesathi.in')}</span>
            </div>
            <button 
              type="button" 
              className="sidebar-logout-pill"
              onClick={handleLogout}
              title={t('logout', 'Sign Out')}
            >
              <i className="fa fa-sign-out-alt"></i>
              <span>{t('logout', 'Sign Out')}</span>
            </button>
          </div>
        </aside>

        {/* ===== MAIN CONTENT INJECTION ===== */}
        <main className="content" id="main-content">
          {/* Platform Maintenance Mode Alert Banner */}
          {isMaintenanceMode && (
            <div className="platform-maintenance-advisory-banner" style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
              border: '1.5px solid #f87171',
              borderRadius: '16px',
              padding: '16px 24px',
              marginBottom: '22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.12)',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px'
                }}>
                  <i className="fa fa-triangle-exclamation"></i>
                </div>
                <span style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 9px',
                  borderRadius: '6px'
                }}>
                  {t('advisoryBadge', 'Scheduled Advisory')}
                </span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#991b1b' }}>
                  {t('maintenanceAdvisoryTitle', 'Platform Maintenance Mode is Active')}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#b91c1c',
                lineHeight: '1.55',
                maxWidth: '850px',
                textAlign: 'center'
              }}>
                {t('maintenanceAdvisoryDesc', 'SchemeSathi is undergoing routine platform optimization and system maintenance. Interactive citizen services including saving schemes, profile updates, scheme exploration, application tracking, and query submissions are temporarily restricted.')}
              </p>
            </div>
          )}

          {/* Urgent Citizen Announcement Banner */}
          {systemConfig?.system_announcement && (
            <div className="platform-urgent-announcement-banner" style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #6ee7b7',
              borderRadius: '16px',
              padding: '16px 24px',
              marginBottom: '22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#d1fae5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px'
                }}>
                  <i className="fa fa-bullhorn"></i>
                </div>
                <span style={{
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 9px',
                  borderRadius: '6px'
                }}>
                  {t('urgentNoticeBadge', 'Official Citizen Notice')}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '13.5px',
                color: '#064e3b',
                marginTop: '4px',
                lineHeight: '1.5',
                fontWeight: '600',
                maxWidth: '850px',
                textAlign: 'center'
              }}>
                {resolveAnnouncement(systemConfig, currentLanguage, translatedAnnouncement)}
              </p>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
