"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function YearSelector({ currentYear }: { currentYear: number }) {
  const router = useRouter();

  const handleYearChange = (newYear: number) => {
    // Al cambiar la URL, Next.js vuelve a renderizar la página con los datos del nuevo año
    router.push(`/verificaciones?anio=${newYear}`);
  };

  return (
    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
      <button 
        onClick={() => handleYearChange(currentYear - 1)}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        title="Año anterior"
      >
        <ChevronLeft size={20} />
      </button>
      
      <span className="text-lg font-bold text-gray-800 w-16 text-center">
        {currentYear}
      </span>
      
      <button 
        onClick={() => handleYearChange(currentYear + 1)}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        title="Año siguiente"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
