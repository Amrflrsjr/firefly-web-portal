import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Package,
  FileText,
  Receipt,
  LogOut,
  Trash2,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { GlobalSearch } from "../components/search/GlobalSearch";
import fireflyLogo from "../assets/Firefly Logo - No BG.png";

export const Layout: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Quotations", path: "/quotations", icon: FileText },
    { label: "Invoices", path: "/invoices", icon: Receipt },
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Products", path: "/products", icon: Package },
    { label: "Recently Deleted", path: "/trash", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row relative">
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Sliding Sidebar Drawer */}
        <aside
          className={`absolute top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Logo & Mobile Close Header */}
            <div className="px-2 py-4 mb-6 border-b border-slate-100 flex items-center justify-between">
              <div className="w-32 h-auto flex items-center justify-center overflow-hidden">
                <img
                  src={fireflyLogo}
                  alt="Firefly Crafts PH Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-[#FFCB62]/30 text-slate-900 border-l-4 border-[#F9B53F]"
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
              <p className="text-sm font-bold text-slate-800 truncate">
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
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between p-4 shadow-sm z-10 shrink-0">
        <div>
          <div className="px-2 py-4 mb-6 border-b border-slate-100 flex items-center justify-center">
            <div className="w-36 h-auto flex items-center justify-center overflow-hidden">
              <img
                src={fireflyLogo}
                alt="Firefly Crafts PH Logo"
                className="w-full h-full object-contain"
              />
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
                        ? "bg-[#FFCB62]/30 text-slate-900 border-l-4 border-[#F9B53F]"
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
            <p className="text-sm font-bold text-slate-800 truncate">
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 gap-4 z-30">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-full max-w-md">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-4"></div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
