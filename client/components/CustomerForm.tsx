import React from 'react';
import { User, MapPin, Phone, Calendar, Hash, Mail } from 'lucide-react';
import { CustomerDetails } from '../types';

interface CustomerFormProps {
  customer: CustomerDetails;
  onChange: (field: keyof CustomerDetails, value: string) => void;
  invoiceNumber: string;
  invoiceDate: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ 
  customer, 
  onChange, 
  invoiceNumber, 
  invoiceDate 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {/* Invoice Meta - Read Only */}
      <div className="md:col-span-2 grid grid-cols-2 gap-6 mb-2">
        <div className="relative">
             <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Invoice #</label>
             <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    value={invoiceNumber} 
                    readOnly 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm focus:outline-none"
                />
             </div>
        </div>
        <div className="relative">
             <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Date</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="date" 
                    value={invoiceDate} 
                    readOnly 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm focus:outline-none"
                />
             </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 md:col-span-2 my-2"></div>

      {/* Customer Inputs */}
      <div className="space-y-1 md:col-span-2">
        <label className="text-sm font-medium text-slate-700">Customer Name</label>
        <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                value={customer.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Enter customer name"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
            />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Mobile Number</label>
        <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="tel"
                value={customer.mobile}
                onChange={(e) => onChange('mobile', e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
            />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Email Address <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
        <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="email"
                value={customer.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="customer@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
            />
        </div>
      </div>

      <div className="space-y-1 md:col-span-2">
        <label className="text-sm font-medium text-slate-700">Billing Address</label>
        <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
                value={customer.address}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none placeholder:text-slate-400"
            />
        </div>
      </div>
    </div>
  );
};