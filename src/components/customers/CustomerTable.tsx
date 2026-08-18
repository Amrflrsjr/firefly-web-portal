import React from "react";
import type { Customer } from "../../types/customer";
import { Building2 } from "lucide-react";

interface CustomerTableProps {
  loading: boolean;
  customers: Customer[];
  onView: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  loading,
  customers,
  onView,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No customers found. Click <b>"+ Add Customer"</b> above to create one.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
          <th className="p-4">Company Name</th>
          <th className="p-4">TIN</th>
          <th className="p-4">Primary Contact</th>
          <th className="p-4">Address</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {customers.map((customer) => {
          const primaryContact =
            customer.contacts?.find((c) => c.isPrimary) ||
            customer.contacts?.[0];

          return (
            <tr
              key={customer.customerId}
              onClick={() => onView(customer)}
              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              <td className="p-4 font-semibold text-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFCB62]/20 text-[#F9B53F] font-bold flex items-center justify-center text-xs group-hover:bg-[#FFCB62]/40 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  {customer.companyName}
                </div>
              </td>
              <td className="p-4 text-slate-600 font-mono text-xs">
                {customer.tin || "N/A"}
              </td>
              <td className="p-4">
                {primaryContact ? (
                  <div>
                    <div className="font-medium text-slate-800">
                      {primaryContact.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {primaryContact.email}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">No Contact</span>
                )}
              </td>
              <td className="p-4 text-slate-600 max-w-xs truncate">
                {customer.companyAddress || "N/A"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
