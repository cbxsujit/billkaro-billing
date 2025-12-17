import React, { useState, useEffect, useCallback } from 'react';
import { FileDown, RotateCcw, MessageCircle } from 'lucide-react';
import { CustomerForm } from './CustomerForm';
import { ItemEntry } from './ItemEntry';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { BillSummary } from './BillSummary';
import { CustomerDetails, InvoiceItem, InvoiceData, Product, SalesRecord, EmailConfig, WhatsAppConfig } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { sendToGoogleSheet } from '../utils/googleSheetSync';

const STORAGE_KEY = 'billkaro_draft_v1';
const PRODUCT_STORAGE_KEY = 'billkaro_products_v1';
const SALES_HISTORY_KEY = 'billkaro_sales_history_v1';
const GSHEET_URL_KEY = 'billkaro_gsheet_url_v1';
const WHATSAPP_API_KEY = 'billkaro_whatsapp_api_v1';

export const BillingCounter: React.FC = () => {
  // State initialization
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    mobile: '',
    email: '',
    address: ''
  });
  
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-001');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    // Load Draft
    const savedData = window.localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.customer) setCustomer(parsed.customer);
        if (parsed.items) setItems(parsed.items);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    } else {
        // Generate a random invoice number if new
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNumber(`INV-${randomNum}`);
    }

    // Load Products
    const savedProducts = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (savedProducts) {
        try {
            setAvailableProducts(JSON.parse(savedProducts));
        } catch (e) {
            console.error("Failed to parse products", e);
        }
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    const dataToSave = {
      customer,
      items,
      invoiceNumber
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [customer, items, invoiceNumber]);

  const handleCustomerChange = (field: keyof CustomerDetails, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (newItem: InvoiceItem) => {
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to clear the current bill?')) {
        setItems([]);
        setCustomer({ name: '', mobile: '', email: '', address: '' });
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNumber(`INV-${randomNum}`);
        window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleWhatsAppShare = () => {
    if (!customer.mobile) {
        alert("Please enter a mobile number first.");
        return;
    }
    
    let totalAmt = 0;
    items.forEach(i => totalAmt += (i.rate * i.quantity) + ((i.rate * i.quantity * i.gstRate)/100));
    
    const message = `Dear ${customer.name || 'Customer'},%0A%0AHere is your Invoice ${invoiceNumber} for Rs. ${Math.round(totalAmt)}.%0AThank you for shopping with us!%0A%0A- BillKaro Team`;
    
    // Open WhatsApp Web/App
    window.open(`https://wa.me/91${customer.mobile}?text=${message}`, '_blank');
  };

  const handleGeneratePDF = async () => {
      if (items.length === 0) {
          alert("Please add at least one item to generate an invoice.");
          return;
      }
      
      setIsProcessing(true);

      const invoiceData: InvoiceData = {
          invoiceNumber,
          date: invoiceDate,
          customer,
          items
      };

      // 1. Generate PDF and get Base64
      const pdfBase64 = generateInvoicePDF(invoiceData);

      // 2. Calculate Totals for History
      let taxableAmount = 0;
      let gstAmount = 0;
      items.forEach(item => {
          const taxable = item.quantity * item.rate;
          const gst = (taxable * item.gstRate) / 100;
          taxableAmount += taxable;
          gstAmount += gst;
      });
      const grandTotal = taxableAmount + gstAmount;

      // 3. Create Sales Record
      const newRecord: SalesRecord = {
          id: Date.now().toString(),
          date: invoiceDate,
          invoiceNumber,
          customerName: customer.name || 'Walk-in Customer',
          mobile: customer.mobile || '-',
          email: customer.email || '-',
          taxableAmount,
          gstAmount,
          grandTotal
      };

      // 4. Save to History
      try {
          const existingHistory = JSON.parse(window.localStorage.getItem(SALES_HISTORY_KEY) || '[]');
          const isDuplicate = existingHistory.some((r: SalesRecord) => r.invoiceNumber === invoiceNumber);
          
          if (!isDuplicate) {
             const updatedHistory = [newRecord, ...existingHistory];
             window.localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(updatedHistory));
             
             // 5. Cloud Sync Logic (Sheet, Email, WhatsApp API)
             const sheetUrl = window.localStorage.getItem(GSHEET_URL_KEY);
             const whatsappApiUrl = window.localStorage.getItem(WHATSAPP_API_KEY);
             
             if (sheetUrl) {
                 // Prepare Email Config
                 let emailConfig: EmailConfig | undefined;
                 if (customer.email && customer.email.includes('@')) {
                    emailConfig = {
                        to: customer.email,
                        invoiceNumber,
                        customerName: customer.name || 'Customer',
                        pdfBase64
                    };
                 }

                 // Prepare WhatsApp API Config (If 3rd party URL is present)
                 let whatsappConfig: WhatsAppConfig | undefined;
                 if (whatsappApiUrl && customer.mobile) {
                     const msg = `Dear ${customer.name || 'Customer'}, Here is your invoice ${invoiceNumber} for Rs. ${Math.round(grandTotal)}. Thanks!`;
                     whatsappConfig = {
                         apiUrl: whatsappApiUrl,
                         mobile: customer.mobile,
                         message: msg,
                         pdfBase64,
                         filename: `Invoice_${invoiceNumber}.pdf`
                     };
                 }

                 sendToGoogleSheet(sheetUrl, [newRecord], emailConfig, whatsappConfig);
                 console.log("Cloud sync initiated.");
             }
          }
      } catch (e) {
          console.error("Failed to save sales history", e);
      }
      
      setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Input Forms */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Customer Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700 flex items-center">
              Customer Details
            </h2>
            <div className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-1 rounded">
                Draft
            </div>
          </div>
          <div className="p-6">
            <CustomerForm 
              customer={customer} 
              onChange={handleCustomerChange} 
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
            />
          </div>
        </div>

        {/* Item Entry Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-700">Add Items</h2>
            </div>
            <div className="p-6">
                <ItemEntry onAddItem={handleAddItem} products={availableProducts} />
            </div>
        </div>

        {/* Items Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-700">Items List</h2>
                <span className="text-xs text-slate-500">{items.length} items added</span>
            </div>
            <InvoiceItemsTable items={items} onRemoveItem={handleRemoveItem} />
        </div>
      </div>

      {/* Right Column: Summary & Actions */}
      <div className="lg:col-span-1 space-y-6">
        <BillSummary items={items} />
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-3">
            <button 
                onClick={handleGeneratePDF}
                disabled={isProcessing}
                className="w-full py-4 px-4 bg-orange-500 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-orange-600 hover:shadow-orange-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                   <span>Processing...</span>
                ) : (
                   <>
                     <FileDown className="w-6 h-6" />
                     <span>Generate PDF & Save</span>
                   </>
                )}
            </button>
            
            {/* WhatsApp Share Button */}
            <button 
                onClick={handleWhatsAppShare}
                className="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition-all flex items-center justify-center space-x-2"
            >
                <MessageCircle className="w-5 h-5" />
                <span>Share on WhatsApp</span>
            </button>
            
            {customer.email && (
                <div className="text-center text-xs text-slate-400">
                   * Email sent automatically via cloud
                </div>
            )}

             <button 
                onClick={handleReset}
                disabled={isProcessing}
                className="w-full py-3 px-4 border-2 border-slate-200 text-slate-500 font-semibold rounded-lg hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center space-x-2"
            >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Form</span>
            </button>
        </div>
      </div>
    </div>
  );
};