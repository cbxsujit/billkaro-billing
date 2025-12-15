import React, { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { InvoiceItem, GST_RATES, Product } from '../types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

interface ItemEntryProps {
  onAddItem: (item: InvoiceItem) => void;
  products: Product[];
}

export const ItemEntry: React.FC<ItemEntryProps> = ({ onAddItem, products }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [rate, setRate] = useState<number | ''>('');
  const [gstRate, setGstRate] = useState<number>(18);
  const [isCustom, setIsCustom] = useState(false);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId === 'custom_entry') {
        setIsCustom(true);
        setName('');
        setRate('');
        setGstRate(18);
        return;
    }

    const product = products.find(p => p.id === selectedId);
    if (product) {
        setIsCustom(false);
        setName(product.name);
        setRate(product.rate);
        setGstRate(product.gstRate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || rate === '') return;

    const newItem: InvoiceItem = {
      id: generateId(),
      name,
      quantity: Number(quantity),
      rate: Number(rate),
      gstRate
    };

    onAddItem(newItem);
    
    // Reset form
    if (!isCustom) {
        setName('');
        setRate('');
    } else {
        // keep custom mode but clear fields
        setName('');
        setRate('');
    }
    setQuantity(1);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-4">
      <div className="flex-grow space-y-1 w-full md:w-auto">
        <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
            <span>Item Name</span>
            <button 
                type="button" 
                onClick={() => setIsCustom(!isCustom)}
                className="text-teal-600 hover:text-teal-700 text-[10px] underline cursor-pointer"
            >
                {isCustom ? "Select from List" : "Enter Manually"}
            </button>
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
          
          {isCustom || products.length === 0 ? (
             <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item description"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                required
                autoFocus
             />
          ) : (
             <select
                onChange={handleProductSelect}
                value={products.find(p => p.name === name)?.id || ''}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white appearance-none cursor-pointer"
             >
                <option value="" disabled>Select a product...</option>
                {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="custom_entry" className="text-teal-600 font-semibold">+ Add Custom Item</option>
             </select>
          )}
        </div>
      </div>

      <div className="w-full md:w-24 space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Qty</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.valueAsNumber)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-center"
          required
        />
      </div>

      <div className="w-full md:w-32 space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">Rate (₹)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.valueAsNumber)}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-right"
          required
        />
      </div>

      <div className="w-full md:w-28 space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">GST %</label>
        <select
          value={gstRate}
          onChange={(e) => setGstRate(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
        >
          {GST_RATES.map(r => (
            <option key={r} value={r}>{r}%</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 min-w-[100px]"
      >
        <Plus className="w-5 h-5" />
        <span className="md:hidden">Add Item</span>
        <span className="hidden md:inline">Add</span>
      </button>
    </form>
  );
};