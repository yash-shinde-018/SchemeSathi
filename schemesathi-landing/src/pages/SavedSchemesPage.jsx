import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import applicationService, { APPLICATIONS_UPDATED_EVENT } from '../services/applicationService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { translateSchemeTitle, translateAuthorityName, translateSchemeText } from '../utils/schemeTranslator';
import './SavedSchemesPage.css';

export default function SavedSchemesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, translateCategory, currentLanguage } = useLanguage();
  const { isMaintenanceMode, showMaintenanceAlert } = useSystemSettings();
  
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [applications, setApplications] = useState(() => applicationService.getApplications());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchSavedSchemes();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleAppsUpdate = () => {
      setApplications(applicationService.getApplications());
    };
    window.addEventListener(APPLICATIONS_UPDATED_EVENT, handleAppsUpdate);
    return () => window.removeEventListener(APPLICATIONS_UPDATED_EVENT, handleAppsUpdate);
  }, []);

  const fetchSavedSchemes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.schemes.getSaved(1, 50);
      if (response?.success) {
        setSavedSchemes(response.data || response.schemes || []);
      } else {
        if (response?.error !== 'UNAUTHORIZED' && response?.message !== 'Authentication required') {
          setError(response?.message || 'Failed to load saved schemes');
        }
      }
    } catch (err) {
      if (err.status !== 401 && err.code !== 'UNAUTHORIZED' && err.message !== 'Authentication required') {
        setError(err.message || 'Error loading saved schemes');
      }
      console.error('Saved schemes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (schemeId, e) => {
    if (e) e.stopPropagation();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Removing schemes from saved');
      return;
    }
    try {
      const response = await apiClient.schemes.unsave(schemeId);
      if (response.success) {
        setSavedSchemes(prev => prev.filter(s => s.id !== schemeId));
      }
    } catch (err) {
      alert('Error removing scheme from bookmarks.');
    }
  };

  const filteredSchemes = savedSchemes.filter(scheme => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      scheme.name?.toLowerCase().includes(term) ||
      scheme.description?.toLowerCase().includes(term) ||
      scheme.ministry?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout activePage="saved">
      <div className="saved-page-wrapper">
        {/* Header Box */}
        <div className="saved-header-box">
          <div className="saved-header-left">
            <h2>
              <i className="fa fa-bookmark"></i> {t('mySavedSchemes', 'My Saved Schemes')}
            </h2>
            <p>{t('savedSchemesDesc', 'Your bookmarked government welfare programs and scholarship schemes ready for quick review and application.')}</p>
          </div>
          <div className="saved-counter-badge">
            {savedSchemes.length} {t('savedCountBadge', 'Saved')}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 18px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Filter bar */}
        {savedSchemes.length > 0 && (
          <div className="saved-filter-bar">
            <input 
              type="text" 
              className="saved-search-input"
              placeholder={t('filterWithinSaved', 'Filter within your saved schemes...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {t('showing', 'Showing')} {filteredSchemes.length} {t('of', 'of')} {savedSchemes.length} {t('bookmarkedSchemes', 'bookmarked schemes')}
            </div>
          </div>
        )}

        {/* Schemes Grid or Empty State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '10px' }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: '28px', color: '#2e7d32', marginBottom: '12px' }}></i>
            <p style={{ color: '#64748b' }}>{t('loading', 'Loading your bookmarked schemes...')}</p>
          </div>
        ) : filteredSchemes.length > 0 ? (
          <div className="saved-grid">
            {filteredSchemes.map((scheme) => {
              const isCentral = scheme.govt_level?.toUpperCase() === 'CENTRAL';

              return (
                <div 
                  key={scheme.id} 
                  className="saved-scheme-card"
                  onClick={() => navigate(`/scheme/${scheme.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    {(() => {
                      const app = applicationService.getApplication(scheme.id);
                      const isApplied = app?.status === 'APPLIED';
                      const isPlanning = app?.status === 'PLANNING';
                      const isConsidering = app?.status === 'CONSIDERING';

                      return (
                        <div className="saved-tags-row">
                          <span className={`saved-pill ${isCentral ? 'central' : 'state'}`}>
                            {isCentral ? t('centralGovt', 'Central Govt') : `${scheme.state || ''} ${t('stateGovt', 'State Govt')}`}
                          </span>
                          <span className="saved-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                            {translateCategory(scheme.category?.name || scheme.category_name || 'Social Welfare')}
                          </span>
                          {isApplied && (
                            <span className="saved-pill applied">
                              <i className="fa fa-check-circle"></i> {t('alreadyApplied', 'Already Applied')}
                            </span>
                          )}
                          {!isApplied && isPlanning && (
                            <span className="saved-pill planning">
                              <i className="fa fa-clock"></i> {t('planningToApply', 'Planning')}
                            </span>
                          )}
                          {!isApplied && isConsidering && (
                            <span className="saved-pill considering">
                              <i className="fa fa-bookmark"></i> {t('shortlisted', 'Shortlisted')}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <h3 className="saved-card-title">{translateSchemeTitle(scheme.name, currentLanguage)}</h3>

                    <div className="saved-card-ministry">
                      <i className="fa fa-landmark"></i>
                      <span>{translateAuthorityName(scheme.ministry || scheme.ministry_department, currentLanguage)}</span>
                    </div>

                    <p className="saved-card-desc">
                      {(() => {
                        const rawDesc = scheme.description || 'Verified government benefit initiative.';
                        const trans = translateSchemeText(rawDesc, currentLanguage);
                        return trans.length > 140 ? trans.slice(0, 140) + '...' : trans;
                      })()}
                    </p>
                  </div>

                  <div className="saved-actions-footer">
                    <button 
                      type="button" 
                      className={`btn-remove-saved ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                      onClick={(e) => handleUnsave(scheme.id, e)}
                      title={isMaintenanceMode ? 'Disabled during platform maintenance' : t('remove', "Remove from saved")}
                      style={{
                        opacity: isMaintenanceMode ? 0.5 : 1,
                        cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <i className="fa fa-trash"></i> {t('remove', 'Remove')}
                    </button>

                    <button 
                      type="button" 
                      className="btn-apply-primary"
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
          <div className="saved-empty-container">
            <div className="saved-empty-icon">
              <i className="fa fa-bookmark"></i>
            </div>
            <h3>{searchTerm ? t('noResultsFound', 'No matching saved schemes') : t('noSchemesSavedYet', 'No schemes saved yet')}</h3>
            <p>
              {searchTerm 
                ? t('noSchemesFoundDesc', 'Try a different search term to find what you have saved.') 
                : t('browseCatalogToSave', 'Browse our catalog of 100+ verified government schemes and bookmark the ones you are eligible for to apply easily.')}
            </p>
            <Link 
              to="/explore" 
              className="btn-apply-primary explore-all-btn" 
              style={{ display: 'inline-flex', padding: '12px 28px', fontSize: '15px', color: '#ffffff', textDecoration: 'none' }}
            >
              <i className="fa fa-compass" style={{ marginRight: '8px', color: '#ffffff' }}></i> {t('exploreAllSchemes', 'Explore All Schemes')}
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
