import React, { createContext, useContext, useState, useEffect } from "react";
import { RequesterUser } from "../types/index.js";

interface RequesterContextType {
  activeRequester: RequesterUser | null;
  setActiveRequester: (requester: RequesterUser | null) => void;
  clearRequester: () => void;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

const STORAGE_KEY = "toktickit_active_requester";

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequester, setActiveRequesterState] = useState<RequesterUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setActiveRequester = (requester: RequesterUser | null) => {
    setActiveRequesterState(requester);
    if (requester) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearRequester = () => {
    setActiveRequester(null);
  };

  return (
    <RequesterContext.Provider value={{ activeRequester, setActiveRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
};

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
