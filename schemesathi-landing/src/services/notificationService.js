/**
 * Notification Service for SchemeSathi
 * 
 * Centralized, user-scoped notification manager:
 * 1. For newly registered users: seeds ONLY ONE Welcome notification (no fake mock alerts).
 * 2. When admin adds new schemes: notifies users about newly launched schemes.
 * 3. When users submit doubts / queries in Help & Support: generates query status and support desk replies.
 * 4. Syncs with backend API (/api/notifications) with instant, offline-first local cache.
 * 5. Dispatches NOTIFICATIONS_UPDATED_EVENT for live badges across Dashboard, Navbar, and Sidebar.
 */

import apiClient from './apiClient';

export const NOTIFICATIONS_UPDATED_EVENT = 'schemesathi_notifications_updated';
export const NEW_BROADCAST_ALERT_EVENT = 'schemesathi_new_broadcast_alert';

function getActiveUserId() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return String(u.id);
    }
  } catch (e) {}
  return 'default';
}

function getStorageKey(userId) {
  const uid = userId || getActiveUserId();
  return `schemesathi_notifications_${uid}`;
}

function getInitKey(userId) {
  const uid = userId || getActiveUserId();
  return `schemesathi_notifs_init_${uid}`;
}

function createWelcomeNotification(userName = 'Citizen') {
  return {
    id: `welcome-${Date.now()}`,
    category: 'WELCOME',
    icon: 'hands-clapping',
    title: `Welcome to SchemeSathi, ${userName}! 🎉`,
    description: 'Welcome to SchemeSathi! Start exploring government schemes tailored for you. Complete your profile to unlock 100% accurate scheme recommendations.',
    linkAction: '/profile',
    linkText: 'Complete Profile →',
    isRead: false,
    createdAt: new Date().toISOString()
  };
}

class NotificationService {
  constructor() {
    this._pollingInterval = null;
    this._broadcastChannel = null;
    this._visibilityHandler = null;
    this._syncedOnce = false;
  }
  /**
   * Get all active notifications for the current user.
   * If a user has no notifications yet, initializes with ONLY the single Welcome notification once.
   */
  getNotifications(userId = null) {
    const key = getStorageKey(userId);
    const initKey = getInitKey(userId);

    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[NotificationService] Error reading stored notifications:', e);
    }

    // If notifications were already initialized for this user, do not recreate welcome
    const isInit = localStorage.getItem(initKey);
    if (isInit === 'true') {
      return [];
    }

    // Default for brand new user on first visit: ONLY the single Welcome notification
    let userName = 'Citizen';
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.first_name) userName = u.first_name;
      }
    } catch (e) {}

    const initial = [createWelcomeNotification(userName)];
    try {
      localStorage.setItem(key, JSON.stringify(initial));
      localStorage.setItem(initKey, 'true');
    } catch (e) {}

    return initial;
  }

  /**
   * Get unread notification count for badges.
   */
  getUnreadCount(userId = null) {
    const notifs = this.getNotifications(userId);
    return notifs.filter(n => !n.isRead).length;
  }

  /**
   * Save notifications to localStorage and dispatch update event.
   */
  _save(notifications, userId = null) {
    const key = getStorageKey(userId);
    const initKey = getInitKey(userId);
    try {
      localStorage.setItem(key, JSON.stringify(notifications));
      localStorage.setItem(initKey, 'true');
    } catch (e) {
      console.error('[NotificationService] Error saving notifications:', e);
    }
    this._notifyListeners();
  }

  _notifyListeners() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
    }
  }

  /**
   * Start automatic background polling & cross-tab synchronization.
   * Checks every intervalMs (default 3.5s) for new broadcasts/notifications.
   */
  startPolling(userId = null, intervalMs = 3500) {
    this._currentUserId = userId;

    // 1. Initial immediate sync
    this.syncWithApi(userId);

    if (this._pollingInterval) {
      return;
    }

    // 2. Cross-tab immediate notification listener via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        if (!this._broadcastChannel) {
          this._broadcastChannel = new BroadcastChannel('schemesathi_realtime_broadcasts');
          this._broadcastChannel.onmessage = (event) => {
            if (event.data?.type === 'NEW_BROADCAST' || event.data?.type === 'SUPPORT_REPLY') {
              this.syncWithApi(this._currentUserId);
            }
          };
        }
        if (!this._notifChannel) {
          this._notifChannel = new BroadcastChannel('schemesathi_notifications');
          this._notifChannel.onmessage = (event) => {
            if (event.data?.type === 'NEW_BROADCAST' || event.data?.type === 'SUPPORT_REPLY') {
              this.syncWithApi(this._currentUserId);
            }
          };
        }
      }
    } catch (e) {}

    // 3. Cross-tab storage event listener
    if (typeof window !== 'undefined' && !this._storageHandler) {
      this._storageHandler = (e) => {
        if (e.key === 'schemesathi_broadcast_ping' || e.key === 'schemesathi_support_reply_ping' || e.key?.startsWith('schemesathi_notifications_')) {
          this.syncWithApi(this._currentUserId);
        }
      };
      window.addEventListener('storage', this._storageHandler);
    }

    // 4. Immediate sync when user returns to this tab
    if (typeof document !== 'undefined' && !this._visibilityHandler) {
      this._visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          this.syncWithApi(this._currentUserId);
        }
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }

    // 5. Background polling timer
    this._pollingInterval = setInterval(() => {
      this.syncWithApi(this._currentUserId);
    }, intervalMs);
  }

  /**
   * Stop background polling and cleanup event listeners.
   */
  stopPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
    if (this._visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (this._storageHandler && typeof window !== 'undefined') {
      window.removeEventListener('storage', this._storageHandler);
      this._storageHandler = null;
    }
    if (this._broadcastChannel) {
      try {
        this._broadcastChannel.close();
      } catch (e) {}
      this._broadcastChannel = null;
    }
  }

  /**
   * Sync with backend notifications API with real-time diff detection.
   */
  async syncWithApi(userId = null) {
    const uid = userId || this._currentUserId;
    try {
      const currentList = this.getNotifications(uid);
      if (!this._seenNotificationIds) {
        this._seenNotificationIds = new Set(currentList.map(n => String(n.id)));
      }

      const res = await apiClient.notifications.list();
      if (res?.success && Array.isArray(res.data)) {
        let userCreatedAt = null;
        try {
          const rawUser = localStorage.getItem('user');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            if (u?.created_at) userCreatedAt = new Date(u.created_at).getTime();
          }
        } catch (e) {}

        const formatted = res.data
          .filter(item => {
            // Defense-in-depth: Never show broadcast notifications that were published before the user registered
            if (!item.user_id && userCreatedAt && item.created_at) {
              const itemTime = new Date(item.created_at).getTime();
              // Exclude broadcasts created before account creation (with 5s clock tolerance)
              if (itemTime < userCreatedAt - 5000) {
                return false;
              }
            }
            return true;
          })
          .map(item => ({
            id: item.id,
            category: item.category || 'SYSTEM',
            icon: item.icon || 'bell',
            title: item.title,
            description: item.description,
            linkAction: item.link_action || '/notifications',
            linkText: item.link_text || 'View Details →',
            isRead: Boolean(item.is_read),
            createdAt: item.created_at || new Date().toISOString()
          }));

        // Detect brand-new notifications/broadcasts that arrived after initial load
        const brandNew = formatted.filter(item => !this._seenNotificationIds.has(String(item.id)) && !item.isRead);

        // Update seen set with all current items
        formatted.forEach(item => this._seenNotificationIds.add(String(item.id)));

        // Only pop up real-time broadcast alerts on background sync, NOT on initial account load
        if (this._syncedOnce && brandNew.length > 0) {
          const alertItem = brandNew.find(n => ['SCHEME', 'ALERT', 'UPDATE', 'GENERAL'].includes(n.category)) || brandNew[0];
          if (typeof window !== 'undefined' && alertItem) {
            window.dispatchEvent(new CustomEvent(NEW_BROADCAST_ALERT_EVENT, { detail: alertItem }));
          }
        }
        this._syncedOnce = true;

        this._save(formatted, uid);
        return formatted;
      }
    } catch (err) {
      console.warn('[NotificationService] Sync with API skipped/failed, using local storage:', err);
    }
    return this.getNotifications(uid);
  }

  /**
   * Toggle or set single notification read status.
   */
  markAsRead(id, userId = null) {
    const list = this.getNotifications(userId);
    const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
    this._save(updated, userId);

    if (typeof id === 'number') {
      apiClient.notifications.markRead(id).catch(() => {});
    }
    return updated;
  }

  /**
   * Toggle read/unread status.
   */
  toggleRead(id, userId = null) {
    const list = this.getNotifications(userId);
    const updated = list.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n);
    this._save(updated, userId);
    return updated;
  }

  /**
   * Mark all notifications as read.
   */
  markAllAsRead(userId = null) {
    const list = this.getNotifications(userId);
    const updated = list.map(n => ({ ...n, isRead: true }));
    this._save(updated, userId);

    apiClient.notifications.markAllRead().catch(() => {});
    return updated;
  }

  /**
   * Delete single notification.
   */
  deleteNotification(id, userId = null) {
    const list = this.getNotifications(userId);
    const updated = list.filter(n => String(n.id) !== String(id));
    this._save(updated, userId);

    if (typeof id === 'number' || (!isNaN(Number(id)) && !String(id).startsWith('welcome-') && !String(id).startsWith('query-'))) {
      apiClient.notifications.delete(Number(id)).catch(() => {});
    }
    return updated;
  }

  /**
   * Clear all read notifications.
   */
  clearRead(userId = null) {
    const list = this.getNotifications(userId);
    const updated = list.filter(n => !n.isRead);
    this._save(updated, userId);

    apiClient.notifications.clearRead().catch(() => {});
    return updated;
  }

  /**
   * Triggered when a citizen submits a doubt / grievance query in Help & Support.
   * Generates query registration acknowledgment and forwards to database for admin resolution.
   */
  async submitQuery({ ticketId, subject, category, description, applicationId, name, email }) {
    const tid = ticketId || `GRV-${Math.floor(100000 + Math.random() * 900000)}`;
    const current = this.getNotifications();

    const notif1 = {
      id: `query-sub-${Date.now()}`,
      category: 'SUPPORT',
      icon: 'question-circle',
      title: `Query Registered: ${tid}`,
      description: `Your query regarding "${subject}" (${category}) has been logged with SchemeSathi Help Desk. An administrative officer will review and reply.`,
      linkAction: '/help',
      linkText: 'Track Status in Help & Support →',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const updated = [notif1, ...current];
    this._save(updated);

    // Forward to backend to save into CitizenQuery database table
    try {
      await apiClient.notifications.submitQuery({
        ticket_id: tid,
        subject,
        category,
        description,
        application_id: applicationId,
        name,
        email
      });
    } catch (e) {
      console.warn('[NotificationService] Error forwarding query to backend:', e);
    }

    return { ticketId: tid, notifications: [notif1] };
  }

  /**
   * Triggered when a new scheme is added (e.g. by Admin or system broadcast).
   */
  notifyNewScheme(scheme) {
    if (!scheme) return;
    const current = this.getNotifications();
    const schemeId = scheme.id || scheme.scheme_id;
    const schemeName = scheme.name || scheme.scheme_name || 'New Government Scheme';

    // Prevent duplicate alert for the same scheme
    const exists = current.some(n => n.linkAction === `/scheme/${schemeId}`);
    if (exists) return;

    const notif = {
      id: `scheme-${schemeId}-${Date.now()}`,
      category: 'SCHEME',
      icon: 'sparkles',
      title: `New Scheme Added: ${schemeName}`,
      description: scheme.short_description || scheme.description || `A new government scheme "${schemeName}" is now available. Check eligibility criteria and benefits.`,
      linkAction: `/scheme/${schemeId}`,
      linkText: 'View Scheme Details →',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    this._save([notif, ...current]);
  }
}

const notificationService = new NotificationService();
export default notificationService;
