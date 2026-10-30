import React, { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';
import applicationService from '../services/applicationService';

/**
 * Authentication Context for SchemeSathi
 * Manages user authentication state, session, and API communication
 */
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setIsAuthenticated(true);
        } catch (e) {}
      }
      const response = await apiClient.auth.getCurrentUser();
      if (response && response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else if (!savedUser) {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (e) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, firstName, lastName, phone) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AuthContext.register] Starting registration for:', email);
      const response = await apiClient.auth.register(email, password, firstName, lastName, phone);

      console.log('[AuthContext.register] Register response:', response);

      if (response.success) {
        console.log('[AuthContext.register] Registration successful, attempting auto-login');
        // Auto-login after registration
        const loginResponse = await apiClient.auth.login(email, password);
        console.log('[AuthContext.register] Login response:', loginResponse);
        
        if (loginResponse.success) {
          // Reset any previous onboarding skip flags and mark user as freshly registered
          try {
            sessionStorage.removeItem('schemesathi_onboarding_skipped');
            if (loginResponse.user?.id) {
              sessionStorage.removeItem(`schemesathi_onboarding_skipped_${loginResponse.user.id}`);
            }
            sessionStorage.setItem('schemesathi_just_registered', 'true');
          } catch (e) {
            console.warn('[AuthContext] Could not update sessionStorage:', e);
          }

          setUser(loginResponse.user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(loginResponse.user));
          try {
            localStorage.setItem('schemesathi-language', 'en');
            window.dispatchEvent(new CustomEvent('schemesathi-language-reset'));
          } catch (e) {}
          applicationService.syncWithBackend();
          console.log('[AuthContext.register] Auto-login successful');
          return { success: true, user: loginResponse.user };
        } else {
          console.error('[AuthContext.register] Auto-login failed:', loginResponse);
          return { success: false, error: loginResponse.error, message: loginResponse.message };
        }
      }

      console.error('[AuthContext.register] Registration failed:', response);
      return { success: false, error: response.error, message: response.message };
    } catch (err) {
      console.error('[AuthContext.register] Error:', err);
      setError(err.message);
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AuthContext.login] Starting login for:', email);
      const response = await apiClient.auth.login(email, password);

      console.log('[AuthContext.login] Login response:', response);

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(response.user));
        try {
          localStorage.setItem('schemesathi-language', 'en');
          window.dispatchEvent(new CustomEvent('schemesathi-language-reset'));
        } catch (e) {}
        applicationService.syncWithBackend();
        console.log('[AuthContext.login] Login successful');
        return { success: true, user: response.user };
      }

      setError(response.message);
      console.error('[AuthContext.login] Login failed:', response.message);
      return { success: false, error: response.error, message: response.message };
    } catch (err) {
      console.error('[AuthContext.login] Error:', err);
      setError(err.message);
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
      try {
        sessionStorage.removeItem('schemesathi_user_profile');
        sessionStorage.removeItem('schemesathi_onboarding_skipped');
        localStorage.removeItem('user');
        localStorage.removeItem('schemesathi-language');
        window.dispatchEvent(new CustomEvent('schemesathi-language-reset'));
        applicationService.clearOnLogout();
      } catch (e) {}
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Clear local state even if logout fails
      setUser(null);
      setIsAuthenticated(false);
      try {
        sessionStorage.removeItem('schemesathi_user_profile');
        sessionStorage.removeItem('schemesathi_onboarding_skipped');
        localStorage.removeItem('user');
        localStorage.removeItem('schemesathi-language');
        window.dispatchEvent(new CustomEvent('schemesathi-language-reset'));
        applicationService.clearOnLogout();
      } catch (e) {}
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.users.updateProfile(profileData);

      if (response.success) {
        // Update user info if name/phone was changed
        if (profileData.first_name || profileData.last_name || profileData.phone) {
          setUser((prev) => ({
            ...prev,
            first_name: profileData.first_name || prev.first_name,
            last_name: profileData.last_name || prev.last_name,
            phone: profileData.phone || prev.phone,
          }));
        }
        return { success: true, data: response.data };
      }

      setError(response.message);
      return { success: false, error: response.error, message: response.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserSession = useCallback((updatedUserData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem('user', JSON.stringify(nextUser));
      } catch (e) {}
      return nextUser;
    });
  }, []);

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    register,
    login,
    logout,
    updateProfile,
    updateUserSession,
    checkAuthStatus,

    // Utilities
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
