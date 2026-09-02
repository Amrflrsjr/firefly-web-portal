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
  UserPlus,
} from "lucide-react";
import { GlobalSearch } from "../components/search/GlobalSearch";
import fireflyLogo from "../assets/Firefly Logo - No BG.png";
import { ConfirmModal } from "./common/ConfirmModal";

export const Layout: React.FC = () => {
  const { username, roles, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check if current user is an Admin
  const isAdmin =
    Array.isArray(roles) &&
    roles.some(
      (role) => typeof role === "string" && role.toLowerCase() === "admin",
    );

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
    { label: "Archive", path: "/trash", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col lg:flex-row relative selection:bg-[#F9B53F]/30 selection:text-slate-900">
      {/* Mobile Sidebar Overlay Drawer */}
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
          className={`absolute top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Logo & Mobile Close Header */}
            <div className="px-2 py-4 mb-6 border-b border-slate-100 flex items-center justify-between">
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/dashboard");
                }}
                className="w-48 h-16 flex items-center justify-center overflow-hidden cursor-pointer mx-auto hover:opacity-90 transition-opacity"
              >
                <img
                  src={fireflyLogo}
                  alt="Firefly Crafts PH Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-linear-to-r from-[#FFCB62]/30 to-[#F9B53F]/20 text-slate-900 border-l-4 border-[#F9B53F] shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? "text-amber-700" : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}

              {/* Admin-Only User Registration Link */}
              {isAdmin && (
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-linear-to-r from-[#FFCB62]/30 to-[#F9B53F]/20 text-slate-900 border-l-4 border-[#F9B53F] shadow-2xs"
                        : "text-amber-700 bg-amber-500/10 hover:bg-amber-500/20"
                    }`
                  }
                >
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  <span>Add New User</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* User Profile & Sign Out Footer */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-200/60 shadow-2xs shrink-0">
                {(username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Logged in as
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {username || "Administrator"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100 active:scale-98 shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200/80 flex-col justify-between p-5 shadow-xs z-10 shrink-0">
        <div>
          {/* Brand Logo Header */}
          <div className="px-2 py-6 mb-6 border-b border-slate-100 flex items-center justify-center">
            <div
              onClick={() => navigate("/dashboard")}
              className="w-52 h-25 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={fireflyLogo}
                alt="Firefly Crafts PH Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-linear-to-r from-[#FFCB62]/30 to-[#F9B53F]/20 text-slate-900 border-l-4 border-[#F9B53F] shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? "text-amber-700" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Admin-Only User Registration Link */}
            {isAdmin && (
              <NavLink
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-linear-to-r from-[#FFCB62]/30 to-[#F9B53F]/20 text-slate-900 border-l-4 border-[#F9B53F] shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <UserPlus
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-amber-700" : "text-slate-400"
                      }`}
                    />
                    <span>Add New User</span>
                  </>
                )}
              </NavLink>
            )}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-200/60 shadow-2xs shrink-0">
              {(username || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                Logged in as
              </p>
              <p className="text-xs font-bold text-slate-800 truncate">
                {username || "Administrator"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100 active:scale-98 shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 gap-4 z-30 shadow-2xs">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-full max-w-md">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="hidden sm:flex items-center gap-2 bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-amber-400 text-slate-950 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        message="Are you sure you want to log out of your session? You will need to sign in again to access the portal workspace."
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
