import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Users,
  Package,
  FileText,
  Receipt,
  LogOut,
  Trash2,
  LayoutDashboard,
  Menu,
  Shield,
  Sun,
  Moon,
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
  const [imageFailed, setImageFailed] = useState(false);
  const { username, roles, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        profilePictureUrl?: string;
        fullName?: string;
      }>;
      setImageFailed(false);
      if (customEvent.detail) {
        setUserProfile((prev) => ({
          ...prev,
          ...customEvent.detail,
        }));
      } else {
        fetchUserMeta();
      }
    };

    window.addEventListener(
      "userProfileUpdated",
      handleProfileUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "userProfileUpdated",
        handleProfileUpdate as EventListener,
      );
    };
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
  ];

  const getNavLinkClass = (isActive: boolean) =>
    `relative flex items-center gap-3.5 px-4 py-3 mx-3 rounded-xl text-xs transition-all cursor-pointer ${
      isActive
        ? "text-slate-900 dark:text-white font-bold bg-transparent"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold"
    }`;

  const renderAvatar = (sizeClass = "w-10 h-10 text-sm") => {
    const resolvedUrl = getImageUrl(userProfile?.profilePictureUrl);
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center border border-amber-200/80 dark:border-amber-800/60 shadow-xs shrink-0`}
      >
        {resolvedUrl && !imageFailed ? (
          <img
            src={resolvedUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          (userProfile?.fullName || username || "A").charAt(0).toUpperCase()
        )}
      </div>
    );
  };

  const renderThemeToggle = () => (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer font-semibold text-xs"
    >
      <span className="flex items-center gap-3.5">
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-400" />
        )}
        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      </span>
      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
        {theme}
      </span>
    </button>
  );

  const renderSidebarContent = (onItemClick?: () => void) => (
    <div className="flex flex-col h-full justify-between p-5">
      <div>
        <div className="px-2 py-4 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div
            onClick={() => {
              onItemClick?.();
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
        </div>

        <nav className="space-y-1.5 mt-4">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onItemClick}
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                      <span
                        className={
                          isActive
                            ? "font-bold text-slate-900 dark:text-white"
                            : ""
                        }
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-l-full" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Utility & Admin Section */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            {isAdmin && (
              <NavLink
                to="/users"
                onClick={onItemClick}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <Users
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    <span>User Management</span>
                    {isActive && (
                      <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-l-full" />
                    )}
                  </>
                )}
              </NavLink>
            )}
            <NavLink
              to="/trash"
              onClick={onItemClick}
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <Trash2
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span>Archive</span>
                  {isActive && (
                    <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-l-full" />
                  )}
                </>
              )}
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Footer Profile & Actions */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
        {renderThemeToggle()}

        <div
          onClick={() => {
            onItemClick?.();
            navigate("/profile");
          }}
          className="flex items-center gap-3.5 px-2 py-1 cursor-pointer group"
        >
          {renderAvatar()}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 transition-colors">
              {userProfile?.fullName || username || "Taylor Kareem"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-amber-500 inline" />
              {isAdmin ? "ADMINISTRATOR" : "STAFF"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onItemClick?.();
            setShowLogoutConfirm(true);
          }}
          className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer font-semibold text-xs"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row relative selection:bg-amber-400/30 selection:text-slate-900">
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
          className={`absolute top-0 bottom-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarContent(() => setMobileMenuOpen(false))}
        </aside>
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-col shadow-xs z-10 shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 gap-4 z-30 shadow-2xs">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-full max-w-xl">
              <GlobalSearch />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
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
