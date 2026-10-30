import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

/**
 * Custom hook for scheme operations
 */
export const useSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchemes = useCallback(async (page = 1, limit = 12) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.schemes.list(page, limit);
      setSchemes(response.data || []);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSchemes = useCallback(async (query, page = 1, limit = 12) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.schemes.search(query, page, limit);
      setSchemes(response.data || []);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const filterSchemes = useCallback(async (filters, page = 1, limit = 12) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.schemes.filter(filters, page, limit);
      setSchemes(response.data || []);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDetails = useCallback(async (schemeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.schemes.getDetails(schemeId);
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    schemes,
    loading,
    error,
    fetchSchemes,
    searchSchemes,
    filterSchemes,
    getDetails,
  };
};
