import React, { useEffect, useState } from "react";
import api from "../api/axios";
import axios from "axios";
import {
  UserPlus,
  Shield,
  Key,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export const Users: React.FC = () => {
  const { username: currentUsername } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<UserResponse | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await api.put(`/users/${u.id}`, {
        fullName: editForm.fullName,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
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

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await api.delete(`/users/${deactivateId}`);
      toast.success("User deactivated successfully");
      setDeactivateId(null);
      fetchUsers(true);
    } catch {
      toast.error("Failed to deactivate user");
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
      return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    }
    return ascending ? (
      <ArrowUp className="w-3 h-3 text-[#F9B53F]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#F9B53F]" />
    );
  };

  // Filter out the currently logged-in admin from the users list
  const filteredUsers = users.filter(
    (u) => u.username.toLowerCase() !== (currentUsername || "").toLowerCase(),
  );

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

  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-0 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-72 h-72 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Administration Command Center</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {today}
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              User Management
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Manage team portal accounts, access levels, roles, and security
              credentials with real-time sync.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {refreshing && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-linear-to-r from-[#FFCB62] to-[#F9B53F] hover:from-[#F9B53F] hover:to-[#F4D158] text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-100/60 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm font-medium flex flex-col items-center justify-center gap-3 bg-white">
            <div className="w-6 h-6 border-2 border-[#F9B53F] border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-slate-600 text-sm">
              Loading users directory...
            </span>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            No other users found. Click{" "}
            <b className="text-slate-700">"Add New User"</b> above to create
            one.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    <th
                      onClick={() => handleSort("fullname")}
                      className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        User
                        {renderSortIcon("fullname")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("role")}
                      className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Role
                        {renderSortIcon("role")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="py-3.5 px-6 cursor-pointer hover:text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        {renderSortIcon("status")}
                      </div>
                    </th>
                    <th className="py-3.5 px-6">Created Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {currentUsers.map((u) => {
                    const isEditing = editingUserId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isEditing
                            ? "bg-amber-50/70 ring-1 ring-inset ring-amber-300/60"
                            : "hover:bg-[#FCFDFF] group"
                        }`}
                      >
                        <td className="py-4 px-6 text-slate-800">
                          {isEditing ? (
                            <div
                              className="space-y-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Edit Full Name
                              </span>
                              <input
                                type="text"
                                value={editForm.fullName}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    fullName: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-amber-400/20 shadow-2xs"
                              />
                              <span className="text-[10px] font-bold text-slate-400 uppercase block pt-1">
                                Email Address
                              </span>
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-amber-400/20 shadow-2xs"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-200/60 group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                                  {u.fullName}
                                </p>
                                <p className="text-xs text-slate-400 font-normal">
                                  @{u.username} • {u.email}
                                </p>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {isEditing ? (
                            <div
                              className="space-y-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Select Role
                              </span>
                              <select
                                value={editForm.role}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    role: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F9B53F] focus:ring-2 focus:ring-amber-400/20 shadow-2xs"
                              >
                                <option value="Admin">Admin</option>
                                <option value="Staff">Staff</option>
                              </select>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                                u.roles.includes("Admin")
                                  ? "bg-purple-50 text-purple-700 border-purple-200/80"
                                  : "bg-slate-100 text-slate-700 border-slate-200/80"
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {u.roles.join(", ") || "Staff"}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {isEditing ? (
                            <div
                              className="space-y-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Status
                              </span>
                              <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                  type="checkbox"
                                  checked={editForm.isActive}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      isActive: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                                />
                                <span className="text-xs font-bold text-slate-700">
                                  {editForm.isActive ? "Active" : "Inactive"}
                                </span>
                              </label>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                                u.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                  : "bg-rose-50 text-rose-700 border-rose-200/80"
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

                        <td className="py-4 px-6 text-slate-500 text-xs font-normal">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-6 text-right">
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
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all active:scale-95 cursor-pointer border border-emerald-200/60 shadow-2xs"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  title="Cancel"
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95 cursor-pointer border border-slate-200/60 shadow-2xs"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleStartEdit(e, u)}
                                  title="Quick Edit User"
                                  className="p-2 bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200/60 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResetPasswordUser(u)}
                                  title="Reset Password"
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeactivateId(u.id)}
                                  title="Deactivate User"
                                  className="p-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200/60 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4" />
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

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 bg-white">
                <p className="text-xs text-slate-500 font-medium">
                  Showing{" "}
                  <span className="font-bold text-slate-700">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-700">
                    {Math.min(startIndex + pageSize, sortedUsers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-700">
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
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deactivateId}
        title="Deactivate User Account"
        message="Are you sure you want to deactivate this user? They will no longer be able to log in to the portal."
        confirmText="Yes, Deactivate"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateId(null)}
      />
    </div>
  );
};
