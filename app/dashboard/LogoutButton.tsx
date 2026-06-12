"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  variant?: 'default' | 'minimal';
}

export default function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
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

  if (variant === 'minimal') {
    return (
      <button 
        onClick={handleLogout}
        className="w-full justify-center hover:bg-red-600/20 text-white/90 hover:text-red-400 px-3.5 py-1.5 rounded-lg text-xs inline-flex items-center gap-2 transition-all font-bold whitespace-nowrap"
      >
        <LogOut size={14} /> Cerrar Sesión
      </button>
    );
  }

  return (
    <button 
      onClick={handleLogout}
      className="bg-[#2D2D2D] hover:bg-red-600 border border-slate-700 hover:border-red-500 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all whitespace-nowrap"
    >
      <LogOut size={14} /> Cerrar Sesión
    </button>
  );
}