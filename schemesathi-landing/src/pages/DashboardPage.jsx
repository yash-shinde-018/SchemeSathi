import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import applicationService, { APPLICATIONS_UPDATED_EVENT } from '../services/applicationService';
import notificationService, { NOTIFICATIONS_UPDATED_EVENT } from '../services/notificationService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSystemSettings } from '../context/SystemSettingsContext';
import ProfileOnboardingModal from '../components/common/ProfileOnboardingModal';
import { translateSchemeTitle, translateSchemeText, translateStateName } from '../utils/schemeTranslator';
import './DashboardPage.css';

// Helper to determine if user's profile is incomplete (requires profile to exist)
function checkProfileIncomplete(profileData) {
  if (!profileData) return false;
  const p = profileData?.profile || profileData || {};
  return !p.date_of_birth || 
    !p.occupation || 
    !p.state ||
    (p.profile_completion_percentage || 0) < 50;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, translateCategory, translateGovtLevel, translateMode, currentLanguage } = useLanguage();
  const { isMaintenanceMode, showMaintenanceAlert } = useSystemSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(() => notificationService.getUnreadCount(user?.id));
  const [profile, setProfile] = useState(() => {
    try {
      const cached = sessionStorage.getItem('schemesathi_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [showOnboardingModal, setShowOnboardingModal] = useState(() => {
    try {
      return sessionStorage.getItem('schemesathi_just_registered') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [applications, setApplications] = useState(() => applicationService.getApplications());
  const [potentialCount, setPotentialCount] = useState(0);
  const [searchFilters, setSearchFilters] = useState({
    category: '',
    state: '',
    targetGroup: '',
    gender: '',
    area: '',
    keyword: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, navigate]);

  // Ensure just_registered flag is consumed and clean up session
  useEffect(() => {
    try {
      const justRegistered = sessionStorage.getItem('schemesathi_just_registered') === 'true';
      if (justRegistered) {
        sessionStorage.removeItem('schemesathi_just_registered');
        sessionStorage.removeItem('schemesathi_onboarding_skipped');
        if (user?.id) {
          sessionStorage.removeItem(`schemesathi_onboarding_skipped_${user.id}`);
        }
        setShowOnboardingModal(true);
      }
    } catch (e) {
      console.warn('[DashboardPage] registration check error:', e);
    }
  }, [user?.id]);

  // Listen to application and notification updates across the app
  useEffect(() => {
    const handleAppsUpdate = () => {
      setApplications(applicationService.getApplications());
    };
    const handleNotifsUpdate = () => {
      setUnreadNotifCount(notificationService.getUnreadCount(user?.id));
    };

    window.addEventListener(APPLICATIONS_UPDATED_EVENT, handleAppsUpdate);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotifsUpdate);
    return () => {
      window.removeEventListener(APPLICATIONS_UPDATED_EVENT, handleAppsUpdate);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotifsUpdate);
    };
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Sync applications in background
      applicationService.syncWithApi().then(() => {
        setApplications(applicationService.getApplications());
      }).catch(() => {});

      const [recRes, savedRes, profileRes] = await Promise.all([
        apiClient.schemes.getRecommendations(6).catch(() => ({ success: false })),
        apiClient.schemes.getSaved(1, 10).catch(() => ({ success: false })),
        apiClient.users.getProfile().catch(() => ({ success: false }))
      ]);

      const appliedIds = applicationService.getAppliedSchemeIds();

      // Update potential schemes live count from backend recommendation engine
      if (recRes?.success) {
        if (typeof recRes.total_potential === 'number') {
          setPotentialCount(recRes.total_potential);
        } else if (Array.isArray(recRes.data)) {
          setPotentialCount(recRes.data.length);
        }
      }

      // If recommendations are returned, enrich them with live application status
      if (recRes?.success && recRes.data && recRes.data.length > 0) {
        const enriched = recRes.data.map(item => {
          const s = item.scheme || item;
          const app = applicationService.getApplication(s.id);
          const isApplied = appliedIds.has(Number(s.id)) || Boolean(item.is_applied);
          return {
            ...s,
            match_score: item.match_score,
            match_reasons: item.reasons || [],
            is_applied: isApplied,
            app_status: app?.status || (isApplied ? 'APPLIED' : null)
          };
        });
        // Sort: unapplied first, then by match score
        enriched.sort((a, b) => {
          if (a.is_applied !== b.is_applied) return a.is_applied ? 1 : -1;
          return (b.match_score || 0) - (a.match_score || 0);
        });
        setSchemes(enriched);
      } else {
        // Fallback to schemes.list only if recommendations endpoint had no results
        const schemesListRes = await apiClient.schemes.list(1, 6).catch(() => ({ success: false }));
        if (schemesListRes?.success && (schemesListRes.data || schemesListRes.schemes)) {
          const list = schemesListRes.data || schemesListRes.schemes || [];
          setPotentialCount(prev => prev > 0 ? prev : (schemesListRes.total || list.length || 0));
          const enriched = list.map(s => {
            const app = applicationService.getApplication(s.id);
            const isApplied = appliedIds.has(Number(s.id));
            return {
              ...s,
              is_applied: isApplied,
              app_status: app?.status || (isApplied ? 'APPLIED' : null)
            };
          });
          setSchemes(enriched);
        }
      }

      if (savedRes?.success) {
        setSavedSchemes(savedRes.data || savedRes.schemes || []);
      }

      if (profileRes?.success) {
        const profData = profileRes.data || profileRes.user;
        setProfile(profData);
        try {
          sessionStorage.setItem('schemesathi_user_profile', JSON.stringify(profData));
        } catch (e) {}

        // Check if user has incomplete profile using shared helper
        const isProfileIncomplete = checkProfileIncomplete(profData);
        const profObj = profData?.profile || profData || {};

        const uid = profData?.id || profData?.user_id || user?.id;
        const userSpecificSkipped = uid ? sessionStorage.getItem(`schemesathi_onboarding_skipped_${uid}`) === 'true' : false;
        const genericSkipped = sessionStorage.getItem('schemesathi_onboarding_skipped') === 'true';
        const hasSkipped = userSpecificSkipped || genericSkipped;

        // Auto-show onboarding modal promptly if profile is genuinely incomplete and hasn't skipped in this session
        if (isProfileIncomplete && !hasSkipped) {
          setShowOnboardingModal(true);
        }

        if (profObj.state) {
          setSearchFilters(prev => ({ ...prev, state: profObj.state }));
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchFilters.category) params.append('category', searchFilters.category);
    if (searchFilters.state) params.append('state', searchFilters.state);
    if (searchFilters.keyword) params.append('q', searchFilters.keyword);
    navigate(`/explore?${params.toString()}`);
  };

  const handleBookmark = async (schemeId, e) => {
    if (e) e.stopPropagation();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Saving and bookmarking schemes');
      return;
    }
    try {
      const isAlreadySaved = savedSchemes.some(s => s.id === schemeId);
      if (isAlreadySaved) {
        await apiClient.schemes.unsave(schemeId);
      } else {
        await apiClient.schemes.save(schemeId);
      }
      // Refresh saved list
      const savedRes = await apiClient.schemes.getSaved(1, 10);
      if (savedRes.success) {
        setSavedSchemes(savedRes.data || savedRes.schemes || []);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const userName = user?.first_name || profile?.first_name || 'Citizen';

  return (
    <DashboardLayout activePage="dashboard">
      {/* Hero / Welcome Banner */}
      <section className="hero-banner">
        <div className="hero-text">
          <h2>{t('welcomeBack', 'Welcome back')}, {userName}! 👋</h2>
          <p>{t('findRightSchemes', "Let's find the right government schemes for you.")}</p>
          <div className="hero-quote">
            <span>{t('quoteTagline', '"Sahi Jaankari, Sahi Yojana, Behtar Kal."')}</span>
          </div>
        </div>
        <div className="hero-image">
          <img src="/herosection.png" alt="Hero Illustration" />
        </div>
      </section>

      {/* Profile Completion Alert Banner (shown only when profile data is loaded and is genuinely incomplete) */}
      {(() => {
        // Do NOT render when profile data hasn't loaded yet, or when profile is complete
        if (!profile || !checkProfileIncomplete(profile)) return null;

        const profObj = profile?.profile || profile || {};
        const completionPct = profObj.profile_completion_percentage || 0;

        return (
          <div className="profile-completion-reminder-banner">
            <div className="reminder-banner-content">
              <div className="reminder-banner-icon">
                <i className="fa fa-lightbulb"></i>
              </div>
              <div className="reminder-banner-text">
                <h4>
                  {t('completeProfileBannerTitle', 'Get 100% Tailored Scheme Recommendations')}
                  <span className="reminder-banner-badge">{completionPct}% {t('verified', 'Complete')}</span>
                </h4>
                <p>
                  {t('completeProfileBanner', 'Complete your profile with basic details like occupation, age & category to match schemes with 100% precision.')}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="reminder-banner-btn"
              onClick={() => setShowOnboardingModal(true)}
            >
              <i className="fa fa-user-edit"></i> {t('completeProfileBtn', 'Complete Profile')}
            </button>
          </div>
        );
      })()}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue-icon">
            <i className="fa fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <span className="stat-number">{potentialCount || schemes.length || 0}</span>
            <span className="stat-label">{t('potentialSchemes', 'Potential Schemes')}</span>
            <Link to="/explore" className="stat-link blue-link">
              {t('basedOnProfile', 'Based on your profile')} →
            </Link>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green-icon">
            <i className="fa fa-bookmark"></i>
          </div>
          <div className="stat-info">
            <span className="stat-number">{savedSchemes.length}</span>
            <span className="stat-label">{t('savedSchemes', 'Saved Schemes')}</span>
            <Link to="/saved-schemes" className="stat-link green-link">
              {t('viewSavedSchemes', 'View saved schemes →')}
            </Link>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange-icon">
            <i className="fa fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <span className="stat-number">{applications.length}</span>
            <span className="stat-label">{t('applications', 'Applications')}</span>
            <Link
              to={isMaintenanceMode ? '#' : '/applications'}
              onClick={(e) => {
                if (isMaintenanceMode) {
                  e.preventDefault();
                  showMaintenanceAlert('Application tracking');
                }
              }}
              className="stat-link orange-link"
              title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : undefined}
            >
              {t('trackYourApplications', 'Track your applications →')}
            </Link>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon red-icon">
            <i className="fa fa-bell"></i>
          </div>
          <div className="stat-info">
            <span className="stat-number red-num">{unreadNotifCount}</span>
            <span className="stat-label red-label">{t('newUpdates', 'New Updates')}</span>
            <Link to="/notifications" className="stat-link red-link">
              {t('latestAnnouncements', 'Latest announcements →')}
            </Link>
          </div>
        </div>
      </div>

      {/* Search / Filter Section */}
      <section className="search-section">
        <h3>{t('findSchemesForYou', 'Find Schemes for You')}</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label>{t('category', 'Category')}</label>
            <div className="select-wrap">
              <i className="fa fa-trophy select-prefix-icon"></i>
              <select 
                value={searchFilters.category} 
                onChange={(e) => setSearchFilters({...searchFilters, category: e.target.value})}
              >
                <option value="">{t('allCategories', 'All Categories')}</option>
                <option value="Agriculture & Farmers">{translateCategory('Agriculture & Farmers')}</option>
                <option value="Education & Scholarships">{translateCategory('Education & Scholarships')}</option>
                <option value="Healthcare">{translateCategory('Healthcare')}</option>
                <option value="Housing">{translateCategory('Housing')}</option>
                <option value="Social Welfare & Financial Assistance">{translateCategory('Social Welfare & Financial Assistance')}</option>
                <option value="Women & Child Welfare">{translateCategory('Women & Child Welfare')}</option>
                <option value="Employment & Skills">{translateCategory('Employment & Skills')}</option>
              </select>
              <i className="fa fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="filter-group">
            <label>{t('stateRegion', 'State / Region')}</label>
            <div className="select-wrap">
              <i className="fa fa-map-marker-alt select-prefix-icon"></i>
              <select 
                value={searchFilters.state} 
                onChange={(e) => setSearchFilters({...searchFilters, state: e.target.value})}
              >
                <option value="Maharashtra">{translateStateName('Maharashtra', currentLanguage)}</option>
                <option value="Delhi">{translateStateName('Delhi', currentLanguage)}</option>
                <option value="Gujarat">{translateStateName('Gujarat', currentLanguage)}</option>
                <option value="Uttar Pradesh">{translateStateName('Uttar Pradesh', currentLanguage)}</option>
                <option value="All India">{t('allIndiaCentral', 'All India / Central')}</option>
              </select>
              <i className="fa fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="filter-group">
            <label>{t('targetGroup', 'Target Group')}</label>
            <div className="select-wrap">
              <i className="fa fa-users select-prefix-icon"></i>
              <select 
                value={searchFilters.targetGroup} 
                onChange={(e) => setSearchFilters({...searchFilters, targetGroup: e.target.value})}
              >
                <option value="">{t('allCitizens', 'All Citizens')}</option>
                <option value="Farmer">{t('farmer', 'Farmer')}</option>
                <option value="Student">{t('student', 'Student')}</option>
                <option value="Women">{t('women', 'Women')}</option>
                <option value="Senior Citizen">{t('seniorCitizen', 'Senior Citizen')}</option>
                <option value="Entrepreneur">{t('msme', 'Small Business / MSME')}</option>
              </select>
              <i className="fa fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="filter-group">
            <label>{t('keyword', 'Keyword')}</label>
            <div className="select-wrap">
              <i className="fa fa-search select-prefix-icon"></i>
              <input
                type="text"
                placeholder={t('keywordPlaceholder', 'e.g. Scholarship, Loan, Subsidy...')}
                value={searchFilters.keyword}
                onChange={(e) => setSearchFilters({...searchFilters, keyword: e.target.value})}
                style={{ width: '100%', height: '42px', padding: '0 12px 0 38px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13.5px' }}
              />
            </div>
          </div>
        </div>

        <div className="filter-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button" 
            className="filter-btn reset-btn"
            onClick={() => setSearchFilters({ category: '', state: profile?.profile?.state || '', targetGroup: '', gender: '', area: '', keyword: '' })}
            style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 500 }}
          >
            {t('reset', 'Reset')}
          </button>
          <button 
            type="button" 
            className="filter-btn submit-btn"
            onClick={handleSearch}
            style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: '#2e7d32', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa fa-search"></i> {t('findSchemesAction', 'Find Schemes')}
          </button>
        </div>
      </section>

      {/* Recommended Schemes Section */}
      <section className="schemes-section">
        <div className="schemes-header">
          <div>
            <h3>{t('topRecommendedSchemes', 'Top Recommended Schemes for You')}</h3>
            {(() => {
              const profObj = profile?.profile || profile || {};
              const isProfileIncomplete = !profObj.date_of_birth || 
                !profObj.occupation || 
                (profObj.profile_completion_percentage || 0) < 60;
              
              if (isProfileIncomplete) {
                return (
                  <div className="schemes-recommendation-note">
                    <i className="fa fa-fire"></i> {t('popularSchemesNotice', 'Showing popular and recently added schemes. Complete your profile for personalized matching.')}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <Link to="/explore" className="view-all-link">{t('viewAllSchemes', 'View All Schemes')} ({schemes.length > 0 ? '100+' : '0'}) →</Link>
        </div>

        <div className="schemes-grid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', padding: '50px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <i className="fa fa-spinner fa-spin" style={{ fontSize: '28px', color: '#16a34a' }}></i>
              <p style={{ color: '#64748b', fontSize: '14.5px', fontWeight: 500, margin: 0 }}>{t('loading', 'Loading your personalized schemes...')}</p>
            </div>
          ) : schemes.length > 0 ? (
            schemes.map((scheme) => {
              const isSaved = savedSchemes.some(s => s.id === scheme.id);
              const app = applicationService.getApplication(scheme.id);
              const isApplied = scheme.is_applied || app?.status === 'APPLIED';
              const isPlanning = app?.status === 'PLANNING';
              const isConsidering = app?.status === 'CONSIDERING';
              const govtBadgeClass = scheme.govt_level?.toLowerCase() === 'central' ? 'central' : 'state';
              
              return (
                <div 
                  key={scheme.id} 
                  className={`scheme-card ${isApplied ? 'card-already-applied' : ''}`} 
                  onClick={() => navigate(`/scheme/${scheme.id}`)} 
                  style={{ cursor: 'pointer' }}
                >
                  <div className="scheme-img">
                    <div className="scheme-img-placeholder agriculture-img">
                      <i className="fa fa-landmark"></i>
                    </div>
                  </div>
                  <div className="scheme-body">
                    <div className="scheme-tags">
                      <span className={`tag ${govtBadgeClass}`}>
                        {scheme.govt_level === 'STATE' ? `${translateStateName(scheme.state, currentLanguage) || ''} ${t('stateGovt', 'State Scheme')}` : t('centralGovt', 'Central Scheme')}
                      </span>
                      <span className="tag category">
                        {translateCategory(scheme.category?.name || scheme.category_name || 'General Welfare')}
                      </span>
                      {isApplied && (
                        <span className="tag applied">
                          <i className="fa fa-check-circle"></i> {t('alreadyApplied', 'Already Applied')}
                        </span>
                      )}
                      {!isApplied && isPlanning && (
                        <span className="tag planning">
                          <i className="fa fa-clock"></i> {t('planningToApply', 'Planning to Apply')}
                        </span>
                      )}
                      {!isApplied && isConsidering && (
                        <span className="tag considering">
                          <i className="fa fa-bookmark"></i> {t('shortlisted', 'Shortlisted')}
                        </span>
                      )}
                    </div>

                    <div className="scheme-title-row">
                      <h4>{translateSchemeTitle(scheme.name, currentLanguage)}</h4>
                      <div className="scheme-right-meta">
                        <button 
                          className={`bookmark-btn ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                          onClick={(e) => handleBookmark(scheme.id, e)}
                          title={isMaintenanceMode ? t('featureDisabledMaintenance', 'Bookmarking is disabled during platform maintenance') : (isSaved ? t('saved', "Saved") : t('saveScheme', "Save Scheme"))}
                          style={{
                            color: isSaved ? '#2e7d32' : '#94a3b8',
                            opacity: isMaintenanceMode ? 0.45 : 1,
                            cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <i className={`fa${isSaved ? 's' : 'r'} fa-bookmark`}></i>
                        </button>
                      </div>
                    </div>

                    {scheme.match_score ? (
                      <div className="dashboard-match-row">
                        <span className="dashboard-match-badge">
                          <i className="fa fa-bolt"></i> {scheme.match_score}% {t('profileMatch', 'Profile Match')}
                        </span>
                        {scheme.match_reasons && scheme.match_reasons.length > 0 && (
                          <span className="dashboard-match-reason">
                            • {scheme.match_reasons[0]}
                          </span>
                        )}
                      </div>
                    ) : null}

                    <p className="scheme-desc">
                      {(() => {
                        const rawDesc = scheme.description || 'Government assisted financial and welfare scheme.';
                        const trans = translateSchemeText(rawDesc, currentLanguage);
                        return trans.length > 140 ? trans.slice(0, 140) + '...' : trans;
                      })()}
                    </p>

                    <div className="scheme-footer">
                      <div className="scheme-meta-tags">
                        <span className="meta-tag eligible"><i className="fa fa-check-circle"></i> {t('verified', 'Verified')}</span>
                        <span className="meta-tag"><i className="fa fa-globe"></i> {translateMode(scheme.application_mode) || 'Online'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isApplied && (
                          <button 
                            className="view-details-btn applied-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMaintenanceMode) {
                                showMaintenanceAlert('Application tracking');
                                return;
                              }
                              navigate('/applications');
                            }}
                            title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "View your tracked submission in My Applications"}
                          >
                            <i className="fa fa-list-check"></i> {t('inApplications', 'In Applications')}
                          </button>
                        )}
                        <button 
                          className="view-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scheme/${scheme.id}`);
                          }}
                        >
                          {t('viewDetails', 'View Details →')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '10px' }}>
              <p style={{ color: '#64748b', fontSize: '15px' }}>{t('noSchemesFoundDesc', 'No schemes currently match this filter.')}</p>
              <Link to="/explore" style={{ display: 'inline-block', marginTop: '12px', color: '#2e7d32', fontWeight: 600 }}>
                {t('exploreAllSchemes', 'Explore all 100 Government Schemes →')}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Onboarding / Recommendation Setup Modal */}
      <ProfileOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={(updatedData) => {
          if (updatedData) {
            setProfile(prev => {
              const updated = {
                ...prev,
                profile: {
                  ...(prev?.profile || {}),
                  ...updatedData,
                  profile_completion_percentage: 100
                }
              };
              try {
                sessionStorage.setItem('schemesathi_user_profile', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
          loadDashboardData();
        }}
        initialProfile={profile}
      />
    </DashboardLayout>
  );
}