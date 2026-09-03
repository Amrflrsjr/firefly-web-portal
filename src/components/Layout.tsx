import React, { useRef, useState, useEffect } from "react";
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
  User,
  Shield,
  ChevronUp,
} from "lucide-react";
import { GlobalSearch } from "../components/search/GlobalSearch";
import fireflyLogo from "../assets/Firefly Logo - No BG.png";
import { ConfirmModal } from "./common/ConfirmModal";

export const Layout: React.FC = () => {
  const { username, roles, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileProfileDropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    Array.isArray(roles) &&
    roles.some(
      (role) => typeof role === "string" && role.toLowerCase() === "admin",
    );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setSidebarProfileOpen(false);
      }
      if (
        mobileProfileDropdownRef.current &&
        !mobileProfileDropdownRef.current.contains(event.target as Node)
      ) {
        setMobileProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Quotations", path: "/quotations", icon: FileText },
    { label: "Invoices", path: "/invoices", icon: Receipt },
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Products", path: "/products", icon: Package },
    { label: "Archive", path: "/trash", icon: Trash2 },
  ];

  const getNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
      isActive
        ? "bg-linear-to-r from-[#FFCB62]/30 to-[#F9B53F]/20 text-slate-900 border-l-4 border-[#F9B53F] shadow-2xs"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col lg:flex-row relative selection:bg-[#F9B53F]/30 selection:text-slate-900">
      {/* Mobile Sidebar Overlay Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
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

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => getNavLinkClass(isActive)}
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

              {isAdmin && (
                <NavLink
                  to="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <Users
                        className={`w-4 h-4 transition-colors ${
                          isActive ? "text-amber-700" : "text-slate-400"
                        }`}
                      />
                      <span>User Management</span>
                    </>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Mobile Drawer Profile & Sign Out Footer */}
          <div
            className="relative space-y-2.5 pt-4 border-t border-slate-100 shrink-0"
            ref={mobileProfileDropdownRef}
          >
            {mobileProfileOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-50 text-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileProfileOpen(false);
                    setMobileMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>View Profile &amp; Settings</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white text-slate-900 border border-slate-200/90 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-[#F9B53F] text-slate-950 font-black text-xs flex items-center justify-center border border-amber-300 shadow-2xs shrink-0">
                  {(username || "A").charAt(0).toUpperCase()}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {username || "Administrator"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3 text-amber-600 inline" />
                    {isAdmin ? "Administrator" : "Staff"}
                  </p>
                </div>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  mobileProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200/90 hover:border-rose-200 transition-all cursor-pointer font-bold text-xs shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
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
              className="w-52 h-20 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
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
                  className={({ isActive }) => getNavLinkClass(isActive)}
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

            {isAdmin && (
              <NavLink
                to="/users"
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <Users
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-amber-700" : "text-slate-400"
                      }`}
                    />
                    <span>User Management</span>
                  </>
                )}
              </NavLink>
            )}
          </nav>
        </div>

        {/* Executive Light Sidebar Footer User Profile & Actions */}
        <div
          className="relative space-y-2.5 pt-4 border-t border-slate-100"
          ref={profileDropdownRef}
        >
          {/* Popover Menu for Profile Settings */}
          {sidebarProfileOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSidebarProfileOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>View Profile &amp; Settings</span>
              </button>
            </div>
          )}

          {/* Executive Profile Toggle Trigger */}
          <button
            type="button"
            onClick={() => setSidebarProfileOpen(!sidebarProfileOpen)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white text-slate-900 border border-slate-200/90 transition-all cursor-pointer shadow-xs group hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-[#F9B53F] text-slate-950 font-black text-xs flex items-center justify-center border border-amber-300 shadow-2xs shrink-0">
                {(username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">
                  {username || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-amber-600 inline" />
                  {isAdmin ? "Administrator" : "Staff"}
                </p>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
                sidebarProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Standalone Secure Sign Out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200/90 hover:border-rose-200 transition-all cursor-pointer font-bold text-xs shadow-2xs group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Streamlined Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 gap-4 z-30 shadow-2xs">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-full max-w-xl">
              <GlobalSearch />
            </div>
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
