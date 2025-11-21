import React, { createContext, useState, useContext, useEffect } from "react";

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [activeSessions, setActiveSessions] = useState(() => {
    try {
      const saved = localStorage.getItem("activeSessions");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Gagal memuat sesi aktif dari localStorage", error);
      return [];
    }
  });

  const [draftOrder, setDraftOrder] = useState(null);

  useEffect(() => {
    localStorage.setItem("activeSessions", JSON.stringify(activeSessions));
  }, [activeSessions]);

  const startDraftOrder = (tableData, guestDetails) => {
    setDraftOrder({
      table: tableData,
      guests: guestDetails, // { name, men, women, total }
    });
  };

  const clearDraftOrder = () => {
    setDraftOrder(null);
  };

  const saveSession = (sessionData) => {
    const newSession = {
      ...sessionData,
      startTime: new Date().toISOString(),
    };
    setActiveSessions((prevSessions) => [...prevSessions, newSession]);
  };

  const endTableSession = (tableId) => {
    setActiveSessions((prevSessions) =>
      prevSessions.filter((session) => session.table.tbl_cd !== tableId)
    );
  };

  const resetAllSessions = () => {
    setActiveSessions([]);
  };

  const value = {
    activeSessions,
    saveSession,
    endTableSession,
    resetAllSessions,
    draftOrder,
    startDraftOrder,
    clearDraftOrder,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
