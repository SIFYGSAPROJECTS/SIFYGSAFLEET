'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 print:hidden"
    >
      <Printer size={16} /> Imprimir Orden
    </button>
  );
}