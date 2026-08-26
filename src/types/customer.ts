export interface CustomerContact {
  contactId?: number;
  customerId?: number;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  isActive?: boolean;
}

export interface Customer {
  customerId: number;
  customerType: "Business" | "Individual";
  companyName: string;
  companyAddress: string;
  tin: string;
  notes: string;
  createdAt: string;
  contacts: CustomerContact[];
}

export interface CreateCustomerDto {
  customerType: "Business" | "Individual";
  companyName: string;
  companyAddress: string;
  tin: string;
  notes: string;
  initialContacts: CustomerContact[];
}
