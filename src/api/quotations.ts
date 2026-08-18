import api from "./axios";
import type {
  QuotationResponseDto,
  CreateQuotationDto,
  EmailPreviewDto,
} from "../types/quotation";

export const quotationApi = {
  // GET /api/Quotations
  getAll: async () => {
    const res = await api.get<QuotationResponseDto[]>("/quotations");
    return res.data;
  },

  // GET /api/Quotations/{id}
  getById: async (id: number) => {
    const res = await api.get<QuotationResponseDto>(`/quotations/${id}`);
    return res.data;
  },

  // POST /api/Quotations
  create: async (dto: CreateQuotationDto) => {
    const res = await api.post<QuotationResponseDto>("/quotations", dto);
    return res.data;
  },

  // PATCH /api/Quotations/{id}/status
  updateStatus: async (id: number, status: string) => {
    const res = await api.patch(`/quotations/${id}/status`, { status });
    return res.data;
  },

  // GET /api/Quotations/{id}/pdf
  downloadPdf: async (id: number, quotationNumber: string) => {
    const res = await api.get(`/quotations/${id}/pdf`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${quotationNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // GET /api/Quotations/{id}/email-preview
  getEmailPreview: async (id: number) => {
    const res = await api.get<EmailPreviewDto>(
      `/quotations/${id}/email-preview`,
    );
    return res.data;
  },

  // POST /api/Quotations/{id}/send-email
  sendEmail: async (
    id: number,
    recipientEmails: string[],
    customBody?: string,
    customSubject?: string,
  ) => {
    const res = await api.post(`/quotations/${id}/send-email`, {
      recipientEmails,
      subject: customSubject,
      body: customBody,
    });
    return res.data;
  },
};
