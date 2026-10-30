import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import applicationService, { APPLICATIONS_UPDATED_EVENT } from '../services/applicationService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { translateSchemeTitle, translateAuthorityName, translateSchemeText, translateStateName } from '../utils/schemeTranslator';
import { fetchDynamicTranslations } from '../utils/dynamicTranslator';
import './ExploreSchemes.css';

export default function ExploreSchemes() {
  const { user } = useAuth();
  const { t, translateCategory, translateGovtLevel, translateMode, currentLanguage } = useLanguage();
  const { isMaintenanceMode, showMaintenanceAlert } = useSystemSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [schemes, setSchemes] = useState([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState(new Set());
  const [applications, setApplications] = useState(() => applicationService.getApplications());
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dynamicTranslations, setDynamicTranslations] = useState({});

  // Dynamic Translation for newly added schemes not present in static dictionary
  useEffect(() => {
    if (currentLanguage === 'en' || !schemes || schemes.length === 0) return;

    const textsToTranslate = [];
    schemes.forEach(s => {
      if (s.name) {
        const titleTrans = translateSchemeTitle(s.name, currentLanguage);
        if (titleTrans === s.name) {
          textsToTranslate.push(s.name);
        }
      }
      const auth = s.ministry || s.ministry_department;
      if (auth) {
        const authTrans = translateAuthorityName(auth, currentLanguage);
        if (authTrans === auth) {
          textsToTranslate.push(auth);
        }
      }
      if (s.description && typeof s.description === 'string' && s.description.length > 5) {
        const descTrans = translateSchemeText(s.description, currentLanguage);
        if (descTrans === s.description) {
          textsToTranslate.push(s.description);
        }
      }
    });

    if (textsToTranslate.length > 0) {
      fetchDynamicTranslations(textsToTranslate, currentLanguage).then(res => {
        if (res && Object.keys(res).length > 0) {
          setDynamicTranslations(prev => ({
            ...prev,
            [currentLanguage]: {
              ...(prev[currentLanguage] || {}),
              ...res
            }
          }));
        }
      });
    }
  }, [schemes, currentLanguage]);

  const langMap = dynamicTranslations[currentLanguage] || {};

  const trCardTitle = (title) => {
    if (!title || currentLanguage === 'en') return title || '';
    if (langMap[title]) return langMap[title];
    return translateSchemeTitle(title, currentLanguage, langMap);
  };

  const trCardAuth = (auth) => {
    if (!auth || currentLanguage === 'en') return auth || '';
    if (langMap[auth]) return langMap[auth];
    return translateAuthorityName(auth, currentLanguage);
  };

  const trCardDesc = (desc) => {
    if (!desc || currentLanguage === 'en') return desc || '';
    if (langMap[desc]) return langMap[desc];
    return translateSchemeText(desc, currentLanguage);
  };

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);

  const [categoriesList, setCategoriesList] = useState([
    { name: 'All', count: 100 },
    { name: 'Education & Scholarships', count: 24 },
    { name: 'Agriculture & Farmers', count: 13 },
    { name: 'Social Welfare & Financial Assistance', count: 12 },
    { name: 'Healthcare', count: 10 },
    { name: 'Women & Child Welfare', count: 10 },
    { name: 'Housing', count: 8 },
    { name: 'Employment & Skills', count: 7 },
    { name: 'Entrepreneurship & Business', count: 7 },
    { name: 'Senior Citizen & Disability', count: 4 },
    { name: 'Other', count: 5 }
  ]);

  // Update query and category state when URL parameter changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Load live categories with scheme counts from backend
  useEffect(() => {
    apiClient.schemes.categories()
      .then(res => {
        if (res?.success && (res.data || res.categories)) {
          setCategoriesList(res.data || res.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Load saved schemes IDs once for bookmark active state
  useEffect(() => {
    apiClient.schemes.getSaved(1, 100)
      .then(res => {
        if (res.success && (res.data || res.schemes)) {
          const ids = new Set((res.data || res.schemes).map(s => s.id));
          setSavedSchemeIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  // Listen to application updates across the app
  useEffect(() => {
    const handleAppsUpdate = () => {
      setApplications(applicationService.getApplications());
    };
    window.addEventListener(APPLICATIONS_UPDATED_EVENT, handleAppsUpdate);
    return () => window.removeEventListener(APPLICATIONS_UPDATED_EVENT, handleAppsUpdate);
  }, []);

  // Fetch schemes based on search, filter, and pagination
  useEffect(() => {
    fetchSchemes();
  }, [selectedCategory, levelFilter, modeFilter, sortBy, currentPage]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      let res;
      if (searchQuery.trim().length >= 2) {
        res = await apiClient.schemes.search(
          searchQuery.trim(),
          currentPage,
          12,
          selectedCategory !== 'All' ? selectedCategory : null
        );
      } else {
        const filters = {
          sort_by: sortBy,
          sort_order: 'asc'
        };
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (levelFilter !== 'All') filters.govt_level = levelFilter.toUpperCase();
        if (modeFilter !== 'All') filters.application_mode = modeFilter;

        res = await apiClient.schemes.filter(filters, currentPage, 12);
      }

      if (res?.success) {
        const items = res.data || res.schemes || [];
        setSchemes(items);
        setTotalCount(res.pagination?.total || items.length);
        setTotalPages(res.pagination?.pages || Math.ceil((res.pagination?.total || items.length) / 12) || 1);
      } else {
        setSchemes([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch schemes:', err);
      setSchemes([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Scheme search and filtering');
      return;
    }
    setCurrentPage(1);
    fetchSchemes();
  };

  const toggleBookmark = async (schemeId, e) => {
    if (e) e.stopPropagation();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Saving and bookmarking schemes');
      return;
    }
    try {
      const isSaved = savedSchemeIds.has(schemeId);
      if (isSaved) {
        await apiClient.schemes.unsave(schemeId);
        setSavedSchemeIds(prev => {
          const next = new Set(prev);
          next.delete(schemeId);
          return next;
        });
      } else {
        await apiClient.schemes.save(schemeId);
        setSavedSchemeIds(prev => new Set(prev).add(schemeId));
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  return (
    <DashboardLayout activePage="explore">
      <div className="find-schemes-wrapper">
        {/* Search & Category Filter Header Box */}
        <div className="find-header-box">
          <h2>{t('findGovernmentSchemes', 'Find Government Schemes')}</h2>
          <p>{t('findSchemesHeroDesc', 'Search over 100+ verified Central & State government schemes, welfare subsidies, and scholarship initiatives.')}</p>

          {/* Search Bar */}
          <form className="page-search-bar" onSubmit={handleSearchSubmit}>
            <div className="search-input-group">
              <i className="fa fa-search"></i>
              <input 
                type="text" 
                className="page-search-input"
                placeholder={isMaintenanceMode ? t('explorationPaused', 'Scheme exploration & search are paused in maintenance mode...') : t('searchBySchemePlaceholder', 'Search by scheme name, keywords, benefits or ministry...')}
                value={searchQuery}
                disabled={isMaintenanceMode}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="search-submit-btn"
              disabled={isMaintenanceMode}
              style={{
                opacity: isMaintenanceMode ? 0.6 : 1,
                cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fa fa-search"></i> {t('searchBtn', 'Search')}
            </button>
          </form>

          {/* Category Chips */}
          <div className="category-chips-row">
            {categoriesList.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`cat-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                disabled={isMaintenanceMode}
                style={{
                  opacity: isMaintenanceMode ? 0.55 : 1,
                  cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                }}
                onClick={() => {
                  if (isMaintenanceMode) {
                    showMaintenanceAlert('Category filtering');
                    return;
                  }
                  setSelectedCategory(cat.name);
                  setCurrentPage(1);
                }}
              >
                {cat.name === 'All' ? t('allCategories', 'All Categories') : translateCategory(cat.name)} ({cat.count})
              </button>
            ))}
          </div>

          {/* Secondary Filters Bar */}
          <div className="secondary-filters-bar">
            <div className="filters-left-group">
              <select 
                className="filter-select-mini"
                value={levelFilter}
                onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">{t('govtLevelAll', 'Govt Level: All')}</option>
                <option value="Central">{t('centralGovt', 'Central Govt')}</option>
                <option value="State">{t('stateGovt', 'State Govt')}</option>
              </select>

              <select 
                className="filter-select-mini"
                value={modeFilter}
                onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">{t('allModes', 'Application: All Modes')}</option>
                <option value="Online">{t('onlineApplication', 'Online Application')}</option>
                <option value="Offline">{t('offlineApplication', 'Offline / CSC Center')}</option>
              </select>

              <select 
                className="filter-select-mini"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">{t('sortByName', 'Sort by: Name (A-Z)')}</option>
                <option value="created_at">{t('sortByRecent', 'Sort by: Recently Added')}</option>
              </select>
            </div>

            <div className="results-count-text">
              {t('showing', 'Showing')} {schemes.length} {t('of', 'of')} {totalCount} {t('schemes', 'schemes')}
            </div>
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '10px' }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: '28px', color: '#2e7d32', marginBottom: '12px' }}></i>
            <p style={{ color: '#64748b' }}>{t('loading', 'Loading...')}</p>
          </div>
        ) : schemes.length > 0 ? (
          <div className="explore-grid-container">
            {schemes.map((scheme) => {
              const isSaved = savedSchemeIds.has(scheme.id);
              const isCentral = scheme.govt_level?.toUpperCase() === 'CENTRAL';
              const app = applicationService.getApplication(scheme.id);
              const isApplied = app?.status === 'APPLIED';
              const isPlanning = app?.status === 'PLANNING';
              const isConsidering = app?.status === 'CONSIDERING';

              return (
                <div 
                  key={scheme.id} 
                  className={`explore-card ${isApplied ? 'is-applied' : ''}`}
                  onClick={() => navigate(`/scheme/${scheme.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <button 
                    type="button"
                    className={`card-bookmark-btn ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                    onClick={(e) => toggleBookmark(scheme.id, e)}
                    title={isMaintenanceMode ? t('featureDisabledMaintenance', 'Bookmarking is disabled during platform maintenance') : (isSaved ? t('saved', "Saved") : t('saveScheme', "Bookmark Scheme"))}
                    style={{
                      color: isSaved ? '#2e7d32' : '#94a3b8',
                      opacity: isMaintenanceMode ? 0.45 : 1,
                      cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className={`fa${isSaved ? 's' : 'r'} fa-bookmark`}></i>
                  </button>

                  <div>
                    <div className="card-top-tags">
                      <span className={`card-pill-tag ${isCentral ? 'central' : 'state'}`}>
                        {isCentral ? t('centralGovt', 'Central Govt') : `${translateStateName(scheme.state, currentLanguage) || ''} ${t('stateGovt', 'State Govt')}`}
                      </span>
                      <span className="card-pill-tag category">
                        {translateCategory(scheme.category?.name || scheme.category_name || 'Social Welfare')}
                      </span>
                      {isApplied && (
                        <span className="card-pill-tag applied">
                          <i className="fa fa-check-circle"></i> {t('alreadyApplied', 'Already Applied')}
                        </span>
                      )}
                      {!isApplied && isPlanning && (
                        <span className="card-pill-tag planning">
                          <i className="fa fa-clock"></i> {t('planningToApply', 'Planning')}
                        </span>
                      )}
                      {!isApplied && isConsidering && (
                        <span className="card-pill-tag considering">
                          <i className="fa fa-bookmark"></i> {t('shortlisted', 'Shortlisted')}
                        </span>
                      )}
                    </div>

                    <h3 className="explore-card-title">{trCardTitle(scheme.name)}</h3>

                    <div className="explore-card-ministry">
                      <i className="fa fa-building-columns"></i>
                      <span>{trCardAuth(scheme.ministry || scheme.ministry_department)}</span>
                    </div>

                    <p className="explore-card-desc">
                      {(() => {
                        const rawDesc = scheme.description || 'Comprehensive government benefit program.';
                        const trans = trCardDesc(rawDesc);
                        return trans.length > 135 ? trans.slice(0, 135) + '...' : trans;
                      })()}
                    </p>
                  </div>

                  <div className="card-footer-meta">
                    <span className="meta-mode-badge">
                      <i className="fa fa-circle-check"></i> {translateMode(scheme.application_mode) || t('onlineApplication', 'Online Application')}
                    </span>
                    <button 
                      type="button" 
                      className="card-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/scheme/${scheme.id}`);
                      }}
                    >
                      {t('viewDetails', 'View Details →')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '10px' }}>
            <i className="fa fa-search" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '14px' }}></i>
            <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>{t('noSchemesFoundTitle', 'No schemes found')}</h3>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>{t('noSchemesFoundDesc', 'Try searching for a different keyword or resetting your category filter.')}</p>
            <button 
              type="button"
              className="search-submit-btn"
              style={{ margin: '0 auto', display: 'inline-flex' }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setLevelFilter('All');
                setModeFilter('All');
                setCurrentPage(1);
              }}
            >
              {t('resetFilters', 'Reset Filters')}
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <button 
              type="button"
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <i className="fa fa-chevron-left"></i> {t('previous', 'Previous')}
            </button>

            <span className="page-indicator-text">
              {t('page', 'Page')} {currentPage} {t('of', 'of')} {totalPages}
            </span>

            <button 
              type="button"
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              {t('next', 'Next')} <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
