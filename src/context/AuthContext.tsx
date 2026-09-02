import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  token: string | null;
  username: string | null;
  roles: string[];
  login: (token: string, username: string, roles: string[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username"),
  );
  const [roles, setRoles] = useState<string[]>(() => {
    const savedRoles = localStorage.getItem("roles");
    return savedRoles ? JSON.parse(savedRoles) : [];
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
    } else {
      localStorage.removeItem("username");
    }
  }, [username]);

  useEffect(() => {
    if (roles.length > 0) {
      localStorage.setItem("roles", JSON.stringify(roles));
    } else {
      localStorage.removeItem("roles");
    }
  }, [roles]);

  const login = (newToken: string, newUsername: string, newRoles: string[]) => {
    setToken(newToken);
    setUsername(newUsername);
    setRoles(newRoles || []);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setRoles([]);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        roles,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
