import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, roles } = useAuth();

  // 1. Not authenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Not an Admin -> redirect to dashboard
  const isAdmin = roles.some((role) => role.toLowerCase() === "admin");
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Authenticated & Admin -> render protected child routes
  return <Outlet />;
};
