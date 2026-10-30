/**
 * API Service for SchemeSathi
 * Centralized API communication layer with error handling and interceptors
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : 'http://localhost:5000/api'
);

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('[apiClient] Making request:', { method: options.method || 'GET', url });

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If user is authenticated in localStorage, attach X-User-Id for seamless session persistence
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.id) {
        headers['X-User-Id'] = String(parsed.id);
      }
      if (parsed?.email) {
        headers['X-User-Email'] = parsed.email;
      }
    }
  } catch (e) {}

  const config = {
    headers,
    credentials: 'include', // Include cookies for session
    ...options,
  };

  try {
    const response = await fetch(url, config);
    console.log('[apiClient] Response status:', response.status);
    
    const data = await response.json();
    console.log('[apiClient] Response data:', data);

    if (!response.ok) {
      const error = new Error(data.message || `HTTP Error: ${response.status}`);
      error.status = response.status;
      error.code = data.error;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[apiClient] Error:', error);
    throw error;
  }
}

export function apiClient(endpoint, options) {
  return makeRequest(endpoint, options);
}

const apiMethods = {
  // ========== Authentication ==========
  auth: {
    register(email, password, firstName, lastName, phone) {
      console.log('[apiClient.auth.register] Called with email:', email);
      return makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
        }),
      });
    },

    login(email, password) {
      console.log('[apiClient.auth.login] Called with email:', email);
      return makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    logout() {
      return makeRequest('/auth/logout', {
        method: 'POST',
      });
    },

    getCurrentUser() {
      return makeRequest('/auth/me', {
        method: 'GET',
      });
    },
  },

  // ========== Schemes ==========
  schemes: {
    list(page = 1, limit = 12, sortBy = 'name', sortOrder = 'asc', category = null) {
      let url = `/schemes?page=${page}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`;
      if (category && category !== 'All') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      return makeRequest(url);
    },

    categories() {
      return makeRequest('/schemes/categories');
    },

    search(query, page = 1, limit = 12, category = null) {
      let url = `/schemes/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      if (category && category !== 'All') {
        url += `&category=${encodeURIComponent(category)}`;
      }
      return makeRequest(url);
    },

    filter(filters = {}, page = 1, limit = 12) {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.govt_level && filters.govt_level !== 'All') params.append('govt_level', filters.govt_level);
      if (filters.state && filters.state !== 'All') params.append('state', filters.state);
      if (filters.ministry) params.append('ministry', filters.ministry);
      if (filters.application_mode && filters.application_mode !== 'All') params.append('application_mode', filters.application_mode);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      return makeRequest(`/schemes/filter?${params.toString()}`);
    },

    getDetails(schemeId) {
      return makeRequest(`/schemes/${schemeId}`);
    },

    save(schemeId) {
      return makeRequest(`/schemes/${schemeId}/save`, {
        method: 'POST',
      });
    },

    unsave(schemeId) {
      return makeRequest(`/schemes/${schemeId}/unsave`, {
        method: 'POST',
      });
    },

    getSaved(page = 1, limit = 12) {
      return makeRequest(`/schemes/saved?page=${page}&limit=${limit}`);
    },

    getRecommendations(limit = 10) {
      return makeRequest(`/schemes/recommendations?limit=${limit}`);
    },

    translate(texts, targetLang = 'mr') {
      return makeRequest('/schemes/translate', {
        method: 'POST',
        body: JSON.stringify({ texts, target_lang: targetLang }),
      });
    },
  },

  // ========== Applications Tracking ==========
  applications: {
    recordIntent(schemeId, intent = 'YES') {
      return makeRequest(`/schemes/${schemeId}/apply-intent`, {
        method: 'POST',
        body: JSON.stringify({ intent }),
      });
    },

    markApplied(schemeId, details = {}) {
      return makeRequest(`/schemes/${schemeId}/mark-applied`, {
        method: 'POST',
        body: JSON.stringify(details),
      });
    },

    getAll() {
      return makeRequest('/schemes/applications');
    },

    remove(schemeId) {
      return makeRequest(`/schemes/${schemeId}/application`, {
        method: 'DELETE',
      });
    },
  },

  // ========== User Profile ==========
  users: {
    getProfile() {
      return makeRequest('/users/profile');
    },

    updateProfile(profileData) {
      return makeRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },

    getProfileCompletion() {
      return makeRequest('/users/profile/completion');
    },

    changePassword(passwordData) {
      return makeRequest('/users/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
    },

    deleteAccount(data) {
      return makeRequest('/users/delete-account', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ========== Admin ==========
  admin: {
    getDashboard() {
      return makeRequest('/admin/dashboard');
    },

    profile: {
      get() {
        return makeRequest('/admin/profile');
      },
      update(profileData) {
        return makeRequest('/admin/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });
      },
      updatePassword(passwordData) {
        return makeRequest('/admin/profile/password', {
          method: 'PUT',
          body: JSON.stringify(passwordData),
        });
      },
    },

    admins: {
      list() {
        return makeRequest('/admin/users/admins');
      },
      create(adminData) {
        return makeRequest('/admin/users/create-admin', {
          method: 'POST',
          body: JSON.stringify(adminData),
        });
      },
    },

    schemes: {
      list(page = 1, limit = 20) {
        return makeRequest(`/admin/schemes?page=${page}&limit=${limit}`);
      },

      create(schemeData) {
        return makeRequest('/admin/schemes', {
          method: 'POST',
          body: JSON.stringify(schemeData),
        });
      },

      update(schemeId, schemeData) {
        return makeRequest(`/admin/schemes/${schemeId}`, {
          method: 'PUT',
          body: JSON.stringify(schemeData),
        });
      },

      delete(schemeId) {
        return makeRequest(`/admin/schemes/${schemeId}`, {
          method: 'DELETE',
        });
      },
    },

    users: {
      list(page = 1, limit = 20, search = '', role = '') {
        let url = `/admin/users?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (role) url += `&role=${encodeURIComponent(role)}`;
        return makeRequest(url);
      },

      updateRole(userId, role) {
        return makeRequest(`/admin/users/${userId}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role }),
        });
      },

      updateStatus(userId, status) {
        return makeRequest(`/admin/users/${userId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
      },
    },

    verifications: {
      list(page = 1, limit = 20) {
        return makeRequest(`/admin/verifications?page=${page}&limit=${limit}`);
      },

      verify(schemeId, verificationData) {
        return makeRequest(`/admin/verifications/${schemeId}`, {
          method: 'POST',
          body: JSON.stringify(verificationData),
        });
      },
    },

    categories: {
      list() {
        return makeRequest('/admin/categories');
      },

      create(categoryData) {
        return makeRequest('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(categoryData),
        });
      },
    },

    logs: {
      list(page = 1, limit = 50) {
        return makeRequest(`/admin/logs?page=${page}&limit=${limit}`);
      },
    },
  },

  // ========== Notifications ==========
  notifications: {
    list() {
      return makeRequest('/notifications');
    },

    submitQuery(queryData) {
      return makeRequest('/notifications/query', {
        method: 'POST',
        body: JSON.stringify(queryData),
      });
    },

    markRead(notifId) {
      return makeRequest(`/notifications/${notifId}/read`, {
        method: 'PUT',
      });
    },

    markAllRead() {
      return makeRequest('/notifications/read-all', {
        method: 'PUT',
      });
    },

    delete(notifId) {
      return makeRequest(`/notifications/${notifId}`, {
        method: 'DELETE',
      });
    },

    clearRead() {
      return makeRequest('/notifications/clear-read', {
        method: 'DELETE',
      });
    },
  },

  // ========== Health ==========
  health: {
    check() {
      return makeRequest('/health');
    },

    dbCheck() {
      return makeRequest('/health/db');
    },

    detailed() {
      return makeRequest('/health/detailed');
    },
  },
};

Object.assign(apiClient, apiMethods);

export default apiClient;
