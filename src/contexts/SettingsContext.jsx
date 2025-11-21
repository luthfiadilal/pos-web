import React, { createContext, useState, useContext, useEffect } from "react";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [isDualDisplayEnabled, setIsDualDisplayEnabled] = useState(() => {
    const saved = localStorage.getItem("dual_display_enabled");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(
      "dual_display_enabled",
      JSON.stringify(isDualDisplayEnabled)
    );
  }, [isDualDisplayEnabled]);

  const value = {
    isDualDisplayEnabled,
    setIsDualDisplayEnabled,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
