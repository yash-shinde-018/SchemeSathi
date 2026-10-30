import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import notificationService, { NOTIFICATIONS_UPDATED_EVENT } from '../services/notificationService';
import { translateNotificationItem, formatLocalizedTimeAgo, fetchDynamicTranslations } from '../utils/dynamicTranslator';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [notifications, setNotifications] = useState(() => notificationService.getNotifications(user?.id));
  const [dynamicTranslations, setDynamicTranslations] = useState({});

  // Sync with backend API on mount and listen to updates
  useEffect(() => {
    notificationService.syncWithApi(user?.id).then((synced) => {
      if (synced) setNotifications(synced);
    }).catch(() => {});

    const handleUpdate = () => {
      setNotifications(notificationService.getNotifications(user?.id));
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
  }, [user?.id]);

  // Dynamic Translation for custom broadcast announcements and admin responses
  useEffect(() => {
    if (currentLanguage === 'en' || !notifications || notifications.length === 0) return;

    const customTexts = [];
    notifications.forEach(n => {
      const adminMatch = n.description?.match(/Admin Response:\s*"([^"]+)"/i);
      if (adminMatch && adminMatch[1]) {
        customTexts.push(adminMatch[1]);
      }
      if (n.category === 'GENERAL' || n.category === 'ALERT') {
        if (n.title) customTexts.push(n.title);
        if (n.description) customTexts.push(n.description);
      }
    });

    if (customTexts.length > 0) {
      fetchDynamicTranslations(customTexts, currentLanguage).then(res => {
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
  }, [notifications, currentLanguage]);

  const handleMarkAllRead = () => {
    const updated = notificationService.markAllAsRead(user?.id);
    setNotifications(updated);
  };

  const handleMarkSingleRead = (id) => {
    const updated = notificationService.markAsRead(id, user?.id);
    setNotifications(updated);
  };

  const handleClearRead = () => {
    const updated = notificationService.clearRead(user?.id);
    setNotifications(updated);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = notificationService.deleteNotification(id, user?.id);
    setNotifications(updated);
  };

  const handleActionClick = (item) => {
    notificationService.markAsRead(item.id, user?.id);
    if (item.linkAction) {
      navigate(item.linkAction);
    }
  };

  // Filter based on active category
  const filteredNotifs = notifications.filter(n => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'WELCOME') return n.category === 'WELCOME' || n.category === 'SYSTEM';
    if (activeCategory === 'SCHEME') return n.category === 'SCHEME';
    if (activeCategory === 'SUPPORT') return n.category === 'SUPPORT';
    if (activeCategory === 'APPLICATION') return n.category === 'APPLICATION' || n.category === 'ALERT';
    return n.category === activeCategory;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout activePage="notifications">
      <div className="notif-page-wrapper">
        {/* Header Box */}
        <div className="notif-header-box">
          <div className="notif-header-left">
            <h2>
              <i className="fa fa-bell"></i> {t('notificationsAlerts', 'Notifications & Alerts')}
            </h2>
            <p>{t('notificationsHeaderDesc', 'Stay informed about newly launched schemes, application verifications, and direct benefit credit updates.')}</p>
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button 
                type="button" 
                className="btn-notif-action"
                onClick={handleMarkAllRead}
              >
                <i className="fa fa-check-double"></i> {t('markAllAsRead', 'Mark all as read')}
              </button>
            )}

            <button 
              type="button" 
              className="btn-notif-action"
              onClick={handleClearRead}
            >
              <i className="fa fa-trash"></i> {t('clearRead', 'Clear read')}
            </button>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="notif-filter-bar">
          <button 
            type="button"
            className={`notif-filter-chip ${activeCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ALL')}
          >
            {t('all', 'All')} <span className="chip-counter">{notifications.length}</span>
          </button>

          <button 
            type="button"
            className={`notif-filter-chip ${activeCategory === 'WELCOME' ? 'active' : ''}`}
            onClick={() => setActiveCategory('WELCOME')}
          >
            <i className="fa fa-hands-clapping"></i> {t('filterWelcomeSystem', 'Welcome & System')}
            <span className="chip-counter">{notifications.filter(n => n.category === 'WELCOME' || n.category === 'SYSTEM').length}</span>
          </button>

          <button 
            type="button"
            className={`notif-filter-chip ${activeCategory === 'SCHEME' ? 'active' : ''}`}
            onClick={() => setActiveCategory('SCHEME')}
          >
            <i className="fa fa-sparkles"></i> {t('filterSchemeRecommendations', 'New Schemes')}
            <span className="chip-counter">{notifications.filter(n => n.category === 'SCHEME').length}</span>
          </button>

          <button 
            type="button"
            className={`notif-filter-chip ${activeCategory === 'SUPPORT' ? 'active' : ''}`}
            onClick={() => setActiveCategory('SUPPORT')}
          >
            <i className="fa fa-headset"></i> {t('filterSupportReplies', 'Queries & Support')}
            <span className="chip-counter">{notifications.filter(n => n.category === 'SUPPORT').length}</span>
          </button>

          <button 
            type="button"
            className={`notif-filter-chip ${activeCategory === 'APPLICATION' ? 'active' : ''}`}
            onClick={() => setActiveCategory('APPLICATION')}
          >
            <i className="fa fa-file-signature"></i> {t('filterApplicationUpdates', 'Applications')}
            <span className="chip-counter">{notifications.filter(n => n.category === 'APPLICATION' || n.category === 'ALERT').length}</span>
          </button>
        </div>

        {/* Notification Stack */}
        <div className="notif-items-stack">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((rawItem) => {
              const item = translateNotificationItem(rawItem, currentLanguage, dynamicTranslations[currentLanguage] || {});
              const isUnread = !rawItem.isRead;
              return (
                <div 
                  key={rawItem.id} 
                  className={`notif-card-item ${isUnread ? 'unread' : ''}`}
                >
                  <div className={`notif-type-icon ${(rawItem.category || 'general').toLowerCase()}`}>
                    <i className={`fa fa-${rawItem.icon || 'bell'}`}></i>
                  </div>

                  <div className="notif-body-content">
                    <div className="notif-header-line">
                      <div className="notif-item-title">{item.title}</div>
                      <div className="notif-time-ago">{formatLocalizedTimeAgo(rawItem.createdAt, currentLanguage)}</div>
                    </div>

                    <p className="notif-item-desc">{item.description}</p>

                    <div className="notif-actions-row">
                      <button 
                        type="button" 
                        className="btn-notif-link"
                        onClick={() => handleActionClick(rawItem)}
                      >
                        {item.linkText || 'View Details →'}
                      </button>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isUnread && (
                          <button 
                            type="button" 
                            className="btn-mark-single-read"
                            onClick={() => handleMarkSingleRead(rawItem.id)}
                          >
                            <i className="fa fa-check" style={{ marginRight: '4px' }}></i>
                            {t('markRead', 'Mark as read')}
                          </button>
                        )}

                        <button 
                          type="button" 
                          className="btn-mark-single-read"
                          style={{ color: '#ef4444' }}
                          onClick={(e) => handleDelete(rawItem.id, e)}
                          title="Delete notification"
                        >
                          <i className="fa fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <i className="fa fa-bell-slash" style={{ fontSize: '36px', color: '#94a3b8', marginBottom: '12px', display: 'inline-block' }}></i>
              <h3 style={{ color: '#1e293b', marginBottom: '6px', fontSize: '18px' }}>{t('noNotifications', 'No notifications in this category')}</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>{t('allCaughtUp', 'You are completely caught up with all updates and announcements.')}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
