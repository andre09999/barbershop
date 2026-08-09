import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.me()
      .then(({ user }) => active && setSession(user))
      .catch(() => active && setSession(null))
      .finally(() => active && setAuthLoading(false));
    return () => { active = false; };
  }, []);

  const signIn = async (credentials) => {
    const { user } = await api.login(credentials);
    setSession(user);
    return user;
  };

  const registerCustomer = async (data) => {
    const { user } = await api.registerCustomer(data);
    setSession(user);
    return user;
  };

  const signOut = async () => {
    try {
      await api.logout();
    } finally {
      setSession(null);
    }
  };

  const refreshSession = async () => {
    const { user } = await api.me();
    setSession(user);
    return user;
  };

  const value = {
    session,
    authLoading,
    signIn,
    registerCustomer,
    signOut,
    refreshSession,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform deve ser usado dentro de PlatformProvider.");
  return context;
}
