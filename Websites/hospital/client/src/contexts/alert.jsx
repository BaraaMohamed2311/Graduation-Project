"use client";
import { useEffect, useState, createContext, useContext } from "react";

export const AlertContext = createContext({ unread: 0, clearUnread: () => {} });

export function useAlerts() {
  return useContext(AlertContext);
}

// Capital A — required for React to treat this as a component, not a plain HTML tag
export function AlertsProvider({ children }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const es = new EventSource(`${process.env.APIKEY}/alerts/stream`);
    es.onopen = () => console.log("nav SSE connected");
    es.onmessage = () => setUnread((prev) => prev + 1);
    es.onerror = (e) => console.log("nav SSE error", e);
    return () => es.close();
  }, []);

  return (
    <AlertContext.Provider value={{ unread, clearUnread: () => setUnread(0) }}>
      {children}
    </AlertContext.Provider>
  );
}