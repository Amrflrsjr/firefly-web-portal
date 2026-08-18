export interface CustomerContact {
  contactId?: number;
  customerId?: number;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface Customer {
  customerId: number;
  companyName: string;
  companyAddress: string;
  tin: string;
  notes: string;
  createdAt: string;
  contacts: CustomerContact[];
}

export interface CreateCustomerDto {
  companyName: string;
  companyAddress: string;
  tin: string;
  notes: string;
  contacts: CustomerContact[];
}
