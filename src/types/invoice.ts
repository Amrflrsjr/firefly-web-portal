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
  invoiceId: number; // Added to match C# PaymentResponseDto
  amountPaid: number; // Changed from 'amount'
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  createdAt: string; // Added to match C#
}

export interface InvoiceResponseDto {
  invoiceId: number;
  invoiceNumber: string;
  quotationId: number;
  quotationNumber: string;
  customerId: number;
  companyName: string; // Changed from 'customerName' to match C#
  contactNameSnapshot: string; // Added to match C#
  contactEmailSnapshot: string; // Added to match C#
  issueDate: string; // Added to match C#
  dueDate: string; // Added to match C#
  vatType: string; // Added to match C#
  subtotal: number; // Added to match C#
  vatAmount: number; // Added to match C#
  totalAmount: number;
  totalPaid: number; // Changed from 'paidAmount' to match C#
  balanceDue: number;
  status: string;
  notes: string; // Added to match C#
  createdAt: string;
  items?: InvoiceItemDto[]; // Made optional in case it isn't always returned
  payments: PaymentDto[];
}

export interface ConvertQuotationToInvoiceDto {
  quotationId: number;
  dueDate: string; // Removed '?' to ensure it is sent
  notes: string; // Removed '?' to ensure it is sent
}

export interface RecordPaymentDto {
  amountPaid: number; // Changed from 'amount'
  paymentDate: string; // Added missing property
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
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
