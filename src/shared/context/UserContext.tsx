
// UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authServiceLong } from "../../infrastructure/http/auth/authService";

export const AUTH_SESSION_STORAGE_KEY = "authSessionActive";

type User = {
  id: string;
  name: string;
  role: string;
} | null;

type UserContextType = {
  user: User;
  setUser: (user: User) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSession = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) === "true";

    if (!hasSession) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadUser = async () => {
      try {
        const res = await authServiceLong.me();
        if (cancelled) return;

        if (!res.ok) {
          sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          setUser(null);
          return;
        }

        setUser({
          id: res.data.id,
          name: res.data.name,
          role: res.data.role,
        });
      } catch (error) {
        console.error("Failed to load current user:", error);
        if (!cancelled) {
          sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
