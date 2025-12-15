import React from 'react';
import { ReceiptText, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-teal-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <ReceiptText className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BillKaro</h1>
            <p className="text-teal-200 text-xs font-medium uppercase tracking-wider">Fast & Smart Billing</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold">Store Manager</span>
            <span className="text-xs text-teal-300">Logged in</span>
          </div>
          <div className="w-10 h-10 bg-teal-800 rounded-full flex items-center justify-center border-2 border-teal-600">
            <User className="w-5 h-5 text-teal-100" />
          </div>
        </div>
      </div>
    </header>
  );
};