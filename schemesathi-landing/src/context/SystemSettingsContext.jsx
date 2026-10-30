import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const SystemSettingsContext = createContext({
  settings: null,
  isMaintenanceMode: false,
  allowRegistration: true,
  allowQueries: true,
  announcement: '',
  refreshSettings: () => {},
  showMaintenanceAlert: () => {}
});

export const SystemSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  const fetchSettings = useCallback(() => {
    apiClient('/auth/system-settings')
      .then(res => {
        if (res?.success && res?.settings) {
          setSettings(res.settings);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 4000);
    const handleSettingsUpdated = (e) => {
      if (e?.detail) {
        setSettings(e.detail);
      } else {
        fetchSettings();
      }
    };
    window.addEventListener('schemesathi-settings-updated', handleSettingsUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('schemesathi-settings-updated', handleSettingsUpdated);
    };
  }, [fetchSettings]);

  const showMaintenanceAlert = (actionName = 'This feature') => {
    alert(`⚠️ Platform Maintenance Mode Active\n\n${actionName} is temporarily disabled while scheduled platform maintenance is active. Please try again after maintenance completes.`);
  };

  const value = {
    settings,
    isMaintenanceMode: Boolean(settings?.maintenance_mode),
    allowRegistration: settings?.allow_citizen_registration !== false,
    allowQueries: settings?.allow_citizen_queries !== false,
    announcement: settings?.system_announcement || '',
    refreshSettings: fetchSettings,
    showMaintenanceAlert
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);
export default SystemSettingsContext;
