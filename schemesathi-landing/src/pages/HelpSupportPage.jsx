import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useLanguage } from '../context/LanguageContext';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import notificationService from '../services/notificationService';
import { fetchDynamicTranslations } from '../utils/dynamicTranslator';
import './HelpSupportPage.css';

const HelpSupportPage = () => {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Support Tab state: 'submit' (form), 'my-tickets' (history & replies), 'track' (lookup by ID)
  const [supportTab, setSupportTab] = useState('submit');
  const [myQueries, setMyQueries] = useState([]);
  const [trackTicketInput, setTrackTicketInput] = useState('');
  const [trackedQuery, setTrackedQuery] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [dynamicTranslations, setDynamicTranslations] = useState({});
  
  // Query form state
  const [formData, setFormData] = useState({
    name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Citizen User',
    email: user?.email || '',
    category: 'Scheme Recommendations',
    applicationId: '',
    subject: '',
    description: ''
  });
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isMaintenanceMode, allowQueries, showMaintenanceAlert } = useSystemSettings();

  // Fetch citizen's submitted queries and admin replies
  const fetchMyQueries = async () => {
    try {
      const res = await apiClient('/notifications/my-queries');
      if (res.success && Array.isArray(res.data)) {
        setMyQueries(res.data);
      }
    } catch (err) {
      console.warn('Error loading queries:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : prev.name,
        email: user.email || prev.email
      }));
    }
    fetchMyQueries();

    // Listen to real-time storage and broadcast events for support replies
    const handleStorage = (e) => {
      if (e.key === 'schemesathi_support_reply_ping' || e.key === 'schemesathi_broadcast_ping') {
        fetchMyQueries();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  // Dynamically translate admin replies into user's selected language
  useEffect(() => {
    if (currentLanguage === 'en') return;

    const textsToTranslate = [];
    if (myQueries && myQueries.length > 0) {
      myQueries.forEach(q => {
        if (q.admin_reply && typeof q.admin_reply === 'string') {
          textsToTranslate.push(q.admin_reply);
        }
      });
    }
    if (trackedQuery && trackedQuery.admin_reply && typeof trackedQuery.admin_reply === 'string') {
      textsToTranslate.push(trackedQuery.admin_reply);
    }

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
  }, [myQueries, trackedQuery, currentLanguage]);

  const trReply = (reply) => {
    if (!reply || currentLanguage === 'en') return reply;
    return dynamicTranslations[currentLanguage]?.[reply] || reply;
  };

  const faqs = [
    {
      id: 1,
      category: 'recommendations',
      q: t('faqQ1', 'How does SchemeSathi find and recommend schemes for me?'),
      a: t('faqA1', 'SchemeSathi analyzes your profile details (age, occupation, education, state, annual income, social category, and residence type) against official eligibility rules. Our matching engine compares 100+ Central and State welfare programs to suggest only the schemes you qualify for.')
    },
    {
      id: 2,
      category: 'profile',
      q: t('faqQ2', 'Why is a 100% complete profile important for scheme recommendations?'),
      a: t('faqA2', 'Many welfare schemes have specific qualifying thresholds—such as maximum income ceilings, certain occupations (e.g. farmer, student, artisan), or state domicile rules. A 100% complete profile allows the recommendation engine to accurately calculate your match score and send alerts when matching schemes launch.')
    },
    {
      id: 3,
      category: 'scope',
      q: t('faqQ3', 'Are recommendations limited to Central schemes or do they include State schemes too?'),
      a: t('faqA3', 'SchemeSathi covers both Central Government flagship programs (like PM Surya Ghar, PM-KISAN, Ayushman Bharat, PMAY) as well as state-specific welfare initiatives (e.g. Maharashtra, Uttar Pradesh, Tamil Nadu, and more). You can filter by state or category on the Find Schemes page.')
    },
    {
      id: 4,
      category: 'application',
      q: t('faqQ4', 'How do I apply for a recommended scheme?'),
      a: t('faqA4', 'Every scheme card provides a direct "View Details" button outlining eligibility, benefits, and required documents, alongside an official "Apply on Official Portal" link directing you to verified government portals (.gov.in / .nic.in) for safe submission.')
    },
    {
      id: 5,
      category: 'saving',
      q: t('faqQ5', 'How can I save schemes to apply later and track them?'),
      a: t('faqA5', 'Click "Save Scheme" on any scheme card to bookmark it in your "Saved Schemes" page. When you finish applying on the government website, you can mark it as applied in SchemeSathi to monitor its progress in "My Applications".')
    },
    {
      id: 6,
      category: 'fees',
      q: t('faqQ6', 'Does SchemeSathi charge any fees for suggesting schemes or application guidance?'),
      a: t('faqA6', 'No. SchemeSathi is 100% free and open for all citizens. We do not collect fees, process financial transactions, or ask for sensitive banking credentials. All official applications are completed directly on legitimate government portals.')
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Query submission');
      return;
    }
    if (!formData.subject || !formData.description) return;

    setIsSubmitting(true);
    try {
      const ticketId = `GRV-${Math.floor(100000 + Math.random() * 900000)}`;

      await notificationService.submitQuery({
        ticketId,
        subject: formData.subject,
        category: formData.category,
        description: formData.description,
        applicationId: formData.applicationId,
        name: formData.name,
        email: formData.email
      });

      setSubmittedTicket({
        id: ticketId,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        category: formData.category,
        subject: formData.subject
      });

      // Refresh citizen's query history from database
      await fetchMyQueries();
      setFormData(prev => ({ ...prev, subject: '', description: '', applicationId: '' }));
    } catch (err) {
      console.error('Error submitting query:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackTicketLookup = async (e) => {
    if (e) e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Query ticket tracking');
      return;
    }
    if (!trackTicketInput.trim()) return;
    setIsTracking(true);
    setTrackError(null);
    setTrackedQuery(null);
    try {
      const res = await apiClient(`/notifications/track-query/${trackTicketInput.trim()}`);
      if (res.success && res.data) {
        setTrackedQuery(res.data);
      } else {
        setTrackError(`No inquiry found for Reference Ticket ID: ${trackTicketInput.trim()}`);
      }
    } catch (err) {
      setTrackError('Ticket not found. Please verify the reference number (e.g. GRV-XXXXXX).');
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <DashboardLayout activePage="help">
      <div className="help-page-wrapper">
        {/* Hero Support Banner */}
        <div className="help-hero-banner">
          <h2>{t('helpHeroTitle', 'How can SchemeSathi help you today?')}</h2>
          <p>
            {t('helpHeroSub', 'Get quick answers about scheme recommendations, eligibility rules, and application guidance.')}
          </p>
          <div className="help-search-container">
            <i className="fas fa-search help-search-icon"></i>
            <input
              type="text"
              placeholder={t('helpSearchPlaceholder', 'Search scheme recommendations, eligibility criteria, document questions...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 2 Direct Support Channels */}
        <div className="channels-grid">
          <div className="channel-card">
            <div className="channel-icon">
              <i className="fab fa-whatsapp"></i>
            </div>
            <div className="channel-title">{t('whatsAppDesk', 'WhatsApp Desk')}</div>
            <div className="channel-info">+91 98765 43210</div>
            <div className="channel-sub">{t('whatsAppSub', 'Instant Scheme Guidance Bot')}</div>
          </div>

          <div className="channel-card">
            <div className="channel-icon">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="channel-title">{t('emailSupport', 'Email Support')}</div>
            <div className="channel-info">support@schemesathi.in</div>
            <div className="channel-sub">{t('emailSupportSub', 'Recommendations & Query Assistance')}</div>
          </div>
        </div>

        {/* FAQs and Grievance Form Split */}
        <div className="help-sections-grid">
          {/* Left: Frequently Asked Questions */}
          <div className="help-block-card">
            <div className="help-block-title">
              <i className="fas fa-question-circle"></i>
              <span>{t('faqTitle', 'Frequently Asked Questions')}</span>
            </div>

            <div className="faq-accordion-stack">
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <i className="fas fa-search" style={{ fontSize: '24px', marginBottom: '8px', color: '#94a3b8' }}></i>
                  <p>
                    {t('noMatchingQuestions', 'No matching questions found for')} "{searchQuery}". {t('trySubmittingTicket', 'Try submitting a query ticket below!')}
                  </p>
                </div>
              ) : (
                filteredFaqs.map((faq, index) => {
                  const isOpen = activeFaq === index;
                  return (
                    <div key={faq.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button
                        className="faq-question-btn"
                        onClick={() => setActiveFaq(isOpen ? null : index)}
                      >
                        <span>{faq.q}</span>
                        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                      </button>
                      {isOpen && (
                        <div className="faq-answer-body">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Citizen Support Desk (Submit Query, My Inquiries & Replies, Track Ticket) */}
          <div className="help-block-card">
            {/* Top Sub-tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1.5px solid #e2e8f0',
              marginBottom: '20px',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => setSupportTab('submit')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: supportTab === 'submit' ? '3px solid #2e7d32' : '3px solid transparent',
                  padding: '10px 14px',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  color: supportTab === 'submit' ? '#2e7d32' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-paper-plane"></i>
                <span>{t('tabSubmitQuery', 'Submit Query')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSupportTab('my-tickets');
                  fetchMyQueries();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: supportTab === 'my-tickets' ? '3px solid #2e7d32' : '3px solid transparent',
                  padding: '10px 14px',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  color: supportTab === 'my-tickets' ? '#2e7d32' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-comments"></i>
                <span>{t('tabMyQueries', 'My Queries')} ({myQueries.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSupportTab('track')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: supportTab === 'track' ? '3px solid #2e7d32' : '3px solid transparent',
                  padding: '10px 14px',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  color: supportTab === 'track' ? '#2e7d32' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-search"></i>
                <span>{t('tabTrackTicket', 'Track Ticket')}</span>
              </button>
            </div>

            {/* TAB 1: SUBMIT NEW QUERY */}
            {supportTab === 'submit' && (
              <>
                {submittedTicket ? (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#2e7d32',
                      color: '#ffffff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: '22px'
                    }}>
                      <i className="fas fa-check"></i>
                    </div>
                    <h4 style={{ color: '#166534', margin: '0 0 6px', fontSize: '17px' }}>
                      {t('ticketSuccessTitle', 'Inquiry Registered with Support Desk!')}
                    </h4>
                    <p style={{ color: '#374151', fontSize: '13.5px', margin: '0 0 14px', lineHeight: '1.5' }}>
                      Your inquiry has been assigned reference ticket: <strong style={{ color: '#0f172a', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{submittedTicket.id}</strong>. Our administrative support desk will review and send an official response directly to your account notifications.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setSubmittedTicket(null)}
                        style={{
                          background: '#2e7d32',
                          color: '#fff',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {t('submitAnotherQuery', 'Submit Another Query')}
                      </button>
                      <button
                        onClick={() => {
                          setSubmittedTicket(null);
                          setSupportTab('my-tickets');
                        }}
                        style={{
                          background: '#f1f5f9',
                          color: '#1e293b',
                          border: '1px solid #cbd5e1',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {t('viewMySubmittedQueries', 'View My Submitted Queries →')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="grievance-form">
                    {!allowQueries && (
                      <div style={{
                        background: '#fff1f2',
                        border: '1px solid #fecdd3',
                        color: '#be123c',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <i className="fa fa-triangle-exclamation" style={{ fontSize: '18px', flexShrink: 0 }}></i>
                        <div>
                          <strong>{t('grievancePausedTitle', 'Grievances & Inquiries Paused')}</strong>
                          <div>{t('grievancePausedDesc', 'New query submissions are temporarily paused by administration. Please check back later.')}</div>
                        </div>
                      </div>
                    )}
                    <div className="form-group-item">
                      <label>{t('issueCategory', 'Query Category')}</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="form-select-field"
                      >
                        <option value="Scheme Recommendations">{t('optSchemeRecommendations', 'Scheme Recommendation & Matching')}</option>
                        <option value="Eligibility Clarification">{t('optEligibilityClarification', 'Eligibility Criteria Clarification')}</option>
                        <option value="Application Link & Process">{t('optAppProcess', 'Application Process & Official Link')}</option>
                        <option value="Required Documents">{t('optRequiredDocs', 'Required Documents Guidance')}</option>
                        <option value="Profile & Matching">{t('optProfileMatching', 'Profile Details & Scheme Suggestions')}</option>
                        <option value="Suggest New Scheme">{t('optSuggestScheme', 'Suggest New Scheme / Feedback')}</option>
                      </select>
                    </div>

                    <div className="form-group-item">
                      <label>{t('schemeNameOptional', 'Scheme Name / Keyword (Optional)')}</label>
                      <input
                        type="text"
                        name="applicationId"
                        value={formData.applicationId}
                        onChange={handleInputChange}
                        placeholder={t('schemeNamePlaceholder', 'e.g. PM Surya Ghar, PM-KISAN, Ayushman Bharat')}
                        className="form-input-field"
                      />
                    </div>

                    <div className="form-group-item">
                      <label>{t('subjectRequired', 'Subject *')}</label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder={t('subjectPlaceholder', 'Brief summary of your question or suggestion')}
                        className="form-input-field"
                      />
                    </div>

                    <div className="form-group-item">
                      <label>{t('detailsRequired', 'Detailed Explanation *')}</label>
                      <textarea
                        rows={4}
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder={t('detailsPlaceholder', 'Please describe your query regarding scheme eligibility, application steps, or required documents...')}
                        className="form-textarea-field"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !allowQueries || isMaintenanceMode}
                      className="btn-submit-ticket"
                      title={isMaintenanceMode ? t('queryPausedTooltip', 'Query submission is paused during maintenance mode') : ''}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>{t('submittingQuery', 'Submitting Query...')}</span>
                        </>
                      ) : isMaintenanceMode ? (
                        <>
                          <i className="fa fa-lock"></i>
                          <span>{t('queriesPausedMaintenance', 'Queries Paused (Maintenance Mode)')}</span>
                        </>
                      ) : !allowQueries ? (
                        <>
                          <i className="fa fa-lock"></i>
                          <span>{t('querySubmissionsPaused', 'Query Submissions Paused')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i>
                          <span>{t('submitQueryBtn', 'Submit Query to Admin Support')}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* TAB 2: MY SUBMITTED INQUIRIES & REPLIES */}
            {supportTab === 'my-tickets' && (
              <div className="my-queries-history-view">
                {myQueries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <i className="fas fa-comments" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '10px' }}></i>
                    <p style={{ margin: '0 0 12px', fontSize: '14px' }}>
                      {t('noSubmittedQueries', "You haven't submitted any inquiries yet.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSupportTab('submit')}
                      style={{
                        background: '#2e7d32',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {t('submitQuestionNow', 'Submit a Question Now')}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {myQueries.map((item) => {
                      const isResolved = item.status === 'RESOLVED';
                      return (
                        <div
                          key={item.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: isResolved ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                            padding: '16px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', fontFamily: 'monospace' }}>
                                #{item.ticket_id}
                              </span>
                              <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', color: '#475569' }}>
                                {item.category}
                              </span>
                            </div>
                            <div>
                              {isResolved ? (
                                <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700' }}>
                                  <i className="fas fa-check-circle" style={{ marginRight: '4px' }}></i> {t('statusResolvedReplied', 'Resolved & Replied')}
                                </span>
                              ) : (
                                <span style={{ background: '#fff7ed', color: '#ea580c', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700' }}>
                                  <i className="fas fa-clock" style={{ marginRight: '4px' }}></i> {t('statusPendingReview', 'Pending Review')}
                                </span>
                              )}
                            </div>
                          </div>

                          <h5 style={{ margin: '0 0 6px', fontSize: '14px', color: '#1e293b', fontWeight: '700' }}>
                            {item.subject}
                          </h5>
                          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                            {item.description}
                          </p>

                          {/* Admin Resolution Response */}
                          {item.admin_reply ? (
                            <div style={{
                              background: '#f0fdf4',
                              border: '1px solid #86efac',
                              borderRadius: '8px',
                              padding: '12px 14px',
                              marginTop: '10px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <i className="fas fa-reply-all"></i> {t('officialAdminReply', 'Official Admin Reply')}
                                </span>
                                <span style={{ fontSize: '11px', color: '#15803d' }}>
                                  {item.replied_at ? new Date(item.replied_at).toLocaleDateString('en-IN') : t('recentTime', 'Recent')}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '13px', color: '#14532d', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                                {trReply(item.admin_reply)}
                              </p>
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', background: '#fffbeb', padding: '6px 10px', borderRadius: '6px' }}>
                              <i className="fas fa-hourglass-half"></i>
                              <span>{t('queryUnderReviewMsg', 'Your query is with the admin desk. Official reply will appear here once reviewed.')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TRACK TICKET BY ID */}
            {supportTab === 'track' && (
              <div className="track-ticket-view">
                <form onSubmit={handleTrackTicketLookup} style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                  <input
                    type="text"
                    required
                    placeholder={t('enterTicketPlaceholder', 'Enter Reference Ticket ID (e.g. GRV-842910)')}
                    value={trackTicketInput}
                    onChange={(e) => setTrackTicketInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isTracking || !trackTicketInput.trim() || isMaintenanceMode}
                    style={{
                      background: isMaintenanceMode ? '#94a3b8' : '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: isMaintenanceMode ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title={isMaintenanceMode ? 'Ticket tracking is paused during maintenance' : ''}
                  >
                    {isTracking ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                    <span>{t('trackBtn', 'Track')}</span>
                  </button>
                </form>

                {trackError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
                    {trackError}
                  </div>
                )}

                {trackedQuery && (
                  <div style={{
                    background: '#ffffff',
                    border: trackedQuery.status === 'RESOLVED' ? '1.5px solid #86efac' : '1.5px solid #fed7aa',
                    borderRadius: '12px',
                    padding: '18px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '700', fontFamily: 'monospace', fontSize: '14px' }}>
                        #{trackedQuery.ticket_id}
                      </span>
                      {trackedQuery.status === 'RESOLVED' ? (
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                          <i className="fas fa-check-circle"></i> {t('statusResolvedReplied', 'Resolved & Replied')}
                        </span>
                      ) : (
                        <span style={{ background: '#fff7ed', color: '#ea580c', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                          <i className="fas fa-clock"></i> {t('statusPendingAdmin', 'Pending Admin Action')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      {t('submittedOn', 'Submitted on')} {new Date(trackedQuery.created_at).toLocaleDateString('en-IN')} {t('forCategory', 'for')} {trackedQuery.category}
                    </div>
                    <h5 style={{ margin: '0 0 6px', fontSize: '14.5px', color: '#1e293b' }}>
                      {trackedQuery.subject}
                    </h5>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                      {trackedQuery.description}
                    </p>

                    {trackedQuery.admin_reply ? (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '12px 14px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                          <i className="fas fa-reply-all"></i> {t('officialAdminResolution', 'Official Admin Resolution:')}
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#14532d', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                          {trReply(trackedQuery.admin_reply)}
                        </p>
                      </div>
                    ) : (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#b45309' }}>
                        <i className="fas fa-hourglass-half" style={{ marginRight: '6px' }}></i>
                        {t('queryUnderReviewNodal', 'This inquiry is under review by the nodal admin desk. Check back shortly for official reply.')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HelpSupportPage;
