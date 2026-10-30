import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

/**
 * Custom hook for user profile operations
 */
export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.users.getProfile();
      setProfile(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.users.updateProfile(profileData);
      setProfile(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompletion = useCallback(async () => {
    try {
      const response = await apiClient.users.getProfileCompletion();
      return response.completion_percentage;
    } catch (err) {
      console.error('Failed to get completion:', err);
      return 0;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    getCompletion,
  };
};
