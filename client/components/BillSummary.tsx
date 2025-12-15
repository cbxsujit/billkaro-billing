import React, { useMemo } from 'react';
import { InvoiceItem } from '../types';

interface Props {
  items: InvoiceItem[];
}

export const BillSummary: React.FC<Props> = ({ items }) => {
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalGST = 0;

    items.forEach(item => {
      const taxable = item.quantity * item.rate;
      const gst = (taxable * item.gstRate) / 100;
      subtotal += taxable;
      totalGST += gst;
    });

    return {
      subtotal,
      cgst: totalGST / 2,
      sgst: totalGST / 2,
      grandTotal: subtotal + totalGST
    };
  }, [items]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden sticky top-6">
      <div className="bg-teal-700 p-4 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Billing Summary
        </h3>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center text-slate-600">
          <span className="font-medium">Subtotal (Taxable)</span>
          <span className="font-mono text-lg">₹{totals.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="h-px bg-slate-100 my-2"></div>
        
        <div className="flex justify-between items-center text-slate-500 text-sm">
          <span>CGST (Output)</span>
          <span className="font-mono">₹{totals.cgst.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center text-slate-500 text-sm">
          <span>SGST (Output)</span>
          <span className="font-mono">₹{totals.sgst.toFixed(2)}</span>
        </div>
        
        <div className="h-px bg-slate-200 my-4"></div>
        
        <div className="flex justify-between items-end">
          <span className="text-lg font-bold text-slate-800">Grand Total</span>
          <span className="text-3xl font-bold text-teal-700 tracking-tight">
            ₹{Math.round(totals.grandTotal).toLocaleString('en-IN')}<span className="text-lg text-teal-500">.{totals.grandTotal.toFixed(2).split('.')[1]}</span>
          </span>
        </div>
        
        <div className="bg-orange-50 text-orange-800 text-xs px-3 py-2 rounded border border-orange-100 mt-2 text-center">
          In Words: Rupees {Math.round(totals.grandTotal)} only
        </div>
      </div>
    </div>
  );
};