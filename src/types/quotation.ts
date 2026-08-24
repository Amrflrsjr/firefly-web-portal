export interface QuotationItemDto {
  productVariantId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateQuotationDto {
  customerId: number;
  contactId?: number | null;
  contactNameSnapshot: string;
  contactEmailSnapshot: string;
  noteToCustomer?: string | null;
  vatType: string | null;
  items: QuotationItemDto[];
  validUntil: string;
}

export interface QuotationItemResponseDto {
  quotationItemId: number;
  productVariantId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  productName?: string | null;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
}

export interface QuotationResponseDto {
  quotationId: number;
  quotationNumber: string;
  companyId: number;
  companyName: string;
  contactNameSnapshot: string;
  contactEmailSnapshot: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: QuotationItemResponseDto[];
}

export interface EmailPreviewDto {
  documentId?: number;
  quotationId?: number;
  documentNumber?: string;
  quotationNumber?: string;
  recipients?: string[];
  recipientEmails?: string[];
  subject?: string;
  body?: string;
  customerName?: string;
  contactName?: string;
  totalAmount?: number;
  attachmentFileName?: string;
}
