/**
 * Application Tracking Service for SchemeSathi
 * 
 * Provides centralized state management for citizen scheme application tracking:
 * 1. Tracks citizen intent: 'YES' (Planning to Apply) vs 'MAYBE' (Considering / Shortlisted)
 * 2. Allows citizen to mark schemes as 'APPLIED' once submitted on external official portals
 * 3. Keeps recommendations and dashboard counts updated in real-time
 * 4. Syncs with both backend API and localStorage for instant, offline-first reliability
 */

import apiClient from './apiClient';

const STORAGE_PREFIX = 'schemesathi_user_applications';
const DECIDED_SESSION_KEY = 'schemesathi_decided_schemes';
export const APPLICATIONS_UPDATED_EVENT = 'schemesathi_applications_updated';

class ApplicationService {
  constructor() {
    this._cleanLegacyDemoData();
  }

  /**
   * Remove any legacy hardcoded starter/demo applications from localStorage
   */
  _cleanLegacyDemoData() {
    try {
      const keysToClean = [
        'schemesathi_user_applications',
        'schemesathi_user_applications_guest'
      ];
      
      // Also find all user-scoped application keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToClean.push(key);
        }
      }

      const uniqueKeys = Array.from(new Set(keysToClean));
      uniqueKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              // Strip out any demo applications (SCH-DEMO-11, SCH-DEMO-26, etc.)
              const cleaned = parsed.filter(a => !String(a?.id || '').startsWith('SCH-DEMO'));
              if (cleaned.length === 0) {
                localStorage.removeItem(k);
              } else if (cleaned.length !== parsed.length) {
                localStorage.setItem(k, JSON.stringify(cleaned));
              }
            }
          } catch (e) {}
        }
      });
    } catch (e) {}
  }

  _getCurrentUserId() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        return u?.id || null;
      }
    } catch (e) {}
    return null;
  }

  _getStorageKey() {
    const userId = this._getCurrentUserId();
    return userId ? `${STORAGE_PREFIX}_${userId}` : `${STORAGE_PREFIX}_guest`;
  }

  _notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(APPLICATIONS_UPDATED_EVENT));
    }
  }

  _getStoredApps() {
    try {
      const key = this._getStorageKey();
      let data = localStorage.getItem(key);
      
      // Fallback check to legacy key if user-scoped key is empty
      if (!data && key !== 'schemesathi_user_applications') {
        const legacy = localStorage.getItem('schemesathi_user_applications');
        if (legacy) data = legacy;
      }

      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      // Always filter out any demo items
      return parsed.filter(a => !String(a?.id || '').startsWith('SCH-DEMO'));
    } catch (e) {
      return [];
    }
  }

  _saveStoredApps(apps) {
    try {
      const cleanApps = Array.isArray(apps) 
        ? apps.filter(a => !String(a?.id || '').startsWith('SCH-DEMO')) 
        : [];
      const key = this._getStorageKey();
      localStorage.setItem(key, JSON.stringify(cleanApps));
      this._notify();
    } catch (e) {
      console.error('[applicationService] Failed to save to localStorage', e);
    }
  }

  /**
   * Clear all tracked application cache when logging out
   */
  clearOnLogout() {
    try {
      const userId = this._getCurrentUserId();
      if (userId) {
        localStorage.removeItem(`${STORAGE_PREFIX}_${userId}`);
      }
      localStorage.removeItem(STORAGE_PREFIX);
      localStorage.removeItem(`${STORAGE_PREFIX}_guest`);
      sessionStorage.removeItem(DECIDED_SESSION_KEY);
      this._notify();
    } catch (e) {}
  }

  _getSessionDecided() {
    try {
      const data = sessionStorage.getItem(DECIDED_SESSION_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  _recordSessionDecided(schemeId) {
    try {
      const list = this._getSessionDecided();
      const numId = Number(schemeId);
      if (!list.includes(numId)) {
        list.push(numId);
        sessionStorage.setItem(DECIDED_SESSION_KEY, JSON.stringify(list));
      }
    } catch (e) {}
  }

  /**
   * Check if user has already made a decision (YES / MAYBE / NOT NOW) or already has this scheme tracked
   */
  hasUserDecided(schemeId) {
    if (!schemeId) return true;
    const numId = Number(schemeId);
    
    // Check if in active applications list
    const apps = this._getStoredApps();
    if (apps.some(a => Number(a.schemeId) === numId)) {
      return true;
    }

    // Check if dismissed during current session
    const decided = this._getSessionDecided();
    return decided.includes(numId);
  }

  /**
   * Mark scheme as dismissed for current session ("Not now / Just browsing")
   */
  recordNotNow(schemeId) {
    if (schemeId) {
      this._recordSessionDecided(schemeId);
    }
  }

  /**
   * Get all tracked applications
   */
  getApplications() {
    return this._getStoredApps();
  }

  /**
   * Get Set of scheme IDs that are marked as 'APPLIED'
   */
  getAppliedSchemeIds() {
    const apps = this._getStoredApps();
    const ids = new Set();
    apps.forEach(a => {
      if (a.status === 'APPLIED') {
        ids.add(Number(a.schemeId));
      }
    });
    return ids;
  }

  /**
   * Get Set of all scheme IDs in applications list (regardless of status)
   */
  getTrackedSchemeIds() {
    const apps = this._getStoredApps();
    const ids = new Set();
    apps.forEach(a => {
      if (a.schemeId) {
        ids.add(Number(a.schemeId));
      }
    });
    return ids;
  }

  /**
   * Find application for a specific scheme
   */
  getApplication(schemeId) {
    const numId = Number(schemeId);
    return this._getStoredApps().find(a => Number(a.schemeId) === numId) || null;
  }

  /**
   * Record User Intent (YES: I want to apply -> PLANNING, MAYBE: Maybe later -> CONSIDERING)
   */
  async recordIntent(scheme, intent = 'YES') {
    if (!scheme || !scheme.id) return null;

    const numId = Number(scheme.id);
    const normalizedIntent = intent.toUpperCase() === 'MAYBE' ? 'MAYBE' : 'YES';
    const status = normalizedIntent === 'YES' ? 'PLANNING' : 'CONSIDERING';

    const apps = this._getStoredApps();
    const existingIndex = apps.findIndex(a => Number(a.schemeId) === numId);

    // Extract clean benefit string
    let benefitSummary = '';
    if (typeof scheme.benefits === 'string') {
      benefitSummary = scheme.benefits.slice(0, 120);
    } else if (scheme.benefits?.summary) {
      benefitSummary = scheme.benefits.summary;
    } else if (scheme.description) {
      benefitSummary = scheme.description.slice(0, 100) + '...';
    }

    const categoryName = scheme.category?.name || scheme.category_name || scheme.category || 'General Welfare';
    const categoryIcon = scheme.category?.icon || 'hand-holding-dollar';
    const categoryColor = scheme.category?.color || '#2e7d32';

    const updatedRecord = {
      id: `SCH-APP-${numId}`,
      schemeId: numId,
      schemeName: scheme.name,
      slug: scheme.slug || '',
      category: categoryName,
      categoryIcon: categoryIcon,
      categoryColor: categoryColor,
      govtLevel: scheme.govt_level || (scheme.state ? 'State' : 'Central'),
      state: scheme.state || 'All India',
      ministry: scheme.ministry || scheme.ministry_department || 'Government of India',
      benefitValue: benefitSummary,
      officialUrl: scheme.official_url || '',
      myschemeUrl: scheme.myscheme_url || '',
      userIntent: normalizedIntent,
      status: (existingIndex >= 0 && apps[existingIndex].status === 'APPLIED') ? 'APPLIED' : status,
      savedDate: existingIndex >= 0 ? apps[existingIndex].savedDate : new Date().toISOString(),
      appliedDate: existingIndex >= 0 ? apps[existingIndex].appliedDate : null,
      applicationNumber: existingIndex >= 0 ? apps[existingIndex].applicationNumber : null,
      notes: existingIndex >= 0 ? apps[existingIndex].notes : null,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      apps[existingIndex] = { ...apps[existingIndex], ...updatedRecord };
    } else {
      apps.unshift(updatedRecord);
    }

    this._saveStoredApps(apps);
    this._recordSessionDecided(numId);

    // Background sync with API
    try {
      apiClient.applications.recordIntent(numId, normalizedIntent).catch(() => {});
    } catch (e) {}

    return updatedRecord;
  }

  /**
   * Mark a scheme as 'APPLIED' once submitted on external portal
   */
  async markAsApplied(schemeId, { applicationNumber = '', appliedDate = null, notes = '' } = {}) {
    const numId = Number(schemeId);
    const apps = this._getStoredApps();
    const existingIndex = apps.findIndex(a => Number(a.schemeId) === numId);

    const now = new Date().toISOString();
    const appDate = appliedDate ? new Date(appliedDate).toISOString() : now;

    if (existingIndex >= 0) {
      apps[existingIndex].status = 'APPLIED';
      apps[existingIndex].appliedDate = appDate;
      if (applicationNumber) {
        apps[existingIndex].applicationNumber = applicationNumber.trim();
      }
      if (notes) {
        apps[existingIndex].notes = notes.trim();
      }
      apps[existingIndex].updatedAt = now;
      this._saveStoredApps(apps);
    }

    // Background sync with API
    try {
      apiClient.applications.markApplied(numId, {
        application_number: applicationNumber,
        applied_date: appDate,
        notes
      }).catch(() => {});
    } catch (e) {}

    return existingIndex >= 0 ? apps[existingIndex] : null;
  }

  /**
   * Revert or update application status (e.g. back to PLANNING)
   */
  updateStatus(schemeId, newStatus) {
    const numId = Number(schemeId);
    const apps = this._getStoredApps();
    const existingIndex = apps.findIndex(a => Number(a.schemeId) === numId);

    if (existingIndex >= 0) {
      apps[existingIndex].status = newStatus;
      if (newStatus !== 'APPLIED') {
        apps[existingIndex].appliedDate = null;
      }
      apps[existingIndex].updatedAt = new Date().toISOString();
      this._saveStoredApps(apps);
    }
  }

  /**
   * Remove scheme from applications
   */
  async removeApplication(schemeIdentifier) {
    if (!schemeIdentifier) return false;
    const numId = Number(schemeIdentifier);
    const strId = String(schemeIdentifier).trim().toLowerCase();

    const apps = this._getStoredApps();
    const filtered = apps.filter(a => {
      const aSchemeId = a.schemeId ?? a.scheme_id ?? a.scheme?.id;
      const aId = a.id;
      // Match numeric schemeId
      if (!isNaN(numId) && numId > 0) {
        if (Number(aSchemeId) === numId || Number(aId) === numId) return false;
      }
      // Match string ID
      if (aId && String(aId).trim().toLowerCase() === strId) return false;
      if (aSchemeId && String(aSchemeId).trim().toLowerCase() === strId) return false;
      return true;
    });

    this._saveStoredApps(filtered);

    // Also remove from session decided cache so user can re-track or re-decide if they visit the scheme again
    try {
      const decided = this._getSessionDecided();
      const updatedDecided = decided.filter(id => Number(id) !== numId && String(id) !== strId);
      sessionStorage.setItem(DECIDED_SESSION_KEY, JSON.stringify(updatedDecided));
    } catch (e) {}

    // Background sync deletion with backend API if valid numeric ID
    if (!isNaN(numId) && numId > 0) {
      try {
        apiClient.applications.remove(numId).catch(() => {});
      } catch (e) {}
    }

    return true;
  }

  /**
   * Synchronize local storage with backend API applications
   */
  async syncWithApi() {
    return this.syncWithBackend();
  }

  async syncWithBackend() {
    try {
      const res = await apiClient.applications.getAll();
      if (res?.success && Array.isArray(res.data)) {
        const localApps = this._getStoredApps();
        const localMap = new Map(localApps.map(a => [Number(a.schemeId), a]));

        const remoteApps = res.data.map(remote => {
          const numId = Number(remote.scheme_id);
          const existing = localMap.get(numId);
          return {
            id: `SCH-APP-${numId}`,
            schemeId: numId,
            schemeName: remote.scheme?.name || existing?.schemeName || `Scheme #${numId}`,
            slug: remote.scheme?.slug || existing?.slug || '',
            category: remote.scheme?.category?.name || existing?.category || 'General',
            categoryIcon: remote.scheme?.category?.icon || existing?.categoryIcon || 'hand-holding-dollar',
            categoryColor: remote.scheme?.category?.color || existing?.categoryColor || '#2e7d32',
            govtLevel: remote.scheme?.govt_level || existing?.govtLevel || 'Central',
            state: remote.scheme?.state || existing?.state || 'All India',
            ministry: remote.scheme?.ministry || existing?.ministry || '',
            benefitValue: remote.scheme?.benefits?.summary || existing?.benefitValue || '',
            officialUrl: remote.scheme?.official_url || existing?.officialUrl || '',
            myschemeUrl: remote.scheme?.myscheme_url || existing?.myschemeUrl || '',
            userIntent: remote.user_intent || existing?.userIntent || 'YES',
            status: remote.status || existing?.status || 'PLANNING',
            savedDate: remote.created_at || existing?.savedDate || new Date().toISOString(),
            appliedDate: remote.applied_date || existing?.appliedDate || null,
            applicationNumber: remote.application_number || existing?.applicationNumber || null,
            notes: remote.notes || existing?.notes || null
          };
        });

        // For logged-in users, the remote DB list is authoritative (empty for new users)
        this._saveStoredApps(remoteApps);
        return remoteApps;
      }
    } catch (e) {
      // Offline or unauthenticated; local cache serves seamlessly
    }
    return this._getStoredApps();
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
