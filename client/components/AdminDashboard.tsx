import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Trash2, ArrowLeft, History, Download, TrendingUp, CloudCog, Copy, Check, CloudUpload, AlertTriangle, MessageCircle, Database, Upload, FileJson, RefreshCw } from 'lucide-react';
import { Product, GST_RATES, SalesRecord, AppBackup } from '../types';
import { GS_SCRIPT_CODE, sendToGoogleSheet } from '../utils/googleSheetSync';

const PRODUCT_STORAGE_KEY = 'billkaro_products_v1';
const SALES_HISTORY_KEY = 'billkaro_sales_history_v1';
const GSHEET_URL_KEY = 'billkaro_gsheet_url_v1';
const WHATSAPP_API_KEY = 'billkaro_whatsapp_api_v1';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'sales' | 'integrations' | 'data'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  
  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState<number | ''>('');
  const [newGst, setNewGst] = useState<number>(18);

  // Integration State
  const [sheetUrl, setSheetUrl] = useState('');
  const [whatsappApiUrl, setWhatsappApiUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    // Products
    const savedProducts = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Failed to load products", e);
      }
    } else {
        const seedData: Product[] = [
            { id: '1', name: 'Consultation Fee', rate: 500, gstRate: 18 },
            { id: '2', name: 'Service Charge', rate: 1000, gstRate: 18 },
            { id: '3', name: 'Hardware Part A', rate: 2500, gstRate: 28 },
        ];
        setProducts(seedData);
        localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(seedData));
    }

    // Sales History
    const savedHistory = localStorage.getItem(SALES_HISTORY_KEY);
    if (savedHistory) {
        try {
            setSalesHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    // Configs
    const savedUrl = localStorage.getItem(GSHEET_URL_KEY);
    if (savedUrl) setSheetUrl(savedUrl);

    const savedWaUrl = localStorage.getItem(WHATSAPP_API_KEY);
    if (savedWaUrl) setWhatsappApiUrl(savedWaUrl);
  }, []);

  // Save products when changed
  useEffect(() => {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  // --- Handlers ---

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRate) return;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: newName,
      rate: Number(newRate),
      gstRate: newGst
    };

    setProducts([...products, newProduct]);
    setNewName('');
    setNewRate('');
    setNewGst(18);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (salesHistory.length === 0) {
        alert("No sales history to export.");
        return;
    }

    // Header
    const headers = ['Date', 'Invoice No', 'Customer', 'Mobile', 'Email', 'Taxable Value', 'GST', 'Grand Total'];
    
    // Rows
    const rows = salesHistory.map(record => [
        record.date,
        record.invoiceNumber,
        `"${record.customerName}"`,
        record.mobile,
        record.email || '-',
        record.taxableAmount.toFixed(2),
        record.gstAmount.toFixed(2),
        record.grandTotal.toFixed(2)
    ]);

    // Combine
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BillKaro_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveConfigs = () => {
      localStorage.setItem(GSHEET_URL_KEY, sheetUrl);
      localStorage.setItem(WHATSAPP_API_KEY, whatsappApiUrl);
      alert("Integration settings saved!");
  };

  const handleCopyCode = () => {
      navigator.clipboard.writeText(GS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
      if (!sheetUrl) {
          alert("Please configure the Google Sheet Integration first.");
          setActiveTab('integrations');
          return;
      }
      if (salesHistory.length === 0) {
          alert("No data to sync.");
          return;
      }

      setIsSyncing(true);
      const syncSuccess = await sendToGoogleSheet(sheetUrl, salesHistory);
      
      if (syncSuccess) {
          // Clear synced records from local storage
          localStorage.removeItem(SALES_HISTORY_KEY);
          setSalesHistory([]);
          
          setTimeout(() => {
              setIsSyncing(false);
              alert("Sync completed! Records sent to Google Sheets and removed from page.");
          }, 1000);
      } else {
          setIsSyncing(false);
          alert("Sync failed. Please try again.");
      }
  };

  // --- Data Management Handlers ---

  const handleBackup = () => {
    const backup: AppBackup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products,
      salesHistory,
      settings: {
        sheetUrl,
        whatsappUrl: whatsappApiUrl
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BillKaro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content) as AppBackup;
        
        // Basic validation
        if (!backup.products || !backup.salesHistory) {
          throw new Error("Invalid backup file format");
        }

        if (confirm(`Restore ${backup.products.length} products and ${backup.salesHistory.length} sales records? This will overwrite current data.`)) {
          localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(backup.products));
          localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(backup.salesHistory));
          
          if (backup.settings?.sheetUrl) localStorage.setItem(GSHEET_URL_KEY, backup.settings.sheetUrl);
          if (backup.settings?.whatsappUrl) localStorage.setItem(WHATSAPP_API_KEY, backup.settings.whatsappUrl);

          alert("Restore successful! App will reload.");
          window.location.reload();
        }
      } catch (err) {
        alert("Failed to restore: Invalid file format.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleHardReset = () => {
    const code = prompt("Type 'DELETE' to confirm wiping all data permanently:");
    if (code === 'DELETE') {
      localStorage.clear();
      window.location.reload();
    }
  };

  const totalRevenue = salesHistory.reduce((acc, curr) => acc + curr.grandTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
                <p className="text-slate-500 text-sm">Store Management System</p>
            </div>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
            {[
              { id: 'products', label: 'Product Master', icon: Package },
              { id: 'sales', label: 'Sales Register', icon: History },
              { id: 'integrations', label: 'Integrations', icon: CloudCog },
              { id: 'data', label: 'Data Management', icon: Database },
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id 
                      ? 'bg-teal-100 text-teal-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
              </button>
            ))}
        </div>
      </div>

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Product Form */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden sticky top-6">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-teal-600" />
                        <h3 className="font-semibold text-slate-700">Add New Product</h3>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Product Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="e.g. Web Design"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Base Rate (₹)</label>
                                    <input
                                        type="number"
                                        value={newRate}
                                        onChange={e => setNewRate(e.target.valueAsNumber)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">GST %</label>
                                    <select
                                        value={newGst}
                                        onChange={e => setNewGst(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                    >
                                        {GST_RATES.map(r => (
                                            <option key={r} value={r}>{r}%</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Add to Master
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Current Inventory</h3>
                        <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-medium">
                            {products.length} Products
                        </span>
                    </div>
                    
                    {products.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No products in master list.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Product Name</th>
                                        <th className="px-6 py-3 font-medium text-right">Base Rate</th>
                                        <th className="px-6 py-3 font-medium text-center">GST</th>
                                        <th className="px-6 py-3 font-medium text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">₹{product.rate.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                                                    {product.gstRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- SALES HISTORY TAB --- */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Card */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Total Revenue</span>
                    </div>
                    <div className="text-4xl font-bold">
                        ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded">
                        All time sales
                    </div>
                </div>

                {/* Export Card */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h3 className="font-semibold text-slate-800 mb-2">Data Actions</h3>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button 
                            onClick={handleExportCSV}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-colors text-sm"
                        >
                            <Download className="w-4 h-4" />
                            CSV Export
                        </button>
                         <button 
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <CloudUpload className="w-4 h-4" />
                            {isSyncing ? 'Syncing...' : 'Sync Cloud'}
                        </button>
                    </div>
                    <p className="text-slate-400 text-xs mt-3 text-center">
                        Sync Cloud requires Google Sheets config in Integrations.
                    </p>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Sales Register</h3>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-medium">
                        {salesHistory.length} Records
                    </span>
                </div>
                
                {salesHistory.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No sales history found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Invoice #</th>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium text-right">Taxable</th>
                                    <th className="px-6 py-3 font-medium text-right">GST</th>
                                    <th className="px-6 py-3 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesHistory.map((record) => (
                                    <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-slate-600">{record.date}</td>
                                        <td className="px-6 py-4 font-mono text-teal-700 text-xs">{record.invoiceNumber}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {record.customerName}
                                            <div className="text-xs text-slate-400">{record.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">₹{record.taxableAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">₹{record.gstAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">₹{record.grandTotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- INTEGRATIONS TAB --- */}
      {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                   <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                       <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                           <CloudCog className="w-5 h-5 text-teal-600" />
                           <h3 className="font-semibold text-slate-700">API Configuration</h3>
                       </div>
                       <div className="p-6 space-y-5">
                           
                           {/* Google Sheet Config */}
                           <div className="space-y-1">
                               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                   <FileJson className="w-4 h-4 text-green-600" />
                                   Google Apps Script Web App URL
                               </label>
                               <input
                                    type="text"
                                    value={sheetUrl}
                                    onChange={(e) => setSheetUrl(e.target.value)}
                                    placeholder="https://script.google.com/macros/s/..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm font-mono text-slate-600"
                               />
                               <p className="text-xs text-slate-400">Enables automatic data sync & email sending.</p>
                           </div>

                           {/* WhatsApp API Config */}
                           <div className="space-y-1">
                               <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                   <MessageCircle className="w-4 h-4 text-green-500" />
                                   WhatsApp 3rd Party API Endpoint
                               </label>
                               <input
                                    type="text"
                                    value={whatsappApiUrl}
                                    onChange={(e) => setWhatsappApiUrl(e.target.value)}
                                    placeholder="https://api.provider.com/send..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm font-mono text-slate-600"
                               />
                               <p className="text-xs text-slate-400">Optional: For automated PDF forwarding via 3rd party providers.</p>
                           </div>

                           <button 
                                onClick={handleSaveConfigs}
                                className="w-full bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
                           >
                               Save All Settings
                           </button>
                       </div>
                   </div>

                   <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                       <h4 className="font-semibold text-blue-800 mb-2">Feature Status</h4>
                       <ul className="text-sm text-blue-700 space-y-2">
                           <li className="flex items-center gap-2">
                               {sheetUrl ? <Check className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-orange-400" />}
                               Google Sheet Sync
                           </li>
                           <li className="flex items-center gap-2">
                               {sheetUrl ? <Check className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-orange-400" />}
                               Email Automation
                           </li>
                           <li className="flex items-center gap-2">
                               {whatsappApiUrl ? <Check className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 block rounded-full bg-slate-300" />}
                               WhatsApp Automation
                           </li>
                       </ul>
                   </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="font-semibold text-slate-700">Setup Instructions</h3>
                   </div>
                   <div className="p-6 space-y-4">
                       <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                           <div className="flex">
                               <div className="flex-shrink-0">
                                   <AlertTriangle className="h-5 w-5 text-amber-400" />
                               </div>
                               <div className="ml-3">
                                   <p className="text-sm text-amber-700">
                                       <strong>Code Updated:</strong> Includes Email & WhatsApp logic. Please redeploy.
                                   </p>
                               </div>
                           </div>
                       </div>

                       <ol className="text-sm text-slate-600 space-y-3 list-decimal list-inside marker:font-bold marker:text-teal-600">
                           <li>Open Google Sheet &gt; Extensions &gt; Apps Script.</li>
                           <li><strong>Replace all code</strong> with the block below.</li>
                           <li>Click <strong>Deploy &gt; Manage Deployments</strong>.</li>
                           <li>Edit current deployment &gt; Version: <strong>"New version"</strong>.</li>
                           <li>Click <strong>Deploy</strong>.</li>
                       </ol>

                       <div className="relative group">
                           <div className="absolute right-2 top-2">
                               <button 
                                    onClick={handleCopyCode}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors backdrop-blur-sm"
                                    title="Copy Code"
                               >
                                   {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                               </button>
                           </div>
                           <pre className="bg-slate-800 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                               {GS_SCRIPT_CODE}
                           </pre>
                       </div>
                   </div>
              </div>
          </div>
      )}

      {/* --- DATA MANAGEMENT TAB --- */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-slate-700">Backup & Restore</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="font-medium text-slate-800 mb-2">Export Data</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            Download a full backup of your products, sales history, and settings. Keep this file safe.
                        </p>
                        <button 
                            onClick={handleBackup}
                            className="w-full border border-slate-300 text-slate-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors font-medium"
                        >
                            <FileJson className="w-5 h-5" />
                            Download Backup JSON
                        </button>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    <div>
                        <h4 className="font-medium text-slate-800 mb-2">Import Data</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            Restore from a previously downloaded backup file. <strong className="text-orange-600">Warning: This overwrites current data.</strong>
                        </p>
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef}
                            onChange={handleRestoreFile}
                            className="hidden" 
                        />
                        <button 
                            onClick={handleRestoreClick}
                            className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors font-medium"
                        >
                            <Upload className="w-5 h-5" />
                            Upload & Restore
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">Danger Zone</h3>
                </div>
                <div className="p-6">
                    <h4 className="font-medium text-slate-800 mb-2">Hard Reset</h4>
                    <p className="text-sm text-slate-500 mb-4">
                        Wipe all data from this browser immediately. This action cannot be undone. Use this if you are handing over the device or want a fresh start.
                    </p>
                    <button 
                        onClick={handleHardReset}
                        className="w-full border border-red-200 text-red-600 bg-red-50 px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors font-medium"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Reset Application
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};