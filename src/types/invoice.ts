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
  invoiceId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  createdAt: string;
}

export interface InvoiceResponseDto {
  invoiceId: number;
  invoiceNumber: string;
  quotationId: number;
  quotationNumber: string;
  customerId: number;
  companyName: string;
  contactNameSnapshot: string;
  contactEmailSnapshot: string;
  issueDate: string;
  dueDate: string;
  vatType: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  status: string;
  notes: string;
  createdAt: string;
  items?: InvoiceItemDto[];
  payments: PaymentDto[];
}

export interface ConvertQuotationToInvoiceDto {
  quotationId: number;
  dueDate: string;
  notes: string;
}

export interface RecordPaymentDto {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}

export interface UpdateInvoiceStatusDto {
  status: string;
}

export interface EmailPreviewDto {
  documentId?: number;
  documentNumber?: string;
  recipients?: string[];
  subject?: string;
  body?: string;
  customerName?: string;
  contactName?: string;
  totalAmount?: number;
  attachmentFileName?: string;
}

export interface SendEmailRequestDto {
  recipientEmails: string[];
  subject: string;
  body: string;
}
