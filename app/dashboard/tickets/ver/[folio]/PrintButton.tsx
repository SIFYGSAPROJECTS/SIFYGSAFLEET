'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-[var(--bg-floating)] border border-[var(--border-cream)] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-main)] print:hidden"
    >
      <Printer size={16} /> Imprimir Orden
    </button>
  );
}