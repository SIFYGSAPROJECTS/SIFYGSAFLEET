'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Wallet, Plane } from 'lucide-react';

export default function GastosMenu() {
  const pathname = usePathname();

  const menuItems = [
    {
      id: 'comprobaciones',
      name: 'Comprobaciones de Gastos',
      icon: FileText,
      href: '/gastos/comprobaciones',
      color: 'text-teal-600',
      activeColor: 'bg-teal-600 text-white shadow-md'
    },
    {
      id: 'caja-chica',
      name: 'Comprobación Caja Chica',
      icon: Wallet,
      href: '/gastos/caja-chica',
      color: 'text-emerald-600',
      activeColor: 'bg-emerald-600 text-white shadow-md'
    },
    {
      id: 'viaticos',
      name: 'Comprobaciones de Viáticos',
      icon: Plane,
      href: '/gastos/viaticos',
      color: 'text-sky-600',
      activeColor: 'bg-sky-600 text-white shadow-md'
    }
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-xl border border-stone-200/50 shadow-sm w-full">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.includes(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium text-sm
              ${isActive 
                ? item.activeColor 
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
          >
            <Icon size={18} className={isActive ? 'text-white' : item.color} />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
