import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import {
  UserPlus,
  Shield,
  Key,
  Trash2,
  Edit,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { UserModal } from "../components/common/UserModal";
import type { UserModalSubmitData } from "../components/common/UserModal";
import { ConfirmModal } from "../components/common/ConfirmModal";

interface UserResponse {
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

export const Users: React.FC = () => {
  const { username: currentUsername } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<UserResponse | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Pagination & Sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState<string>("fullname");
  const [ascending, setAscending] = useState<boolean>(true);

  // Inline editing states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "Staff",
    isActive: true,
  });

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await api.get("/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUsersData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/users");
        if (isMounted) {
          setUsers(res.data);
        }
      } catch {
        if (isMounted) {
          toast.error("Failed to load users");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadUsersData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateQueryParams = (updates: Record<string, string>) => {
    const params: Record<string, string> = {
      search: searchQuery,
      role: roleFilter,
      status: statusFilter,
      ...updates,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key] || params[key] === "all") delete params[key];
    });
    setSearchParams(params, { replace: true });
    setCurrentPage(1);
  };

  const handleCreateUser = async (data: UserModalSubmitData) => {
    setSubmitting(true);
    try {
      await api.post("/users", data);
      toast.success("User created successfully");
      setShowCreateModal(false);
      fetchUsers(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to create user");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, u: UserResponse) => {
    e.stopPropagation();
    setEditingUserId(u.id);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      role: u.roles[0] || "Staff",
      isActive: u.isActive,
    });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUserId(null);
  };

  const handleSaveEdit = async (e: React.MouseEvent, u: UserResponse) => {
    e.stopPropagation();
    if (!editForm.fullName.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fullName", editForm.fullName);
      formData.append("email", editForm.email);
      formData.append("role", editForm.role);
      formData.append("isActive", String(editForm.isActive));

      await api.put(`/users/${u.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("User updated successfully");
      setEditingUserId(null);
      fetchUsers(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to update user");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (data: UserModalSubmitData) => {
    if (!resetPasswordUser || !data.newPassword) return;
    if (data.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/users/${resetPasswordUser.id}/reset-password`, {
        newPassword: data.newPassword,
      });
      toast.success("Password reset successfully");
      setResetPasswordUser(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to reset password");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await api.delete(`/users/${deleteUserId}`);
      toast.success("User permanently deleted successfully");
      setDeleteUserId(null);
      fetchUsers(true);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setAscending(!ascending);
    } else {
      setSortBy(field);
      setAscending(true);
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      );
    }
    return ascending ? (
      <ArrowUp className="w-3 h-3 text-slate-700 dark:text-slate-300" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-700 dark:text-slate-300" />
    );
  };

  // Filter out current admin user and apply search / filters
  const filteredUsers = users.filter((u) => {
    const isNotSelf =
      u.username.toLowerCase() !== (currentUsername || "").toLowerCase();
    if (!isNotSelf) return false;

    const matchesSearch =
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const userRole = u.roles[0] || "Staff";
    const matchesRole =
      roleFilter === "all" ||
      userRole.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = "";
    let valB = "";
    if (sortBy === "fullname") {
      valA = a.fullName.toLowerCase();
      valB = b.fullName.toLowerCase();
    } else if (sortBy === "username") {
      valA = a.username.toLowerCase();
      valB = b.username.toLowerCase();
    } else if (sortBy === "role") {
      valA = (a.roles[0] || "").toLowerCase();
      valB = (b.roles[0] || "").toLowerCase();
    } else if (sortBy === "status") {
      valA = a.isActive ? "active" : "inactive";
      valB = b.isActive ? "active" : "inactive";
    }

    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    roleFilter !== "all" || statusFilter !== "all" || searchQuery !== "";

  return (
    <div className="space-y-6 pb-10 px-4 sm:px-0">
      {/* Flat Page Header matching Quotations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Manage team portal accounts, access levels, roles, and security
            credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {refreshing && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Syncing
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar matching Quotations */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, username, email..."
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all shadow-2xs"
              />
            </div>

            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={`lg:hidden flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMobileFiltersOpen || hasActiveFilters
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div
            className={`flex-wrap items-center gap-2.5 ${
              isMobileFiltersOpen ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => updateQueryParams({ role: e.target.value })}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => updateQueryParams({ status: e.target.value })}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchParams({}, { replace: true });
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table Card matching Quotations */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
            <div className="w-7 h-7 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Loading users directory...
            </span>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No users matched your search criteria.
              </p>
              <p className="text-slate-400 text-xs">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters or search query."
                  : 'There are currently no other user accounts. Click "+ Add New User" above to create one.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setSearchParams({}, { replace: true })}
                className="mt-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                    <th
                      onClick={() => handleSort("fullname")}
                      className="py-3 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        User Profile
                        {renderSortIcon("fullname")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("role")}
                      className="py-3 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        Role
                        {renderSortIcon("role")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="py-3 px-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        {renderSortIcon("status")}
                      </div>
                    </th>
                    <th className="py-3 px-5 whitespace-nowrap">
                      Created Date
                    </th>
                    <th className="py-3 px-5 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {currentUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const resolvedAvatarUrl = getImageUrl(u.profilePictureUrl);

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors group ${
                          isEditing
                            ? "bg-amber-50/70 dark:bg-amber-950/30"
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
                        }`}
                      >
                        <td className="py-3.5 px-5 text-slate-800 dark:text-slate-100">
                          {isEditing ? (
                            <div
                              className="space-y-1.5 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editForm.fullName}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    fullName: e.target.value,
                                  })
                                }
                                placeholder="Full Name"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="Email Address"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 shadow-2xs"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs overflow-hidden">
                                {resolvedAvatarUrl && !failedImages[u.id] ? (
                                  <img
                                    src={resolvedAvatarUrl}
                                    alt={u.fullName}
                                    className="w-full h-full object-cover"
                                    onError={() =>
                                      setFailedImages((prev) => ({
                                        ...prev,
                                        [u.id]: true,
                                      }))
                                    }
                                  />
                                ) : (
                                  u.fullName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {u.fullName}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                  @{u.username} • {u.email}
                                </p>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          {isEditing ? (
                            <select
                              value={editForm.role}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  role: e.target.value,
                                })
                              }
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 shadow-2xs cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Staff">Staff</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border shadow-2xs ${
                                u.roles.includes("Admin")
                                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              {u.roles.join(", ") || "Staff"}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          {isEditing ? (
                            <label
                              className="flex items-center gap-1.5 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={editForm.isActive}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    isActive: e.target.checked,
                                  })
                                }
                                className="w-3.5 h-3.5 text-slate-900 rounded border-slate-300 dark:border-slate-700 focus:ring-slate-500 bg-white dark:bg-slate-800"
                              />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {editForm.isActive ? "Active" : "Inactive"}
                              </span>
                            </label>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border shadow-2xs ${
                                u.isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.isActive ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 font-normal">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleSaveEdit(e, u)}
                                  title="Save Changes"
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-900/60 shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  title="Cancel"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleStartEdit(e, u)}
                                  title="Quick Edit User"
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResetPasswordUser(u)}
                                  title="Reset Password"
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteUserId(u.id)}
                                  title="Permanently Delete User"
                                  className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching QuotationTable style */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {Math.min(startIndex + pageSize, sortedUsers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {sortedUsers.length}
                  </span>{" "}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      <UserModal
        isOpen={showCreateModal}
        title="Create New User Account"
        type="create"
        submitting={submitting}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
      />

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <UserModal
          isOpen={!!resetPasswordUser}
          title={`Reset Password for ${resetPasswordUser.fullName}`}
          type="reset-password"
          submitting={submitting}
          onClose={() => setResetPasswordUser(null)}
          onSubmit={handleResetPassword}
        />
      )}

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteUserId}
        title="Permanently Delete User Account"
        message="Are you sure you want to permanently delete this user? This action cannot be undone and will remove all associated database records and avatars."
        confirmText="Yes, Permanently Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteUserId(null)}
      />
    </div>
  );
};
