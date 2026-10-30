import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLayout from '../components/layout/AdminLayout';
import apiClient from '../services/apiClient';
import './DashboardPage.css';
import '../styles/admin-dashboard.css';

const SCHEME_CATEGORIES = [
  { id: 1, name: 'Education & Scholarships' },
  { id: 2, name: 'Agriculture & Farmers' },
  { id: 3, name: 'Social Welfare & Financial Assistance' },
  { id: 4, name: 'Women & Child Welfare' },
  { id: 5, name: 'Healthcare' },
  { id: 6, name: 'Housing' },
  { id: 7, name: 'Employment & Skills' },
  { id: 8, name: 'Entrepreneurship & Business' },
  { id: 9, name: 'Senior Citizen & Disability' },
  { id: 10, name: 'Other' },
];

const QUICK_REPLY_TEMPLATES = [
  {
    label: '📄 Document Guidance',
    text: 'Please ensure your uploaded certificate is digitally verified and issued within the current financial year (2024-25). You can re-upload your document under My Profile > Documents.'
  },
  {
    label: '⏳ Processing Timeline',
    text: 'Your scheme application is currently under district nodal verification. Direct Benefit Transfer (DBT) disbursements are typically credited within 5 to 7 working days following clearance.'
  },
  {
    label: '🔗 Official Portal Steps',
    text: 'Please visit the official government portal directly using the link on the scheme card. Log in with your Aadhaar-linked mobile number to complete e-KYC and finalize your submission.'
  },
  {
    label: '✅ Grievance Approved',
    text: 'Our administrative desk has reviewed your grievance record and updated your verification status. Your case is cleared for priority processing with the respective department.'
  }
];

const INDIAN_STATES_AND_REGIONS = [
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export default function AdminDashboardPage() {
  const { user, updateUserSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/add-scheme')) return 'add-scheme';
    if (path.includes('/schemes')) return 'schemes';
    if (path.includes('/users') || path.includes('/analytics')) return 'analytics';
    if (path.includes('/queries') || path.includes('/verifications') || path.includes('/support')) return 'queries';
    if (path.includes('/broadcast')) return 'broadcast';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  const activeTab = getTabFromPath();

  const [stats, setStats] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [totalSchemesCount, setTotalSchemesCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [queries, setQueries] = useState([]);
  const [queryCounts, setQueryCounts] = useState({ total: 0, pending: 0, resolved: 0 });
  const [queryFilter, setQueryFilter] = useState('all');
  const [queryCategoryFilter, setQueryCategoryFilter] = useState('all');
  const [querySearch, setQuerySearch] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [deletingQuery, setDeletingQuery] = useState(null);
  const [isDeletingQuery, setIsDeletingQuery] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [isClearBroadcastsModalOpen, setIsClearBroadcastsModalOpen] = useState(false);
  const [isClearingBroadcasts, setIsClearingBroadcasts] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState(null);
  const [isDeleteSingleBroadcastModalOpen, setIsDeleteSingleBroadcastModalOpen] = useState(false);
  const [isDeletingSingleBroadcast, setIsDeletingSingleBroadcast] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    allow_citizen_registration: true,
    allow_citizen_queries: true,
    auto_broadcast_new_schemes: true,
    maintenance_mode: false,
    system_announcement: '',
    default_language: 'en',
    max_upload_size_mb: 5,
    session_timeout_hours: 24,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPingingDb, setIsPingingDb] = useState(false);
  const [liveDbLatency, setLiveDbLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Settings subtab: 'system' | 'profile' | 'team'
  const searchParams = new URLSearchParams(location.search);
  const [settingsSubTab, setSettingsSubTab] = useState(searchParams.get('tab') || 'system');

  // Keep settingsSubTab in sync if URL query changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['system', 'profile', 'team'].includes(tabParam)) {
      setSettingsSubTab(tabParam);
    }
  }, [location.search]);

  // Admin Profile Update state
  const [adminProfileForm, setAdminProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Admin Password Update state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Admin Team & Access Management state
  const [adminList, setAdminList] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Direct Create Admin modal
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showCreateAdminPw, setShowCreateAdminPw] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Revoke Admin modal
  const [adminToRevoke, setAdminToRevoke] = useState(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Sync profile form when user object updates
  useEffect(() => {
    if (user) {
      setAdminProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Search and Table filters
  const [schemeSearch, setSchemeSearch] = useState('');
  const [schemeLevelFilter, setSchemeLevelFilter] = useState('ALL'); // 'ALL' | 'CENTRAL' | 'STATE'
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState('ALL');
  const [schemeStatusFilter, setSchemeStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [schemeSortBy, setSchemeSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'state-asc' | 'level-asc' | 'id-desc'
  const [schemePage, setSchemePage] = useState(1);
  const [schemePageSize, setSchemePageSize] = useState(15); // 15 | 25 | 50 | 'ALL'
  const [copiedSchemeId, setCopiedSchemeId] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  // Scheme Inspection, Edit & Deletion Modals
  const [inspectingScheme, setInspectingScheme] = useState(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectDetailedData, setInspectDetailedData] = useState(null);
  const [isEditSchemeMode, setIsEditSchemeMode] = useState(false);
  const [editSchemeForm, setEditSchemeForm] = useState(null);
  const [isSavingSchemeEdit, setIsSavingSchemeEdit] = useState(false);

  const [schemeToDelete, setSchemeToDelete] = useState(null);
  const [isDeleteSchemeModalOpen, setIsDeleteSchemeModalOpen] = useState(false);
  const [isDeletingScheme, setIsDeletingScheme] = useState(false);

  // Add Scheme Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newScheme, setNewScheme] = useState({
    name: '',
    category_id: 1,
    govt_level: 'Central',
    state: 'All India',
    ministry_department: '',
    description: '',
    benefits: '',
    eligibility_criteria: '',
    application_process: '',
    documents_required: '',
    official_url: '',
    myscheme_url: '',
    application_mode: 'Online'
  });

  // Batch Excel/CSV Scheme Import state
  const [schemeCreationMode, setSchemeCreationMode] = useState('manual'); // 'manual' | 'import'
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Broadcast Modal / Form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    link_action: '/explore',
    link_text: 'View Announcement →'
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const role = (user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

  // Check URL query parameters (e.g. ?q=scholarship)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('q');
    if (q) {
      setSchemeSearch(q);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }

    fetchTabData(); apiClient('/admin/dashboard').then(res => { if (res?.success) setStats(res.dashboard || res.data); }).catch(() => {});
  }, [user, isAdmin, activeTab]);

  // Live Telemetry Auto-Sync: Updates the 4 overview metrics automatically without page reload or refresh
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'overview') return;

    let isSubscribed = true;

    const syncLiveMetrics = async () => {
      try {
        const res = await apiClient('/admin/dashboard');
        if (isSubscribed && res && res.success) {
          setStats(res.dashboard || res.data);
        }
      } catch (err) {
        // Silent background sync
      }
    };

    // Auto-sync every 4 seconds live
    const autoSyncTimer = setInterval(syncLiveMetrics, 4000);

    const handleWindowFocus = () => {
      syncLiveMetrics();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncLiveMetrics();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isSubscribed = false;
      clearInterval(autoSyncTimer);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, isAdmin, activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTabData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'overview') {
        const res = await apiClient('/admin/dashboard');
        if (res.success) {
          setStats(res.dashboard || res.data);
        }
      } else if (activeTab === 'schemes') {
        const res = await apiClient('/admin/schemes?limit=1000');
        if (res.success) {
          const list = res.schemes || res.data || [];
          setSchemes(list);
          setTotalSchemesCount(res.pagination?.total || res.total || list.length);
        }
      } else if (activeTab === 'analytics' || activeTab === 'users') {
        const res = await apiClient('/admin/users/analytics');
        if (res.success) {
          setUserAnalytics(res.analytics || res.data || null);
        }
      } else if (activeTab === 'queries' || activeTab === 'verifications') {
        const res = await apiClient('/admin/queries');
        if (res.success) {
          setQueries(res.queries || res.data || []);
          setQueryCounts(res.counts || { total: 0, pending: 0, resolved: 0 });
        }
      } else if (activeTab === 'broadcast') {
        const res = await apiClient('/admin/broadcast');
        if (res.success) {
          setBroadcasts(res.data || []);
        }
      } else if (activeTab === 'settings') {
        const res = await apiClient('/admin/settings');
        if (res.success) {
          setSystemSettings(res.data || {});
          if (res.data?.system_settings) {
            setSettingsForm(prev => ({
              ...prev,
              ...res.data.system_settings
            }));
          }
          if (res.data?.db_latency_ms !== undefined) {
            setLiveDbLatency(res.data.db_latency_ms);
          }
        }
        try {
          const adminsRes = await apiClient.admin.admins.list();
          if (adminsRes?.success) {
            setAdminList(adminsRes.admins || []);
          }
        } catch (e) {}
        try {
          const profRes = await apiClient.admin.profile.get();
          if (profRes?.success && profRes.user) {
            setAdminProfileForm({
              first_name: profRes.user.first_name || '',
              last_name: profRes.user.last_name || '',
              email: profRes.user.email || '',
              phone: profRes.user.phone || '',
            });
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error fetching data:', err);
      setError(err.message || 'Failed to load administrative records');
    } finally {
      setLoading(false);
    }
  };

  // Format activity feed timestamp into clean, relative or date time
  const formatActivityTime = (isoString, defaultStr = '') => {
    if (!isoString) return defaultStr || 'Recently';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return defaultStr || 'Recently';
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const isToday = now.toDateString() === date.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today, ${timeStr}`;
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (yesterday.toDateString() === date.toDateString()) return `Yesterday, ${timeStr}`;
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch (e) {
      return defaultStr || 'Recently';
    }
  };

  const fallbackRecentActivities = [
    {
      id: 'fallback-1',
      icon_color: 'blue',
      icon_class: 'fa fa-pen-to-square',
      title: 'Updated: 40% Subsidy On Hank Yarn, Dyes & Chemicals Scheme (#83)',
      subtitle: 'Application mode, scheme name, and publication status updated by administrator.',
      badge: 'Admin Action',
      badge_type: 'admin-tag',
      formatted_time: 'Today, 08:14 AM'
    },
    {
      id: 'fallback-2',
      icon_color: 'green',
      icon_class: 'fa fa-circle-plus',
      title: 'Published: PM-DAKSH Welfare Initiative (#101)',
      subtitle: 'Skill training and financial assistance program cataloged for citizen discovery.',
      badge: 'New Scheme',
      badge_type: 'green-tag',
      formatted_time: 'Oct 25, 11:38 AM'
    },
    {
      id: 'fallback-3',
      icon_color: 'purple',
      icon_class: 'fa fa-file-signature',
      title: 'Citizen Application Intent: AICTE-Swanath Scholarship Scheme',
      subtitle: 'Application workflow initiated by citizen • Status: Considering • Intent recorded',
      badge: 'Citizen Filing',
      badge_type: 'purple-tag',
      formatted_time: 'Oct 23, 05:17 AM'
    },
    {
      id: 'fallback-4',
      icon_color: 'purple',
      icon_class: 'fa fa-file-signature',
      title: 'Citizen Application Intent: Agriculture Infrastructure Fund',
      subtitle: 'Application workflow initiated by citizen • Status: Planning • Intent recorded',
      badge: 'Citizen Filing',
      badge_type: 'purple-tag',
      formatted_time: 'Oct 23, 05:00 AM'
    }
  ];

  // Helper to securely stream and download CSV reports from backend
  const triggerReportDownload = async (endpoint, fallbackFilename) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {};
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) headers['X-User-Id'] = String(parsed.id);
        if (parsed?.email) headers['X-User-Email'] = parsed.email;
      }
    } catch (e) {}

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Server returned status HTTP ${response.status}`);
    }

    let filename = fallbackFilename;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=(?:["']?)([^"';]+)(?:["']?)/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  // Export Scheme Catalog Report (CSV) with ALL scheme columns & specifications
  const handleExportSchemeReport = async () => {
    try {
      showToast('Generating full Scheme Catalog report (all specifications, criteria & benefits)...');
      await triggerReportDownload(
        '/admin/reports/schemes',
        `SchemeSathi_Scheme_Catalog_Full_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      showToast('Scheme Catalog Report downloaded successfully! (All 101 schemes with full specifications)');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to download scheme report: ' + (err.message || 'Network error'));
    }
  };

  // Export Citizen Details & Demographic Report (CSV) with ALL user details
  const handleExportCitizenReport = async () => {
    try {
      showToast('Generating Citizen Details report (profiles, demographics & account status)...');
      await triggerReportDownload(
        '/admin/reports/citizens',
        `SchemeSathi_Citizen_Details_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      showToast('Citizen Details Report downloaded successfully! (Cleanly formatted & Excel-ready)');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to download citizen report: ' + (err.message || 'Network error'));
    }
  };

  // Export Audit Logs Report (CSV) detailing WHAT ACTUALLY CHANGED
  const handleExportAuditReport = async () => {
    try {
      showToast('Generating System Audit report (detailed change breakdown & audit trail)...');
      await triggerReportDownload(
        '/admin/reports/audit',
        `SchemeSathi_System_Audit_Log_Full_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      showToast('System Audit Report downloaded successfully! (Complete audit trail detailing what actually changed)');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to download audit log report: ' + (err.message || 'Network error'));
    }
  };

  // Switch tab via router navigation
  const handleTabChange = (tabKey) => {
    if (tabKey === 'overview') {
      navigate('/admin');
    } else if (tabKey === 'analytics') {
      navigate('/admin/users');
    } else if (tabKey === 'add-scheme') {
      navigate('/admin/add-scheme');
    } else if (tabKey === 'queries' || tabKey === 'verifications') {
      navigate('/admin/queries');
    } else {
      navigate(`/admin/${tabKey}`);
    }
  };

  // Open Reply Modal for Citizen Query
  const handleOpenReplyModal = (q) => {
    setSelectedQuery(q);
    setAdminReplyText(q.admin_reply || '');
    setIsReplyModalOpen(true);
  };

  // Apply Quick Preset Reply Template
  const handleApplyQuickReply = (templateText) => {
    setAdminReplyText(templateText);
  };

  // Submit Official Resolution Reply to Citizen
  const handleSendQueryReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedQuery) return;
    if (!adminReplyText.trim()) {
      showToast('Please enter an official response before submitting.');
      return;
    }

    try {
      setIsSendingReply(true);
      const res = await apiClient(`/admin/queries/${selectedQuery.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: adminReplyText.trim() })
      });

      if (res.success) {
        const updatedQuery = res.data || {
          ...selectedQuery,
          status: 'RESOLVED',
          admin_reply: adminReplyText.trim(),
          replied_at: new Date().toISOString()
        };

        // Update queries in list
        setQueries(prev => prev.map(item => item.id === selectedQuery.id ? updatedQuery : item));

        // Update counts
        setQueryCounts(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - (selectedQuery.status === 'PENDING' ? 1 : 0)),
          resolved: prev.resolved + (selectedQuery.status === 'PENDING' ? 1 : 0)
        }));

        // Dispatch real-time BroadcastChannel event for instant citizen bell notification
        try {
          const channel = new BroadcastChannel('schemesathi_notifications');
          channel.postMessage({
            type: 'SUPPORT_REPLY',
            ticketId: selectedQuery.ticket_id,
            citizenEmail: selectedQuery.citizen_email,
            subject: selectedQuery.subject,
            title: `Support Desk Replied: Ticket ${selectedQuery.ticket_id}`,
            description: adminReplyText.trim(),
            timestamp: Date.now()
          });
          setTimeout(() => channel.close(), 1500);
        } catch (err) {}

        // Multi-tab fallback ping
        localStorage.setItem('schemesathi_support_reply_ping', JSON.stringify({
          ticketId: selectedQuery.ticket_id,
          citizenEmail: selectedQuery.citizen_email,
          time: Date.now()
        }));

        showToast(`Official reply sent to ${selectedQuery.citizen_name} (Ticket ${selectedQuery.ticket_id})!`);
        setIsReplyModalOpen(false);
        setSelectedQuery(null);
        setAdminReplyText('');
      } else {
        showToast(res.message || 'Failed to dispatch reply');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error sending query reply:', err);
      showToast(err.message || 'Error communicating with support API');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteQuery = (q) => {
    setDeletingQuery(q);
  };

  // Confirm and Execute Grievance Query Deletion
  const handleConfirmDeleteQuery = async () => {
    if (!deletingQuery) return;

    try {
      setIsDeletingQuery(true);
      const queryToDelete = deletingQuery;
      let res;
      try {
        res = await apiClient(`/admin/queries/${queryToDelete.id}`, { method: 'DELETE' });
      } catch (err1) {
        // Fallback to POST /delete if DELETE method is blocked
        res = await apiClient(`/admin/queries/${queryToDelete.id}/delete`, { method: 'POST' });
      }

      if (res && res.success) {
        setQueries(prev => prev.filter(item => item.id !== queryToDelete.id));
        setQueryCounts(prev => ({
          total: Math.max(0, prev.total - 1),
          pending: Math.max(0, prev.pending - (queryToDelete.status === 'PENDING' ? 1 : 0)),
          resolved: Math.max(0, prev.resolved - (queryToDelete.status === 'RESOLVED' ? 1 : 0))
        }));
        showToast(`Grievance ticket #${queryToDelete.ticket_id} has been removed successfully.`);
        setDeletingQuery(null);
      } else {
        showToast(res?.message || 'Failed to remove grievance');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error deleting query:', err);
      showToast(err.message || 'Error communicating with support API');
    } finally {
      setIsDeletingQuery(false);
    }
  };

  // Confirm and Execute Deletion of All Citizen Queries
  const handleConfirmDeleteAllQueries = async () => {
    try {
      setIsDeletingAll(true);
      let res;
      try {
        res = await apiClient('/admin/queries/delete-all', { method: 'DELETE' });
      } catch (err1) {
        // Fallback to POST /delete-all if DELETE method is blocked
        res = await apiClient('/admin/queries/delete-all', { method: 'POST' });
      }

      if (res && res.success) {
        setQueries([]);
        setQueryCounts({ total: 0, pending: 0, resolved: 0 });
        showToast(res.message || 'All citizen queries have been deleted successfully.');
        setIsDeleteAllModalOpen(false);
      } else {
        showToast(res?.message || 'Failed to delete all citizen queries');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error deleting all queries:', err);
      showToast(err.message || 'Error communicating with support API');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Add Scheme Submit Handler
  const handleCreateScheme = async (e) => {
    e.preventDefault();
    if (!newScheme.name.trim()) {
      showToast('Please enter a valid scheme name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient('/admin/schemes', {
        method: 'POST',
        body: JSON.stringify({
          ...newScheme,
          category_id: Number(newScheme.category_id)
        })
      });

      if (res.success) {
        showToast(`Scheme "${newScheme.name}" published and broadcast to citizens! 🎉`);
        setIsAddModalOpen(false);
        setTotalSchemesCount(prev => prev + 1);
        setNewScheme({
          name: '',
          category_id: 1,
          govt_level: 'Central',
          state: 'All India',
          ministry_department: '',
          description: '',
          benefits: '',
          eligibility_criteria: '',
          application_process: '',
          documents_required: '',
          official_url: '',
          myscheme_url: '',
          application_mode: 'Online'
        });
        fetchTabData(); apiClient('/admin/dashboard').then(res => { if (res?.success) setStats(res.dashboard || res.data); }).catch(() => {});
      } else {
        showToast(res.message || 'Failed to create scheme');
      }
    } catch (err) {
      showToast(err.message || 'Error creating scheme');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file selection for Excel / CSV import
  const handleFileSelected = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      showToast('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }
    setImportFile(file);
    setImportResult(null);
    showToast(`Spreadsheet attached: ${file.name}`);
  };

  // Download official scheme template (.xlsx or .csv)
  const handleDownloadImportTemplate = async (format = 'xlsx') => {
    try {
      setIsDownloadingTemplate(true);
      showToast(`Generating official ${format.toUpperCase()} template with sample data...`);
      const filename = format === 'csv'
        ? 'SchemeSathi_Scheme_Import_Template.csv'
        : 'SchemeSathi_Scheme_Import_Template.xlsx';
      await triggerReportDownload(`/admin/schemes/import-template?format=${format}`, filename);
      showToast(`Official ${format.toUpperCase()} template downloaded successfully!`);
    } catch (err) {
      showToast(`Failed to download template: ${err.message}`);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Upload and batch import schemes from spreadsheet
  const handleImportSchemes = async () => {
    if (!importFile) {
      showToast('Please select an Excel (.xlsx, .xls) or CSV file to import.');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    setIsImporting(true);
    setImportResult(null);

    try {
      showToast('Processing and validating schemes spreadsheet in batch...');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const headers = {};
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed?.id) headers['X-User-Id'] = String(parsed.id);
          if (parsed?.email) headers['X-User-Email'] = parsed.email;
        }
      } catch (e) {}

      const response = await fetch(`${API_BASE_URL}/admin/schemes/import`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData
      });

      const res = await response.json();
      if (res.success) {
        setImportResult(res.data);
        const importedCount = res.data?.imported_count || 0;
        showToast(res.message || `Successfully imported ${importedCount} schemes!`);
        setImportFile(null);
        if (importedCount > 0) {
          setTotalSchemesCount(prev => prev + importedCount);
        }
        // Refresh catalog and dashboard stats immediately
        fetchTabData();
        apiClient('/admin/dashboard').then(dashRes => {
          if (dashRes?.success) setStats(dashRes.dashboard || dashRes.data);
        }).catch(() => {});
      } else {
        showToast(res.message || 'Import failed. Please verify spreadsheet columns.');
        if (res.data) setImportResult(res.data);
      }
    } catch (err) {
      showToast(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Render Scheme Bulk Import Panel (used in both dedicated page and modal)
  const renderSchemeImportPanel = (isInModal = false) => (
    <div className={`scheme-import-container ${isInModal ? 'is-in-modal' : ''}`}>
      {/* Step 1: Download Official Template */}
      <div className="scheme-import-step-card">
        <div className="step-card-header">
          <div className="step-badge-number">1</div>
          <div className="step-card-titles">
            <h4>Download Official Scheme Onboarding Template</h4>
            <p>
              Pre-structured with all required fields (Description, Eligibility, Benefits, Documents, Application Process, Official URLs, Tags) and complete sample rows. The Excel workbook includes a reference sheet of all approved welfare categories.
            </p>
          </div>
        </div>

        <div className="template-download-options">
          <button
            type="button"
            className="btn-template-download btn-excel"
            disabled={isDownloadingTemplate}
            onClick={() => handleDownloadImportTemplate('xlsx')}
            title="Download Excel template (.xlsx)"
          >
            <div className="template-btn-icon excel-icon">
              <i className="fa fa-file-excel"></i>
            </div>
            <div className="template-btn-text">
              <span className="btn-main-title">Download Excel Template (.xlsx)</span>
              <span className="btn-sub-title">Includes Sample Schemes + Approved Sector Category Sheet</span>
            </div>
            <i className="fa fa-cloud-arrow-down download-icon-right"></i>
          </button>

          <button
            type="button"
            className="btn-template-download btn-csv"
            disabled={isDownloadingTemplate}
            onClick={() => handleDownloadImportTemplate('csv')}
            title="Download CSV template (.csv)"
          >
            <div className="template-btn-icon csv-icon">
              <i className="fa fa-file-csv"></i>
            </div>
            <div className="template-btn-text">
              <span className="btn-main-title">Download CSV Template (.csv)</span>
              <span className="btn-sub-title">Standard comma-separated format with UTF-8 encoding</span>
            </div>
            <i className="fa fa-cloud-arrow-down download-icon-right"></i>
          </button>
        </div>

        <div className="template-fields-guide">
          <span className="guide-label"><i className="fa fa-circle-info"></i> Standard Columns in Template:</span>
          <div className="guide-tags">
            <span className="field-tag required">Scheme Official Name *</span>
            <span className="field-tag required">Category *</span>
            <span className="field-tag required">Government Level *</span>
            <span className="field-tag">Applicable State / UT</span>
            <span className="field-tag">Ministry / Department</span>
            <span className="field-tag">Application Mode</span>
            <span className="field-tag">Publication Status</span>
            <span className="field-tag">Description</span>
            <span className="field-tag">Eligibility Criteria</span>
            <span className="field-tag">Benefits</span>
            <span className="field-tag">Required Documents</span>
            <span className="field-tag">Application Process</span>
            <span className="field-tag">Official Portal URL</span>
            <span className="field-tag">MyScheme URL</span>
            <span className="field-tag">Search Tags</span>
          </div>
        </div>
      </div>

      {/* Step 2: Upload Filled Spreadsheet */}
      <div className="scheme-import-step-card">
        <div className="step-card-header">
          <div className="step-badge-number">2</div>
          <div className="step-card-titles">
            <h4>Upload Completed Scheme Spreadsheet</h4>
            <p>
              Upload your edited sheet. The system validates entries, automatically matches sector categories, splits required documents, generates unique slugs, and publishes schemes to the catalog.
            </p>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          className={`scheme-import-dropzone ${isDraggingFile ? 'dropzone-active' : ''} ${importFile ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileSelected(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => {
            if (!importFile) {
              const inputId = isInModal ? 'scheme-file-input-modal' : 'scheme-file-input-page';
              const input = document.getElementById(inputId);
              if (input) input.click();
            }
          }}
        >
          <input
            id={isInModal ? 'scheme-file-input-modal' : 'scheme-file-input-page'}
            type="file"
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          {!importFile ? (
            <div className="dropzone-empty-state">
              <div className="dropzone-icon">
                <i className="fa fa-cloud-arrow-up"></i>
              </div>
              <h5>Drag and drop your Excel or CSV spreadsheet here</h5>
              <p>Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)</p>
              <button
                type="button"
                className="btn-browse-file"
                onClick={(e) => {
                  e.stopPropagation();
                  const inputId = isInModal ? 'scheme-file-input-modal' : 'scheme-file-input-page';
                  const input = document.getElementById(inputId);
                  if (input) input.click();
                }}
              >
                <i className="fa fa-folder-open"></i> Browse Files on Computer
              </button>
            </div>
          ) : (
            <div className="dropzone-file-selected" onClick={(e) => e.stopPropagation()}>
              <div className="file-info-left">
                <div className={`file-badge-icon ${importFile.name.toLowerCase().endsWith('.csv') ? 'is-csv' : 'is-excel'}`}>
                  <i className={importFile.name.toLowerCase().endsWith('.csv') ? 'fa fa-file-csv' : 'fa fa-file-excel'}></i>
                </div>
                <div className="file-meta-text">
                  <span className="file-name">{importFile.name}</span>
                  <span className="file-details">
                    {(importFile.size / 1024).toFixed(1)} KB • {importFile.name.split('.').pop()?.toUpperCase()} Document
                  </span>
                </div>
              </div>
              <div className="file-actions-right">
                <button
                  type="button"
                  className="btn-change-file"
                  onClick={() => {
                    const inputId = isInModal ? 'scheme-file-input-modal' : 'scheme-file-input-page';
                    const input = document.getElementById(inputId);
                    if (input) input.click();
                  }}
                  title="Replace file"
                >
                  <i className="fa fa-arrow-rotate-right"></i> Replace
                </button>
                <button
                  type="button"
                  className="btn-remove-file"
                  onClick={() => { setImportFile(null); setImportResult(null); }}
                  title="Remove file"
                >
                  <i className="fa fa-trash-can"></i> Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Trigger Button */}
        <div className="import-submit-bar">
          <button
            type="button"
            className="btn-execute-import"
            disabled={!importFile || isImporting}
            onClick={handleImportSchemes}
          >
            {isImporting ? (
              <><i className="fa fa-spinner fa-spin"></i> Processing & Cataloging Schemes...</>
            ) : (
              <><i className="fa fa-bolt"></i> Upload & Import Schemes Automatically</>
            )}
          </button>
        </div>

        {/* Results Feedback Banner */}
        {importResult && (
          <div className={`import-results-summary ${importResult.imported_count > 0 ? 'success' : 'warning'}`}>
            <div className="results-header">
              <div className="results-badge">
                <i className={importResult.imported_count > 0 ? 'fa fa-circle-check' : 'fa fa-triangle-exclamation'}></i>
                <span>Import Summary</span>
              </div>
              <span className="results-timestamp">Batch processed successfully</span>
            </div>

            <div className="results-counts-row">
              <div className="result-stat-box success">
                <span className="stat-number">{importResult.imported_count || 0}</span>
                <span className="stat-label">Schemes Added to Catalog</span>
              </div>
              <div className="result-stat-box warning">
                <span className="stat-number">{importResult.skipped_count || 0}</span>
                <span className="stat-label">Skipped (Duplicates or Empty)</span>
              </div>
            </div>

            {importResult.imported_schemes && importResult.imported_schemes.length > 0 && (
              <div className="results-details-block">
                <h5><i className="fa fa-check-double"></i> Successfully Cataloged Schemes:</h5>
                <ul className="imported-schemes-list">
                  {importResult.imported_schemes.map((name, i) => (
                    <li key={i}><i className="fa fa-check"></i> {name}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.skipped_schemes && importResult.skipped_schemes.length > 0 && (
              <div className="results-details-block skipped-block">
                <h5><i className="fa fa-info-circle"></i> Skipped Rows or Duplicates:</h5>
                <ul className="skipped-schemes-list">
                  {importResult.skipped_schemes.map((reason, i) => (
                    <li key={i}><i className="fa fa-clock-rotate-left"></i> {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="results-actions-row">
              <button
                type="button"
                className="btn-inspect-catalog"
                onClick={() => {
                  if (isInModal) setIsAddModalOpen(false);
                  navigate('/admin/schemes');
                }}
              >
                <i className="fa fa-arrow-right"></i> Inspect Catalog ({totalSchemesCount} Total Schemes)
              </button>
              <button
                type="button"
                className="btn-import-another"
                onClick={() => {
                  setImportFile(null);
                  setImportResult(null);
                }}
              >
                <i className="fa fa-plus"></i> Import Another Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Populate Edit Form Data from Current Scheme
  const populateEditSchemeForm = (scheme, detailed) => {
    const data = detailed || scheme;
    if (!data) return;

    let categoryId = 1;
    if (data.category_id) {
      categoryId = Number(data.category_id);
    } else if (data.category && typeof data.category === 'object' && data.category.id) {
      categoryId = Number(data.category.id);
    } else if (data.category_name || data.category) {
      const match = SCHEME_CATEGORIES.find(c => 
        c.name.toLowerCase() === String(data.category_name || data.category).toLowerCase()
      );
      if (match) categoryId = match.id;
    }

    let benefitsText = '';
    if (typeof data.benefits === 'string') {
      benefitsText = data.benefits;
    } else if (data.benefits && typeof data.benefits === 'object') {
      benefitsText = data.benefits.details || data.benefits.description || Object.values(data.benefits).join('\n');
    }

    let eligibilityText = '';
    if (typeof data.eligibility === 'string') {
      eligibilityText = data.eligibility;
    } else if (data.eligibility && typeof data.eligibility === 'object') {
      eligibilityText = data.eligibility.criteria || data.eligibility.description || Object.values(data.eligibility).join('\n');
    } else if (data.eligibility_criteria) {
      eligibilityText = typeof data.eligibility_criteria === 'string' 
        ? data.eligibility_criteria 
        : (data.eligibility_criteria.criteria || Object.values(data.eligibility_criteria).join('\n'));
    }

    let documentsText = '';
    const rawDocs = data.documents || data.documents_required || [];
    if (Array.isArray(rawDocs)) {
      documentsText = rawDocs.map(d => String(d).replace(/[\ufffd\xa0]/g, ' ').replace(/^[\d+.)\-*•\s]+/, '').trim()).filter(Boolean).join('\n');
    } else if (typeof rawDocs === 'string') {
      documentsText = rawDocs;
    }

    setEditSchemeForm({
      id: data.id,
      name: data.name || '',
      category_id: categoryId,
      govt_level: data.govt_level || (String(data.govt_level || '').toLowerCase().includes('state') ? 'State' : 'Central'),
      state: data.state || 'All India',
      ministry_department: data.ministry_department || data.ministry || '',
      description: data.description || '',
      benefits: benefitsText,
      eligibility_criteria: eligibilityText,
      documents_required: documentsText,
      application_process: data.application_process || '',
      official_url: data.official_url || '',
      myscheme_url: data.myscheme_url || '',
      application_mode: data.application_mode || 'Online',
      is_active: data.is_active !== false && data.status !== 'INACTIVE',
      status: data.status || (data.is_active !== false ? 'ACTIVE' : 'INACTIVE')
    });
  };

  const handleStartEditScheme = () => {
    populateEditSchemeForm(inspectingScheme, inspectDetailedData);
    setIsEditSchemeMode(true);
  };

  const handleCancelEditScheme = () => {
    setIsEditSchemeMode(false);
    setEditSchemeForm(null);
  };

  const handleCloseInspectModal = () => {
    setIsInspectModalOpen(false);
    setIsEditSchemeMode(false);
    setEditSchemeForm(null);
  };

  const handleEditSchemeDirect = (scheme) => {
    handleInspectScheme(scheme);
    populateEditSchemeForm(scheme, null);
    setIsEditSchemeMode(true);
  };

  const handleSaveSchemeEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editSchemeForm || !editSchemeForm.name.trim()) {
      showToast('Please enter a valid scheme name');
      return;
    }

    setIsSavingSchemeEdit(true);
    try {
      const payload = {
        name: editSchemeForm.name.trim(),
        category_id: Number(editSchemeForm.category_id),
        govt_level: editSchemeForm.govt_level,
        state: editSchemeForm.state,
        ministry: editSchemeForm.ministry_department.trim(),
        ministry_department: editSchemeForm.ministry_department.trim(),
        description: editSchemeForm.description,
        benefits: editSchemeForm.benefits,
        eligibility: editSchemeForm.eligibility_criteria,
        eligibility_criteria: editSchemeForm.eligibility_criteria,
        documents: editSchemeForm.documents_required,
        documents_required: editSchemeForm.documents_required,
        application_process: editSchemeForm.application_process,
        official_url: editSchemeForm.official_url.trim(),
        myscheme_url: editSchemeForm.myscheme_url.trim(),
        application_mode: editSchemeForm.application_mode,
        is_active: editSchemeForm.is_active,
        status: editSchemeForm.is_active ? 'ACTIVE' : 'INACTIVE'
      };

      const res = await apiClient(`/admin/schemes/${editSchemeForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        showToast('Scheme updated successfully! ✨');
        
        const catObj = SCHEME_CATEGORIES.find(c => c.id === Number(editSchemeForm.category_id));
        const updatedSchemeObj = {
          ...(inspectDetailedData || inspectingScheme),
          ...payload,
          id: editSchemeForm.id,
          category_name: catObj ? catObj.name : (inspectingScheme?.category_name || 'General'),
          category: catObj ? { id: catObj.id, name: catObj.name } : inspectingScheme?.category
        };

        setSchemes(prev => prev.map(s => s.id === editSchemeForm.id ? { ...s, ...updatedSchemeObj } : s));
        setInspectingScheme(updatedSchemeObj);
        setInspectDetailedData(updatedSchemeObj);
        setIsEditSchemeMode(false);
      } else {
        showToast(res?.message || 'Failed to update scheme');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error updating scheme:', err);
      showToast(err.message || 'Error updating scheme');
    } finally {
      setIsSavingSchemeEdit(false);
    }
  };

  // Open Scheme Details Inspection Modal & Fetch Full Technical Specifications
  const handleInspectScheme = async (scheme) => {
    setInspectingScheme(scheme);
    setInspectDetailedData(null);
    setIsEditSchemeMode(false);
    setEditSchemeForm(null);
    setIsInspectModalOpen(true);
    setInspectLoading(true);

    try {
      const res = await apiClient(`/schemes/${scheme.id}`);
      if (res && res.success) {
        setInspectDetailedData(res.scheme || res.data || scheme);
      } else {
        setInspectDetailedData(scheme);
      }
    } catch (err) {
      console.warn('[AdminDashboardPage] Error fetching scheme extra details:', err);
      setInspectDetailedData(scheme);
    } finally {
      setInspectLoading(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteSchemeModal = (scheme) => {
    setSchemeToDelete(scheme);
    setIsDeleteSchemeModalOpen(true);
  };

  // Confirm and Execute Scheme Deletion
  const handleConfirmDeleteScheme = async () => {
    if (!schemeToDelete) return;
    setIsDeletingScheme(true);
    try {
      const res = await apiClient(`/admin/schemes/${schemeToDelete.id}`, { method: 'DELETE' });
      if (res.success) {
        showToast(`Scheme "${schemeToDelete.name}" deleted successfully.`);
        setSchemes(prev => prev.filter(s => s.id !== schemeToDelete.id));
        setTotalSchemesCount(prev => Math.max(0, prev - 1));

        if (inspectingScheme?.id === schemeToDelete.id) {
          setIsInspectModalOpen(false);
          setInspectingScheme(null);
        }
        setIsDeleteSchemeModalOpen(false);
        setSchemeToDelete(null);
      } else {
        showToast(res.message || 'Failed to delete scheme');
      }
    } catch (err) {
      showToast(err.message || 'Error deleting scheme');
    } finally {
      setIsDeletingScheme(false);
    }
  };

  // Legacy delete fallback
  const handleDeleteScheme = async (schemeId, schemeName) => {
    const s = schemes.find(item => item.id === schemeId) || { id: schemeId, name: schemeName };
    handleOpenDeleteSchemeModal(s);
  };

  // Safe, complete extraction helpers matching Public Citizen View (solves duplicates & formatting)
  const textToBulletList = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) {
      return text.flatMap(t => textToBulletList(t)).filter(Boolean);
    }
    if (typeof text === 'object') {
      return Object.values(text).flatMap(t => textToBulletList(t)).filter(Boolean);
    }
    if (typeof text !== 'string') return [String(text)];

    let cleaned = text
      .replace(/[\ufffd\u2022\u25cf\u25aa\u25b8\u2013\u2014*•]+/g, ' ')
      .replace(/\r\n|\r/g, '\n')
      .trim();

    const DEC = '___DEC___';
    cleaned = cleaned.replace(/(\d[\d,]*)\.(\d+)/g, (m, p1, p2) => p1 + DEC + p2);

    const DOT = '___DOT___';
    cleaned = cleaned.replace(/\b(Coop|Govt|Dept|Ltd|Pvt|Inc|No|Dr|Mr|Mrs|Ms|vs|etc|Rs|AD|i\.e|e\.g)\./gi, (m, p) => p + DOT);

    cleaned = cleaned.replace(/([a-zA-Z\)])\.([A-Z])/g, '$1. $2');
    cleaned = cleaned.replace(/([a-zA-Z])\.(\d)/g, '$1. $2');
    cleaned = cleaned.replace(/([a-zA-Z])(Rs\b|Rs\.|₹)/g, '$1 $2');

    const rawLines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    const joinedLines = [];
    rawLines.forEach(line => {
      if (
        joinedLines.length > 0 &&
        (!/[.!?:;]$/.test(joinedLines[joinedLines.length - 1]) ||
          /^[a-z,;]/.test(line) ||
          /^(?:and|or|in|to|its|of|for|with|by|from|etc\.?)\b/i.test(line))
      ) {
        joinedLines[joinedLines.length - 1] += ' ' + line;
      } else {
        joinedLines.push(line);
      }
    });

    const fullContent = joinedLines.join(' ');
    const numberedItemRegex = /(?:^|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\)|[-•*–—])\s+([^]+?)(?=(?:\s(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\)|[-•*–—])\s+)|$)/g;
    const numberedMatches = [...fullContent.matchAll(numberedItemRegex)];

    let candidates = [];
    if (fullContent.includes(';')) {
      // Split by semicolon (standard delimiter used by admin to separate distinct criteria / benefits)
      candidates = fullContent
        .split(/;\s*/)
        .map(s => s.trim().replace(/[;\.]+\s*$/, '').trim())
        .filter(Boolean);
    } else if (numberedMatches.length > 1) {
      candidates = numberedMatches.map(m => m[1].trim());
    } else {
      candidates = fullContent
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    const validSentences = [];
    for (let cand of candidates) {
      let s = cand
        .replace(new RegExp(DOT, 'g'), '.')
        .replace(new RegExp(DEC, 'g'), '.')
        .trim();

      // ONLY strip actual list markers (e.g. "1. ", "1) ", "(a) ", "• ", "- "), NOT initial numbers like "40% subsidy"
      s = s.replace(/^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\)|[-•*–—])\s*/, '').trim();
      s = s.replace(/^(?:DETAILS|CRITERIA|BENEFITS|DESCRIPTION|Overview)\s*:\s*/i, '').trim();

      if (!s || s.length < 3 || /^(?:etc\.?|and|or|nil|na|n\/a)$/i.test(s)) {
        continue;
      }

      s = s.charAt(0).toUpperCase() + s.slice(1);
      if (!/[.!?:]$/.test(s)) {
        s += '.';
      }

      validSentences.push(s);
    }

    return validSentences.length > 0 ? validSentences : [fullContent.replace(new RegExp(DOT, 'g'), '.').replace(new RegExp(DEC, 'g'), '.')];
  };

  const getAboutSchemeBullets = (schemeObj, benefitsDataObj) => {
    if (!schemeObj) return [];

    const rawDesc = typeof schemeObj.description === 'string' ? schemeObj.description.trim() : '';
    const rawBenefits = benefitsDataObj?.raw ? benefitsDataObj.raw.trim() : '';
    const catName = typeof schemeObj.category === 'object' ? (schemeObj.category?.name || 'Social Welfare') : (schemeObj.category || schemeObj.category_name || 'Social Welfare');
    const ministry = schemeObj.ministry || schemeObj.ministry_department || 'Government of India';
    const govtLevel = (schemeObj.govt_level || '').toUpperCase() === 'CENTRAL' ? 'Central Government' : `${schemeObj.state || 'State'} Government`;
    const appMode = schemeObj.application_mode || 'Online';

    const isDuplicate = !rawDesc || (
      rawBenefits && (
        rawDesc.toLowerCase().replace(/[\s\W]+/g, '') === rawBenefits.toLowerCase().replace(/[\s\W]+/g, '') ||
        (rawDesc.length > 25 && rawBenefits.includes(rawDesc.slice(0, 35)))
      )
    );

    if (!isDuplicate && rawDesc.length > 20) {
      return textToBulletList(rawDesc);
    }

    const summaryBullets = [];
    let purpose = `${schemeObj.name} is a dedicated ${govtLevel} welfare initiative administered by the ${ministry} to deliver critical financial and social assistance under the ${catName} sector.`;
    const catLower = catName.toLowerCase();
    const nameLower = (schemeObj.name || '').toLowerCase();

    if (catLower.includes('educat') || catLower.includes('scholar') || nameLower.includes('scholarship')) {
      purpose = `${schemeObj.name} is an academic financial assistance initiative managed by the ${ministry} to support eligible students in completing higher technical and professional diploma or degree education.`;
    } else if (catLower.includes('agri') || catLower.includes('farm') || nameLower.includes('kisan')) {
      purpose = `${schemeObj.name} is an agricultural support program under the ${ministry} designed to provide direct financial security, modern post-harvest infrastructure, and input subsidies to empower farmers.`;
    } else if (catLower.includes('women') || catLower.includes('child') || nameLower.includes('women')) {
      purpose = `${schemeObj.name} is a dedicated empowerment program under the ${ministry} created to advance socio-economic welfare, mobility, and financial self-reliance for women.`;
    } else if (catLower.includes('weav') || nameLower.includes('yarn') || nameLower.includes('textile') || nameLower.includes('subsidy')) {
      purpose = `${schemeObj.name} is an industrial welfare scheme under the ${ministry} to support weavers and cooperative societies by subsidizing raw material costs and boosting domestic handloom production.`;
    } else if (catLower.includes('health') || catLower.includes('arogya') || nameLower.includes('health') || nameLower.includes('bima')) {
      purpose = `${schemeObj.name} is a public health initiative administered by the ${ministry} providing critical healthcare coverage, hospitalization subsidies, and medical aid.`;
    } else if (catLower.includes('fellow') || nameLower.includes('fellowship') || nameLower.includes('research')) {
      purpose = `${schemeObj.name} is an international research and training program under the ${ministry} fostering academic exchange and scientific collaboration among researchers.`;
    }
    summaryBullets.push(purpose);

    const rawElig = typeof schemeObj.eligibility === 'object' && schemeObj.eligibility
      ? (schemeObj.eligibility.criteria || JSON.stringify(schemeObj.eligibility))
      : String(schemeObj.eligibility || schemeObj.eligibility_criteria || '');

    let targetSummary = '';
    if (/orphan|covid|martyr|armed forces/i.test(rawElig) || /swanath/i.test(nameLower)) {
      targetSummary = 'Target Beneficiaries: Specifically designed for orphan students, children who lost parents during COVID-19, and wards of martyred Armed Forces or Central Armed Police Forces personnel.';
    } else if (catLower.includes('agri') || catLower.includes('farm') || /farmer|agricultural|kisan|crop|harvest|infra/i.test(nameLower) || (/farmer|agricultural|kisan/i.test(rawElig) && !catLower.includes('women'))) {
      targetSummary = 'Target Beneficiaries: Farmers, Primary Agricultural Credit Societies (PACS), Agri-entrepreneurs, Farmer Producer Organizations (FPOs), and agricultural cultivators.';
    } else if (/weavers?|handloom|societies|cooperative/i.test(rawElig) || /yarn|handloom/i.test(nameLower)) {
      targetSummary = 'Target Beneficiaries: Primary Handloom Weavers Cooperative Societies and registered artisan members engaged in active textile production.';
    } else if (catLower.includes('women') || /women|stree|mahila|kanya/i.test(nameLower) || /women|female|girl/i.test(rawElig)) {
      targetSummary = 'Target Beneficiaries: Working women, self-employed female workers, and eligible women-led households.';
    } else if (/student|scholarship|education/i.test(rawElig) || /scholarship|fellowship|vidya|student/i.test(nameLower)) {
      targetSummary = 'Target Beneficiaries: Enrolled students, scholars, and youth pursuing recognized academic or technical education.';
    } else if (rawElig && rawElig.length > 20) {
      const firstElig = rawElig.split(/[.!?\n]/)[0].replace(/^[\s\d.():•\-–*]+/, '').trim();
      if (firstElig.length > 15 && firstElig.length < 180) {
        targetSummary = `Target Beneficiaries: ${firstElig.charAt(0).toUpperCase() + firstElig.slice(1)}.`;
      }
    }
    if (targetSummary) {
      summaryBullets.push(targetSummary);
    }

    summaryBullets.push(
      `Application & Governance: Managed with end-to-end transparent verification via ${appMode} mode, ensuring direct and accountable delivery of benefits to verified applicants.`
    );

    return summaryBullets;
  };

  const getBenefitsData = (benefits) => {
    if (!benefits) return null;
    if (typeof benefits === 'string') {
      const bullets = textToBulletList(benefits);
      return { bullets, raw: benefits };
    }
    if (typeof benefits === 'object') {
      if (Array.isArray(benefits)) {
        return { bullets: benefits.map(b => (typeof b === 'object' ? JSON.stringify(b) : String(b))), raw: '' };
      }
      if (benefits.details) {
        const bullets = textToBulletList(String(benefits.details));
        return { bullets, raw: String(benefits.details) };
      }
      const entries = Object.entries(benefits).map(
        ([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
      );
      return { bullets: entries, raw: '' };
    }
    return { bullets: [String(benefits)], raw: String(benefits) };
  };

  const getEligibilityData = (schemeObj) => {
    const raw = schemeObj.eligibility || schemeObj.eligibility_criteria || schemeObj.eligibility_rules;
    if (!raw) return null;

    let text = '';
    if (typeof raw === 'string') {
      text = raw;
    } else if (typeof raw === 'object') {
      if (Array.isArray(raw)) {
        return { criteriaBullets: raw.map(String), notes: [], exclusions: [] };
      }
      if (raw.criteria) {
        text = String(raw.criteria);
      } else {
        const entries = Object.entries(raw).map(
          ([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
        );
        return { criteriaBullets: entries, notes: [], exclusions: [] };
      }
    }

    let mainCriteriaText = text;
    let exclusionText = '';
    if (text.includes('Exclusions / Ineligibility:')) {
      const parts = text.split('Exclusions / Ineligibility:');
      mainCriteriaText = parts[0].trim();
      exclusionText = parts[1].trim();
    } else if (text.includes('Exclusions:')) {
      const parts = text.split('Exclusions:');
      mainCriteriaText = parts[0].trim();
      exclusionText = parts[1].trim();
    }

    const notes = [];
    if (/NOTE\s*\d*\s*:/i.test(mainCriteriaText)) {
      const noteMatches = mainCriteriaText.match(/NOTE\s*\d*\s*:[^]+?(?=(?:NOTE\s*\d*\s*:)|$)/gi);
      if (noteMatches) {
        noteMatches.forEach(n => notes.push(n.trim()));
        mainCriteriaText = mainCriteriaText.replace(/NOTE\s*\d*\s*:[^]+$/i, '').trim();
      }
    }

    const criteriaBullets = textToBulletList(mainCriteriaText);
    const exclusions = exclusionText ? textToBulletList(exclusionText) : [];

    return { criteriaBullets, notes, exclusions };
  };

  const getDocumentsList = (schemeObj) => {
    const docs = schemeObj.documents_required || schemeObj.documents;
    if (!docs) return ['Valid Government Issued Photo Identity (Aadhaar / Voter ID / Ration Card).'];

    let rawList = [];
    if (Array.isArray(docs)) {
      rawList = docs.map(String);
    } else if (typeof docs === 'object' && docs !== null) {
      rawList = Object.values(docs).map(String);
    } else {
      rawList = [String(docs)];
    }

    let expandedItems = [];
    for (let rawItem of rawList) {
      if (!rawItem || !rawItem.trim()) continue;
      let subItems = [];
      if (rawItem.includes(';')) {
        subItems = rawItem.split(/;\s*/);
      } else if (rawItem.includes('\n')) {
        subItems = rawItem.split(/[\r\n]+/);
      } else if (/(?:^|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)])\s+/.test(rawItem)) {
        subItems = rawItem.split(/(?:^|\s)(?:\d+[\.\)]|[a-zA-Z][\.\)])\s+/).filter(Boolean);
      } else {
        subItems = rawItem.split(/(?:[\r\n]+\s*[•\ufffd\u25cf\u25aa\u25b8*–—]\s*|[•\ufffd\u25cf\u25aa\u25b8*–—]\s+)/);
      }
      for (let s of subItems) {
        if (s.trim()) expandedItems.push(s.trim());
      }
    }
    if (expandedItems.length === 0) expandedItems = rawList;

    const rejoinedList = [];
    let inParen = false;
    let parenBuffer = '';

    for (let rawItem of expandedItems) {
      let item = rawItem.replace(/\s+/g, ' ').trim();
      if (!item) continue;

      const openCount = (item.match(/\(/g) || []).length;
      const closeCount = (item.match(/\)/g) || []).length;

      if (!inParen) {
        if (openCount > closeCount) {
          inParen = true;
          parenBuffer = item;
          continue;
        }
      } else {
        parenBuffer += ', ' + item;
        if (openCount < closeCount || parenBuffer.includes(')')) {
          inParen = false;
          item = parenBuffer;
          parenBuffer = '';
        } else {
          continue;
        }
      }

      if (rejoinedList.length > 0) {
        const prev = rejoinedList[rejoinedList.length - 1];
        const prevNeedsContinuation =
          /[:\-,/]$/.test(prev) ||
          /\b(in case of|in ca of|of|for|with|and|or|to|by|from|latest|if|duly|copy of|audited)\s*$/i.test(prev) ||
          /^(?:article\s+of|proof\s+of\s+registration|address\s+proof)\s*:?$/i.test(prev);

        const currIsContinuation =
          /^[a-z,;)]/.test(item) ||
          /^(?:association|balance\s+sheet|tax\s+bill|registration|applicable|available|last\s+one\s+year|estimates|sanction)\b/i.test(item);

        if (prevNeedsContinuation || currIsContinuation) {
          rejoinedList[rejoinedList.length - 1] = prev.replace(/[:\s]+$/, '') + (prev.endsWith('/') || item.startsWith('/') ? '' : ' ') + item;
          continue;
        }
      }

      rejoinedList.push(item);
    }
    if (parenBuffer) {
      rejoinedList.push(parenBuffer);
    }

    const formattedDocs = [];
    for (let block of rejoinedList) {
      let s = block
        .replace(/[\ufffd\u2022\u25cf\u25aa\u25b8\u2013\u2014*•]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      s = s.replace(/^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\(\d+\)|\([a-zA-Z]\)|[-•*–—])\s+/, '').trim();
      s = s.replace(/^documents?\s+(?:to\s+be\s+submitted|required)\s*(?:during\s+application\s+submission)?\s*:\s*/i, '').trim();

      if (!s || s.length < 5 || /^(?:etc\.?|and|or|nil|na|n\/a|as applicable|if available\.?|if applicable\.?|applicable\.?)$/i.test(s)) {
        continue;
      }

      if (/^(?:if\s+available|if\s+applicable|then\s+|applicable)/i.test(s) && formattedDocs.length > 0 && s.length < 35) {
        formattedDocs[formattedDocs.length - 1] = formattedDocs[formattedDocs.length - 1].replace(/\.?$/, '') + ` (${s.replace(/\.?$/, '')}).`;
        continue;
      }

      s = s.replace(/\bin ca of\b/gi, 'in case of');
      s = s.replace(/Registers\s+Stock Register\s+Cash Book/gi, 'Registers: Stock Register, Cash Book');
      s = s.charAt(0).toUpperCase() + s.slice(1);
      if (!/[.!?:]$/.test(s)) {
        s += '.';
      }

      formattedDocs.push(s);
    }

    return formattedDocs.length > 0 ? formattedDocs : ['Standard Government Issued Verification Credentials.'];
  };

  const renderBulletContent = (text) => {
    if (!text) return null;

    let title = null;
    let mainBody = text;

    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx < 40) {
      title = text.slice(0, colonIdx);
      mainBody = text.slice(colonIdx + 1);
    }

    const metricRegex = /(\b\d+(?:\.\d+)?%\s*(?:subsidy|amount|bonus)?|₹\s*[\d,]+|\bRs\.?\s*[\d,]+)/gi;
    const parts = mainBody.split(metricRegex);

    return (
      <span>
        {title && <strong className="bullet-highlight-title">{title}: </strong>}
        {parts.map((part, i) => {
          if (metricRegex.test(part)) {
            return (
              <strong key={i} className="bullet-metric-badge">
                {part}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  };

  // Toggle User Status
  const handleToggleUserStatus = async (userId, currentStatus, userEmail) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await apiClient(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        showToast(`User ${userEmail} marked as ${newStatus}.`);
        fetchTabData(); apiClient('/admin/dashboard').then(res => { if (res?.success) setStats(res.dashboard || res.data); }).catch(() => {});
      } else {
        showToast(res.message || 'Failed to update user status');
      }
    } catch (err) {
      showToast(err.message || 'Error updating user status');
    }
  };

  // Toggle User Role
  const handleToggleUserRole = async (userId, currentRole, userEmail) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Change role for ${userEmail} to ${newRole}?`)) return;

    try {
      const res = await apiClient(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (res.success) {
        showToast(`User ${userEmail} is now ${newRole}.`);
        fetchTabData(); apiClient('/admin/dashboard').then(res => { if (res?.success) setStats(res.dashboard || res.data); }).catch(() => {});
      } else {
        showToast(res.message || 'Failed to update user role');
      }
    } catch (err) {
      showToast(err.message || 'Error updating user role');
    }
  };

  // Send Broadcast Alert
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.description.trim()) {
      showToast('Title and message are required.');
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await apiClient('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastForm)
      });
      if (res.success) {
        showToast('Official announcement broadcasted to all citizens! 📢');

        // Immediately notify all active citizen tabs via BroadcastChannel & storage ping
        try {
          if (typeof window !== 'undefined') {
            if ('BroadcastChannel' in window) {
              const channel = new BroadcastChannel('schemesathi_realtime_broadcasts');
              channel.postMessage({ type: 'NEW_BROADCAST', broadcast: res.data });
              setTimeout(() => {
                try { channel.close(); } catch (e) {}
              }, 1500);
            }
            localStorage.setItem('schemesathi_broadcast_ping', Date.now().toString());
          }
        } catch (err) {
          console.warn('BroadcastChannel error:', err);
        }

        setBroadcastForm({
          title: '',
          description: '',
          category: 'GENERAL',
          link_action: '/explore',
          link_text: 'View Announcement →'
        });
        fetchTabData(); apiClient('/admin/dashboard').then(res => { if (res?.success) setStats(res.dashboard || res.data); }).catch(() => {});
      } else {
        showToast(res.message || 'Failed to send broadcast');
      }
    } catch (err) {
      showToast(err.message || 'Error broadcasting message');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Permanently clear all broadcast messages history
  const handleConfirmClearBroadcasts = async () => {
    setIsClearingBroadcasts(true);
    try {
      const res = await apiClient('/admin/broadcast', { method: 'DELETE' });
      if (res?.success) {
        setBroadcasts([]);
        showToast(res.message || 'All broadcast messages have been permanently deleted.');
        setIsClearBroadcastsModalOpen(false);
      } else {
        showToast(res?.message || 'Failed to clear broadcast history');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error clearing broadcast history:', err);
      showToast(err.message || 'Error communicating with server');
    } finally {
      setIsClearingBroadcasts(false);
    }
  };

  // Permanently delete a single broadcast notification
  const handleConfirmDeleteSingleBroadcast = async () => {
    if (!broadcastToDelete) return;
    setIsDeletingSingleBroadcast(true);
    try {
      const res = await apiClient(`/admin/broadcast/${broadcastToDelete.id}`, { method: 'DELETE' });
      if (res?.success) {
        setBroadcasts(prev => prev.filter(b => b.id !== broadcastToDelete.id));
        showToast('Broadcast message permanently deleted.');
        setIsDeleteSingleBroadcastModalOpen(false);
        setBroadcastToDelete(null);
      } else {
        showToast(res?.message || 'Failed to delete broadcast message');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error deleting broadcast:', err);
      showToast(err.message || 'Error deleting broadcast message');
    } finally {
      setIsDeletingSingleBroadcast(false);
    }
  };

  // System Settings Diagnostic & Configuration Handlers
  const handleToggleSetting = async (key) => {
    const updatedValue = !settingsForm[key];
    const newForm = {
      ...settingsForm,
      [key]: updatedValue
    };
    setSettingsForm(newForm);

    // Instant auto-save to backend
    try {
      const res = await apiClient('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(newForm)
      });
      if (res?.success) {
        const friendlyName = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        showToast(`${friendlyName}: ${updatedValue ? 'Enabled (Active)' : 'Disabled (Paused)'} ⚙️`);
      }
    } catch (err) {
      console.warn('[AdminDashboardPage] Quick save setting error:', err);
    }
  };

  const handleSettingInputChange = (key, val) => {
    setSettingsForm(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await apiClient('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settingsForm)
      });
      if (res?.success) {
        showToast('Platform system settings saved successfully! ⚙️');
        if (res.system_settings) {
          setSettingsForm(prev => ({ ...prev, ...res.system_settings }));
          try {
            window.dispatchEvent(new CustomEvent('schemesathi-settings-updated', { detail: res.system_settings }));
          } catch (e) {}
        }
      } else {
        showToast(res?.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Error saving settings:', err);
      showToast(err.message || 'Error communicating with server');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePingDatabase = async () => {
    setIsPingingDb(true);
    try {
      const t0 = performance.now();
      const res = await apiClient('/admin/settings/ping');
      const roundTrip = Math.round(performance.now() - t0);
      if (res?.success) {
        const measured = res.latency_ms || roundTrip;
        setLiveDbLatency(measured);
        showToast(`Neon PostgreSQL live roundtrip: ${measured} ms (Status: ${res.status || 'CONNECTED'}) ⚡`);
      } else {
        showToast('Database ping failed: ' + (res?.error || 'Timeout'));
      }
    } catch (err) {
      showToast('Database ping error: ' + err.message);
    } finally {
      setIsPingingDb(false);
    }
  };

  const handleRefreshSettings = async () => {
    try {
      const res = await apiClient('/admin/settings');
      if (res?.success) {
        setSystemSettings(res.data || {});
        if (res.data?.system_settings) {
          setSettingsForm(prev => ({ ...prev, ...res.data.system_settings }));
        }
        if (res.data?.db_latency_ms !== undefined) {
          setLiveDbLatency(res.data.db_latency_ms);
        }
        showToast('Telemetry & live counters refreshed! 🔄');
      }
    } catch (err) {
      showToast('Failed to refresh telemetry');
    }
  };

  const handleResetSettingsToDefault = () => {
    setSettingsForm({
      allow_citizen_registration: true,
      allow_citizen_queries: true,
      auto_broadcast_new_schemes: true,
      maintenance_mode: false,
      system_announcement: '',
      default_language: 'en',
      max_upload_size_mb: 5,
      session_timeout_hours: 24,
    });
    showToast('Settings reset to platform defaults. Tap "Save Configuration" to persist.');
  };

  // Fetch fresh Admin Team list
  const fetchAdminList = useCallback(async () => {
    setIsLoadingAdmins(true);
    try {
      const res = await apiClient.admin.admins.list();
      if (res.success && res.admins) {
        setAdminList(res.admins);
      }
    } catch (err) {
      console.error('Failed to fetch admin list:', err);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  // Update Admin Profile details
  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    if (!adminProfileForm.first_name.trim() || !adminProfileForm.last_name.trim() || !adminProfileForm.email.trim()) {
      showToast('First name, last name, and email address are required.');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const res = await apiClient.admin.profile.update(adminProfileForm);
      if (res.success && res.user) {
        if (updateUserSession) {
          updateUserSession(res.user);
        }
        showToast('Admin profile details updated successfully! ✅');
      } else {
        showToast(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      showToast(err.message || 'Error updating profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Update Admin Password
  const handleUpdateAdminPassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password) {
      showToast('Please enter your current password.');
      return;
    }
    if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
      showToast('New password must be at least 8 characters long.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('New password and confirmation do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await apiClient.admin.profile.updatePassword(passwordForm);
      if (res.success) {
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        showToast('Administrator password changed successfully! 🔐');
      } else {
        showToast(res.message || 'Failed to change password.');
      }
    } catch (err) {
      showToast(err.message || 'Error changing password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Create New Administrator Directly
  const handleCreateNewAdmin = async (e) => {
    e.preventDefault();
    if (!createAdminForm.first_name.trim() || !createAdminForm.last_name.trim() || !createAdminForm.email.trim() || !createAdminForm.password) {
      showToast('Please fill in all required fields.');
      return;
    }
    if (createAdminForm.password.length < 8) {
      showToast('Initial password must be at least 8 characters long.');
      return;
    }
    setIsCreatingAdmin(true);
    try {
      const res = await apiClient.admin.admins.create(createAdminForm);
      if (res.success) {
        showToast(`Administrator account for ${createAdminForm.first_name} created successfully! 🛡️`);
        setIsCreateAdminModalOpen(false);
        setCreateAdminForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: '',
        });
        fetchAdminList();
      } else {
        showToast(res.message || 'Failed to provision administrator.');
      }
    } catch (err) {
      showToast(err.message || 'Error creating administrator.');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Revoke Admin Access (Demote to User)
  const handleRevokeAdminAccess = async () => {
    if (!adminToRevoke) return;
    if (adminToRevoke.id === user?.id) {
      showToast('Platform security prevents you from revoking your own administrator privileges.');
      return;
    }
    setIsRevoking(true);
    try {
      const res = await apiClient.admin.users.updateRole(adminToRevoke.id, 'USER');
      if (res.success) {
        showToast(`Admin privileges revoked for ${adminToRevoke.first_name}. Account role set to Citizen.`);
        setIsRevokeModalOpen(false);
        setAdminToRevoke(null);
        fetchAdminList();
      } else {
        showToast(res.message || 'Failed to revoke administrator privileges.');
      }
    } catch (err) {
      showToast(err.message || 'Error revoking administrator privileges.');
    } finally {
      setIsRevoking(false);
    }
  };
  const handleCopySchemeLink = (schemeId) => {
    const url = `${window.location.origin}/scheme/${schemeId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSchemeId(schemeId);
      setTimeout(() => setCopiedSchemeId(null), 2000);
      showToast('Scheme direct link copied to clipboard! 📋');
    }).catch(() => {
      showToast('Failed to copy link');
    });
  };

  // Helper for Category styling & icon
  const getCategoryMeta = (catName) => {
    const name = String(catName || '').toLowerCase();
    if (name.includes('scholarship') || name.includes('education')) {
      return { icon: 'fa-graduation-cap', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (name.includes('farmer') || name.includes('agri')) {
      return { icon: 'fa-tractor', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    }
    if (name.includes('social') || name.includes('assistance') || name.includes('financial')) {
      return { icon: 'fa-hand-holding-dollar', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
    }
    if (name.includes('women') || name.includes('child')) {
      return { icon: 'fa-person-dress', bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' };
    }
    if (name.includes('health')) {
      return { icon: 'fa-heart-pulse', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    }
    if (name.includes('housing')) {
      return { icon: 'fa-house', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
    }
    if (name.includes('employment') || name.includes('skill')) {
      return { icon: 'fa-briefcase', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
    }
    if (name.includes('business') || name.includes('entrepreneur')) {
      return { icon: 'fa-lightbulb', bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    }
    if (name.includes('senior') || name.includes('disab')) {
      return { icon: 'fa-wheelchair', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' };
    }
    return { icon: 'fa-layer-group', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  };

  // Unique categories list
  const schemeCategories = useMemo(() => {
    const cats = new Set();
    schemes.forEach(s => {
      const catName = typeof s.category === 'object' ? s.category?.name : (s.category || s.category_name);
      if (catName && typeof catName === 'string' && catName.trim()) {
        cats.add(catName.trim());
      }
    });
    return Array.from(cats).sort();
  }, [schemes]);

  // Counts for tabs
  const centralSchemesCount = useMemo(() => {
    return schemes.filter(s => !String(s.govt_level || '').toLowerCase().includes('state')).length;
  }, [schemes]);

  const stateSchemesCount = useMemo(() => {
    return schemes.filter(s => String(s.govt_level || '').toLowerCase().includes('state')).length;
  }, [schemes]);

  // Comprehensive Filtered and Sorted Schemes
  const filteredAndSortedSchemes = useMemo(() => {
    const term = schemeSearch.trim().toLowerCase();

    const list = schemes.filter(s => {
      const name = (s.name || '').toLowerCase();
      const cat = (typeof s.category === 'object' ? s.category?.name : (s.category || s.category_name || '')).toLowerCase();
      const dept = (s.ministry_department || s.ministry || '').toLowerCase();
      const st = (s.state || '').toLowerCase();
      const level = String(s.govt_level || '').toLowerCase();
      const isState = level.includes('state');
      const isActive = s.is_active !== false;

      // Search match
      if (term) {
        const matches = name.includes(term) || cat.includes(term) || dept.includes(term) || st.includes(term);
        if (!matches) return false;
      }

      // Govt level filter
      if (schemeLevelFilter === 'CENTRAL' && isState) return false;
      if (schemeLevelFilter === 'STATE' && !isState) return false;

      // Category filter
      if (schemeCategoryFilter !== 'ALL') {
        if (cat !== schemeCategoryFilter.toLowerCase()) return false;
      }

      // Status filter
      if (schemeStatusFilter === 'ACTIVE' && !isActive) return false;
      if (schemeStatusFilter === 'INACTIVE' && isActive) return false;

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (schemeSortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (schemeSortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (schemeSortBy === 'state-asc') {
        return (a.state || 'All India').localeCompare(b.state || 'All India');
      }
      if (schemeSortBy === 'level-asc') {
        return (a.govt_level || 'Central').localeCompare(b.govt_level || 'Central');
      }
      if (schemeSortBy === 'id-desc') {
        return (b.id || 0) - (a.id || 0);
      }
      return 0;
    });
  }, [schemes, schemeSearch, schemeLevelFilter, schemeCategoryFilter, schemeStatusFilter, schemeSortBy]);

  // Backward compatibility alias for any existing reference
  const filteredSchemes = filteredAndSortedSchemes;

  // Pagination calculations
  const totalFilteredCount = filteredAndSortedSchemes.length;
  const isAllPagination = schemePageSize === 'ALL';
  const effectivePageSize = isAllPagination ? Math.max(1, totalFilteredCount) : Number(schemePageSize);
  const totalPages = isAllPagination ? 1 : Math.max(1, Math.ceil(totalFilteredCount / effectivePageSize));
  
  const paginatedSchemes = useMemo(() => {
    if (schemePageSize === 'ALL') return filteredAndSortedSchemes;
    const size = Number(schemePageSize);
    const start = (schemePage - 1) * size;
    return filteredAndSortedSchemes.slice(start, start + size);
  }, [filteredAndSortedSchemes, schemePage, schemePageSize]);

  const isAnyFilterActive = schemeSearch.trim() !== '' || schemeLevelFilter !== 'ALL' || schemeCategoryFilter !== 'ALL' || schemeStatusFilter !== 'ALL' || schemeSortBy !== 'name-asc';

  const handleResetFilters = () => {
    setSchemeSearch('');
    setSchemeLevelFilter('ALL');
    setSchemeCategoryFilter('ALL');
    setSchemeStatusFilter('ALL');
    setSchemeSortBy('name-asc');
    setSchemePage(1);
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (!userSearch.trim()) return true;
    const term = userSearch.toLowerCase();
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return u.email?.toLowerCase().includes(term) || name.includes(term) || u.phone?.includes(term);
  });

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout activePage={activeTab} onOpenAddScheme={() => setIsAddModalOpen(true)}>
      <div className="admin-dashboard-page-wrapper">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="admin-toast-alert">
            <i className="fa fa-circle-check"></i>
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="admin-toast-close" aria-label="Dismiss">
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}

        {error && (
          <div className="admin-error-box">
            <i className="fa fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="admin-loading-state">
            <i className="fa fa-spinner fa-spin"></i>
            <span>Loading administrative records...</span>
          </div>
        ) : (
          <div className="admin-tab-content-area">
            {/* 1. OVERVIEW & ANALYTICS PAGE */}
            {activeTab === 'overview' && (
              <div className="admin-overview-view">
                {/* Hero / Welcome Banner - Displayed only on master Overview page */}
                <section className="hero-banner admin-hero-banner">
                  <div className="hero-text">
                    <div className="hero-heading-group">
                      <div className="hero-top-badge">
                        <i className="fa fa-shield-halved"></i> Master Administration Console
                      </div>
                      <h2>Welcome to Administration, {user?.first_name || 'Admin'}! 🏛️</h2>
                    </div>
                    <p>
                      Oversee official welfare schemes, monitor citizen registrations and demographics in real time, review policy verifications, and broadcast verified welfare updates nationwide.
                    </p>
                    <div className="hero-quote-row">
                      <div className="hero-quote">
                        <span>"Sahi Jaankari, Sahi Yojana, Behtar Kal."</span>
                      </div>
                    </div>
                  </div>
                  <div className="hero-image">
                    <img src="/herosection.png" alt="Parliament Illustration" />
                  </div>
                </section>
                <div className="stats-grid">
                  <div className="stat-card blue" onClick={() => handleTabChange('analytics')} style={{ cursor: 'pointer' }} title="View User Analytics & Profiles">
                    <div className="stat-icon blue-icon"><i className="fa fa-users"></i></div>
                    <div className="stat-info">
                      <span className="stat-number">{stats?.total_users ?? 23}</span>
                      <span className="stat-label">Registered Citizens</span>
                      <span className="stat-sub">{stats?.active_users ?? stats?.total_users ?? 23} active accounts</span>
                    </div>
                  </div>

                  <div className="stat-card green" onClick={() => handleTabChange('schemes')} style={{ cursor: 'pointer' }} title="View Scheme Catalog">
                    <div className="stat-icon green-icon"><i className="fa fa-landmark"></i></div>
                    <div className="stat-info">
                      <span className="stat-number">{stats?.total_schemes ?? 101}</span>
                      <span className="stat-label">Total Schemes</span>
                      <span className="stat-sub">{stats?.active_schemes ?? 101} active & visible</span>
                    </div>
                  </div>

                  <div className="stat-card purple" onClick={() => handleTabChange('analytics')} style={{ cursor: 'pointer' }} title="View Citizen Applications">
                    <div className="stat-icon purple-icon"><i className="fa fa-file-signature"></i></div>
                    <div className="stat-info">
                      <span className="stat-number">{stats?.total_applications ?? 5}</span>
                      <span className="stat-label">Citizen Applications</span>
                      <span className="stat-sub">{stats?.applied_applications ? `${stats.applied_applications} verified & submitted` : 'Applications filed & tracked'}</span>
                    </div>
                  </div>

                  <div className="stat-card orange" onClick={() => handleTabChange('schemes')} style={{ cursor: 'pointer' }} title="View Welfare Categories">
                    <div className="stat-icon orange-icon"><i className="fa fa-layer-group"></i></div>
                    <div className="stat-info">
                      <span className="stat-number">{stats?.total_categories ?? 10}</span>
                      <span className="stat-label">Welfare Categories</span>
                      <span className="stat-sub">10 active welfare sectors</span>
                    </div>
                  </div>
                </div>

                {/* Recent Reports & Admin Activity Section */}
                <div className="admin-reports-activity-section">
                  <div className="panel-header">
                    <div className="panel-title-group">
                      <div className="panel-icon-bubble purple">
                        <i className="fa fa-clock-rotate-left"></i>
                      </div>
                      <div>
                        <h3 className="panel-title">Recent Reports & Admin Activity</h3>
                        <span className="panel-subtitle">Administrative Audit Trail, Citizen Reports & Data Exports</span>
                      </div>
                    </div>
                    <span className="panel-badge purple-badge">
                      <span className="live-pulsing-dot"></span> Real-Time Log
                    </span>
                  </div>

                  {/* Quick Reports Download Bar (3 Columns) */}
                  <div className="reports-quick-actions">
                    <button 
                      type="button" 
                      className="report-download-btn" 
                      onClick={handleExportSchemeReport}
                      title="Download complete scheme metadata and audit report (CSV)"
                    >
                      <div className="report-btn-icon-wrap teal">
                        <i className="fa fa-file-csv"></i>
                      </div>
                      <div className="report-btn-info">
                        <strong>Scheme Catalog Report</strong>
                        <span>Export all 101 schemes with full specifications, criteria & benefits (CSV)</span>
                      </div>
                    </button>
                    <button 
                      type="button" 
                      className="report-download-btn" 
                      onClick={handleExportCitizenReport}
                      title="Download complete citizen profiles, demographics & account status (CSV)"
                    >
                      <div className="report-btn-icon-wrap purple">
                        <i className="fa fa-file-invoice"></i>
                      </div>
                      <div className="report-btn-info">
                        <strong>Citizen Details Report</strong>
                        <span>Export citizen profiles, demographics & status (CSV)</span>
                      </div>
                    </button>
                    <button 
                      type="button" 
                      className="report-download-btn" 
                      onClick={handleExportAuditReport}
                      title="Download complete administrative audit log detailing what actually changed (CSV)"
                    >
                      <div className="report-btn-icon-wrap blue">
                        <i className="fa fa-file-shield"></i>
                      </div>
                      <div className="report-btn-info">
                        <strong>System Audit Report</strong>
                        <span>Export full audit trail detailing what actually changed (CSV)</span>
                      </div>
                    </button>
                  </div>

                  {/* Recent Platform & Admin Activity Timeline (Live Top 4 Feeds) */}
                  <div className="admin-activity-timeline-wrap">
                    <span className="v-section-label"><i className="fa fa-timeline"></i> Platform Event Log & Administrative Feed</span>
                    <div className="activity-timeline-feed">
                      {((stats?.recent_activities && stats.recent_activities.length > 0)
                        ? stats.recent_activities.slice(0, 4)
                        : fallbackRecentActivities
                      ).map((item, idx) => (
                        <div className="activity-timeline-item" key={item.id || idx}>
                          <div className={`activity-item-icon ${item.icon_color || (item.badge === 'New Scheme' ? 'green' : (item.badge === 'Citizen Filing' ? 'purple' : 'blue'))}`}>
                            <i className={item.icon_class || (item.badge === 'New Scheme' ? 'fa fa-circle-plus' : (item.badge === 'Citizen Filing' ? 'fa fa-file-signature' : 'fa fa-pen-to-square'))}></i>
                          </div>
                          <div className="activity-item-body">
                            <div className="activity-item-main">
                              <strong className="activity-item-title">{item.title}</strong>
                              <p className="activity-item-desc">{item.subtitle}</p>
                            </div>
                            <div className="activity-item-aside">
                              <span className={`activity-tag ${item.badge_type || (item.badge === 'New Scheme' ? 'green-tag' : (item.badge === 'Citizen Filing' ? 'purple-tag' : 'admin-tag'))}`}>
                                {item.badge || 'Admin Action'}
                              </span>
                              <span className="activity-item-time">
                                <i className="fa fa-clock"></i> {item.formatted_time || formatActivityTime(item.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="panel-footer">
                    <span className="panel-footer-note">
                      <i className="fa fa-shield-halved"></i> All administrative operations, scheme edits, and citizen filings are recorded for security and compliance audit.
                    </span>
                    <div className="panel-footer-actions">
                      <button type="button" className="panel-footer-btn" onClick={() => handleTabChange('schemes')}>
                        Inspect Scheme Catalog <i className="fa fa-arrow-right"></i>
                      </button>
                      <button type="button" className="panel-footer-btn" onClick={() => handleTabChange('queries')}>
                        Support & Queries <i className="fa fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            {activeTab === 'schemes' && (
              <div className="admin-schemes-view">
                {/* Dedicated Scheme Catalog Page Header */}
                <div className="admin-page-header-card">
                  <div className="admin-page-header-info">
                    <div className="admin-page-badge">
                      <i className="fa fa-landmark"></i> Official Welfare Repository
                    </div>
                    <h2>Scheme Catalog & Management</h2>
                    <p>
                      Manage, publish, audit, and inspect verified Central & State government schemes, welfare subsidies, and application guidelines across India.
                    </p>
                  </div>
                  <div className="admin-page-header-actions">
                    <div className="admin-stat-counter-pill">
                      <span className="counter-val">
                        {totalSchemesCount || schemes.length}
                      </span>
                      <span className="counter-lbl">Total Schemes</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Filtering & Management Controls */}
                <div className="admin-schemes-controls-panel">
                  {/* Primary Strip: Level Pills & Search & Add Button */}
                  <div className="admin-toolbar-primary">
                    {/* Level Tabs Segmented Control */}
                    <div className="level-filter-pills" role="tablist" aria-label="Filter by Government Level">
                      <button
                        type="button"
                        className={`level-pill-btn ${schemeLevelFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => { setSchemeLevelFilter('ALL'); setSchemePage(1); }}
                      >
                        <i className="fa fa-layer-group"></i> All Schemes
                        <span className="pill-badge">{schemes.length}</span>
                      </button>
                      <button
                        type="button"
                        className={`level-pill-btn ${schemeLevelFilter === 'CENTRAL' ? 'active' : ''}`}
                        onClick={() => { setSchemeLevelFilter('CENTRAL'); setSchemePage(1); }}
                      >
                        <i className="fa fa-flag"></i> Central
                        <span className="pill-badge">{centralSchemesCount}</span>
                      </button>
                      <button
                        type="button"
                        className={`level-pill-btn ${schemeLevelFilter === 'STATE' ? 'active' : ''}`}
                        onClick={() => { setSchemeLevelFilter('STATE'); setSchemePage(1); }}
                      >
                        <i className="fa fa-landmark"></i> State
                        <span className="pill-badge">{stateSchemesCount}</span>
                      </button>
                    </div>

                    {/* Quick Add Scheme CTA */}
                    <button className="btn-add-primary" onClick={() => navigate('/admin/add-scheme')}>
                      <i className="fa fa-plus"></i> Add New Scheme
                    </button>
                  </div>

                  {/* Secondary Strip: Search Input & Filter Selects */}
                  <div className="admin-toolbar-secondary">
                    <div className="admin-search-input-wrap">
                      <i className="fa fa-search"></i>
                      <input
                        type="text"
                        placeholder="Search by scheme title, ministry, department, state..."
                        value={schemeSearch}
                        onChange={(e) => {
                          setSchemeSearch(e.target.value);
                          setSchemePage(1);
                        }}
                      />
                      {schemeSearch && (
                        <button onClick={() => { setSchemeSearch(''); setSchemePage(1); }} className="clear-btn" title="Clear Search">
                          <i className="fa fa-times"></i>
                        </button>
                      )}
                    </div>

                    <div className="admin-filter-selects-group">
                      {/* Category Filter */}
                      <div className="filter-select-wrapper">
                        <i className="fa fa-tags select-icon"></i>
                        <select
                          className="admin-filter-select"
                          value={schemeCategoryFilter}
                          onChange={(e) => { setSchemeCategoryFilter(e.target.value); setSchemePage(1); }}
                          aria-label="Filter by Category"
                        >
                          <option value="ALL">All Categories ({schemeCategories.length})</option>
                          {schemeCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div className="filter-select-wrapper">
                        <i className="fa fa-circle-dot select-icon"></i>
                        <select
                          className="admin-filter-select"
                          value={schemeStatusFilter}
                          onChange={(e) => { setSchemeStatusFilter(e.target.value); setSchemePage(1); }}
                          aria-label="Filter by Status"
                        >
                          <option value="ALL">All Status</option>
                          <option value="ACTIVE">Active Only</option>
                          <option value="INACTIVE">Inactive Only</option>
                        </select>
                      </div>

                      {/* Sort Order */}
                      <div className="filter-select-wrapper">
                        <i className="fa fa-arrow-down-a-z select-icon"></i>
                        <select
                          className="admin-filter-select"
                          value={schemeSortBy}
                          onChange={(e) => { setSchemeSortBy(e.target.value); setSchemePage(1); }}
                          aria-label="Sort Schemes"
                        >
                          <option value="name-asc">Name (A → Z)</option>
                          <option value="name-desc">Name (Z → A)</option>
                          <option value="state-asc">State (A → Z)</option>
                          <option value="level-asc">Govt Level</option>
                          <option value="id-desc">Newest Schemes First</option>
                        </select>
                      </div>

                      {/* Clear Filters CTA */}
                      {isAnyFilterActive && (
                        <button
                          type="button"
                          className="btn-reset-filters"
                          onClick={handleResetFilters}
                          title="Reset all active filters"
                        >
                          <i className="fa fa-rotate-left"></i> Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Table Card with Sticky Header */}
                <div className="admin-table-container">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th className="col-idx text-center">#</th>
                        <th className="col-name">Scheme Name & Info</th>
                        <th className="col-cat">Category</th>
                        <th className="col-level text-center">Level</th>
                        <th className="col-state">State</th>
                        <th className="col-dept">Ministry / Dept</th>
                        <th className="col-status text-center">Status</th>
                        <th className="col-actions text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSchemes.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="empty-table-cell">
                            <div className="empty-table-state-box">
                              <div className="empty-icon-wrap">
                                <i className="fa fa-folder-open"></i>
                              </div>
                              <h3>No schemes matched your criteria</h3>
                              <p>
                                {schemeSearch.trim()
                                  ? `No government schemes found matching "${schemeSearch}".`
                                  : 'No schemes available under the selected filters.'}
                              </p>
                              {isAnyFilterActive && (
                                <button type="button" className="btn-clear-empty" onClick={handleResetFilters}>
                                  <i className="fa fa-rotate-left"></i> Reset All Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedSchemes.map((scheme, idx) => {
                          const catName = typeof scheme.category === 'object' ? (scheme.category?.name || 'General') : (scheme.category || scheme.category_name || 'General');
                          const catMeta = getCategoryMeta(catName);
                          const isStateLevel = String(scheme.govt_level || '').toLowerCase().includes('state');
                          const levelDisplay = isStateLevel ? 'State' : 'Central';
                          const deptName = scheme.ministry_department || scheme.ministry || 'Government of India';
                          const rowNum = isAllPagination ? (idx + 1) : ((schemePage - 1) * Number(schemePageSize) + idx + 1);
                          const isCopied = copiedSchemeId === scheme.id;

                          return (
                            <tr key={scheme.id}>
                              {/* Row Index */}
                              <td className="col-idx text-center">
                                <span className="row-num-badge">{rowNum}</span>
                              </td>

                              {/* Scheme Name & Metadata */}
                              <td className="col-name scheme-name-cell">
                                <div className="scheme-title-group">
                                  <Link
                                    to={`/scheme/${scheme.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="scheme-title-link"
                                    title={`View ${scheme.name} details (opens in new tab)`}
                                  >
                                    <span className="scheme-name-text">{scheme.name}</span>
                                    <i className="fa fa-arrow-up-right-from-square external-icon" aria-hidden="true"></i>
                                  </Link>
                                  <div className="scheme-meta-row">
                                    <span className="scheme-id-tag">ID: #{scheme.id}</span>
                                    {scheme.application_mode && (
                                      <span className={`scheme-mode-pill ${scheme.application_mode.toLowerCase()}`}>
                                        <i className={`fa ${scheme.application_mode.toLowerCase() === 'online' ? 'fa-globe' : 'fa-file-lines'}`}></i>
                                        {scheme.application_mode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Category Chip */}
                              <td className="col-cat">
                                <span
                                  className="cat-chip"
                                  style={{
                                    backgroundColor: catMeta.bg,
                                    color: catMeta.color,
                                    borderColor: catMeta.border
                                  }}
                                  title={catName}
                                >
                                  <i className={`fa ${catMeta.icon} cat-icon`}></i>
                                  <span className="cat-text">{catName}</span>
                                </span>
                              </td>

                              {/* Govt Level */}
                              <td className="col-level text-center">
                                <span className={`level-chip ${isStateLevel ? 'level-state' : 'level-central'}`}>
                                  <i className={`fa ${isStateLevel ? 'fa-landmark' : 'fa-flag'}`}></i>
                                  <span>{levelDisplay}</span>
                                </span>
                              </td>

                              {/* State Jurisdiction */}
                              <td className="col-state">
                                {scheme.state && scheme.state !== 'All India' ? (
                                  <span className="state-name-cell" title={scheme.state}>
                                    <i className="fa fa-map-pin state-pin-icon"></i>
                                    <span className="state-text">{scheme.state}</span>
                                  </span>
                                ) : (
                                  <span className="state-national-badge" title="National Welfare Initiative">
                                    <i className="fa fa-globe-asia"></i> All India
                                  </span>
                                )}
                              </td>

                              {/* Ministry / Department */}
                              <td className="col-dept">
                                <div className="dept-wrapper" title={deptName}>
                                  <i className="fa fa-building-columns dept-icon" aria-hidden="true"></i>
                                  <span className="dept-text">{deptName}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="col-status text-center">
                                <span className={`status-pill ${scheme.is_active !== false ? 'active' : 'inactive'}`}>
                                  <span className="status-dot"></span>
                                  <span>{scheme.is_active !== false ? 'Active' : 'Inactive'}</span>
                                </span>
                              </td>

                              {/* Actions - Inspect Scheme Only */}
                              <td className="col-actions text-center">
                                <div className="action-buttons-cell">
                                  <button
                                    type="button"
                                    className="btn-action inspect"
                                    title="Inspect scheme details"
                                    onClick={() => handleInspectScheme(scheme)}
                                    aria-label={`Inspect ${scheme.name}`}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Table Footer: Results info & Pagination Controls */}
                  <div className="admin-table-footer">
                    <div className="table-page-info">
                      {totalFilteredCount === 0 ? (
                        <span>Showing <strong>0</strong> schemes</span>
                      ) : (
                        <span>
                          Showing{' '}
                          <strong>
                            {isAllPagination ? 1 : ((schemePage - 1) * Number(schemePageSize) + 1)}
                            {' - '}
                            {isAllPagination ? totalFilteredCount : Math.min(schemePage * Number(schemePageSize), totalFilteredCount)}
                          </strong>{' '}
                          of <strong>{totalFilteredCount}</strong> schemes
                          {isAnyFilterActive && <span className="filtered-tag"> (filtered from {schemes.length})</span>}
                        </span>
                      )}
                    </div>

                    <div className="table-page-controls">
                      {/* Per-Page Selector */}
                      <div className="rows-per-page-wrap">
                        <label htmlFor="scheme-page-size-select">Per page:</label>
                        <select
                          id="scheme-page-size-select"
                          className="select-rows-per-page"
                          value={schemePageSize}
                          onChange={(e) => {
                            const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                            setSchemePageSize(val);
                            setSchemePage(1);
                          }}
                        >
                          <option value="15">15</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="ALL">All ({totalFilteredCount})</option>
                        </select>
                      </div>

                      {/* Pagination Buttons */}
                      {!isAllPagination && totalPages > 1 && (
                        <div className="pagination-buttons" role="navigation" aria-label="Scheme catalog pagination">
                          <button
                            type="button"
                            className="page-btn prev-btn"
                            disabled={schemePage <= 1}
                            onClick={() => setSchemePage(prev => Math.max(1, prev - 1))}
                            title="Previous Page"
                          >
                            <i className="fa fa-chevron-left"></i>
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - schemePage) <= 1)
                            .reduce((acc, p, idx, arr) => {
                              if (idx > 0 && p - arr[idx - 1] > 1) {
                                acc.push('ellipsis-' + p);
                              }
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((item) => {
                              if (typeof item === 'string') {
                                return <span key={item} className="page-ellipsis">…</span>;
                              }
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  className={`page-btn ${schemePage === item ? 'active' : ''}`}
                                  onClick={() => setSchemePage(item)}
                                >
                                  {item}
                                </button>
                              );
                            })}

                          <button
                            type="button"
                            className="page-btn next-btn"
                            disabled={schemePage >= totalPages}
                            onClick={() => setSchemePage(prev => Math.min(totalPages, prev + 1))}
                            title="Next Page"
                          >
                            <i className="fa fa-chevron-right"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. USER ANALYTICS PAGE (Replaces User Management) */}
            {(activeTab === 'analytics' || activeTab === 'users') && (
              <div className="admin-analytics-view">
                {/* Dedicated User Analytics Page Header */}
                <div className="admin-page-header-card">
                  <div className="admin-page-header-info">
                    <div className="admin-page-badge">
                      <i className="fa fa-chart-line"></i> Real-Time Citizen Intelligence
                    </div>
                    <h2>User Analytics & Citizen Demographics</h2>
                    <p>
                      Holistic live visibility into active citizens, 5-day registration velocity, occupational breakdown, state reach, and profile completeness.
                    </p>
                  </div>
                  <div className="admin-page-header-actions">
                    <div className="admin-stat-counter-pill">
                      <span className="counter-val">{userAnalytics?.metrics?.total_users ?? 21}</span>
                      <span className="counter-lbl">Registered Citizens</span>
                    </div>
                    <button className="analytics-refresh-btn" onClick={fetchTabData} title="Refresh Analytics Data">
                      <i className="fa fa-rotate"></i> Sync Live Metrics
                    </button>
                  </div>
                </div>

                {/* 2. Top Key Metrics Row (Neumorphic Clay Cards) */}
                <div className="stats-grid analytics-metrics-grid">
                  {/* 2.1 Total Active Users */}
                  <div className="stat-card green">
                    <div className="stat-icon green-icon">
                      <i className="fa fa-user-check"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-num-row">
                        <span className="stat-number">{userAnalytics?.metrics?.active_users ?? 20}</span>
                        <span className="stat-pill-badge active-badge">
                          <span className="pulse-dot-sm"></span> Active
                        </span>
                      </div>
                      <span className="stat-label">Total Active Users</span>
                      <span className="stat-sub">{userAnalytics?.metrics?.active_percentage ?? 95.2}% account activation rate</span>
                    </div>
                  </div>

                  {/* 2.2 Users Joined in Last 5 Days */}
                  <div className="stat-card orange">
                    <div className="stat-icon orange-icon">
                      <i className="fa fa-user-plus"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-num-row">
                        <span className="stat-number">
                          {userAnalytics?.daily_trends
                            ? userAnalytics.daily_trends.reduce((sum, d) => sum + (d.count || 0), 0)
                            : (userAnalytics?.metrics?.users_joined_last_5_days ?? 0)}
                        </span>
                        <span className="stat-pill-badge velocity-badge">
                          <i className="fa fa-arrow-trend-up"></i> Last 5 Days
                        </span>
                      </div>
                      <span className="stat-label">Joined in Last 5 Days</span>
                      <span className="stat-sub">Recent onboarding velocity</span>
                    </div>
                  </div>

                  {/* 2.3 Total Registered Base */}
                  <div className="stat-card blue">
                    <div className="stat-icon blue-icon">
                      <i className="fa fa-users"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-num-row">
                        <span className="stat-number">{userAnalytics?.metrics?.total_users ?? 21}</span>
                        <span className="stat-pill-badge blue-badge">Verified Base</span>
                      </div>
                      <span className="stat-label">Total Registered Citizens</span>
                      <span className="stat-sub">National & State portal reach</span>
                    </div>
                  </div>

                  {/* 2.4 Profile Completion Rate */}
                  <div className="stat-card purple">
                    <div className="stat-icon purple-icon">
                      <i className="fa fa-id-card-clip"></i>
                    </div>
                    <div className="stat-info">
                      <div className="stat-num-row">
                        <span className="stat-number">{userAnalytics?.metrics?.avg_profile_completion ?? 64}%</span>
                        <span className="stat-pill-badge purple-badge">Profile Rate</span>
                      </div>
                      <span className="stat-label">Avg Profile Completion</span>
                      <span className="stat-sub">Scheme eligibility matching score</span>
                    </div>
                  </div>
                </div>

                {/* 3. Visuals & Graphs Section */}
                <div className="analytics-visuals-grid">
                  {/* 3.1 Graph 1: 5-Day Registration Velocity (SVG Bar Chart) */}
                  <div className="analytics-card-panel velocity-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-chart-column panel-icon"></i>
                        <div>
                          <h4>5-Day Registration Velocity</h4>
                          <p>Daily citizen signups recorded over the last 5 days</p>
                        </div>
                      </div>
                      <div className="velocity-summary-pill">
                        <i className="fa fa-fire"></i>
                        <span>
                          {userAnalytics?.daily_trends
                            ? userAnalytics.daily_trends.reduce((sum, d) => sum + (d.count || 0), 0)
                            : (userAnalytics?.metrics?.users_joined_last_5_days ?? 0)} Joined in 5 Days
                        </span>
                      </div>
                    </div>

                    {/* Interactive CSS / SVG Bar Chart */}
                    <div className="bar-chart-container">
                      <div className="bar-chart-bars">
                        {(userAnalytics?.daily_trends || [
                          { label: '19 Oct', day_name: 'Mon', count: 1 },
                          { label: '20 Oct', day_name: 'Tue', count: 0 },
                          { label: '21 Oct', day_name: 'Wed', count: 8 },
                          { label: '22 Oct', day_name: 'Thu', count: 0 },
                          { label: '23 Oct', day_name: 'Today', count: 0 },
                        ]).map((day, idx) => {
                          const maxCount = Math.max(...(userAnalytics?.daily_trends || []).map(d => d.count), 8);
                          const heightPct = maxCount > 0 ? Math.max((day.count / maxCount) * 100, 8) : 8;
                          const isToday = idx === 4 || day.day_name === 'Today';

                          return (
                            <div key={idx} className={`chart-col ${isToday ? 'today-col' : ''}`}>
                              <div className="bar-val-tooltip">{day.count} {day.count === 1 ? 'user' : 'users'}</div>
                              <div className="bar-track">
                                <div
                                  className={`bar-fill ${day.count > 0 ? 'has-data' : 'zero-data'}`}
                                  style={{ height: `${heightPct}%` }}
                                ></div>
                              </div>
                              <div className="bar-label-group">
                                <span className="bar-label-date">{day.label}</span>
                                <span className="bar-label-day">{day.day_name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3.2 Graph 2: Classification by Occupation */}
                  <div className="analytics-card-panel occupation-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-briefcase panel-icon"></i>
                        <div>
                          <h4>Citizen Classification by Occupation</h4>
                          <p>Demographic distribution across employment sectors</p>
                        </div>
                      </div>
                    </div>

                    <div className="occupation-breakdown-list">
                      {(userAnalytics?.occupation_classification || [
                        { label: 'Students & Scholars', count: 6, percentage: 28.6 },
                        { label: 'Farmers & Agri Workers', count: 5, percentage: 23.8 },
                        { label: 'Self-Employed / Business', count: 4, percentage: 19.0 },
                        { label: 'Healthcare & Essential', count: 3, percentage: 14.3 },
                        { label: 'General Citizens', count: 3, percentage: 14.3 },
                      ]).slice(0, 5).map((occ, idx) => {
                        const colors = ['#0d9488', '#2563eb', '#7c3aed', '#c8654b', '#10b981'];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={idx} className="occupation-row">
                            <div className="occ-info-row">
                              <span className="occ-name">{occ.label}</span>
                              <div className="occ-count-wrap">
                                <span className="occ-count">{occ.count} citizens</span>
                                <span className="occ-pct">{occ.percentage}%</span>
                              </div>
                            </div>
                            <div className="occ-progress-track">
                              <div
                                className="occ-progress-fill"
                                style={{ width: `${Math.max(occ.percentage, 5)}%`, background: barColor }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Secondary Row: Demographics + State Distribution */}
                <div className="analytics-visuals-grid secondary-grid">
                  {/* 4.1 Geographic / State Distribution */}
                  <div className="analytics-card-panel states-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-map-location-dot panel-icon"></i>
                        <div>
                          <h4>Geographic Reach (Top States)</h4>
                          <p>Citizen distribution across states & territories</p>
                        </div>
                      </div>
                    </div>

                    <div className="states-rank-list">
                      {((userAnalytics?.top_states && userAnalytics.top_states.length > 0)
                        ? userAnalytics.top_states
                        : [
                          { state: 'Maharashtra', count: 5, percentage: 23.8 },
                          { state: 'Gujarat', count: 2, percentage: 9.5 },
                          { state: 'Madhya Pradesh', count: 1, percentage: 4.8 },
                        ]
                      ).map((st, idx) => (
                        <div key={idx} className="state-rank-item">
                          <div className="state-badge-rank">#{idx + 1}</div>
                          <div className="state-details">
                            <div className="state-meta-row">
                              <span className="state-name">{st.state}</span>
                              <span className="state-val">{st.count} users ({st.percentage}%)</span>
                            </div>
                            <div className="state-bar-track">
                              <div className="state-bar-fill" style={{ width: `${Math.max(st.percentage * 2.8, 12)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4.2 Multi-Segment Classification (Social, Gender & Roles) */}
                  <div className="analytics-card-panel demographics-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-shapes panel-icon"></i>
                        <div>
                          <h4>Social & Demographic Segments</h4>
                          <p>Caste categories, gender and profile completeness</p>
                        </div>
                      </div>
                    </div>

                    <div className="demographics-segments-wrap">
                      {/* Social Category Cards */}
                      <div className="segment-sub-block">
                        <span className="sub-block-title">Caste Category Representation</span>
                        <div className="pill-tags-grid">
                          {(userAnalytics?.social_classification || [
                            { category: 'Not Specified', count: 16, percentage: 64.0 },
                            { category: 'General', count: 5, percentage: 20.0 },
                            { category: 'OBC', count: 1, percentage: 4.0 },
                            { category: 'SC', count: 1, percentage: 4.0 },
                            { category: 'ST', count: 1, percentage: 4.0 },
                            { category: 'EWS', count: 1, percentage: 4.0 },
                          ]).map((soc, idx) => (
                            <div key={idx} className="soc-tag-card">
                              <span className="soc-cat-title">{soc.category}</span>
                              <div className="soc-count-row">
                                <strong>{soc.count}</strong>
                                <span>({soc.percentage}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gender & Profile Completion Split */}
                      <div className="segment-sub-block">
                        <span className="sub-block-title">Gender & Profile Completeness</span>
                        <div className="gender-brackets-grid">
                          <div className="gender-split-card">
                            <div className="split-item">
                              <i className="fa fa-person male-icon"></i>
                              <span>Male: <strong>{userAnalytics?.gender_classification?.find(g => g.gender === 'Male')?.count ?? 5}</strong></span>
                            </div>
                            <div className="split-item">
                              <i className="fa fa-person-dress female-icon"></i>
                              <span>Female: <strong>{userAnalytics?.gender_classification?.find(g => g.gender === 'Female')?.count ?? 2}</strong></span>
                            </div>
                            <div className="split-item">
                              <i className="fa fa-user-circle other-icon"></i>
                              <span>Other / Unspecified: <strong>{userAnalytics?.gender_classification?.find(g => g.gender === 'Not Specified')?.count ?? 14}</strong></span>
                            </div>
                          </div>

                          <div className="completion-bracket-card kyc-bracket-card">
                            <div className="completion-row kyc-row">
                              <span>80-100% (Scheme Ready):</span>
                              <strong className="text-green">{userAnalytics?.completion_brackets?.complete ?? 7} citizens</strong>
                            </div>
                            <div className="completion-row kyc-row">
                              <span>40-79% (In Progress):</span>
                              <strong className="text-blue">{userAnalytics?.completion_brackets?.in_progress ?? 0} citizens</strong>
                            </div>
                            <div className="completion-row kyc-row">
                              <span>1-39% (Started):</span>
                              <strong className="text-orange">{userAnalytics?.completion_brackets?.started ?? 0} citizens</strong>
                            </div>
                            <div className="completion-row kyc-row">
                              <span>0% (Not Started):</span>
                              <strong style={{ color: '#64748b', fontWeight: 700 }}>{userAnalytics?.completion_brackets?.empty ?? 14} citizens</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Citizen Onboarding & Scheme Adoption Funnel (Executive Funnel Studio) */}
                <div className="analytics-card-panel funnel-analytics-panel">
                  <div className="panel-header">
                    <div className="panel-title-wrap">
                      <i className="fa fa-filter-circle-dollar panel-icon"></i>
                      <div>
                        <h4>Citizen Onboarding & Scheme Adoption Funnel</h4>
                        <p>End-to-end progression pipeline from registration to verified welfare beneficiary</p>
                      </div>
                    </div>
                    <div className="funnel-header-stats">
                      <div className="funnel-stat-chip">
                        <span className="chip-label">Top of Funnel:</span>
                        <strong className="chip-val">{userAnalytics?.metrics?.total_users ?? 21} Citizens</strong>
                      </div>
                      <div className="funnel-conversion-rate-tag">
                        <i className="fa fa-arrow-trend-up"></i>
                        <span><strong>{userAnalytics?.funnel_analytics?.[4]?.pct ?? 23.8}%</strong> Net Welfare Conversion</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Column Studio Grid: Visual Funnel + Conversion Intelligence */}
                  <div className="funnel-studio-grid">
                    {/* Left Column: Visual Funnel Flow */}
                    <div className="funnel-visual-card">
                      <div className="funnel-visual-header">
                        <span className="funnel-visual-badge">
                          <i className="fa fa-chart-column"></i> Vertical Pipeline Flow
                        </span>
                        <span className="funnel-visual-sub">
                          5 Tapered Onboarding Stages
                        </span>
                      </div>

                      <div className="funnel-layers-container">
                        {/* Ambient Funnel Contour Guide */}
                        <svg className="funnel-backdrop-svg" viewBox="0 0 600 340" preserveAspectRatio="none" aria-hidden="true">
                          <polygon
                            points="15,4 585,4 475,320 125,320"
                            fill="rgba(13, 148, 136, 0.025)"
                            stroke="rgba(13, 148, 136, 0.15)"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                        </svg>

                        {(() => {
                          const steps = userAnalytics?.funnel_analytics || [
                            { stage: 'Citizens Registered', count: 21, pct: 100.0, icon: 'fa-user-check', color: '#2563eb', badge: 'Total Base' },
                            { stage: 'Profile Demographic Started', count: 14, pct: 66.7, icon: 'fa-id-card', color: '#0d9488', badge: 'Active' },
                            { stage: 'Scheme-Ready Profile (80%+)', count: 7, pct: 33.3, icon: 'fa-circle-check', color: '#16a34a', badge: 'Eligible' },
                            { stage: 'Schemes Saved & Tracked', count: 12, pct: 57.1, icon: 'fa-bookmark', color: '#ea580c', badge: 'Engaged' },
                            { stage: 'Welfare Applications Filed', count: 5, pct: 23.8, icon: 'fa-file-signature', color: '#7c3aed', badge: 'Enrolled' },
                          ];

                          const widths = ['100%', '88%', '77%', '66%', '55%'];
                          const maxWidths = [600, 530, 465, 400, 340];

                          return steps.map((step, idx) => {
                            const nextStep = steps[idx + 1];
                            let transitionLabel = '';
                            if (idx === 0) {
                              const drop = Math.max((step.count || 21) - (nextStep?.count || 7), 0);
                              transitionLabel = `${nextStep?.pct ?? 33.3}% Retention · ${drop} Drop-off`;
                            } else if (idx === 1) {
                              const incomp = Math.max((step.count || 7) - (nextStep?.count || 7), 0);
                              transitionLabel = `${Math.round(((nextStep?.count || 7) / (step.count || 7)) * 100)}% Readiness · ${incomp} Incomplete`;
                            } else if (idx === 2) {
                              transitionLabel = `${nextStep?.count || 6} Schemes Explored`;
                            } else if (idx === 3) {
                              const conv = Math.round(((nextStep?.count || 5) / (step.count || 6)) * 100);
                              transitionLabel = `${conv}% Application Conversion`;
                            }

                            const displayStage = (step.stage || '')
                              .replace('Welfare Applications Submitted', 'Applications Filed')
                              .replace('Welfare Applications Filed', 'Applications Filed');

                            return (
                              <div key={idx} className="funnel-tier-wrapper">
                                {/* The Tier Trapezoid Card */}
                                <div
                                  className="funnel-tier-card"
                                  style={{
                                    width: widths[idx] || '100%',
                                    maxWidth: `${maxWidths[idx] || 620}px`,
                                    borderLeft: `4px solid ${step.color}`,
                                    background: `linear-gradient(135deg, ${step.color}0a 0%, #ffffff 100%)`
                                  }}
                                >
                                  <div className="tier-main-row">
                                    <div className="tier-info-wrap">
                                      <span className="tier-num-pill" style={{ background: step.color }}>
                                        {idx + 1}
                                      </span>
                                      <i className={`fa ${step.icon} tier-step-icon`} style={{ color: step.color }}></i>
                                      <span className="tier-step-title">{displayStage}</span>
                                    </div>
                                    <div className="tier-metrics-wrap">
                                      <span className="tier-count-highlight">
                                        <strong>{step.count}</strong> citizens
                                      </span>
                                      <span className="tier-pct-pill" style={{ color: step.color, background: `${step.color}18` }}>
                                        {step.pct}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Progress bar line */}
                                  <div className="tier-mini-track">
                                    <div
                                      className="tier-mini-bar"
                                      style={{
                                        width: `${Math.max(step.pct, 8)}%`,
                                        background: `linear-gradient(90deg, ${step.color}70 0%, ${step.color} 100%)`
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Flow Connector to next step */}
                                {idx < steps.length - 1 && (
                                  <div className="funnel-tier-connector">
                                    <div className="connector-drop-line"></div>
                                    <span className="connector-chip">
                                      <i className="fa fa-chevron-down" style={{ color: nextStep?.color || '#0d9488' }}></i>
                                      {transitionLabel}
                                    </span>
                                    <div className="connector-drop-line"></div>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}

                        {/* Funnel Goal Node */}
                        <div className="funnel-goal-node">
                          <div className="goal-node-icon">
                            <i className="fa fa-award"></i>
                          </div>
                          <div className="goal-node-text">
                            <strong>{userAnalytics?.funnel_analytics?.[4]?.count ?? 5} Verified Welfare Beneficiaries</strong>
                            <span>{userAnalytics?.funnel_analytics?.[4]?.pct ?? 23.8}% Overall Conversion from Portal Registration</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Funnel Intelligence & Drop-off Diagnostics */}
                    <div className="funnel-intel-card">
                      <div className="intel-card-header">
                        <h4>
                          <i className="fa fa-brain"></i> Funnel Conversion Intelligence
                        </h4>
                        <span className="intel-live-pill">Live Diagnostics</span>
                      </div>

                      {/* Circular Gauge Card */}
                      {(() => {
                        const totalBase = userAnalytics?.metrics?.total_users || 21;
                        const appliedCount = userAnalytics?.funnel_analytics?.[4]?.count ?? 5;
                        const netConversion = userAnalytics?.funnel_analytics?.[4]?.pct ?? 23.8;
                        const convFraction = Math.min(Math.max(netConversion / 100, 0.05), 1);
                        const radius = 34;
                        const circ = 2 * Math.PI * radius;
                        const fSteps = userAnalytics?.funnel_analytics || [];

                        return (
                          <>
                            <div className="intel-gauge-box">
                              <div className="intel-gauge-radial">
                                <svg width="84" height="84" viewBox="0 0 84 84">
                                  <circle cx="42" cy="42" r={radius} fill="none" stroke="#e2ece4" strokeWidth="7" />
                                  <circle
                                    cx="42"
                                    cy="42"
                                    r={radius}
                                    fill="none"
                                    stroke="#0d9488"
                                    strokeWidth="7"
                                    strokeDasharray={`${circ * convFraction} ${circ}`}
                                    strokeDashoffset="0"
                                    strokeLinecap="round"
                                    transform="rotate(-90 42 42)"
                                  />
                                  <text x="42" y="47" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0d9488">
                                    {netConversion}%
                                  </text>
                                </svg>
                              </div>
                              <div className="intel-gauge-details">
                                <span className="gauge-headline">Application Efficiency</span>
                                <p className="gauge-sub">{appliedCount} of {totalBase} registered citizens successfully filed welfare applications</p>
                                <div className="gauge-micro-stats">
                                  <span><i className="fa fa-circle-check" style={{ color: '#16a34a' }}></i> {totalBase} Base</span>
                                  <span><i className="fa fa-file-signature" style={{ color: '#7c3aed' }}></i> {appliedCount} Enrolled</span>
                                </div>
                              </div>
                            </div>

                            {/* Drop-Off Progression Breakdown List */}
                            <div className="intel-breakdown-list">
                              <div className="breakdown-header-row">
                                <span>Pipeline Transition</span>
                                <span>Retention Rate</span>
                              </div>

                              <div className="breakdown-item">
                                <div className="item-title-group">
                                  <span className="step-dot" style={{ background: '#2563eb' }}></span>
                                  <span className="item-name">Registration → Onboarding</span>
                                </div>
                                <div className="item-values">
                                  <strong style={{ color: '#2563eb' }}>{fSteps[1]?.pct ?? 33.3}%</strong>
                                  <span className="item-drop-tag">{Math.max(totalBase - (fSteps[1]?.count ?? 7), 0)} dropped</span>
                                </div>
                              </div>

                              <div className="breakdown-item">
                                <div className="item-title-group">
                                  <span className="step-dot" style={{ background: '#0d9488' }}></span>
                                  <span className="item-name">Onboarding → Profile Ready</span>
                                </div>
                                <div className="item-values">
                                  <strong style={{ color: '#0d9488' }}>{fSteps[2]?.pct ?? 33.3}%</strong>
                                  <span className="item-drop-tag">{Math.max((fSteps[1]?.count ?? 7) - (fSteps[2]?.count ?? 7), 0)} incomplete</span>
                                </div>
                              </div>

                              <div className="breakdown-item">
                                <div className="item-title-group">
                                  <span className="step-dot" style={{ background: '#ea580c' }}></span>
                                  <span className="item-name">Profile Ready → Scheme Saves</span>
                                </div>
                                <div className="item-values">
                                  <strong style={{ color: '#ea580c' }}>{fSteps[3]?.pct ?? 28.6}%</strong>
                                  <span className="item-drop-tag positive">+{fSteps[3]?.count ?? 6} saves</span>
                                </div>
                              </div>

                              <div className="breakdown-item">
                                <div className="item-title-group">
                                  <span className="step-dot" style={{ background: '#7c3aed' }}></span>
                                  <span className="item-name">Scheme Saves → Application</span>
                                </div>
                                <div className="item-values">
                                  <strong style={{ color: '#7c3aed' }}>
                                    {Math.round(((fSteps[4]?.count ?? 5) / (fSteps[3]?.count || 6)) * 100)}%
                                  </strong>
                                  <span className="item-drop-tag">{fSteps[4]?.count ?? 5} applied</span>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* Strategic Takeaway Tip */}
                      <div className="intel-advice-box">
                        <i className="fa fa-lightbulb advice-icon"></i>
                        <p>
                          <strong>Governance Takeaway:</strong> Profile readiness (80%+) is the #1 catalyst for application submission. Completing demographics triples citizen application rates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Dual Grid: Age Demographics & Household Income Brackets */}
                <div className="analytics-visuals-grid">
                  {/* 6.1 Age Group Distribution (Donut Chart + Target Schemes) */}
                  <div className="analytics-card-panel age-demographics-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-chart-pie panel-icon"></i>
                        <div>
                          <h4>Age Distribution & Life-Stage Demographics</h4>
                          <p>Demographic spread for age-targeted welfare schemes</p>
                        </div>
                      </div>
                    </div>

                    <div className="age-donut-layout">
                      {/* SVG Donut */}
                      <div className="donut-chart-box">
                        <svg viewBox="0 0 160 160" className="donut-svg">
                          <circle cx="80" cy="80" r="58" fill="none" stroke="#e2ebe3" strokeWidth="22" />
                          {(() => {
                            const ageList = userAnalytics?.age_demographics || [
                              { range: 'Youth (18–25 yrs)', count: 9, pct: 42.9, color: '#0d9488' },
                              { range: 'Working Adults (26–40 yrs)', count: 7, pct: 33.3, color: '#2563eb' },
                              { range: 'Mid-Career (41–55 yrs)', count: 4, pct: 19.0, color: '#16a34a' },
                              { range: 'Senior Citizens (55+ yrs)', count: 1, pct: 4.8, color: '#ea580c' },
                            ];
                            const circ = 2 * Math.PI * 58; // ~364.4
                            let accumulatedPct = 0;
                            return ageList.map((segment, idx) => {
                              const strokeDash = Math.max((segment.pct / 100) * circ, segment.count > 0 ? 4 : 0);
                              const strokeOffset = -(accumulatedPct / 100) * circ;
                              accumulatedPct += segment.pct;
                              return (
                                <circle
                                  key={idx}
                                  cx="80"
                                  cy="80"
                                  r="58"
                                  fill="none"
                                  stroke={segment.color}
                                  strokeWidth="22"
                                  strokeDasharray={`${strokeDash} ${circ}`}
                                  strokeDashoffset={strokeOffset}
                                  className="donut-segment"
                                />
                              );
                            });
                          })()}
                        </svg>
                        <div className="donut-center-info">
                          <span className="center-num">{userAnalytics?.metrics?.total_users ?? 21}</span>
                          <span className="center-lbl">Citizens</span>
                        </div>
                      </div>

                      {/* Legend & Breakdown List */}
                      <div className="age-legend-list">
                        {(userAnalytics?.age_demographics || [
                          { range: 'Youth (18–25 yrs)', count: 9, pct: 42.9, color: '#0d9488', target: 'Skill India, PMKVY & Scholarships' },
                          { range: 'Working Adults (26–40 yrs)', count: 7, pct: 33.3, color: '#2563eb', target: 'PMAY, Mudra Loans & Startups' },
                          { range: 'Mid-Career (41–55 yrs)', count: 4, pct: 19.0, color: '#16a34a', target: 'PM-KISAN & Ayushman Bharat' },
                          { range: 'Senior Citizens (55+ yrs)', count: 1, pct: 4.8, color: '#ea580c', target: 'Old Age Pension & Vayoshri' },
                        ]).map((grp, idx) => (
                          <div key={idx} className="age-legend-item">
                            <div className="age-meta-header">
                              <div className="age-color-dot" style={{ background: grp.color }}></div>
                              <strong className="age-name">{grp.range}</strong>
                              <span className="age-stat">{grp.count} citizens ({grp.pct}%)</span>
                            </div>
                            <span className="age-target-schemes">{grp.target}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 6.2 Household Income & Subsidy Eligibility */}
                  <div className="analytics-card-panel income-brackets-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-hand-holding-dollar panel-icon"></i>
                        <div>
                          <h4>Annual Household Income & Subsidy Tiers</h4>
                          <p>Economic strata classification for targeted welfare allocation</p>
                        </div>
                      </div>
                    </div>

                    <div className="income-tiers-list">
                      {(userAnalytics?.income_brackets || [
                        { bracket: 'EWS / BPL (< ₹1.5L/yr)', count: 12, pct: 57.1, level: 'High Subsidy Priority', color: '#10b981' },
                        { bracket: 'Lower Middle (₹1.5L – ₹3L)', count: 6, pct: 28.6, level: 'Standard Assistance', color: '#0d9488' },
                        { bracket: 'Middle Income (₹3L – ₹8L)', count: 2, pct: 9.5, level: 'Interest Subvention', color: '#3b82f6' },
                        { bracket: 'Higher Income (> ₹8L)', count: 1, pct: 4.8, level: 'Institutional Grants', color: '#64748b' }
                      ]).map((inc, idx) => (
                        <div key={idx} className="income-tier-card">
                          <div className="income-row-top">
                            <span className="tier-bracket-name">{inc.bracket}</span>
                            <span className="tier-subsidy-badge" style={{ color: inc.color, borderColor: `${inc.color}40`, background: `${inc.color}15` }}>
                              {inc.level}
                            </span>
                          </div>
                          <div className="income-bar-track">
                            <div
                              className="income-bar-fill"
                              style={{ width: `${inc.count > 0 ? Math.max(inc.pct, 5) : 0}%`, background: inc.color }}
                            ></div>
                          </div>
                          <div className="income-row-bot">
                            <span className="income-count-txt">{inc.count} citizens</span>
                            <strong className="income-pct-txt" style={{ color: inc.color }}>{inc.pct}%</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. Dual Grid: Rural vs Urban Habitat & Platform Health */}
                <div className="analytics-visuals-grid secondary-grid">
                  {/* 7.1 Geographic Habitat Split: Rural vs Urban */}
                  <div className="analytics-card-panel habitat-split-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-building-wheat panel-icon"></i>
                        <div>
                          <h4>Geographic Habitat Split: Rural vs Urban</h4>
                          <p>Gram Panchayat vs Municipal Urban citizen distribution</p>
                        </div>
                      </div>
                    </div>

                    <div className="habitat-content-box">
                      <div className="habitat-visual-bar-wrap">
                        {(userAnalytics?.habitat_split?.rural_pct ?? 0) > 0 && (
                          <div className="habitat-segment rural" style={{ width: `${userAnalytics.habitat_split.rural_pct}%` }}>
                            <span className="segment-txt">Rural {userAnalytics.habitat_split.rural_pct}%</span>
                          </div>
                        )}
                        {(userAnalytics?.habitat_split?.urban_pct ?? 0) > 0 && (
                          <div className="habitat-segment urban" style={{ width: `${userAnalytics.habitat_split.urban_pct}%` }}>
                            <span className="segment-txt">Urban {userAnalytics.habitat_split.urban_pct}%</span>
                          </div>
                        )}
                        {(userAnalytics?.habitat_split?.unspecified_pct ?? 0) > 0 && (
                          <div className="habitat-segment unspecified" style={{ width: `${userAnalytics.habitat_split.unspecified_pct}%`, background: '#94a3b8' }}>
                            <span className="segment-txt">Not Specified {userAnalytics.habitat_split.unspecified_pct}%</span>
                          </div>
                        )}
                      </div>

                      <div className="habitat-cards-row" style={{ gridTemplateColumns: ((userAnalytics?.habitat_split?.unspecified_count ?? 0) > 0) ? 'repeat(3, 1fr)' : '1fr 1fr' }}>
                        <div className="habitat-info-card rural-card">
                          <div className="habitat-card-head">
                            <i className="fa fa-tractor"></i>
                            <div>
                              <h5>Rural Citizens</h5>
                              <span className="habitat-count">
                                {userAnalytics?.habitat_split?.rural_count ?? 0} Citizens ({userAnalytics?.habitat_split?.rural_pct ?? 0}%)
                              </span>
                            </div>
                          </div>
                          <p className="habitat-desc">High demand for PM-KISAN, Gramin Awas, Soil Health & MGNREGA welfare</p>
                        </div>

                        <div className="habitat-info-card urban-card">
                          <div className="habitat-card-head">
                            <i className="fa fa-city"></i>
                            <div>
                              <h5>Urban Citizens</h5>
                              <span className="habitat-count">
                                {userAnalytics?.habitat_split?.urban_count ?? 0} Citizens ({userAnalytics?.habitat_split?.urban_pct ?? 0}%)
                              </span>
                            </div>
                          </div>
                          <p className="habitat-desc">High affinity for PMAY-Urban, PM SVANidhi, Mudra Loans & Skill India</p>
                        </div>

                        {(userAnalytics?.habitat_split?.unspecified_count ?? 0) > 0 && (
                          <div className="habitat-info-card unspecified-card">
                            <div className="habitat-card-head">
                              <i className="fa fa-location-dot" style={{ color: '#94a3b8' }}></i>
                              <div>
                                <h5>Not Specified</h5>
                                <span className="habitat-count">
                                  {userAnalytics?.habitat_split?.unspecified_count} Citizens ({userAnalytics?.habitat_split?.unspecified_pct}%)
                                </span>
                              </div>
                            </div>
                            <p className="habitat-desc">Location details pending citizen profile completion</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 7.2 Platform Engagement & Health Matrix */}
                  <div className="analytics-card-panel platform-health-panel">
                    <div className="panel-header">
                      <div className="panel-title-wrap">
                        <i className="fa fa-heart-pulse panel-icon"></i>
                        <div>
                          <h4>Platform Health & Engagement Indicators</h4>
                          <p>Real-time citizen verification and platform retention health</p>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const totalBase = userAnalytics?.metrics?.total_users || 21;
                      const actRate = userAnalytics?.platform_health?.account_activation_rate ?? 95.2;
                      const mobRate = userAnalytics?.platform_health?.mobile_verified_rate ?? 100.0;
                      const profRate = userAnalytics?.platform_health?.high_profile_rate ?? 33.3;
                      const retRate = userAnalytics?.platform_health?.weekly_active_rate ?? 71.4;

                      return (
                        <div className="radial-gauges-grid">
                          <div className="gauge-item">
                            <div className="gauge-circle-wrap">
                              <svg viewBox="0 0 80 80" className="radial-svg">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2ebe3" strokeWidth="7" />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="7"
                                  strokeDasharray="201"
                                  strokeDashoffset={`${201 * (1 - Math.min(Math.max(actRate / 100, 0), 1))}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="gauge-val-txt text-green">{actRate}%</span>
                            </div>
                            <span className="gauge-title">Account Activation</span>
                            <span className="gauge-sub">{userAnalytics?.metrics?.active_users ?? 20} of {totalBase} active accounts</span>
                          </div>

                          <div className="gauge-item">
                            <div className="gauge-circle-wrap">
                              <svg viewBox="0 0 80 80" className="radial-svg">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2ebe3" strokeWidth="7" />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  fill="none"
                                  stroke="#0d9488"
                                  strokeWidth="7"
                                  strokeDasharray="201"
                                  strokeDashoffset={`${201 * (1 - Math.min(Math.max(mobRate / 100, 0), 1))}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="gauge-val-txt text-teal">{mobRate}%</span>
                            </div>
                            <span className="gauge-title">Phone Verified</span>
                            <span className="gauge-sub">OTP & mobile authenticated</span>
                          </div>

                          <div className="gauge-item">
                            <div className="gauge-circle-wrap">
                              <svg viewBox="0 0 80 80" className="radial-svg">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2ebe3" strokeWidth="7" />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeWidth="7"
                                  strokeDasharray="201"
                                  strokeDashoffset={`${201 * (1 - Math.min(Math.max(profRate / 100, 0), 1))}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="gauge-val-txt text-blue">{profRate}%</span>
                            </div>
                            <span className="gauge-title">High Profile Readiness</span>
                            <span className="gauge-sub">80%+ profile score ({userAnalytics?.completion_brackets?.complete ?? 7} citizens)</span>
                          </div>

                          <div className="gauge-item">
                            <div className="gauge-circle-wrap">
                              <svg viewBox="0 0 80 80" className="radial-svg">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2ebe3" strokeWidth="7" />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  fill="none"
                                  stroke="#7c3aed"
                                  strokeWidth="7"
                                  strokeDasharray="201"
                                  strokeDashoffset={`${201 * (1 - Math.min(Math.max(retRate / 100, 0), 1))}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="gauge-val-txt text-purple">{retRate}%</span>
                            </div>
                            <span className="gauge-title">Active Retention</span>
                            <span className="gauge-sub">
                              {userAnalytics?.daily_trends
                                ? userAnalytics.daily_trends.reduce((sum, d) => sum + (d.count || 0), 0)
                                : (userAnalytics?.metrics?.users_joined_last_5_days ?? 0)} joined in 5 days
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 4. CITIZEN QUERIES & FEEDBACK MANAGEMENT PAGE */}
            {(activeTab === 'queries' || activeTab === 'verifications') && (
              <div className="admin-queries-view">
                {/* Page Header Card */}
                <div className="admin-page-header-card">
                  <div className="admin-page-header-info">
                    <div className="admin-page-badge">
                      <i className="fa fa-headset"></i> Citizen Support & Grievance Desk
                    </div>
                    <h2>Citizen Queries & Feedback Management</h2>
                    <p>
                      Review citizen questions, feedback, and application inquiries. Dispatch official administrative replies directly to citizens with real-time notification alerts.
                    </p>
                  </div>
                  <div className="admin-page-header-actions">
                    <div className="admin-stat-counter-pill">
                      <span className="counter-val">{queryCounts.total || queries.length}</span>
                      <span className="counter-lbl">Total Queries</span>
                    </div>
                    <div className="admin-stat-counter-pill" style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
                      <span className="counter-val" style={{ color: '#d97706' }}>{queryCounts.pending}</span>
                      <span className="counter-lbl" style={{ color: '#b45309' }}>Pending Review</span>
                    </div>
                    <div className="admin-stat-counter-pill" style={{ borderColor: '#10b981', background: '#ecfdf5' }}>
                      <span className="counter-val" style={{ color: '#059669' }}>{queryCounts.resolved}</span>
                      <span className="counter-lbl" style={{ color: '#047857' }}>Resolved</span>
                    </div>
                    <button className="analytics-refresh-btn" onClick={fetchTabData} title="Refresh Queries">
                      <i className="fa fa-rotate"></i> Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteAllModalOpen(true)}
                      disabled={queries.length === 0}
                      title={queries.length === 0 ? 'No queries to delete' : 'Delete all citizen queries'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        border: queries.length === 0 ? '1px solid #e2e8f0' : '1px solid #fecdd3',
                        background: queries.length === 0 ? '#f8fafc' : '#fff1f2',
                        color: queries.length === 0 ? '#94a3b8' : '#e11d48',
                        cursor: queries.length === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <i className="fa fa-trash-can"></i>
                      <span>Delete All Queries</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="queries-filter-toolbar" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--neu-surface, #f8fafc)',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'var(--neu-raised, 0 4px 6px -1px rgba(0, 0, 0, 0.05))',
                  marginBottom: '20px'
                }}>
                  {/* Status Segmented Buttons */}
                  <div className="query-status-filter-group" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setQueryFilter('all')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: queryFilter === 'all' ? '1.5px solid #2e7d32' : '1px solid #cbd5e1',
                        background: queryFilter === 'all' ? '#2e7d32' : '#ffffff',
                        color: queryFilter === 'all' ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      All ({queryCounts.total || queries.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueryFilter('PENDING')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: queryFilter === 'PENDING' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                        background: queryFilter === 'PENDING' ? '#d97706' : '#ffffff',
                        color: queryFilter === 'PENDING' ? '#ffffff' : '#b45309',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <i className="fa fa-clock" style={{ marginRight: '6px' }}></i>
                      Pending Review ({queryCounts.pending})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueryFilter('RESOLVED')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: queryFilter === 'RESOLVED' ? '1.5px solid #059669' : '1px solid #cbd5e1',
                        background: queryFilter === 'RESOLVED' ? '#059669' : '#ffffff',
                        color: queryFilter === 'RESOLVED' ? '#ffffff' : '#047857',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <i className="fa fa-check-circle" style={{ marginRight: '6px' }}></i>
                      Resolved & Replied ({queryCounts.resolved})
                    </button>
                  </div>

                  {/* Search Input & Category Dropdown */}
                  <div style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '280px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                      <i className="fa fa-search" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        fontSize: '13px'
                      }}></i>
                      <input
                        type="text"
                        placeholder="Search ticket, citizen, subject..."
                        value={querySearch}
                        onChange={(e) => setQuerySearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 34px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          background: '#ffffff'
                        }}
                      />
                      {querySearch && (
                        <button
                          type="button"
                          onClick={() => setQuerySearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Queries Cards Feed */}
                {(() => {
                  const filteredQueries = queries.filter(q => {
                    const matchesSearch = !querySearch.trim() ||
                      q.ticket_id?.toLowerCase().includes(querySearch.toLowerCase()) ||
                      q.citizen_name?.toLowerCase().includes(querySearch.toLowerCase()) ||
                      q.citizen_email?.toLowerCase().includes(querySearch.toLowerCase()) ||
                      q.subject?.toLowerCase().includes(querySearch.toLowerCase()) ||
                      q.description?.toLowerCase().includes(querySearch.toLowerCase());
                    const matchesStatus = queryFilter === 'all' || q.status === queryFilter;
                    return matchesSearch && matchesStatus;
                  });

                  if (filteredQueries.length === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1.5px dashed #cbd5e1'
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '26px',
                          margin: '0 auto 16px'
                        }}>
                          <i className="fa fa-inbox"></i>
                        </div>
                        <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>No citizen queries found</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                          {querySearch ? 'Try adjusting your search keywords.' : 'All citizen inquiries and feedback tickets have been processed.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="queries-cards-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredQueries.map((q) => {
                        const isResolved = q.status === 'RESOLVED';
                        const citizenInitial = (q.citizen_name || 'C').charAt(0).toUpperCase();

                        return (
                          <div
                            key={q.id}
                            className="query-card-item"
                            style={{
                              background: '#ffffff',
                              borderRadius: '10px',
                              padding: '12px 16px',
                              border: isResolved ? '1px solid #e2e8f0' : '1.5px solid #fed7aa',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {/* Card Top Row: Citizen info, Ticket ID, Category, Scheme Ref, Date & Status */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              marginBottom: '6px',
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #2e7d32 0%, #166534 100%)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  flexShrink: 0
                                }}>
                                  {citizenInitial}
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
                                  {q.citizen_name}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  <i className="fa fa-envelope" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                                  {q.citizen_email}
                                </span>
                                <span style={{
                                  background: '#f1f5f9',
                                  color: '#0f172a',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontWeight: '700',
                                  fontSize: '11.5px'
                                }}>
                                  #{q.ticket_id}
                                </span>
                                <span style={{
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  <i className="fa fa-tag" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                                  {q.category}
                                </span>
                                {q.application_id && (
                                  <span style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#475569',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <i className="fa fa-landmark text-green" style={{ fontSize: '10px' }}></i>
                                    <span>Scheme Ref: <strong>{q.application_id}</strong></span>
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                  <i className="fa fa-calendar-alt" style={{ marginRight: '4px' }}></i>
                                  {q.created_at ? new Date(q.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Recent'}
                                </span>
                                {isResolved ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>
                                    <i className="fa fa-circle-check"></i> Resolved & Replied
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#fff7ed',
                                    color: '#ea580c',
                                    border: '1px solid #ffedd5',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>
                                    <i className="fa fa-hourglass-half"></i> Pending Review
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Subject & Description */}
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{
                                fontSize: '13.5px',
                                color: '#1e293b',
                                fontWeight: '700',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <i className="fa fa-question-circle" style={{ color: '#2563eb', fontSize: '12.5px' }}></i>
                                <span>{q.subject}</span>
                              </div>
                              <div style={{
                                background: '#f8fafc',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                borderLeft: '3px solid #3b82f6',
                                fontSize: '12.5px',
                                lineHeight: '1.45',
                                color: '#334155'
                              }}>
                                {q.description}
                              </div>
                            </div>

                            {/* Official Admin Reply Block (if resolved) */}
                            {q.admin_reply && (
                              <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                marginBottom: '6px'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  marginBottom: '2px'
                                }}>
                                  <span style={{
                                    color: '#166534',
                                    fontWeight: '700',
                                    fontSize: '11.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <i className="fa fa-reply-all"></i> Official Administrative Response
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#15803d' }}>
                                    {q.replied_at ? new Date(q.replied_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Recorded'}
                                    {q.replied_by_name ? ` • by ${q.replied_by_name}` : ''}
                                  </span>
                                </div>
                                <p style={{
                                  margin: 0,
                                  fontSize: '12.5px',
                                  lineHeight: '1.4',
                                  color: '#14532d',
                                  whiteSpace: 'pre-line'
                                }}>
                                  {q.admin_reply}
                                </p>
                              </div>
                            )}

                            {/* Card Footer Actions */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '6px',
                              borderTop: '1px solid #f1f5f9'
                            }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuery(q)}
                                title={`Delete grievance #${q.ticket_id}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 11px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  background: '#fff1f2',
                                  color: '#e11d48',
                                  border: '1px solid #fecdd3',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <i className="fa fa-trash-can" style={{ fontSize: '11px' }}></i>
                                <span>Delete Query</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReplyModal(q)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  background: isResolved ? '#f8fafc' : '#2e7d32',
                                  color: isResolved ? '#1e293b' : '#ffffff',
                                  border: isResolved ? '1px solid #cbd5e1' : 'none',
                                  boxShadow: isResolved ? 'none' : '0 1px 3px rgba(46, 125, 50, 0.25)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <i className={`fa ${isResolved ? 'fa-pen' : 'fa-reply'}`} style={{ fontSize: '11px' }}></i>
                                <span>{isResolved ? 'Update Official Reply' : 'Send Official Reply'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Reply Modal Dialog */}
                {isReplyModalOpen && selectedQuery && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div className="admin-reply-modal" style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      maxWidth: '680px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      padding: '28px 32px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      {/* Modal Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '18px',
                        paddingBottom: '14px',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#2e7d32',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Official Support Resolution Desk
                          </div>
                          <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: '#0f172a' }}>
                            Reply to Ticket: {selectedQuery.ticket_id}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsReplyModalOpen(false)}
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            color: '#64748b',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Citizen Summary Strip */}
                      <div style={{
                        background: '#f8fafc',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '18px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                          <div><strong>Citizen:</strong> {selectedQuery.citizen_name}</div>
                          <div><strong>Email:</strong> {selectedQuery.citizen_email}</div>
                          <div><strong>Category:</strong> {selectedQuery.category}</div>
                          <div><strong>Scheme:</strong> {selectedQuery.application_id || 'General Support'}</div>
                        </div>
                        <div style={{
                          paddingTop: '8px',
                          borderTop: '1px dashed #cbd5e1',
                          color: '#334155'
                        }}>
                          <strong>Inquiry:</strong> "{selectedQuery.subject}"
                        </div>
                      </div>

                      {/* Quick Reply Presets */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                          Quick Response Templates (Click to insert):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {QUICK_REPLY_TEMPLATES.map((tpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleApplyQuickReply(tpl.text)}
                              style={{
                                background: '#f0fdf4',
                                border: '1px solid #86efac',
                                color: '#166534',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={tpl.text}
                            >
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reply Textarea Form */}
                      <form onSubmit={handleSendQueryReply}>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '6px'
                          }}>
                            Official Administrative Response Message *
                          </label>
                          <textarea
                            rows={6}
                            required
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="Type clear, actionable instructions for the citizen. E.g. required documents, portal links, processing timelines, or clarification on eligibility rules..."
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '13.5px',
                              lineHeight: '1.5',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          ></textarea>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11.5px',
                            color: '#64748b',
                            marginTop: '4px'
                          }}>
                            <span>Be courteous and provide authentic government guidance.</span>
                            <span>{adminReplyText.length} characters</span>
                          </div>
                        </div>

                        {/* Real-time notification notice */}
                        <div style={{
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '20px',
                          fontSize: '12.5px',
                          color: '#065f46'
                        }}>
                          <i className="fa fa-bell" style={{ fontSize: '15px', color: '#059669' }}></i>
                          <span>
                            <strong>Real-time Alert:</strong> Submitting this reply will immediately create a real-time notification in <strong>{selectedQuery.citizen_name}</strong>'s SchemeSathi account.
                          </span>
                        </div>

                        {/* Modal Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => setIsReplyModalOpen(false)}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#475569',
                              fontSize: '13.5px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSendingReply || !adminReplyText.trim()}
                            style={{
                              padding: '10px 22px',
                              borderRadius: '8px',
                              border: 'none',
                              background: isSendingReply || !adminReplyText.trim() ? '#94a3b8' : '#2e7d32',
                              color: '#ffffff',
                              fontSize: '13.5px',
                              fontWeight: '600',
                              cursor: isSendingReply || !adminReplyText.trim() ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 2px 6px rgba(46, 125, 50, 0.3)'
                            }}
                          >
                            {isSendingReply ? (
                              <>
                                <i className="fa fa-spinner fa-spin"></i>
                                <span>Sending Reply...</span>
                              </>
                            ) : (
                              <>
                                <i className="fa fa-paper-plane"></i>
                                <span>Send Official Reply & Notify Citizen</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation Modal Dialog */}
                {deletingQuery && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '480px',
                      width: '100%',
                      padding: '24px 28px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          <i className="fa fa-triangle-exclamation"></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>Delete Grievance Ticket?</h3>
                          <span style={{ fontSize: '12.5px', color: '#64748b' }}>Reference ID: #{deletingQuery.ticket_id}</span>
                        </div>
                      </div>

                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '18px',
                        fontSize: '13px',
                        color: '#334155'
                      }}>
                        <div style={{ marginBottom: '4px' }}><strong>Citizen:</strong> {deletingQuery.citizen_name} ({deletingQuery.citizen_email})</div>
                        <div><strong>Subject:</strong> "{deletingQuery.subject}"</div>
                      </div>

                      <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                        Are you sure you want to permanently delete this grievance record? This action cannot be reversed.
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setDeletingQuery(null)}
                          disabled={isDeletingQuery}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmDeleteQuery}
                          disabled={isDeletingQuery}
                          style={{
                            padding: '9px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isDeletingQuery ? '#f87171' : '#dc2626',
                            color: '#ffffff',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: isDeletingQuery ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                          }}
                        >
                          {isDeletingQuery ? (
                            <>
                              <i className="fa fa-spinner fa-spin"></i>
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <i className="fa fa-trash-can"></i>
                              <span>Yes, Delete Query</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete All Queries Confirmation Modal Dialog */}
                {isDeleteAllModalOpen && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '490px',
                      width: '100%',
                      padding: '26px 30px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0
                        }}>
                          <i className="fa fa-triangle-exclamation"></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Delete All Citizen Queries?</h3>
                          <span style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: '600' }}>
                            Permanent Administrative Action
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: '#fff1f2',
                        border: '1px solid #fecdd3',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#9f1239'
                      }}>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                          <i className="fa fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                          Warning: This will delete ALL {queries.length} citizen grievance and feedback ticket(s)!
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          All user questions, grievances, and official administrative replies will be permanently wiped from the database.
                        </div>
                      </div>

                      <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                        Are you sure you want to proceed? This operation cannot be reversed.
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setIsDeleteAllModalOpen(false)}
                          disabled={isDeletingAll}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmDeleteAllQueries}
                          disabled={isDeletingAll}
                          style={{
                            padding: '9px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isDeletingAll ? '#f87171' : '#dc2626',
                            color: '#ffffff',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: isDeletingAll ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                          }}
                        >
                          {isDeletingAll ? (
                            <>
                              <i className="fa fa-spinner fa-spin"></i>
                              <span>Deleting All Queries...</span>
                            </>
                          ) : (
                            <>
                              <i className="fa fa-trash-can"></i>
                              <span>Yes, Delete All ({queries.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. BROADCAST NOTIFICATIONS PAGE */}
            {activeTab === 'broadcast' && (
              <div className="admin-broadcast-view">
                {/* Dedicated Broadcast Alerts Page Header */}
                <div className="admin-page-header-card">
                  <div className="admin-page-header-info">
                    <div className="admin-page-badge">
                      <i className="fa fa-bullhorn"></i> Citizen Communication Engine
                    </div>
                    <h2>Broadcast Alerts & Notifications</h2>
                    <p>
                      Dispatch high-priority announcements, scheme deadline alerts, and official platform notifications directly to registered citizens.
                    </p>
                  </div>
                  <div className="admin-page-header-actions">
                    <div className="admin-stat-counter-pill">
                      <span className="counter-val">{broadcasts.length}</span>
                      <span className="counter-lbl">Broadcasts Sent</span>
                    </div>
                  </div>
                </div>

                <div className="admin-broadcast-grid">
                  {/* Broadcast Compose Form */}
                  <div className="admin-card-panel">
                    <div className="panel-header">
                      <h3><i className="fa fa-bullhorn"></i> Send Official Citizen Broadcast</h3>
                    </div>
                    <form onSubmit={handleSendBroadcast} className="admin-scheme-form">
                      <div className="admin-form-group">
                        <label>Announcement Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. New Agriculture Subsidy Window Now Open"
                          value={broadcastForm.title}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                        />
                      </div>

                      <div className="form-row-2">
                        <div className="admin-form-group">
                          <label>Category</label>
                          <select
                            value={broadcastForm.category}
                            onChange={(e) => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                          >
                            <option value="GENERAL">General Notice</option>
                            <option value="SCHEME">Scheme Alert</option>
                            <option value="UPDATE">Platform Update</option>
                            <option value="ALERT">Urgent Deadline</option>
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label>Action Link</label>
                          <input
                            type="text"
                            placeholder="/explore or /scheme/12"
                            value={broadcastForm.link_action}
                            onChange={(e) => setBroadcastForm({ ...broadcastForm, link_action: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label>Message Content *</label>
                        <textarea
                          rows="4"
                          required
                          placeholder="Provide clear details regarding the announcement or scheme deadline for citizens..."
                          value={broadcastForm.description}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, description: e.target.value })}
                        />
                      </div>

                      <div className="admin-form-actions">
                        <button
                          type="submit"
                          className="btn-submit-scheme"
                          disabled={isBroadcasting}
                        >
                          {isBroadcasting ? (
                            <><i className="fa fa-spinner fa-spin"></i> Broadcasting...</>
                          ) : (
                            <><i className="fa fa-paper-plane"></i> Broadcast to All Citizens</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Broadcast History */}
                  <div className="admin-card-panel">
                    <div className="panel-header">
                      <h3><i className="fa fa-clock-rotate-left"></i> Broadcast History ({broadcasts.length})</h3>
                      <div className="panel-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {broadcasts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsClearBroadcastsModalOpen(true)}
                            className="btn-clear-broadcasts"
                            title="Permanently Delete All Broadcast History"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #fecdd3',
                              background: '#fff1f2',
                              color: '#e11d48',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fa fa-trash-can"></i>
                            <span>Clear History</span>
                          </button>
                        )}
                        <button onClick={fetchTabData} className="btn-action view" title="Refresh">
                          <i className="fa fa-rotate"></i>
                        </button>
                      </div>
                    </div>

                    <div className="broadcasts-history-list" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      {broadcasts.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                          No broadcast announcements sent yet. Use the form to send your first message.
                        </p>
                      ) : (
                        broadcasts.map((b) => (
                          <div key={b.id} className="broadcast-item-card">
                            <div className="broadcast-top-meta">
                              <span className={`broadcast-category-badge ${(b.category || 'general').toLowerCase()}`}>
                                {b.category || 'GENERAL'}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="broadcast-date">
                                  {b.created_at ? new Date(b.created_at).toLocaleString() : 'Recent'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBroadcastToDelete(b);
                                    setIsDeleteSingleBroadcastModalOpen(true);
                                  }}
                                  className="btn-delete-broadcast-item"
                                  title="Permanently Delete This Broadcast"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    transition: 'all 0.15s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.background = '#fee2e2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.background = 'none';
                                  }}
                                >
                                  <i className="fa fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                            <span className="broadcast-title">{b.title}</span>
                            <p className="broadcast-desc">{b.description}</p>
                            {b.link_action && (
                              <Link to={b.link_action} className="broadcast-link">
                                {b.link_text || 'View details →'}
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear All Broadcasts Confirmation Modal Dialog */}
                {isClearBroadcastsModalOpen && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '490px',
                      width: '100%',
                      padding: '26px 30px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0
                        }}>
                          <i className="fa fa-triangle-exclamation"></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Clear All Broadcast History?</h3>
                          <span style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: '600' }}>
                            Permanent Database Deletion
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: '#fff1f2',
                        border: '1px solid #fecdd3',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#9f1239'
                      }}>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                          <i className="fa fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                          Warning: This will permanently delete ALL {broadcasts.length} broadcast message(s)!
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          Every broadcast announcement will be permanently removed from the database and will no longer appear in history or citizen notification feeds.
                        </div>
                      </div>

                      <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                        Are you sure you want to proceed? This operation cannot be undone.
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setIsClearBroadcastsModalOpen(false)}
                          disabled={isClearingBroadcasts}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmClearBroadcasts}
                          disabled={isClearingBroadcasts}
                          style={{
                            padding: '9px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            cursor: isClearingBroadcasts ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: isClearingBroadcasts ? 0.7 : 1
                          }}
                        >
                          {isClearingBroadcasts ? (
                            <><i className="fa fa-spinner fa-spin"></i> Clearing History...</>
                          ) : (
                            <><i className="fa fa-trash-can"></i> Yes, Permanently Delete All</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Single Broadcast Confirmation Modal */}
                {isDeleteSingleBroadcastModalOpen && broadcastToDelete && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '460px',
                      width: '100%',
                      padding: '24px 28px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          <i className="fa fa-trash-can"></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>Delete Broadcast Message?</h3>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Permanent Deletion
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                        Are you sure you want to permanently delete this broadcast announcement?
                      </p>

                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        color: '#1e293b',
                        fontWeight: '600'
                      }}>
                        "{broadcastToDelete.title}"
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDeleteSingleBroadcastModalOpen(false);
                            setBroadcastToDelete(null);
                          }}
                          disabled={isDeletingSingleBroadcast}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmDeleteSingleBroadcast}
                          disabled={isDeletingSingleBroadcast}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: isDeletingSingleBroadcast ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: isDeletingSingleBroadcast ? 0.7 : 1
                          }}
                        >
                          {isDeletingSingleBroadcast ? (
                            <><i className="fa fa-spinner fa-spin"></i> Deleting...</>
                          ) : (
                            <><i className="fa fa-trash-can"></i> Delete</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. SYSTEM SETTINGS & HEALTH PAGE */}
            {activeTab === 'settings' && (
              <div className="admin-settings-view">
                {/* Dedicated System & Settings Page Header */}
                <div className="admin-page-header-card">
                  <div className="admin-page-header-info">
                    <div className="admin-page-badge">
                      <i className={`fa ${settingsSubTab === 'profile' ? 'fa-user-gear' : (settingsSubTab === 'team' ? 'fa-user-shield' : 'fa-sliders')}`}></i>{' '}
                      {settingsSubTab === 'profile' ? 'Admin Profile & Security' : (settingsSubTab === 'team' ? 'Administrative Access Control' : 'Security & Infrastructure')}
                    </div>
                    <h2>
                      {settingsSubTab === 'profile' && 'Administrator Profile & Security'}
                      {settingsSubTab === 'team' && 'Administrator Team & Access Management'}
                      {settingsSubTab === 'system' && 'System Configuration & Health'}
                    </h2>
                    <p>
                      {settingsSubTab === 'profile' && 'Update your administrator personal contact details, email address, and Bcrypt-encrypted password credentials.'}
                      {settingsSubTab === 'team' && 'Manage administrator team credentials, account status, and provision new administrator accounts.'}
                      {settingsSubTab === 'system' && 'Configure live citizen portal accessibility, inspect Neon database connectivity, and monitor platform health parameters.'}
                    </p>
                  </div>
                  <div className="admin-page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {settingsSubTab === 'system' && (
                      <>
                        <button
                          type="button"
                          className="analytics-refresh-btn"
                          onClick={handlePingDatabase}
                          disabled={isPingingDb}
                          title="Test live database roundtrip latency"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className={`fa fa-bolt ${isPingingDb ? 'fa-spin' : ''}`} style={{ color: '#eab308' }}></i>
                          {isPingingDb ? 'Pinging Neon DB...' : 'Test DB Latency'}
                        </button>
                        <button
                          type="button"
                          className="analytics-refresh-btn"
                          onClick={handleRefreshSettings}
                          title="Refresh live counters from database"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <i className="fa fa-rotate"></i> Refresh Telemetry
                        </button>
                        <div className="admin-stat-counter-pill">
                          <span className="counter-val" style={{ color: '#10b981' }}>Active</span>
                          <span className="counter-lbl">System Health</span>
                        </div>
                      </>
                    )}
                    {settingsSubTab === 'profile' && (
                      <div className="admin-stat-counter-pill">
                        <span className="counter-val" style={{ color: '#0d9488' }}>{user?.role || 'ADMIN'}</span>
                        <span className="counter-lbl">Current Account</span>
                      </div>
                    )}
                    {settingsSubTab === 'team' && (
                      <button
                        type="button"
                        className="analytics-refresh-btn"
                        onClick={fetchAdminList}
                        disabled={isLoadingAdmins}
                        title="Refresh admin team list"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <i className={`fa fa-rotate ${isLoadingAdmins ? 'fa-spin' : ''}`}></i> Refresh Roster
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Settings Subtabs Navigation */}
                <div className="settings-subtabs-nav">
                  <button
                    type="button"
                    className={`settings-subtab-btn ${settingsSubTab === 'system' ? 'active' : ''}`}
                    onClick={() => setSettingsSubTab('system')}
                  >
                    <i className="fa fa-sliders"></i> System Configuration & Health
                  </button>
                  <button
                    type="button"
                    className={`settings-subtab-btn ${settingsSubTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setSettingsSubTab('profile')}
                  >
                    <i className="fa fa-user-gear"></i> Admin Profile & Password
                  </button>
                  <button
                    type="button"
                    className={`settings-subtab-btn ${settingsSubTab === 'team' ? 'active' : ''}`}
                    onClick={() => {
                      setSettingsSubTab('team');
                      fetchAdminList();
                    }}
                  >
                    <i className="fa fa-user-shield"></i> Admin Team & Accounts
                  </button>
                </div>

                {/* SUBTAB 1: SYSTEM SETTINGS & HEALTH */}
                {settingsSubTab === 'system' && (
                  <>
                    {/* 3 Core Info Cards: Platform Health, Security, and Live Database Counters */}
                    <div className="admin-settings-grid">
                      <div className="settings-info-card">
                        <h4><i className="fa fa-server"></i> Platform Health</h4>
                        <div className="settings-row">
                          <span className="settings-label">Database Connection</span>
                          <span className="status-badge-green">
                            <i className="fa fa-circle" style={{ fontSize: '7px' }}></i>
                            {systemSettings?.database_status || 'CONNECTED'}
                            {liveDbLatency !== null ? ` (${liveDbLatency} ms)` : (systemSettings?.db_latency_ms ? ` (${systemSettings.db_latency_ms} ms)` : '')}
                          </span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Engine & DB Host</span>
                          <span className="settings-val">PostgreSQL (Neon Cloud DB)</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">API Service</span>
                          <span className="settings-val">Flask RESTful v1.0</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Environment</span>
                          <span className="settings-val">{systemSettings?.environment || 'development'}</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Python Version</span>
                          <span className="settings-val">{systemSettings?.python_version || '3.13.7'}</span>
                        </div>
                      </div>

                      <div className="settings-info-card">
                        <h4><i className="fa fa-shield-halved"></i> Security & Administration</h4>
                        <div className="settings-row">
                          <span className="settings-label">Active Administrators</span>
                          <span className="settings-val">{systemSettings?.active_admins_count || adminList.length || 1} Accounts</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Current Admin</span>
                          <span className="settings-val">{user?.email || 'admin@schemesathi.in'}</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Password Protection</span>
                          <span className="settings-val">Bcrypt Salt Hashed</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Authentication</span>
                          <span className="settings-val">Session Cookie + X-User-Id</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">CORS Policy</span>
                          <span className="settings-val">Vite Dev Proxy (5173 ↔ 5000)</span>
                        </div>
                      </div>

                      <div className="settings-info-card">
                        <h4><i className="fa fa-database"></i> Database Counters (Live)</h4>
                        <div className="settings-row">
                          <span className="settings-label">Total Welfare Schemes</span>
                          <span className="settings-val" style={{ color: '#0f172a', fontWeight: '700' }}>
                            {systemSettings?.live_counts?.total_schemes ?? systemSettings?.stats?.total_schemes ?? 0} Records
                            <span style={{ fontSize: '11px', color: '#0d9488', marginLeft: '6px', fontWeight: '600' }}>
                              ({systemSettings?.live_counts?.active_schemes ?? systemSettings?.stats?.active_schemes ?? 0} Active)
                            </span>
                          </span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Registered Citizens</span>
                          <span className="settings-val" style={{ color: '#0f172a', fontWeight: '700' }}>
                            {systemSettings?.live_counts?.total_users ?? systemSettings?.stats?.total_users ?? 0} Profiles
                            <span style={{ fontSize: '11px', color: '#0d9488', marginLeft: '6px', fontWeight: '600' }}>
                              ({systemSettings?.live_counts?.active_users ?? systemSettings?.stats?.active_users ?? 0} Active)
                            </span>
                          </span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Official Categories</span>
                          <span className="settings-val" style={{ color: '#0f172a', fontWeight: '700' }}>
                            {systemSettings?.live_counts?.total_categories ?? systemSettings?.stats?.total_categories ?? 0} Categories
                          </span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Citizen Applications</span>
                          <span className="settings-val" style={{ color: '#0f172a', fontWeight: '700' }}>
                            {systemSettings?.live_counts?.total_applications ?? systemSettings?.stats?.total_applications ?? 0} Submissions
                          </span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Server Timestamp</span>
                          <span className="settings-val" style={{ fontSize: '11.5px' }}>
                            {systemSettings?.server_time ? new Date(systemSettings.server_time).toLocaleString() : new Date().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Platform System Configuration Controls */}
                    <div className="admin-settings-panel">
                      <div className="settings-section-header">
                        <div className="settings-section-left">
                          <div className="settings-section-icon">
                            <i className="fa fa-sliders"></i>
                          </div>
                        </div>
                        <div className="settings-section-center">
                          <h3>Platform System Settings & Operational Controls</h3>
                          <p>Configure live citizen portal accessibility, automated broadcasts, language preferences, and urgent platform announcements.</p>
                        </div>
                        <div className="settings-section-actions">
                          <button
                            type="button"
                            className="analytics-refresh-btn"
                            onClick={handleResetSettingsToDefault}
                            title="Reset all settings to platform defaults"
                            style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' }}
                          >
                            <i className="fa fa-rotate-left"></i> Defaults
                          </button>
                          <button
                            type="button"
                            className="btn-create-scheme"
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            style={{ padding: '8px 18px', fontSize: '13px' }}
                          >
                            {isSavingSettings ? (
                              <><i className="fa fa-spinner fa-spin"></i> Saving...</>
                            ) : (
                              <><i className="fa fa-floppy-disk"></i> Save Configuration</>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Toggle switches grid */}
                      <h4 className="settings-subgroup-title">
                        <i className="fa fa-toggle-on"></i>
                        Citizen Portal Access & Workflows
                      </h4>
                      <div className="settings-toggles-grid">
                        <div className="setting-toggle-card">
                          <div className="setting-toggle-info">
                            <div className="setting-toggle-title">
                              <i className="fa fa-user-plus" style={{ color: '#0d9488' }}></i>
                              Citizen Self-Registration
                            </div>
                            <div className="setting-toggle-desc">
                              Allow new citizens to sign up and create accounts on SchemeSathi.
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`toggle-switch-btn ${settingsForm.allow_citizen_registration ? 'active' : ''}`}
                            onClick={() => handleToggleSetting('allow_citizen_registration')}
                            aria-label="Toggle citizen registration"
                          >
                            <span className="toggle-switch-thumb"></span>
                          </button>
                        </div>

                        <div className="setting-toggle-card">
                          <div className="setting-toggle-info">
                            <div className="setting-toggle-title">
                              <i className="fa fa-circle-question" style={{ color: '#0d9488' }}></i>
                              Citizen Grievances & Queries
                            </div>
                            <div className="setting-toggle-desc">
                              Allow citizens to submit help inquiries and grievance questions.
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`toggle-switch-btn ${settingsForm.allow_citizen_queries ? 'active' : ''}`}
                            onClick={() => handleToggleSetting('allow_citizen_queries')}
                            aria-label="Toggle citizen queries"
                          >
                            <span className="toggle-switch-thumb"></span>
                          </button>
                        </div>

                        <div className="setting-toggle-card">
                          <div className="setting-toggle-info">
                            <div className="setting-toggle-title">
                              <i className="fa fa-bullhorn" style={{ color: '#0d9488' }}></i>
                              Auto-Broadcast on Publishing
                            </div>
                            <div className="setting-toggle-desc">
                              Instantly send a broadcast notification when an admin publishes a new scheme.
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`toggle-switch-btn ${settingsForm.auto_broadcast_new_schemes ? 'active' : ''}`}
                            onClick={() => handleToggleSetting('auto_broadcast_new_schemes')}
                            aria-label="Toggle auto broadcast"
                          >
                            <span className="toggle-switch-thumb"></span>
                          </button>
                        </div>

                        <div className="setting-toggle-card">
                          <div className="setting-toggle-info">
                            <div className="setting-toggle-title">
                              <i className="fa fa-triangle-exclamation" style={{ color: settingsForm.maintenance_mode ? '#dc2626' : '#64748b' }}></i>
                              Maintenance Advisory Mode
                            </div>
                            <div className="setting-toggle-desc">
                              Show a scheduled maintenance advisory banner to public citizens.
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`toggle-switch-btn ${settingsForm.maintenance_mode ? 'active' : ''}`}
                            onClick={() => handleToggleSetting('maintenance_mode')}
                            aria-label="Toggle maintenance mode"
                          >
                            <span className="toggle-switch-thumb"></span>
                          </button>
                        </div>
                      </div>

                      {/* Dropdowns & System Limits */}
                      <h4 className="settings-subgroup-title">
                        <i className="fa fa-sliders"></i>
                        Localization & Security Parameters
                      </h4>
                      <div className="settings-controls-grid">
                        <div className="setting-control-group">
                          <label className="setting-control-label">
                            <i className="fa fa-language"></i> Default Citizen Language
                          </label>
                          <select
                            className="setting-control-select"
                            value={settingsForm.default_language}
                            onChange={(e) => handleSettingInputChange('default_language', e.target.value)}
                          >
                            <option value="en">English (Default)</option>
                            <option value="hi">हिन्दी (Hindi)</option>
                            <option value="mr">मराठी (Marathi)</option>
                          </select>
                        </div>

                        <div className="setting-control-group">
                          <label className="setting-control-label">
                            <i className="fa fa-cloud-arrow-up"></i> Max Document Upload Size
                          </label>
                          <select
                            className="setting-control-select"
                            value={settingsForm.max_upload_size_mb}
                            onChange={(e) => handleSettingInputChange('max_upload_size_mb', Number(e.target.value))}
                          >
                            <option value={5}>5 MB (Recommended)</option>
                            <option value={10}>10 MB</option>
                            <option value={20}>20 MB</option>
                          </select>
                        </div>

                        <div className="setting-control-group">
                          <label className="setting-control-label">
                            <i className="fa fa-clock"></i> Session Security Duration
                          </label>
                          <select
                            className="setting-control-select"
                            value={settingsForm.session_timeout_hours}
                            onChange={(e) => handleSettingInputChange('session_timeout_hours', Number(e.target.value))}
                          >
                            <option value={12}>12 Hours</option>
                            <option value={24}>24 Hours (Standard)</option>
                            <option value={168}>7 Days</option>
                          </select>
                        </div>
                      </div>

                      {/* Urgent Announcement Banner */}
                      <h4 className="settings-subgroup-title">
                        <i className="fa fa-bullhorn"></i>
                        Urgent Citizen Notice Banner
                      </h4>
                      <div className="setting-banner-group">
                        <label className="setting-control-label">
                          <span>Broadcast a pinned notice across all citizen portal pages (leave blank to deactivate notice):</span>
                        </label>
                        <textarea
                          className="setting-banner-textarea"
                          placeholder="e.g. Special Direct Benefit Transfer (DBT) verification drive active in all district panchayats this week..."
                          value={settingsForm.system_announcement || ''}
                          onChange={(e) => handleSettingInputChange('system_announcement', e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="settings-actions-bar">
                        <button
                          type="button"
                          className="btn-create-scheme"
                          onClick={handleSaveSettings}
                          disabled={isSavingSettings}
                          style={{ padding: '12px 28px', fontSize: '14px', borderRadius: '12px' }}
                        >
                          {isSavingSettings ? (
                            <><i className="fa fa-spinner fa-spin"></i> Saving Settings...</>
                          ) : (
                            <><i className="fa fa-check"></i> Save System Configuration</>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* SUBTAB 2: ADMIN PROFILE & SECURITY CREDENTIALS */}
                {settingsSubTab === 'profile' && (
                  <div className="admin-profile-view-grid">
                    {/* Card 1: Administrator Contact & Profile Information */}
                    <div className="admin-profile-card">
                      <div className="admin-card-header">
                        <div className="admin-card-icon-pill teal">
                          <i className="fa fa-user-pen"></i>
                        </div>
                        <div className="admin-card-header-text">
                          <h3>Personal Profile Details</h3>
                          <p>Update your first name, last name, official email address, and contact number.</p>
                        </div>
                        <div className="admin-card-header-right"></div>
                      </div>

                      <form onSubmit={handleUpdateAdminProfile} className="admin-profile-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div className="admin-form-group">
                            <label className="admin-form-label">
                              First Name <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={adminProfileForm.first_name}
                              onChange={(e) => setAdminProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                              placeholder="e.g. Admin"
                              required
                            />
                          </div>
                          <div className="admin-form-group">
                            <label className="admin-form-label">
                              Last Name <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={adminProfileForm.last_name}
                              onChange={(e) => setAdminProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                              placeholder="e.g. Officer"
                              required
                            />
                          </div>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Official Email Address <span className="req">*</span>
                          </label>
                          <input
                            type="email"
                            className="admin-form-input"
                            value={adminProfileForm.email}
                            onChange={(e) => setAdminProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="admin@schemesathi.in"
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Contact Phone Number
                          </label>
                          <input
                            type="tel"
                            className="admin-form-input"
                            value={adminProfileForm.phone}
                            onChange={(e) => setAdminProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="10-digit mobile number"
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">Account Role & Privileges</label>
                          <input
                            type="text"
                            className="admin-form-input"
                            value={`${user?.role || 'ADMIN'} (Full System Administrator)`}
                            disabled
                          />
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="submit"
                            className="btn-create-scheme"
                            disabled={isUpdatingProfile}
                            style={{ padding: '10px 22px', fontSize: '13.5px' }}
                          >
                            {isUpdatingProfile ? (
                              <><i className="fa fa-spinner fa-spin"></i> Saving Profile...</>
                            ) : (
                              <><i className="fa fa-floppy-disk"></i> Save Profile Changes</>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Card 2: Administrator Password Change */}
                    <div className="admin-profile-card">
                      <div className="admin-card-header">
                        <div className="admin-card-icon-pill amber">
                          <i className="fa fa-lock"></i>
                        </div>
                        <div className="admin-card-header-text">
                          <h3>Update Admin Password</h3>
                          <p>Ensure your account is protected with a secure password of at least 8 characters.</p>
                        </div>
                        <div className="admin-card-header-right"></div>
                      </div>

                      <form onSubmit={handleUpdateAdminPassword} className="admin-profile-form">
                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Current Password <span className="req">*</span>
                          </label>
                          <div className="admin-pw-wrapper">
                            <input
                              type={showCurrentPw ? 'text' : 'password'}
                              className="admin-form-input"
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                              placeholder="Enter current password"
                              required
                            />
                            <button
                              type="button"
                              className="admin-pw-toggle-btn"
                              onClick={() => setShowCurrentPw(!showCurrentPw)}
                              title={showCurrentPw ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              <i className={`fa ${showCurrentPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            New Password <span className="req">*</span>
                          </label>
                          <div className="admin-pw-wrapper">
                            <input
                              type={showNewPw ? 'text' : 'password'}
                              className="admin-form-input"
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                              placeholder="At least 8 characters"
                              required
                            />
                            <button
                              type="button"
                              className="admin-pw-toggle-btn"
                              onClick={() => setShowNewPw(!showNewPw)}
                              title={showNewPw ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              <i className={`fa ${showNewPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                          <div style={{ fontSize: '11.5px', color: passwordForm.new_password.length >= 8 ? '#15803d' : '#64748b', marginTop: '2px' }}>
                            <i className={`fa ${passwordForm.new_password.length >= 8 ? 'fa-check' : 'fa-circle-info'}`} style={{ marginRight: '5px' }}></i>
                            Password strength: Minimum 8 characters
                          </div>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Confirm New Password <span className="req">*</span>
                          </label>
                          <div className="admin-pw-wrapper">
                            <input
                              type={showConfirmPw ? 'text' : 'password'}
                              className="admin-form-input"
                              value={passwordForm.confirm_password}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                              placeholder="Re-enter new password"
                              required
                            />
                            <button
                              type="button"
                              className="admin-pw-toggle-btn"
                              onClick={() => setShowConfirmPw(!showConfirmPw)}
                              title={showConfirmPw ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              <i className={`fa ${showConfirmPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                          {passwordForm.confirm_password && (
                            <div style={{
                              fontSize: '11.5px',
                              color: passwordForm.new_password === passwordForm.confirm_password ? '#15803d' : '#dc2626',
                              marginTop: '2px'
                            }}>
                              <i className={`fa ${passwordForm.new_password === passwordForm.confirm_password ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '5px' }}></i>
                              {passwordForm.new_password === passwordForm.confirm_password ? 'Passwords match' : 'Passwords do not match'}
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="submit"
                            className="btn-create-scheme"
                            disabled={isUpdatingPassword}
                            style={{ padding: '10px 22px', fontSize: '13.5px' }}
                          >
                            {isUpdatingPassword ? (
                              <><i className="fa fa-spinner fa-spin"></i> Updating Password...</>
                            ) : (
                              <><i className="fa fa-key"></i> Update Password</>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: ADMIN TEAM & ACCESS ROLES DELEGATION */}
                {settingsSubTab === 'team' && (
                  <div className="admin-team-view-wrapper">
                    {/* Header Action Bar */}
                    <div className="admin-team-header-bar">
                      <div className="admin-team-header-left">
                        <div className="admin-card-icon-pill teal">
                          <i className="fa fa-user-shield"></i>
                        </div>
                      </div>
                      <div className="admin-team-header-center">
                        <h3>Platform Administrator Team & Credentials</h3>
                        <p>Provision and manage platform administrator accounts and administrative access credentials.</p>
                      </div>
                      <div className="admin-team-header-actions">
                        <button
                          type="button"
                          className="btn-add-admin-direct"
                          onClick={() => setIsCreateAdminModalOpen(true)}
                        >
                          <i className="fa fa-plus"></i> Add New Administrator
                        </button>
                      </div>
                    </div>

                    {/* Active Administrators Roster Table */}
                    <div className="admin-roster-card">
                      <div className="admin-card-header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
                        <div className="admin-card-icon-pill purple">
                          <i className="fa fa-shield-halved"></i>
                        </div>
                        <div className="admin-card-header-text">
                          <h3>Active System Administrators Roster</h3>
                          <p>All platform accounts currently provisioned with administrative access and management credentials.</p>
                        </div>
                        <div className="admin-card-header-right"></div>
                      </div>

                      {isLoadingAdmins ? (
                        <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          <i className="fa fa-spinner fa-spin" style={{ fontSize: '20px', color: '#0d9488', marginBottom: '8px' }}></i>
                          <div>Loading administrator roster...</div>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="admin-roster-table">
                            <thead>
                              <tr>
                                <th>Administrator</th>
                                <th>Contact Phone</th>
                                <th>Role</th>
                                <th>Registered</th>
                                <th>Last Login</th>
                                <th style={{ textAlign: 'right' }}>Access Control</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminList.map((adm) => {
                                const isSelf = adm.id === user?.id;
                                const isSuper = (adm.role || '').toUpperCase() === 'SUPERADMIN';
                                return (
                                  <tr key={adm.id}>
                                    <td>
                                      <div className="admin-user-cell">
                                        <div className="admin-avatar-bubble">
                                          {(adm.first_name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="admin-user-name">
                                            {adm.first_name} {adm.last_name || ''}
                                            {isSelf && (
                                              <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: '700', marginLeft: '6px' }}>
                                                (You)
                                              </span>
                                            )}
                                          </div>
                                          <div className="admin-user-email">{adm.email}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>{adm.phone || '—'}</td>
                                    <td>
                                      {isSuper ? (
                                        <span className="role-pill-superadmin">
                                          <i className="fa fa-crown"></i> SUPERADMIN
                                        </span>
                                      ) : (
                                        <span className="role-pill-admin">
                                          <i className="fa fa-shield"></i> ADMIN
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {adm.created_at ? new Date(adm.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                      </span>
                                    </td>
                                    <td>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {formatActivityTime(adm.last_login, 'Never')}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      {isSelf ? (
                                        <span className="current-user-pill">
                                          <i className="fa fa-circle-check" style={{ color: '#0d9488' }}></i> Current Session
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn-revoke-admin"
                                          onClick={() => {
                                            setAdminToRevoke(adm);
                                            setIsRevokeModalOpen(true);
                                          }}
                                          title="Revoke admin access and demote to citizen account"
                                        >
                                          <i className="fa fa-user-slash"></i> Revoke Access
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODAL 1: DIRECT CREATE NEW ADMINISTRATOR */}
                {isCreateAdminModalOpen && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '500px',
                      width: '100%',
                      padding: '24px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                      border: '1px solid #e2e8f0',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#f0fdf4',
                            color: '#0d9488',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                          }}>
                            <i className="fa fa-user-plus"></i>
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>Add New Administrator</h3>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Provision platform credentials</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCreateAdminModalOpen(false)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>

                      <form onSubmit={handleCreateNewAdmin} className="admin-profile-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="admin-form-group">
                            <label className="admin-form-label">
                              First Name <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={createAdminForm.first_name}
                              onChange={(e) => setCreateAdminForm(prev => ({ ...prev, first_name: e.target.value }))}
                              placeholder="e.g. Suresh"
                              required
                            />
                          </div>
                          <div className="admin-form-group">
                            <label className="admin-form-label">
                              Last Name <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={createAdminForm.last_name}
                              onChange={(e) => setCreateAdminForm(prev => ({ ...prev, last_name: e.target.value }))}
                              placeholder="e.g. Patil"
                              required
                            />
                          </div>
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Official Email Address <span className="req">*</span>
                          </label>
                          <input
                            type="email"
                            className="admin-form-input"
                            value={createAdminForm.email}
                            onChange={(e) => setCreateAdminForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="admin.suresh@schemesathi.in"
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Mobile Phone Number <span className="req">*</span>
                          </label>
                          <input
                            type="tel"
                            className="admin-form-input"
                            value={createAdminForm.phone}
                            onChange={(e) => setCreateAdminForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="10-digit mobile number"
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Temporary Initial Password <span className="req">*</span>
                          </label>
                          <div className="admin-pw-wrapper">
                            <input
                              type={showCreateAdminPw ? 'text' : 'password'}
                              className="admin-form-input"
                              value={createAdminForm.password}
                              onChange={(e) => setCreateAdminForm(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="At least 8 characters"
                              required
                            />
                            <button
                              type="button"
                              className="admin-pw-toggle-btn"
                              onClick={() => setShowCreateAdminPw(!showCreateAdminPw)}
                              title={showCreateAdminPw ? 'Hide password' : 'Show password'}
                            >
                              <i className={`fa ${showCreateAdminPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                          <button
                            type="button"
                            onClick={() => setIsCreateAdminModalOpen(false)}
                            disabled={isCreatingAdmin}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#475569',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isCreatingAdmin}
                            className="btn-create-scheme"
                            style={{ padding: '8px 18px', fontSize: '13px' }}
                          >
                            {isCreatingAdmin ? (
                              <><i className="fa fa-spinner fa-spin"></i> Creating Admin...</>
                            ) : (
                              <><i className="fa fa-user-plus"></i> Create Administrator</>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL 2: CONFIRM REVOKE ADMIN ACCESS */}
                {isRevokeModalOpen && adminToRevoke && (
                  <div className="admin-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '460px',
                      width: '100%',
                      padding: '24px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                      border: '1px solid #e2e8f0',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          <i className="fa fa-user-slash"></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>Revoke Administrator Access</h3>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Role Downgrade
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                        Are you sure you want to revoke administrative privileges for <strong>{adminToRevoke.first_name} {adminToRevoke.last_name || ''}</strong>?
                      </p>

                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{adminToRevoke.email}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Role will change: ADMIN → USER (Citizen)</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRevokeModalOpen(false);
                            setAdminToRevoke(null);
                          }}
                          disabled={isRevoking}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleRevokeAdminAccess}
                          disabled={isRevoking}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: isRevoking ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isRevoking ? (
                            <><i className="fa fa-spinner fa-spin"></i> Revoking...</>
                          ) : (
                            <><i className="fa fa-user-slash"></i> Revoke Access</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. DEDICATED ADD NEW SCHEME PAGE */}
            {activeTab === 'add-scheme' && (
              <div className="admin-add-scheme-view">
                {/* Dedicated Add Scheme Page Header */}
                <div className="admin-page-header-card">
                  <div className="admin-page-header-info">
                    <div className="admin-page-badge">
                      <i className="fa fa-circle-plus"></i> Scheme Creation Studio
                    </div>
                    <h2>Add New Government Scheme</h2>
                    <p>
                      Publish an official Central or State welfare initiative, financial subsidy, or scholarship to the master citizen discovery repository.
                    </p>
                  </div>
                  <div className="admin-page-header-actions">
                    <button
                      type="button"
                      className="analytics-refresh-btn"
                      onClick={() => navigate('/admin/schemes')}
                      title="Return to Scheme Catalog"
                    >
                      <i className="fa fa-arrow-left"></i> View Catalog
                    </button>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="scheme-creation-mode-tabs">
                  <button
                    type="button"
                    className={`mode-tab-btn ${schemeCreationMode === 'manual' ? 'active' : ''}`}
                    onClick={() => { setSchemeCreationMode('manual'); setImportResult(null); }}
                  >
                    <i className="fa fa-pen-to-square"></i> Manual Form Entry
                  </button>
                  <button
                    type="button"
                    className={`mode-tab-btn ${schemeCreationMode === 'import' ? 'active' : ''}`}
                    onClick={() => { setSchemeCreationMode('import'); }}
                  >
                    <i className="fa fa-file-excel"></i> Import from Excel / Sheet
                    <span className="mode-tab-badge">Bulk Upload</span>
                  </button>
                </div>

                {schemeCreationMode === 'import' ? (
                  <div className="admin-create-scheme-panel">
                    {renderSchemeImportPanel(false)}
                  </div>
                ) : (
                  <div className="admin-create-scheme-panel">
                  <form onSubmit={async (e) => {
                    await handleCreateScheme(e);
                    navigate('/admin/schemes');
                  }} className="admin-scheme-form">

                    {/* Section 1: General Scheme Profile */}
                    <div className="scheme-form-section">
                      <div className="form-section-header">
                        <div className="form-section-icon"><i className="fa fa-file-lines"></i></div>
                        <div>
                          <h3>General Scheme Profile</h3>
                          <p>Define official title, sector category, and administrative jurisdiction</p>
                        </div>
                      </div>

                      <div className="scheme-form-grid">
                        <div className="admin-form-group">
                          <label>Scheme Official Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter the complete nomenclature of the scheme (e.g. Pradhan Mantri Awas Yojana - Urban (PMAY-U 2.0))"
                            value={newScheme.name}
                            onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                          />
                        </div>

                        <div className="form-row-2">
                          <div className="admin-form-group">
                            <label>Sector Category *</label>
                            <select
                              value={newScheme.category_id}
                              onChange={(e) => setNewScheme({ ...newScheme, category_id: e.target.value })}
                            >
                              {SCHEME_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="admin-form-group">
                            <label>Application Mode *</label>
                            <select
                              value={newScheme.application_mode}
                              onChange={(e) => setNewScheme({ ...newScheme, application_mode: e.target.value })}
                            >
                              <option value="Online">Online Portal</option>
                              <option value="Offline">Offline / District Office</option>
                              <option value="Both">Both (Hybrid Mode)</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row-2">
                          <div className="admin-form-group">
                            <label>Government Level *</label>
                            <select
                              value={newScheme.govt_level}
                              onChange={(e) => setNewScheme({ ...newScheme, govt_level: e.target.value })}
                            >
                              <option value="Central">Central (National / Union)</option>
                              <option value="State">State (State Specific)</option>
                            </select>
                          </div>

                          <div className="admin-form-group">
                            <label>State / Region *</label>
                            <select
                              required
                              value={newScheme.state}
                              onChange={(e) => setNewScheme({ ...newScheme, state: e.target.value })}
                            >
                              {INDIAN_STATES_AND_REGIONS.map((stateName) => (
                                <option key={stateName} value={stateName}>
                                  {stateName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="admin-form-group">
                          <label>Nodal Ministry / Department *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ministry of Housing and Urban Affairs"
                            value={newScheme.ministry_department}
                            onChange={(e) => setNewScheme({ ...newScheme, ministry_department: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Scheme Benefits & Financial Assistance */}
                    <div className="scheme-form-section">
                      <div className="form-section-header">
                        <div className="form-section-icon"><i className="fa fa-hand-holding-heart"></i></div>
                        <div>
                          <h3>Scheme Benefits & Financial Assistance</h3>
                          <p>Specify key benefits, financial aid, subsidies, scholarships, or in-kind assistance</p>
                        </div>
                      </div>

                      <div className="scheme-form-grid">
                        <div className="admin-form-group">
                          <label>Scheme Benefits *</label>
                          <textarea
                            rows="3"
                            required
                            placeholder="e.g. Financial subsidies, grants, loans, health coverage, allowances, scholarships, or in-kind material assistance..."
                            value={newScheme.benefits}
                            onChange={(e) => setNewScheme({ ...newScheme, benefits: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Eligibility & Requirements */}
                    <div className="scheme-form-section">
                      <div className="form-section-header">
                        <div className="form-section-icon"><i className="fa fa-user-check"></i></div>
                        <div>
                          <h3>Eligibility Criteria & Scheme Description</h3>
                          <p>Define citizen criteria, income brackets, age limits, and scheme purpose</p>
                        </div>
                      </div>

                      <div className="scheme-form-grid">
                        <div className="admin-form-group">
                          <label>Brief Description *</label>
                          <textarea
                            rows="3"
                            required
                            placeholder="Summarize the core objectives and mission of this welfare program..."
                            value={newScheme.description}
                            onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label>Detailed Eligibility Criteria *</label>
                          <textarea
                            rows="4"
                            required
                            placeholder="Separate distinct criteria with semicolons (;) or enter on new lines (e.g. Indian citizen; Age above 18 years; Annual family income under ₹2.5 Lakh; Permanent resident of state...)"
                            value={newScheme.eligibility_criteria}
                            onChange={(e) => setNewScheme({ ...newScheme, eligibility_criteria: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Application Procedure & Procedural Roadmap */}
                    <div className="scheme-form-section">
                      <div className="form-section-header">
                        <div className="form-section-icon"><i className="fa fa-diagram-project"></i></div>
                        <div>
                          <h3>Application Procedure & Step-by-Step Roadmap</h3>
                          <p>Provide sequential steps (1., 2., 3. or Step 1, Step 2) to automatically generate the visual flowchart</p>
                        </div>
                      </div>

                      <div className="scheme-form-grid">
                        <div className="admin-form-group">
                          <label>Step-by-Step Application Process *</label>
                          <textarea
                            rows="5"
                            required
                            placeholder={"e.g. 1. Portal Registration: Visit official application portal and sign up with mobile number.\n2. Fill Online Application: Complete personal details and scheme category.\n3. Document Upload: Attach scanned copies of required certificates.\n4. Verification & Approval: District officer verifies records and DBT grant is credited."}
                            value={newScheme.application_process}
                            onChange={(e) => setNewScheme({ ...newScheme, application_process: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Mandatory Verification Documents */}
                    <div className="scheme-form-section">
                      <div className="form-section-header">
                        <div className="form-section-icon"><i className="fa fa-folder-open"></i></div>
                        <div>
                          <h3>Mandatory Verification Documents</h3>
                          <p>List all required identification, income, residence, or certificate records needed from applicants</p>
                        </div>
                      </div>

                      <div className="scheme-form-grid">
                        <div className="admin-form-group">
                          <label>Required Documents (One per line, or separated by ; or commas) *</label>
                          <textarea
                            rows="5"
                            required
                            placeholder={"e.g. Aadhaar Card\nIncome Certificate\nDomicile Certificate\nBank Passbook Copy\n(Or separated by semicolon: Aadhaar Card; Income Certificate; Bank Passbook)"}
                            value={newScheme.documents_required}
                            onChange={(e) => setNewScheme({ ...newScheme, documents_required: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Official Portals & External Access */}
                    <div className="scheme-form-section">
                      <div className="form-section-header">
                        <div className="form-section-icon"><i className="fa fa-globe"></i></div>
                        <div>
                          <h3>Official Portals & External Access</h3>
                          <p>Direct web links where citizens can submit their application or view national portal records</p>
                        </div>
                      </div>

                      <div className="scheme-form-grid">
                        <div className="form-row-2">
                          <div className="admin-form-group">
                            <label>Official Application Portal URL *</label>
                            <input
                              type="url"
                              required
                              placeholder="https://pmay-urban.gov.in"
                              value={newScheme.official_url}
                              onChange={(e) => setNewScheme({ ...newScheme, official_url: e.target.value })}
                            />
                          </div>

                          <div className="admin-form-group">
                            <label>National myScheme Portal Link</label>
                            <input
                              type="url"
                              placeholder="https://www.myscheme.gov.in/schemes/pmay-u"
                              value={newScheme.myscheme_url}
                              onChange={(e) => setNewScheme({ ...newScheme, myscheme_url: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="scheme-studio-actions">
                      <button
                        type="button"
                        className="btn-scheme-cancel"
                        onClick={() => navigate('/admin/schemes')}
                      >
                        <i className="fa fa-xmark"></i> Cancel & Discard
                      </button>
                      <button
                        type="submit"
                        className="btn-scheme-publish"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><i className="fa fa-spinner fa-spin"></i> Publishing Scheme...</>
                        ) : (
                          <><i className="fa fa-cloud-arrow-up"></i> Publish Scheme to Catalog</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Scheme Modal */}
        {isAddModalOpen && (
          <div className="admin-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
            <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>
                  <i className="fa fa-circle-plus"></i> Add New Government Scheme
                </h3>
                <button className="admin-modal-close" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                  <i className="fa fa-times"></i>
                </button>
              </div>

              {/* Mode Selector Tabs inside Modal */}
              <div className="scheme-creation-mode-tabs in-modal">
                <button
                  type="button"
                  className={`mode-tab-btn ${schemeCreationMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setSchemeCreationMode('manual')}
                >
                  <i className="fa fa-pen-to-square"></i> Manual Form Entry
                </button>
                <button
                  type="button"
                  className={`mode-tab-btn ${schemeCreationMode === 'import' ? 'active' : ''}`}
                  onClick={() => setSchemeCreationMode('import')}
                >
                  <i className="fa fa-file-excel"></i> Import from Sheet
                  <span className="mode-tab-badge">Bulk Upload</span>
                </button>
              </div>

              {schemeCreationMode === 'import' ? (
                renderSchemeImportPanel(true)
              ) : (
                <form onSubmit={handleCreateScheme} className="admin-scheme-form">
                <div className="form-row-2">
                  <div className="admin-form-group">
                    <label>Scheme Official Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PM Surya Ghar: Muft Bijli Yojana"
                      value={newScheme.name}
                      onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Category *</label>
                    <select
                      value={newScheme.category_id}
                      onChange={(e) => setNewScheme({ ...newScheme, category_id: e.target.value })}
                    >
                      {SCHEME_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="admin-form-group">
                    <label>Government Level *</label>
                    <select
                      value={newScheme.govt_level}
                      onChange={(e) => setNewScheme({ ...newScheme, govt_level: e.target.value })}
                    >
                      <option value="Central">Central</option>
                      <option value="State">State</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>State Scope</label>
                    <select
                      value={newScheme.state}
                      onChange={(e) => setNewScheme({ ...newScheme, state: e.target.value })}
                    >
                      {INDIAN_STATES_AND_REGIONS.map((stateName) => (
                        <option key={stateName} value={stateName}>
                          {stateName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Ministry / Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Ministry of New and Renewable Energy"
                      value={newScheme.ministry_department}
                      onChange={(e) => setNewScheme({ ...newScheme, ministry_department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Brief Description</label>
                  <textarea
                    rows="2"
                    placeholder="Summary of the scheme and its primary goal..."
                    value={newScheme.description}
                    onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="admin-form-group">
                    <label>Benefits Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. Subsidy up to ₹78,000 for 3kW rooftop solar"
                      value={newScheme.benefits}
                      onChange={(e) => setNewScheme({ ...newScheme, benefits: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Official Portal URL *</label>
                    <input
                      type="url"
                      placeholder="https://pmsuryaghar.gov.in"
                      value={newScheme.official_url}
                      onChange={(e) => setNewScheme({ ...newScheme, official_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-form-group">
                    <label>National myScheme Portal Link</label>
                    <input
                      type="url"
                      placeholder="https://www.myscheme.gov.in/schemes/pm-surya-ghar"
                      value={newScheme.myscheme_url}
                      onChange={(e) => setNewScheme({ ...newScheme, myscheme_url: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Mandatory Documents Required</label>
                    <input
                      type="text"
                      placeholder="e.g. Aadhaar Card; Electricity Bill; Bank Passbook (or separated by comma)"
                      value={newScheme.documents_required}
                      onChange={(e) => setNewScheme({ ...newScheme, documents_required: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Step-by-Step Application Process (1., 2., 3. or Step 1, Step 2)</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. 1. Register on portal 2. Fill personal & land details 3. Upload verification certificates 4. District inspection and grant credit"
                    value={newScheme.application_process}
                    onChange={(e) => setNewScheme({ ...newScheme, application_process: e.target.value })}
                  />
                </div>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-scheme"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><i className="fa fa-spinner fa-spin"></i> Publishing...</>
                    ) : (
                      <><i className="fa fa-check"></i> Save & Broadcast Scheme</>
                    )}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        )}

        {/* ==========================================================================
            SCHEME INSPECTION & EDIT MODAL (Admin In-Dashboard Detailed View)
            ========================================================================== */}
        {isInspectModalOpen && inspectingScheme && (
          <div className="scheme-inspect-modal-backdrop" onClick={handleCloseInspectModal}>
            <div className="scheme-inspect-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              {/* Modal Top Bar */}
              <div className="scheme-inspect-header">
                <div className="scheme-inspect-title-wrap">
                  <div className="scheme-inspect-meta-pills">
                    <span className="inspect-id-badge">Scheme #{inspectingScheme.id}</span>
                    <span className={`status-pill ${inspectingScheme.is_active !== false && inspectingScheme.status !== 'INACTIVE' ? 'active' : 'inactive'}`}>
                      <span className="status-dot"></span>
                      <span>{inspectingScheme.is_active !== false && inspectingScheme.status !== 'INACTIVE' ? 'Active' : 'Inactive'}</span>
                    </span>
                    <span className={`level-chip ${String(inspectingScheme.govt_level || '').toLowerCase().includes('state') ? 'level-state' : 'level-central'}`}>
                      <i className={`fa ${String(inspectingScheme.govt_level || '').toLowerCase().includes('state') ? 'fa-landmark' : 'fa-flag'}`}></i>
                      <span>{String(inspectingScheme.govt_level || '').toLowerCase().includes('state') ? 'State Level' : 'Central Government'}</span>
                    </span>
                    <span
                      className="cat-chip"
                      style={{
                        backgroundColor: getCategoryMeta(typeof inspectingScheme.category === 'object' ? inspectingScheme.category?.name : (inspectingScheme.category || inspectingScheme.category_name)).bg,
                        color: getCategoryMeta(typeof inspectingScheme.category === 'object' ? inspectingScheme.category?.name : (inspectingScheme.category || inspectingScheme.category_name)).color,
                        borderColor: getCategoryMeta(typeof inspectingScheme.category === 'object' ? inspectingScheme.category?.name : (inspectingScheme.category || inspectingScheme.category_name)).border
                      }}
                    >
                      <i className={`fa ${getCategoryMeta(typeof inspectingScheme.category === 'object' ? inspectingScheme.category?.name : (inspectingScheme.category || inspectingScheme.category_name)).icon}`}></i>
                      <span>{typeof inspectingScheme.category === 'object' ? (inspectingScheme.category?.name || 'General') : (inspectingScheme.category || inspectingScheme.category_name || 'General')}</span>
                    </span>
                  </div>
                  <h2 className="scheme-inspect-title">
                    {isEditSchemeMode ? `Edit Specifications: ${inspectingScheme.name}` : inspectingScheme.name}
                  </h2>
                  <p className="scheme-inspect-dept">
                    <i className="fa fa-building-columns"></i>
                    <span>{inspectingScheme.ministry_department || inspectingScheme.ministry || 'Government of India'}</span>
                  </p>
                </div>

                <div className="scheme-inspect-header-actions">
                  <button
                    type="button"
                    className="btn-close-inspect-modal"
                    onClick={handleCloseInspectModal}
                    title="Close inspection"
                    aria-label="Close"
                  >
                    <i className="fa fa-times"></i>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="scheme-inspect-body">
                {inspectLoading && !inspectDetailedData ? (
                  <div className="inspect-loading-state">
                    <i className="fa fa-spinner fa-spin"></i>
                    <p>Loading full technical specifications & rules...</p>
                  </div>
                ) : isEditSchemeMode && editSchemeForm ? (
                  /* =========================================================
                     EDIT MODE: Comprehensive Form for all Scheme Details
                     ========================================================= */
                  <form className="inspect-edit-form" onSubmit={handleSaveSchemeEdit}>
                    <div className="inspect-edit-header-bar">
                      <span className="edit-badge">
                        <i className="fa fa-pen-to-square"></i>
                        <span>Admin Editing Mode Active &mdash; Scheme #{editSchemeForm.id}</span>
                      </span>
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: 500 }}>
                        Modify any details below and click "Save & Apply Changes"
                      </span>
                    </div>

                    {/* Section 1: Core Scheme Metadata */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-id-card"></i> 1. Core Identification & Classifications
                      </h4>

                      <div className="edit-form-group">
                        <label>Scheme Official Name <span className="req">*</span></label>
                        <input
                          type="text"
                          className="edit-form-input"
                          value={editSchemeForm.name}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. 40% Subsidy On Hank Yarn, Dyes & Chemicals Scheme"
                          required
                        />
                      </div>

                      <div className="edit-form-row">
                        <div className="edit-form-group">
                          <label>Ministry / Department / Nodal Agency</label>
                          <input
                            type="text"
                            className="edit-form-input"
                            value={editSchemeForm.ministry_department}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, ministry_department: e.target.value }))}
                            placeholder="e.g. Government of Andhra Pradesh"
                          />
                        </div>

                        <div className="edit-form-group">
                          <label>Scheme Category</label>
                          <select
                            className="edit-form-select"
                            value={editSchemeForm.category_id}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, category_id: e.target.value }))}
                          >
                            {SCHEME_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="edit-form-row-3">
                        <div className="edit-form-group">
                          <label>Government Level</label>
                          <select
                            className="edit-form-select"
                            value={editSchemeForm.govt_level}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, govt_level: e.target.value }))}
                          >
                            <option value="Central">Central</option>
                            <option value="State">State</option>
                          </select>
                        </div>

                        <div className="edit-form-group">
                          <label>Applicable State / Jurisdiction</label>
                          <select
                            className="edit-form-select"
                            value={editSchemeForm.state}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, state: e.target.value }))}
                          >
                            {INDIAN_STATES_AND_REGIONS.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        <div className="edit-form-group">
                          <label>Application Mode</label>
                          <select
                            className="edit-form-select"
                            value={editSchemeForm.application_mode}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, application_mode: e.target.value }))}
                          >
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                            <option value="Both">Both / Hybrid</option>
                          </select>
                        </div>
                      </div>

                      <div className="edit-form-group">
                        <label>Publication Status</label>
                        <select
                          className="edit-form-select"
                          value={editSchemeForm.is_active ? 'ACTIVE' : 'INACTIVE'}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, is_active: e.target.value === 'ACTIVE', status: e.target.value }))}
                        >
                          <option value="ACTIVE">Active (Discoverable by Citizens)</option>
                          <option value="INACTIVE">Inactive (Hidden from Recommendations)</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 2: Overview & Scope */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-align-left"></i> 2. Overview & Detailed Scope
                      </h4>
                      <div className="edit-form-group">
                        <label>Description & Scope</label>
                        <textarea
                          className="edit-form-textarea"
                          rows={4}
                          value={editSchemeForm.description}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Provide a comprehensive summary of the scheme purpose, background, and objectives..."
                        />
                      </div>
                    </div>

                    {/* Section 3: Key Benefits */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-gift"></i> 3. Key Benefits & Financial Assistance
                      </h4>
                      <div className="edit-form-group">
                        <label>Benefits Details & Subsidies</label>
                        <textarea
                          className="edit-form-textarea"
                          rows={4}
                          value={editSchemeForm.benefits}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, benefits: e.target.value }))}
                          placeholder="Details of financial grant, subsidy %, loan assistance, or incentives..."
                        />
                        <span className="edit-form-hint">Tip: Enter specific numbers, direct benefit transfers, and conditions.</span>
                      </div>
                    </div>

                    {/* Section 4: Eligibility Criteria */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-user-check"></i> 4. Eligibility Criteria & Qualifications
                      </h4>
                      <div className="edit-form-group">
                        <label>Eligibility Requirements & Exclusions</label>
                        <textarea
                          className="edit-form-textarea"
                          rows={4}
                          value={editSchemeForm.eligibility_criteria}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, eligibility_criteria: e.target.value }))}
                          placeholder="Age limits, caste/category criteria, annual income ceilings, occupation..."
                        />
                      </div>
                    </div>

                    {/* Section 5: Mandatory Documents */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-folder-closed"></i> 5. Mandatory Documents Required
                      </h4>
                      <div className="edit-form-group">
                        <label>Required Documents (one document per line)</label>
                        <textarea
                          className="edit-form-textarea"
                          rows={4}
                          value={editSchemeForm.documents_required}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, documents_required: e.target.value }))}
                          placeholder="Aadhaar Card&#10;Income Certificate&#10;Bank Passbook Photocopy&#10;Cooperative Registration Certificate"
                        />
                        <span className="edit-form-hint">Enter each required document on a separate line for clean checklist rendering.</span>
                      </div>
                    </div>

                    {/* Section 6: Application Workflow */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-route"></i> 6. Application Workflow & Procedure
                      </h4>
                      <div className="edit-form-group">
                        <label>Step-by-Step Application Procedure</label>
                        <textarea
                          className="edit-form-textarea"
                          rows={4}
                          value={editSchemeForm.application_process}
                          onChange={(e) => setEditSchemeForm(prev => ({ ...prev, application_process: e.target.value }))}
                          placeholder="Step 1: Submission proforma...&#10;Step 2: Scrutiny by Assistant Director...&#10;Step 3: Disbursal to Bank Account..."
                        />
                      </div>
                    </div>

                    {/* Section 7: Official URLs */}
                    <div className="edit-form-card">
                      <h4 className="edit-form-card-title">
                        <i className="fa fa-link"></i> 7. Official Portals & External URLs
                      </h4>
                      <div className="edit-form-row">
                        <div className="edit-form-group">
                          <label>Official Application Portal URL</label>
                          <input
                            type="url"
                            className="edit-form-input"
                            value={editSchemeForm.official_url}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, official_url: e.target.value }))}
                            placeholder="https://handlooms.ap.gov.in/..."
                          />
                        </div>
                        <div className="edit-form-group">
                          <label>National myScheme Portal URL</label>
                          <input
                            type="url"
                            className="edit-form-input"
                            value={editSchemeForm.myscheme_url}
                            onChange={(e) => setEditSchemeForm(prev => ({ ...prev, myscheme_url: e.target.value }))}
                            placeholder="https://www.myscheme.gov.in/schemes/..."
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* =========================================================
                     VIEW MODE: Clean, Left-Aligned Readable Specifications
                     ========================================================= */
                  <>
                    {/* Quick Specs Grid */}
                    {(() => {
                      const schemeObj = inspectDetailedData || inspectingScheme;
                      const benefitsData = getBenefitsData(schemeObj.benefits);
                      const aboutBullets = getAboutSchemeBullets(schemeObj, benefitsData);
                      const benefitsBullets = benefitsData?.bullets || [];
                      const eligibilityData = getEligibilityData(schemeObj);
                      const documentsList = getDocumentsList(schemeObj);
                      const applicationProcessText = schemeObj.application_process;

                      return (
                        <>
                          <div className="inspect-quick-grid">
                            <div className="inspect-quick-card">
                              <span className="spec-label">Applicable State</span>
                              <span className="spec-value">
                                <i className="fa fa-map-pin"></i>
                                <span>{schemeObj.state || 'All India (National)'}</span>
                              </span>
                            </div>
                            <div className="inspect-quick-card">
                              <span className="spec-label">Application Mode</span>
                              <span className="spec-value">
                                <i className="fa fa-laptop"></i>
                                <span>{schemeObj.application_mode || 'Online'}</span>
                              </span>
                            </div>
                            <div className="inspect-quick-card">
                              <span className="spec-label">Scheme Slug / Tag</span>
                              <span className="spec-value spec-mono">
                                {schemeObj.slug || `scheme-${schemeObj.id}`}
                              </span>
                            </div>
                            <div className="inspect-quick-card">
                              <span className="spec-label">Record Audit ID</span>
                              <span className="spec-value spec-mono">
                                REF-{schemeObj.id.toString().padStart(5, '0')}
                              </span>
                            </div>
                          </div>

                          {/* Overview & Scope (Deduplicated, structured, high-value) */}
                          {aboutBullets.length > 0 && (
                            <div className="inspect-section-card">
                              <h3 className="section-title">
                                <span className="section-icon-badge teal">
                                  <i className="fa fa-circle-info"></i>
                                </span>
                                <span>Overview & Scope</span>
                              </h3>
                              <ul className="inspect-checklist overview-list">
                                {aboutBullets.map((bullet, i) => (
                                  <li key={i}>
                                    <i className="fa fa-circle-check item-icon text-teal"></i>
                                    <span>{renderBulletContent(bullet)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Key Benefits & Financial Assistance (Full fidelity, highlighted metrics) */}
                          {benefitsBullets.length > 0 && (
                            <div className="inspect-section-card">
                              <h3 className="section-title">
                                <span className="section-icon-badge emerald">
                                  <i className="fa fa-gift"></i>
                                </span>
                                <span>Key Benefits & Financial Assistance</span>
                              </h3>
                              <ul className="inspect-checklist benefits-list">
                                {benefitsBullets.map((benefit, i) => (
                                  <li key={i}>
                                    <i className="fa fa-circle-check item-icon text-emerald"></i>
                                    <span>{renderBulletContent(benefit)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Eligibility Criteria & Qualifications */}
                          {eligibilityData && eligibilityData.criteriaBullets.length > 0 && (
                            <div className="inspect-section-card">
                              <h3 className="section-title">
                                <span className="section-icon-badge blue">
                                  <i className="fa fa-user-check"></i>
                                </span>
                                <span>Eligibility Criteria & Qualifications</span>
                              </h3>
                              <ul className="inspect-checklist eligibility-list">
                                {eligibilityData.criteriaBullets.map((crit, i) => (
                                  <li key={i}>
                                    <i className="fa fa-check item-icon text-blue"></i>
                                    <span>{renderBulletContent(crit)}</span>
                                  </li>
                                ))}
                              </ul>
                              {eligibilityData.exclusions && eligibilityData.exclusions.length > 0 && (
                                <div className="inspect-exclusions-subbox">
                                  <h4 className="inspect-subbox-title">
                                    <i className="fa fa-ban text-red"></i> Specific Exclusions
                                  </h4>
                                  <ul className="inspect-checklist exclusions-list">
                                    {eligibilityData.exclusions.map((ex, i) => (
                                      <li key={i}>
                                        <i className="fa fa-xmark item-icon text-red"></i>
                                        <span>{renderBulletContent(ex)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mandatory Documents Required */}
                          {documentsList.length > 0 && (
                            <div className="inspect-section-card">
                              <h3 className="section-title">
                                <span className="section-icon-badge purple">
                                  <i className="fa fa-folder-closed"></i>
                                </span>
                                <span>Mandatory Documents Required</span>
                              </h3>
                              <div className="inspect-docs-grid">
                                {documentsList.map((doc, i) => (
                                  <div key={i} className="inspect-doc-card">
                                    <i className="fa fa-file-lines"></i>
                                    <span>{doc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Application Workflow & Procedure */}
                          {applicationProcessText && (
                            <div className="inspect-section-card">
                              <h3 className="section-title">
                                <span className="section-icon-badge amber">
                                  <i className="fa fa-route"></i>
                                </span>
                                <span>Application Workflow & Procedure</span>
                              </h3>
                              <div className="inspect-process-text">
                                {applicationProcessText}
                              </div>
                            </div>
                          )}

                          {/* Official Government Portals */}
                          {(schemeObj.official_url || schemeObj.myscheme_url) && (
                            <div className="inspect-section-card">
                              <h3 className="section-title">
                                <span className="section-icon-badge sky">
                                  <i className="fa fa-link"></i>
                                </span>
                                <span>Official Government Portals</span>
                              </h3>
                              <div className="inspect-portal-links">
                                {schemeObj.official_url && (
                                  <a
                                    href={schemeObj.official_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inspect-portal-btn official"
                                  >
                                    <i className="fa fa-globe"></i>
                                    <span>Official Application Portal</span>
                                    <i className="fa fa-external-link"></i>
                                  </a>
                                )}
                                {schemeObj.myscheme_url && (
                                  <a
                                    href={schemeObj.myscheme_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inspect-portal-btn myscheme"
                                  >
                                    <i className="fa fa-landmark"></i>
                                    <span>National myScheme.gov.in Portal</span>
                                    <i className="fa fa-external-link"></i>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="scheme-inspect-footer">
                {isEditSchemeMode ? (
                  <>
                    <button
                      type="button"
                      className="btn-cancel-edit-mode"
                      onClick={handleCancelEditScheme}
                      disabled={isSavingSchemeEdit}
                    >
                      Cancel & Discard
                    </button>
                    <button
                      type="button"
                      className="btn-save-edit-submit"
                      onClick={handleSaveSchemeEdit}
                      disabled={isSavingSchemeEdit}
                    >
                      {isSavingSchemeEdit ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa fa-floppy-disk"></i>
                          <span>Save & Apply Changes</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-inspect-delete"
                      onClick={() => handleOpenDeleteSchemeModal(inspectingScheme)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                      <span>Delete Scheme</span>
                    </button>

                    <div className="inspect-footer-right">
                      <button
                        type="button"
                        className="btn-inspect-edit"
                        onClick={handleStartEditScheme}
                        title="Edit any section of this scheme"
                      >
                        <i className="fa fa-pen-to-square"></i>
                        <span>Edit Scheme</span>
                      </button>

                      <a
                        href={`/scheme/${inspectingScheme.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-inspect-citizen-view"
                      >
                        <span>Open Public Citizen View</span>
                        <i className="fa fa-arrow-up-right-from-square"></i>
                      </a>

                      <button
                        type="button"
                        className="btn-inspect-close"
                        onClick={handleCloseInspectModal}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            SCHEME DELETION CONFIRMATION MODAL
            ========================================================================== */}
        {isDeleteSchemeModalOpen && schemeToDelete && (
          <div className="scheme-inspect-modal-backdrop" onClick={() => !isDeletingScheme && setIsDeleteSchemeModalOpen(false)}>
            <div className="delete-scheme-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="delete-modal-icon-wrap">
                <i className="fa fa-triangle-exclamation"></i>
              </div>
              <h3 className="delete-modal-title">Delete Government Scheme?</h3>
              <p className="delete-modal-desc">
                Are you sure you want to delete and deactivate <strong>"{schemeToDelete.name}"</strong>?
              </p>

              <div className="delete-scheme-preview-card">
                <div className="preview-top">
                  <span className="preview-id">ID: #{schemeToDelete.id}</span>
                  <span className="preview-level">{String(schemeToDelete.govt_level || '').toLowerCase().includes('state') ? 'State Level' : 'Central Level'}</span>
                </div>
                <div className="preview-dept">
                  <i className="fa fa-building-columns"></i>
                  <span>{schemeToDelete.ministry_department || schemeToDelete.ministry || 'Government of India'}</span>
                </div>
              </div>

              <div className="delete-warning-callout">
                <i className="fa fa-circle-info"></i>
                <span>This scheme will be removed from citizen discovery and recommendations. Existing historical application records will be preserved for audit compliance.</span>
              </div>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="btn-delete-cancel"
                  onClick={() => setIsDeleteSchemeModalOpen(false)}
                  disabled={isDeletingScheme}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-delete-confirm"
                  onClick={handleConfirmDeleteScheme}
                  disabled={isDeletingScheme}
                >
                  {isDeletingScheme ? (
                    <><i className="fa fa-spinner fa-spin"></i> Deleting...</>
                  ) : (
                    <>
                      <i className="fa fa-trash-can"></i>
                      <span>Yes, Delete Scheme</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
