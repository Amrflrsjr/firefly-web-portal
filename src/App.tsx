import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Customers } from "./pages/Customer";
import { Products } from "./pages/Product";
import { Quotations } from "./pages/Quotation";
import { Invoices } from "./pages/Invoices";
import { Trash } from "./pages/Trash";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./components/common/NotFound";
import { Users } from "./pages/Users";
import { Profile } from "./pages/Profile";

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "0.75rem",
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#ffffff",
              },
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
              },
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/trash" element={<Trash />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                {/* Admin-Only Route */}
                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<Users />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
