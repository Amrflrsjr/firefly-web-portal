import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import axios from "axios";
import {
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Camera,
  Upload,
  Mail,
  AtSign,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

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

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Check if current form inputs or selected file differ from saved profile data
  const hasChanges =
    profile !== null &&
    (formData.fullName !== profile.fullName ||
      formData.email !== profile.email ||
      selectedFile !== null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get("/users/me");
        if (isMounted) {
          setProfile(res.data);
          setFormData({
            fullName: res.data.fullName,
            email: res.data.email,
          });
        }
      } catch {
        if (isMounted) {
          toast.error("Failed to load user profile");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/me");
      setProfile(res.data);
      setFormData({
        fullName: res.data.fullName,
        email: res.data.email,
      });
      setSelectedFile(null);
      setPreviewImage(null);
      setIsEditing(false);

      window.dispatchEvent(
        new CustomEvent("userProfileUpdated", {
          detail: {
            profilePictureUrl: res.data.profilePictureUrl,
            fullName: res.data.fullName,
          },
        }),
      );
    } catch {
      toast.error("Failed to refresh profile");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setUpdatingProfile(true);
    try {
      const data = new FormData();
      data.append("FullName", formData.fullName);
      data.append("Email", formData.email);
      data.append("Role", profile?.roles[0] || "Staff");

      if (selectedFile) {
        data.append("profilePicture", selectedFile);
      }

      await api.put("/users/me", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile updated successfully");
      await fetchProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to update profile");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName,
        email: profile.email,
      });
      setSelectedFile(null);
      setPreviewImage(null);
    }
    setIsEditing(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post(`/users/${profile.id}/reset-password`, {
        newPassword: passwordData.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to reset password");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="space-y-6 pb-10 px-4 sm:px-0 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const resolvedAvatarUrl =
    previewImage || getImageUrl(profile?.profilePictureUrl);

  return (
    <div className="space-y-6 pb-10 px-4 sm:px-0 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-2xl">
            {resolvedAvatarUrl ? (
              <img
                src={resolvedAvatarUrl}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (profile?.fullName || profile?.username || "A")
                .charAt(0)
                .toUpperCase()
            )}
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-slate-950/50 backdrop-blur-xs flex flex-col items-center justify-center text-white cursor-pointer"
              title="Change photo"
            >
              <Camera className="w-5 h-5 mb-0.5 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Change
              </span>
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              {profile?.fullName || profile?.username}
              {/* Verified Badge SVG matching requested style */}
              <svg
                className="w-5 h-5 text-blue-500 shrink-0 inline-block"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.99 14.5l-3.5-3.5 1.41-1.41L10.01 13.67l5.59-5.59 1.41 1.41-7 7z" />
              </svg>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {profile?.email}
          </p>
          {isEditing && (
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Personal Details Card Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Personal details
          </h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Full Name Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 w-40 shrink-0">
                Full name:
              </span>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                />
              ) : (
                <span className="font-semibold text-slate-800 dark:text-slate-100 px-1">
                  {profile?.fullName}
                </span>
              )}
            </div>

            {/* Username Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 w-40 shrink-0 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5" /> Username:
              </span>
              <div className="w-full sm:max-w-md text-slate-700 dark:text-slate-300 font-mono font-semibold px-1">
                @{profile?.username}
              </div>
            </div>

            {/* Role Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 w-40 shrink-0 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Role:
              </span>
              <div className="w-full sm:max-w-md px-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {profile?.roles.join(", ") || "Staff"}
                </span>
              </div>
            </div>

            {/* Email Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 w-40 shrink-0 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email:
              </span>
              {isEditing ? (
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                />
              ) : (
                <span className="font-semibold text-slate-800 dark:text-slate-100 px-1">
                  {profile?.email}
                </span>
              )}
            </div>
          </div>

          {/* Conditional Save Actions Footer */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={updatingProfile}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingProfile || !hasChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{updatingProfile ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Security Settings Card Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Security Settings
          </h2>
          {!showPasswordSection && (
            <button
              type="button"
              onClick={() => setShowPasswordSection(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" /> Change Password
            </button>
          )}
        </div>

        {showPasswordSection && (
          <form
            onSubmit={handleResetPassword}
            className="p-6 space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600 dark:text-slate-400 block">
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600 dark:text-slate-400 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({ newPassword: "", confirmPassword: "" });
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingPassword}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>
                  {updatingPassword ? "Updating..." : "Update Password"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
