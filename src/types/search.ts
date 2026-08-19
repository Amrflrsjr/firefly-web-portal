export interface SearchItemDto {
  id: number;
  title: string;
  subtitle: string;
  type: string;
  url: string;
}

export interface GlobalSearchResponseDto {
  customers: SearchItemDto[];
  quotations: SearchItemDto[];
  invoices: SearchItemDto[];
}
