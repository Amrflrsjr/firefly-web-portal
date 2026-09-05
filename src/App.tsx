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
              fontSize: "14px",
              borderRadius: "10px",
              background: "#1e293b",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#FFCB62",
                secondary: "#1e293b",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
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
