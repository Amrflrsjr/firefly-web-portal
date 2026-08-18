import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Users, Package, FileText, Receipt, LogOut } from "lucide-react";

export const Layout: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Products", path: "/products", icon: Package },
    { label: "Quotations", path: "/quotations", icon: FileText },
    { label: "Invoices", path: "/invoices", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm">
        <div>
          <div className="px-3 py-4 mb-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-firefly-primary flex items-center justify-center text-slate-900 font-black text-lg shadow-sm">
              F
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">
                Firefly Portal
              </h2>
              <p className="text-xs text-slate-500">Business Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-firefly-accent/30 text-slate-900 border-l-4 border-firefly-secondary"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-slate-700" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="px-3 mb-3">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              Logged in as
            </p>
            <p className="text-sm font-bold text-slate-800">
              {username || "Admin"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
