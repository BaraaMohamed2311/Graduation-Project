"use client";
import { useEffect, useState, createContext, useContext } from "react";
import { useUserDataContext } from "@/contexts/user_data";

export const AlertContext = createContext({ unread: 0, clearUnread: () => {} });

export function useAlerts() {
  return useContext(AlertContext);
}

export function AlertsProvider({ children }) {
  const [unread, setUnread] = useState(0);
  const { user_data } = useUserDataContext();

  useEffect(() => {
    if (!user_data?.user_id) return;

    const role = user_data?.emp_title?.toLowerCase();
    const isPatient = !user_data?.emp_title;

    const shouldCountAlert = (alert) => {
      if (alert.alert_type === "medication") return role === "nurse";
      if (alert.alert_type === "critical")   return role === "doctor" || role === "surgeon" || role === "nurse";
      if (alert.alert_type === "consultation") return true; // already scoped server-side to this user's id
      return true;
    };

    const es = new EventSource(`${process.env.APIKEY}/alerts/stream?user_id=${user_data.user_id}`);
    es.onopen = () => console.log("nav SSE connected");
    es.onmessage = (e) => {
      const alert = JSON.parse(e.data);
      if (shouldCountAlert(alert)) setUnread((prev) => prev + 1);
    };
    es.onerror = (e) => console.log("nav SSE error", e);
    return () => es.close();
  }, [user_data?.user_id, user_data?.emp_title]);

  return (
    <AlertContext.Provider value={{ unread, clearUnread: () => setUnread(0) }}>
      {children}
    </AlertContext.Provider>
  );
}