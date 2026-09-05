import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import axios from "axios";
import {
  User,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  profilePictureUrl: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

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

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    profilePictureUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const hasProfileChanges =
    profile !== null &&
    (formData.fullName !== profile.fullName ||
      formData.email !== profile.email ||
      selectedFile !== null ||
      formData.profilePictureUrl !== (profile.profilePictureUrl || ""));

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
            profilePictureUrl: res.data.profilePictureUrl || "",
          });
          setPreviewImage(getImageUrl(res.data.profilePictureUrl));
        }
      } catch {
        if (isMounted) toast.error("Failed to load user profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("role", profile?.roles[0] || "Staff");
      data.append("isActive", "true");
      if (selectedFile) {
        data.append("profilePicture", selectedFile);
      }

      await api.put("/users/me", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile updated successfully");

      const res = await api.get("/users/me");
      setProfile(res.data);
      setSelectedFile(null);
      setFormData({
        fullName: res.data.fullName,
        email: res.data.email,
        profilePictureUrl: res.data.profilePictureUrl || "",
      });
      setPreviewImage(getImageUrl(res.data.profilePictureUrl));
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

  const handleDiscardChanges = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName,
        email: profile.email,
        profilePictureUrl: profile.profilePictureUrl || "",
      });
      setSelectedFile(null);
      setPreviewImage(getImageUrl(profile.profilePictureUrl));
    }
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

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading && !profile) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-pulse">
        <div className="h-40 sm:h-44 rounded-3xl bg-slate-100" />
        <div className="h-96 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-72 h-72 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Account Control Center</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                {today}
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              {getGreeting()},{" "}
              {profile?.fullName || profile?.username || "User"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Manage your personal credentials, upload a profile photo, and
              secure your access.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/60 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Personal Information
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Update your account details and profile image.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.username || ""}
                    className="w-full bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Role
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>{profile?.roles.join(", ") || "Staff"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Upload Profile Picture
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer shadow-2xs"
                />
              </div>
            </div>

            {/* Avatar preview card */}
            <div className="w-full lg:w-72 flex flex-col items-center justify-center p-6 bg-slate-50/80 border border-slate-200/80 rounded-3xl shrink-0 self-center lg:self-start">
              <div className="w-28 h-28 rounded-full bg-linear-to-br from-slate-900 to-slate-800 text-amber-300 font-black text-2xl flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profile?.fullName || profile?.username || "A")
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <p className="text-xs font-extrabold text-slate-800 mt-4 truncate max-w-full">
                {profile?.fullName || profile?.username}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {profile?.roles.join(", ") || "Staff Member"}
              </p>
            </div>
          </div>

          <div
            className={`grid transition-all duration-300 ease-in-out overflow-hidden border-slate-100 ${
              hasProfileChanges
                ? "grid-rows-[1fr] opacity-100 pt-4 border-t"
                : "grid-rows-[0fr] opacity-0 pt-0 border-t-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={updatingProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>Discard Changes</span>
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{updatingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Password Reset Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Security &amp; Password
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Ensure your account is protected with a secure password.
              </p>
            </div>
          </div>

          {!showPasswordSection && (
            <button
              type="button"
              onClick={() => setShowPasswordSection(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Change Password</span>
            </button>
          )}
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
            showPasswordSection
              ? "grid-rows-[1fr] opacity-100 mt-4"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <form onSubmit={handleResetPassword} className="space-y-5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    New Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:bg-white shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordData({ newPassword: "", confirmPassword: "" });
                  }}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] text-slate-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
