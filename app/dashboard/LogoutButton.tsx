"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/'); 
      router.refresh(); // Refresca para limpiar cualquier dato en caché
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-500 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all"
    >
      <LogOut size={14} /> Salir
    </button>
  );
}