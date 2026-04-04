"use client";
import { createContext, useContext, useEffect, useState } from "react";

const IsLoginContext = createContext();

const useIsLoginContext = () => useContext(IsLoginContext);

function IsLoginProvider({ children }) {
  // null = not yet read from localStorage (hydrating)
  // false = read and not logged in
  // true = read and logged in
  const [isLogin, setIsLogin] = useState(null);

  // Read from localStorage only after hydration (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem("isLogin");
    setIsLogin(stored ? JSON.parse(stored) : false);
  }, []);

  // Persist to localStorage whenever it changes (skip null state)
  useEffect(() => {
    if (isLogin !== null) {
      localStorage.setItem("isLogin", JSON.stringify(isLogin));
    }
  }, [isLogin]);

  return (
    <IsLoginContext.Provider value={{ isLogin, setIsLogin }}>
      {children}
    </IsLoginContext.Provider>
  );
}

export { useIsLoginContext, IsLoginProvider };