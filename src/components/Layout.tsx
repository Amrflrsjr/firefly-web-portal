import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { GlobalSearch } from "../components/search/GlobalSearch";
import fireflyLogo from "../assets/Firefly Logo - No BG.png";
import { ConfirmModal } from "./common/ConfirmModal";
import api from "../api/axios";

// Helper to resolve relative backend upload paths
const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const apiBase = api.defaults.baseURL || "http://localhost:5000";
  const baseOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${baseOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const Layout: React.FC = () => {
  const { username, roles, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    profilePictureUrl?: string;
    fullName?: string;
  } | null>(null);

  const isAdmin =
    Array.isArray(roles) &&
    roles.some(
      (role) => typeof role === "string" && role.toLowerCase() === "admin",
    );

  useEffect(() => {
    const fetchUserMeta = async () => {
      try {
        const res = await api.get("/users/me");
        setUserProfile(res.data);
      } catch {
        // Fallback silently if unauthenticated or error
      }
    };
    fetchUserMeta();
  }, []);

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

  const getNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
      isActive
        ? "bg-linear-to-r from-[#FFCB62]/30 to-[#F9B53F]/20 text-slate-900 border-l-4 border-[#F9B53F] shadow-2xs"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
    }`;

  const renderAvatar = (sizeClass = "w-9 h-9 text-xs") => {
    const resolvedUrl = getImageUrl(userProfile?.profilePictureUrl);
    return (
      <div
        className={`${sizeClass} rounded-xl overflow-hidden bg-linear-to-br from-amber-400 to-[#F9B53F] text-slate-950 font-black flex items-center justify-center border border-amber-300 shadow-2xs shrink-0`}
      >
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          (userProfile?.fullName || username || "A").charAt(0).toUpperCase()
        )}
      </div>
    );
  };

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

          {/* Mobile Drawer Profile Footer */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white text-slate-900 border border-slate-200/90 transition-all cursor-pointer shadow-xs hover:bg-amber-50 hover:border-amber-200 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {renderAvatar()}
                <div className="text-left min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate group-hover:text-amber-900">
                    {userProfile?.fullName || username || "Administrator"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Shield className="w-3 h-3 text-amber-600 inline" />
                    {isAdmin ? "Administrator" : "Staff"}
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-amber-700 group-hover:bg-amber-100 group-hover:border-amber-200 transition-colors shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
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

        {/* Executive Sidebar Footer */}
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white text-slate-900 border border-slate-200/90 transition-all cursor-pointer shadow-xs group hover:bg-amber-50 hover:border-amber-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderAvatar()}
              <div className="text-left min-w-0">
                <p className="text-xs font-black text-slate-900 truncate group-hover:text-amber-900">
                  {userProfile?.fullName || username || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-amber-600 inline" />
                  {isAdmin ? "Administrator" : "Staff"}
                </p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-amber-700 group-hover:bg-amber-100 group-hover:border-amber-200 transition-colors shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
          </button>

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

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>

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
