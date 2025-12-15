import React, { useState } from 'react';
import { Header } from './components/Header';
import { BillingCounter } from './components/BillingCounter';
import { AdminDashboard } from './components/AdminDashboard';
import { Lock, ChevronRight, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'billing' | 'admin'>('billing');
  const [showLoginInput, setShowLoginInput] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setCurrentView('admin');
      setShowLoginInput(false);
      setPinInput('');
    } else {
      alert("Incorrect PIN");
      setPinInput('');
    }
  };

  const cancelLogin = () => {
    setShowLoginInput(false);
    setPinInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {currentView === 'billing' ? (
             <BillingCounter />
          ) : (
             <AdminDashboard onBack={() => setCurrentView('billing')} />
          )}
        </div>
      </main>
      <footer className="bg-slate-100 py-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
           <div className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} BillKaro. All rights reserved.
           </div>
           
           {currentView === 'billing' && (
             <div className="mt-2 h-8 flex items-center justify-center">
               {showLoginInput ? (
                 <form onSubmit={handleLoginSubmit} className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <input 
                     type="password" 
                     value={pinInput}
                     onChange={(e) => setPinInput(e.target.value)}
                     placeholder="PIN"
                     className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-teal-500"
                     autoFocus
                   />
                   <button 
                     type="submit"
                     className="bg-teal-600 text-white p-1 rounded hover:bg-teal-700 transition-colors"
                   >
                     <ChevronRight className="w-4 h-4" />
                   </button>
                   <button 
                     type="button" 
                     onClick={cancelLogin}
                     className="text-slate-400 hover:text-slate-600 p-1"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </form>
               ) : (
                 <button 
                    onClick={() => setShowLoginInput(true)}
                    className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
                 >
                    <Lock className="w-3 h-3" />
                    Admin Login
                 </button>
               )}
             </div>
           )}
        </div>
      </footer>
    </div>
  );
};

export default App;