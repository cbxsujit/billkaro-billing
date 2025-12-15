import React from 'react';
import { Trash2 } from 'lucide-react';
import { InvoiceItem } from '../types';

interface Props {
  items: InvoiceItem[];
  onRemoveItem: (id: string) => void;
}

export const InvoiceItemsTable: React.FC<Props> = ({ items, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-slate-400 flex flex-col items-center">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
            <Trash2 className="w-6 h-6 text-slate-300" />
        </div>
        <p>No items added yet. Start adding items above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-3 font-medium">#</th>
            <th className="px-6 py-3 font-medium">Item</th>
            <th className="px-6 py-3 font-medium text-right">Qty</th>
            <th className="px-6 py-3 font-medium text-right">Rate</th>
            <th className="px-6 py-3 font-medium text-right">Taxable</th>
            <th className="px-6 py-3 font-medium text-right">GST</th>
            <th className="px-6 py-3 font-medium text-right">Total</th>
            <th className="px-6 py-3 font-medium text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const taxable = item.quantity * item.rate;
            const gstAmount = (taxable * item.gstRate) / 100;
            const total = taxable + gstAmount;

            return (
              <tr key={item.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-400">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-6 py-4 text-right text-slate-600">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-slate-600">₹{item.rate.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-slate-600">₹{taxable.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-100">
                    {item.gstRate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800">₹{total.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};