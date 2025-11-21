import React, { createContext, useState, useContext } from "react";
import { useSettings } from "./SettingsContext";

const LayoutContext = createContext();

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }) => {
  const [pageWantsDisplayButton, setPageWantsDisplayButton] = useState(false);
  const [isChatbotOpen, setChatbotOpen] = useState(false);
  const { isDualDisplayEnabled } = useSettings();

  const showCustomerDisplayButton =
    pageWantsDisplayButton && isDualDisplayEnabled;

  const value = {
    showCustomerDisplayButton,
    setShowCustomerDisplayButton: setPageWantsDisplayButton,
    isChatbotOpen,
    setChatbotOpen,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};
