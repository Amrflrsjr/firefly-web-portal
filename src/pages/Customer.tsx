import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import type {
  Customer,
  CreateCustomerDto,
  CustomerContact,
} from "../types/customer";
import { Plus, Search, AlertCircle } from "lucide-react";
import axios from "axios";

import { CustomerTable } from "../components/customers/CustomerTable";
import { CustomerDetailsModal } from "../components/customers/CustomerDetailsModal";
import { CreateCustomerModal } from "../components/customers/CreateCustomerModal";
import { EditCustomerModal } from "../components/customers/EditCustomerModal";
import { AddContactModal } from "../components/customers/AddContactModal";
import { EditContactModal } from "../components/customers/EditContactModal";
import { ConfirmModal } from "../components/common/ConfirmModal";

export const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);

  // Confirm modal states
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);

  // Selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedContact, setSelectedContact] =
    useState<CustomerContact | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCustomers = async () => {
    try {
      const response = await api.get<Customer[]>("/customers");
      setCustomers(response.data);
      setApiError(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to connect to API";
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const response = await api.get<Customer[]>("/customers");
        if (isSubscribed) {
          setCustomers(response.data);
          setApiError(null);
        }
      } catch (err: unknown) {
        if (isSubscribed && axios.isAxiosError(err)) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch data";
          setApiError(msg);
          toast.error(msg);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const exactMatchCustomer = searchQuery
    ? customers.find(
        (c) =>
          c.customerId.toString() === searchQuery ||
          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : null;

  const activeCustomer = selectedCustomer || exactMatchCustomer;

  const handleCreateCustomer = async (dto: CreateCustomerDto) => {
    setSaving(true);
    setFormError("");
    try {
      await api.post("/customers", dto);
      toast.success("Customer created successfully!");
      setIsCreateOpen(false);
      await loadCustomers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to create customer";
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = async (data: {
    companyName: string;
    companyAddress: string;
    tin: string;
    notes: string;
  }) => {
    if (!selectedCustomer) return;
    setSaving(true);
    setFormError("");
    try {
      await api.put(`/customers/${selectedCustomer.customerId}`, data);
      toast.success("Customer updated successfully!");
      setIsEditOpen(false);
      setSelectedCustomer(null);
      await loadCustomers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update customer";
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async (contact: CustomerContact) => {
    if (!selectedCustomer) return;
    setSaving(true);
    setFormError("");
    try {
      await api.post(
        `/customers/${selectedCustomer.customerId}/contacts`,
        contact,
      );
      toast.success("Contact added successfully!");
      setIsAddContactOpen(false);
      setSelectedCustomer(null);
      await loadCustomers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to add contact";
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditContact = async (updatedContact: CustomerContact) => {
    if (!selectedCustomer || !updatedContact.contactId) return;
    setSaving(true);
    setFormError("");
    try {
      await api.put(
        `/customers/${selectedCustomer.customerId}/contacts/${updatedContact.contactId}`,
        updatedContact,
      );
      toast.success("Contact updated successfully!");
      setIsEditContactOpen(false);
      setSelectedContact(null);
      await loadCustomers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message || "Failed to update contact";
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteContact = async () => {
    if (!selectedCustomer || !contactToDelete) return;
    setSaving(true);
    try {
      await api.delete(
        `/customers/${selectedCustomer.customerId}/contacts/${contactToDelete}`,
      );
      toast.success("Contact deleted successfully!");
      await loadCustomers();
      setSelectedCustomer(null);
      setContactToDelete(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Failed to delete contact";
        toast.error(msg);
      } else {
        toast.error("Failed to delete contact");
      }
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setSaving(true);
    try {
      await api.delete(`/customers/${customerToDelete}`);
      toast.success("Customer deleted successfully!");
      setSelectedCustomer(null);
      setCustomerToDelete(null);
      await loadCustomers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to delete customer");
      } else {
        toast.error("Failed to delete customer");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ search: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.customerId.toString() === searchQuery ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tin && c.tin.includes(searchQuery)),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500">
            Manage client companies and primary contacts
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[#FFCB62] hover:bg-[#F9B53F] text-slate-900 font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
          <button
            onClick={loadCustomers}
            className="text-xs font-bold bg-red-100 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, TIN..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CustomerTable
          loading={loading}
          customers={filteredCustomers}
          onView={(cust) => setSelectedCustomer(cust)}
        />
      </div>

      {activeCustomer &&
        !isEditOpen &&
        !isAddContactOpen &&
        !isEditContactOpen && (
          <CustomerDetailsModal
            customer={activeCustomer}
            onClose={() => {
              setSelectedCustomer(null);
              if (searchQuery) setSearchParams({}, { replace: true });
            }}
            onEditCustomer={() => {
              setFormError("");
              setIsEditOpen(true);
            }}
            onAddContact={() => {
              setFormError("");
              setIsAddContactOpen(true);
            }}
            onEditContact={(contact) => {
              setSelectedContact(contact);
              setFormError("");
              setIsEditContactOpen(true);
            }}
            onDeleteContact={(contactId) =>
              setContactToDelete(contactId ?? null)
            }
            onDeleteCustomer={(customerId) => setCustomerToDelete(customerId)}
          />
        )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={customerToDelete !== null}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This will soft-delete the record and associated active contacts."
        confirmText="Yes, Delete"
        isDanger={true}
        loading={saving}
        onConfirm={executeDeleteCustomer}
        onClose={() => setCustomerToDelete(null)}
      />

      <ConfirmModal
        isOpen={contactToDelete !== null}
        title="Delete Contact"
        message="Are you sure you want to delete this contact?"
        confirmText="Yes, Delete"
        isDanger={true}
        loading={saving}
        onConfirm={executeDeleteContact}
        onClose={() => setContactToDelete(null)}
      />

      {isCreateOpen && (
        <CreateCustomerModal
          saving={saving}
          error={formError}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      )}

      {isEditOpen && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          saving={saving}
          error={formError}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditCustomer}
        />
      )}

      {isAddContactOpen && selectedCustomer && (
        <AddContactModal
          companyName={selectedCustomer.companyName}
          saving={saving}
          error={formError}
          onClose={() => setIsAddContactOpen(false)}
          onSubmit={handleAddContact}
        />
      )}

      {isEditContactOpen && selectedContact && selectedCustomer && (
        <EditContactModal
          contact={selectedContact}
          companyName={selectedCustomer.companyName}
          saving={saving}
          error={formError}
          onClose={() => setIsEditContactOpen(false)}
          onSubmit={handleEditContact}
        />
      )}
    </div>
  );
};
