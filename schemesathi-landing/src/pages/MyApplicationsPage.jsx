import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSystemSettings } from '../context/SystemSettingsContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import applicationService, { APPLICATIONS_UPDATED_EVENT } from '../services/applicationService';
import { translateSchemeTitle, translateAuthorityName } from '../utils/schemeTranslator';
import './MyApplicationsPage.css';

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const { t, translateCategory, translateStatus, currentLanguage } = useLanguage();
  const { isMaintenanceMode, showMaintenanceAlert } = useSystemSettings();
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Mark as applied modal state
  const [markingModalOpen, setMarkingModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appNumberInput, setAppNumberInput] = useState('');
  const [appDateInput, setAppDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [appNotesInput, setAppNotesInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadApplications = () => {
    const list = applicationService.getApplications();
    setApplications(list);
  };

  useEffect(() => {
    loadApplications();
    applicationService.syncWithBackend();

    const handleUpdate = () => loadApplications();
    window.addEventListener(APPLICATIONS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(APPLICATIONS_UPDATED_EVENT, handleUpdate);
  }, []);

  // Stats calculation
  const totalCount = applications.length;
  const appliedCount = applications.filter(a => a.status === 'APPLIED').length;
  const planningCount = applications.filter(a => a.status === 'PLANNING').length;
  const consideringCount = applications.filter(a => a.status === 'CONSIDERING').length;

  // Filtered applications
  const filteredApps = applications.filter(app => {
    // Status filter
    if (activeFilter !== 'ALL' && app.status !== activeFilter) {
      return false;
    }
    // Search query filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = app.schemeName?.toLowerCase().includes(term);
      const catMatch = app.category?.toLowerCase().includes(term);
      const minMatch = app.ministry?.toLowerCase().includes(term);
      const refMatch = app.applicationNumber?.toLowerCase().includes(term);
      return nameMatch || catMatch || minMatch || refMatch;
    }
    return true;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenMarkApplied = (app) => {
    if (isMaintenanceMode) {
      showMaintenanceAlert('Application tracking updates');
      return;
    }
    setSelectedApp(app);
    setAppNumberInput(app.applicationNumber || '');
    setAppDateInput(app.appliedDate ? app.appliedDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setAppNotesInput(app.notes || '');
    setMarkingModalOpen(true);
  };

  const handleConfirmMarkApplied = async (e) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Application tracking');
      return;
    }
    if (!selectedApp) return;

    await applicationService.markAsApplied(selectedApp.schemeId, {
      applicationNumber: appNumberInput.trim(),
      appliedDate: appDateInput,
      notes: appNotesInput.trim()
    });

    setMarkingModalOpen(false);
    showToast(`Marked ${selectedApp.schemeName} as Applied on the official portal! Recommendations updated.`);
    loadApplications();
  };

  const handlePromoteToPlanning = async (schemeId, schemeName) => {
    if (isMaintenanceMode) {
      showMaintenanceAlert('Application status updates');
      return;
    }
    applicationService.updateStatus(schemeId, 'PLANNING');
    showToast(`${schemeName} moved to Planning to Apply!`);
    loadApplications();
  };

  const handleOpenDelete = (app, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isMaintenanceMode) {
      showMaintenanceAlert('Application removal');
      return;
    }
    setAppToDelete(app);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = appToDelete.schemeId ?? appToDelete.scheme_id ?? appToDelete.id;
      const targetName = appToDelete.schemeName || 'Scheme';
      await applicationService.removeApplication(targetId);
      setDeleteModalOpen(false);
      setAppToDelete(null);
      showToast(`Removed "${targetName}" from My Applications.`);
      loadApplications();
    } catch (err) {
      console.error('Delete application error:', err);
      showToast('Failed to remove application.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <DashboardLayout activePage="applications">
      <div className="applications-page-wrapper">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="app-toast-alert">
            <i className="fa fa-circle-check"></i>
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="app-toast-close">
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}

        {/* Header Box */}
        <div className="applications-header-box">
          <div className="applications-header-left">
            <h2>
              <i className="fa fa-file-signature"></i> {t('mySchemeApplications', 'My Scheme Applications')}
            </h2>
            <p>
              {t('myAppsHeaderDesc', 'Track schemes you are planning to apply for, record submission details from official portals, and keep your eligibility recommendations updated.')}
            </p>
          </div>
          <Link to="/explore" className="btn-new-app">
            <i className="fa fa-plus"></i> {t('findMoreSchemes', 'Find More Schemes')}
          </Link>
        </div>

        {/* Practical Portal Clarification Card */}
        <div className="app-mechanism-explainer">
          <div className="explainer-icon">
            <i className="fa fa-shield-halved"></i>
          </div>
          <div className="explainer-text">
            <strong>{t('howTrackingWorks', 'How Application Tracking Works:')}</strong>
            <p>
              {t('howTrackingDesc', 'Government scheme applications are submitted directly through official central/state portals or local designated offices. Once you apply on the official portal, click "Mark as Applied" below to record your application details and update your personalized scheme recommendations!')}
            </p>
          </div>
        </div>

        {/* Maintenance Mode Lockdown Alert */}
        {isMaintenanceMode && (
          <div style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
            border: '1.5px solid #f87171',
            borderRadius: '14px',
            padding: '14px 20px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#991b1b',
            fontSize: '13.5px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            <i className="fa fa-lock" style={{ fontSize: '16px', color: '#dc2626' }}></i>
            <span>{t('applicationsLockedDesc', 'Application tracking, status updates, and submission recordings are temporarily paused while platform maintenance is active.')}</span>
          </div>
        )}

        {/* Pipeline Summary Cards */}
        <div className="pipeline-stats-grid">
          <div 
            className={`pipeline-card ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            <div className="pipeline-icon-badge all"><i className="fa fa-folder-open"></i></div>
            <div>
              <div className="pipeline-count">{totalCount}</div>
              <div className="pipeline-label">{t('allApplications', 'All Applications')}</div>
            </div>
          </div>

          <div 
            className={`pipeline-card ${activeFilter === 'APPLIED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('APPLIED')}
          >
            <div className="pipeline-icon-badge approved"><i className="fa fa-circle-check"></i></div>
            <div>
              <div className="pipeline-count">{appliedCount}</div>
              <div className="pipeline-label">{t('appliedOfficialPortal', 'Applied (Official Portal)')}</div>
            </div>
          </div>

          <div 
            className={`pipeline-card ${activeFilter === 'PLANNING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PLANNING')}
          >
            <div className="pipeline-icon-badge review"><i className="fa fa-hourglass-start"></i></div>
            <div>
              <div className="pipeline-count">{planningCount}</div>
              <div className="pipeline-label">{t('planningToApply', 'Planning to Apply')}</div>
            </div>
          </div>

          <div 
            className={`pipeline-card ${activeFilter === 'CONSIDERING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('CONSIDERING')}
          >
            <div className="pipeline-icon-badge action"><i className="fa fa-clock"></i></div>
            <div>
              <div className="pipeline-count">{consideringCount}</div>
              <div className="pipeline-label">{t('consideringShortlist', 'Considering / Shortlist')}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="applications-search-bar">
          <div className="search-input-wrap">
            <i className="fa fa-search search-icon"></i>
            <input 
              type="text"
              placeholder={t('searchAppsPlaceholder', 'Search by scheme name, category, or application ref number...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
          <div className="filter-pills-row">
            <button 
              className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              {t('all', 'All')} ({totalCount})
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'APPLIED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('APPLIED')}
            >
              {t('statusApplied', 'Applied')} ({appliedCount})
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'PLANNING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('PLANNING')}
            >
              {t('planningToApply', 'Planning')} ({planningCount})
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'CONSIDERING' ? 'active' : ''}`}
              onClick={() => setActiveFilter('CONSIDERING')}
            >
              {t('shortlisted', 'Considering')} ({consideringCount})
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div className="applications-list-container">
          {filteredApps.length === 0 ? (
            <div className="empty-applications-card">
              <div className="empty-icon-box">
                <i className="fa fa-file-circle-question"></i>
              </div>
              <h3>{t('noApplications', 'No Applications Found')}</h3>
              <p>
                {searchTerm 
                  ? `${t('noResultsFound', 'No applications matching')} "${searchTerm}".`
                  : activeFilter === 'APPLIED'
                  ? t('noApplicationsSub', 'You have not marked any schemes as applied yet. When you submit an application on an official government portal, mark it as applied here.')
                  : activeFilter === 'PLANNING'
                  ? t('noApplicationsSub', 'No schemes in your planning list. Explore schemes and select "Yes, I want to apply" to track them here.')
                  : t('noApplicationsSub', 'Start exploring schemes to add them to your application tracker.')}
              </p>
              <Link to="/explore" className="btn-explore-empty">
                <i className="fa fa-compass"></i> {t('exploreAllSchemes', 'Explore All Government Schemes')}
              </Link>
            </div>
          ) : (
            <div className="applications-cards-grid">
              {filteredApps.map((app) => {
                const isApplied = app.status === 'APPLIED';
                const isPlanning = app.status === 'PLANNING';
                const isConsidering = app.status === 'CONSIDERING';

                return (
                  <div key={app.id || app.schemeId} className={`app-card-item ${app.status.toLowerCase()}`}>
                    {/* Top Status & Meta Row */}
                    <div className="app-card-top">
                      <div className="app-card-badges">
                        <span className="app-tag-category">
                          <i className={`fa fa-${app.categoryIcon || 'landmark'}`}></i>
                          {translateCategory(app.category || 'General Welfare')}
                        </span>
                        <span className="app-tag-level">
                          <i className="fa fa-map-marker-alt"></i> {app.state || 'All India'}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {isApplied && (
                        <span className="status-badge-chip applied">
                          <i className="fa fa-circle-check"></i> {t('appliedOfficialPortal', 'Applied on Official Portal')}
                        </span>
                      )}
                      {isPlanning && (
                        <span className="status-badge-chip planning">
                          <i className="fa fa-hourglass-start"></i> {t('planningToApply', 'Planning to Apply')}
                        </span>
                      )}
                      {isConsidering && (
                        <span className="status-badge-chip considering">
                          <i className="fa fa-clock"></i> {t('shortlisted', 'Considering')}
                        </span>
                      )}
                    </div>

                    {/* Scheme Name & Ministry */}
                    <div className="app-card-body">
                      <h3 className="app-scheme-title">
                        <Link to={`/scheme/${app.schemeId}`}>{translateSchemeTitle(app.schemeName, currentLanguage)}</Link>
                      </h3>
                      <p className="app-ministry-name">
                        <i className="fa fa-building-columns"></i> {translateAuthorityName(app.ministry, currentLanguage)}
                      </p>

                      {/* Benefit info */}
                      {app.benefitValue && (
                        <div className="app-benefit-box">
                          <i className="fa fa-gift"></i>
                          <span>{app.benefitValue}</span>
                        </div>
                      )}

                      {/* Submission / Tracking Details */}
                      <div className="app-tracking-meta-grid">
                        <div className="meta-cell">
                          <span className="meta-cell-label">{t('dateTracked', 'Date Tracked')}</span>
                          <span className="meta-cell-value">{formatDate(app.savedDate)}</span>
                        </div>

                        {isApplied && (
                          <div className="meta-cell highlight-green">
                            <span className="meta-cell-label">{t('appliedDate', 'Applied Date')}</span>
                            <span className="meta-cell-value">{formatDate(app.appliedDate)}</span>
                          </div>
                        )}

                        {isApplied && (
                          <div className="meta-cell highlight-blue">
                            <span className="meta-cell-label">{t('appRefNumber', 'Application / Ref #')}</span>
                            <span className="meta-cell-value">{app.applicationNumber || 'None specified'}</span>
                          </div>
                        )}

                        {!isApplied && (
                          <div className="meta-cell">
                            <span className="meta-cell-label">{t('citizenIntent', 'Citizen Intent')}</span>
                            <span className="meta-cell-value">
                              {isPlanning ? t('wantsToApply', 'Yes (Wants to Apply)') : t('maybeConsidering', 'Maybe (Considering)')}
                            </span>
                          </div>
                        )}
                      </div>

                      {app.notes && (
                        <div className="app-notes-snippet">
                          <i className="fa fa-note-sticky"></i>
                          <span>{app.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="app-card-actions">
                      <div className="actions-left">
                        {/* Primary Action: Mark as Applied */}
                        {!isApplied ? (
                          <button
                            type="button"
                            className={`btn-action-apply ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                            onClick={() => handleOpenMarkApplied(app)}
                            disabled={isMaintenanceMode}
                            style={{
                              opacity: isMaintenanceMode ? 0.45 : 1,
                              cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                            }}
                            title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Click when you have submitted on the official portal"}
                          >
                            <i className="fa fa-check-circle"></i>
                            <span>{t('markAsApplied', 'Mark as Applied')}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`btn-action-update-ref ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                            onClick={() => handleOpenMarkApplied(app)}
                            disabled={isMaintenanceMode}
                            style={{
                              opacity: isMaintenanceMode ? 0.45 : 1,
                              cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                            }}
                            title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Update Application / Reference Number"}
                          >
                            <i className="fa fa-pen-to-square"></i>
                            <span>{t('updateRefDetails', 'Update Ref Details')}</span>
                          </button>
                        )}

                        {/* Secondary: Launch Official Portal */}
                        {app.officialUrl && (
                          <a
                            href={app.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-action-launch-portal"
                            title="Open external government application portal"
                          >
                            <i className="fa fa-arrow-up-right-from-square"></i>
                            <span>{t('officialPortal', 'Official Portal')}</span>
                          </a>
                        )}

                        {/* If Considering: Option to promote to Planning */}
                        {isConsidering && (
                          <button
                            type="button"
                            className={`btn-action-promote ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                            onClick={() => handlePromoteToPlanning(app.schemeId, app.schemeName)}
                            disabled={isMaintenanceMode}
                            style={{
                              opacity: isMaintenanceMode ? 0.45 : 1,
                              cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                            }}
                            title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Move to Planning list"}
                          >
                            <i className="fa fa-arrow-up"></i>
                            <span>{t('planToApply', 'Plan to Apply')}</span>
                          </button>
                        )}
                      </div>

                      <div className="actions-right">
                        {/* View Guide */}
                        <Link
                          to={`/scheme/${app.schemeId}`}
                          className="btn-action-guide"
                          title="View scheme details and application flowchart"
                        >
                          <i className="fa fa-sitemap"></i> {t('guide', 'Guide')}
                        </Link>

                        {/* Remove */}
                        <button
                          type="button"
                          className={`btn-action-remove ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                          onClick={(e) => handleOpenDelete(app, e)}
                          disabled={isMaintenanceMode}
                          style={{
                            opacity: isMaintenanceMode ? 0.45 : 1,
                            cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                          }}
                          title={isMaintenanceMode ? t('appTrackingDisabledMaintenance', 'Application tracking is disabled during platform maintenance') : "Remove from applications"}
                          aria-label={`Remove ${app.schemeName}`}
                        >
                          <i className="fa fa-trash"></i>
                          <span>{t('delete', 'Delete')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            MARK AS APPLIED INTERACTIVE MODAL
           ========================================================================= */}
        {markingModalOpen && selectedApp && (
          <div className="modal-backdrop-overlay" onClick={() => setMarkingModalOpen(false)}>
            <div className="mark-applied-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-card-header">
                <div className="modal-header-icon">
                  <i className="fa fa-clipboard-check"></i>
                </div>
                <div>
                  <h3>{t('recordOfficialApp', 'Record Official Application')}</h3>
                  <p>{t('recordOfficialAppSub', 'Confirm that you have submitted your application on the official portal.')}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setMarkingModalOpen(false)}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleConfirmMarkApplied} className="mark-applied-form">
                <div className="form-scheme-summary">
                  <span className="summary-label">{t('schemeOverview', 'Scheme Name')}:</span>
                  <span className="summary-scheme-title">{selectedApp.schemeName}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="appNumberInput">
                    {t('appAckOptional', 'Application / Acknowledgment Number (Optional)')}
                  </label>
                  <input
                    id="appNumberInput"
                    type="text"
                    placeholder={t('appAckPlaceholder', 'e.g. MH-2026-89412 or ACK-98214')}
                    value={appNumberInput}
                    onChange={(e) => setAppNumberInput(e.target.value)}
                  />
                  <span className="field-hint">
                    {t('appAckHint', 'Enter the reference number provided by the official portal after form submission.')}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="appDateInput">
                    {t('submissionDate', 'Submission Date')} <span className="req">*</span>
                  </label>
                  <input
                    id="appDateInput"
                    type="date"
                    required
                    value={appDateInput}
                    onChange={(e) => setAppDateInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="appNotesInput">
                    {t('personalNotesOptional', 'Personal Notes / Remarks (Optional)')}
                  </label>
                  <textarea
                    id="appNotesInput"
                    rows="2"
                    placeholder="e.g. Submitted documents online; waiting for district officer verification."
                    value={appNotesInput}
                    onChange={(e) => setAppNotesInput(e.target.value)}
                  />
                </div>

                <div className="modal-form-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setMarkingModalOpen(false)}
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-confirm"
                  >
                    <i className="fa fa-check"></i> {t('confirmAsApplied', 'Confirm as Applied')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            DELETE APPLICATION CONFIRMATION MODAL
           ========================================================================= */}
        {deleteModalOpen && appToDelete && (
          <div className="modal-backdrop-overlay" onClick={() => !isDeleting && setDeleteModalOpen(false)}>
            <div className="delete-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <div className="delete-modal-icon-badge">
                  <i className="fa fa-trash-can"></i>
                </div>
                <div>
                  <h3>{t('removeFromApps', 'Remove from Applications?')}</h3>
                  <p className="delete-modal-subtitle">{t('confirmRemoveAppSub', 'Confirm removing this scheme from your tracked list')}</p>
                </div>
              </div>

              <div className="delete-modal-content">
                <p>
                  {t('areYouSureRemove', 'Are you sure you want to remove')} <strong>"{appToDelete.schemeName}"</strong> {t('fromYourApplications', 'from your applications?')}
                </p>
                <div className="delete-scheme-summary">
                  <div className="summary-row">
                    <span className="summary-lbl">{t('category', 'Category')}:</span>
                    <span className="summary-val">{translateCategory(appToDelete.category)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-lbl">{t('status', 'Status')}:</span>
                    <span className="summary-val status-val">
                      {appToDelete.status === 'APPLIED' ? t('appliedOfficialPortal', 'Applied on Official Portal') : appToDelete.status === 'PLANNING' ? t('planningToApply', 'Planning to Apply') : t('shortlisted', 'Considering')}
                    </span>
                  </div>
                  {appToDelete.applicationNumber && (
                    <div className="summary-row">
                      <span className="summary-lbl">{t('appRefNumber', 'Ref Number')}:</span>
                      <span className="summary-val">{appToDelete.applicationNumber}</span>
                    </div>
                  )}
                </div>
                <div className="delete-notice-tip">
                  <i className="fa fa-info-circle"></i>
                  <span>This will remove this item from your applications list and update your dashboard recommendations. You can always re-track or re-apply anytime.</span>
                </div>
              </div>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  className="btn-delete-confirm-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i>
                      <span>{t('loading', 'Removing...')}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-trash"></i>
                      <span>{t('yesRemoveScheme', 'Yes, Remove Scheme')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
