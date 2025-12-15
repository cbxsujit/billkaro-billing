export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  email?: string;
  address: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customer: CustomerDetails;
  items: InvoiceItem[];
}

export interface Product {
  id: string;
  name: string;
  rate: number;
  gstRate: number;
}

export interface SalesRecord {
  id: string;
  date: string;
  invoiceNumber: string;
  customerName: string;
  mobile: string;
  email?: string;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export interface EmailConfig {
  to: string;
  invoiceNumber: string;
  pdfBase64: string;
  customerName: string;
}

export interface WhatsAppConfig {
  apiUrl: string;
  mobile: string;
  message: string;
  pdfBase64: string;
  filename: string;
}

export interface AppBackup {
  version: string;
  timestamp: string;
  products: Product[];
  salesHistory: SalesRecord[];
  settings: {
    sheetUrl: string;
    whatsappUrl: string;
  };
}

export const GST_RATES = [0, 5, 12, 18, 28];