export interface InvoiceItemDto {
  invoiceItemId: number;
  productName: string;
  variantDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PaymentDto {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  paymentDate: string;
}

export interface InvoiceResponseDto {
  invoiceId: number;
  invoiceNumber: string;
  quotationId: number;
  quotationNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string; // e.g. "Unpaid", "Partially Paid", "Paid"
  createdAt: string;
  items: InvoiceItemDto[];
  payments: PaymentDto[];
}

export interface ConvertQuotationToInvoiceDto {
  quotationId: number;
  dueDate?: string;
  notes?: string;
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}
