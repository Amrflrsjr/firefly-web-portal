// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Customers } from "./pages/Customer";
import { Products } from "./pages/Product";
import { Quotations } from "./pages/Quotation";
import { Invoices } from "./pages/Invoices";

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "14px",
            borderRadius: "10px",
            background: "#1e293b", // Slate 800
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
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/customers" replace />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/invoices" element={<Invoices />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
