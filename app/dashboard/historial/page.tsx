import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default async function HistorialPage() {
  // 1. Identificamos al usuario
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    return <div className="p-8 text-center text-red-500">Error: No has iniciado sesión</div>;
  }

  // 2. Buscamos si es ADMIN o USER
  const usuario = await prisma.empleados.findUnique({
    where: { Email: userEmail }
  });

  // 3. EL FILTRO INTELIGENTE: Si es ADMIN ve todo. Si es chofer, solo ve lo suyo.
  const condicionDeBusqueda = usuario?.Rol === 'ADMIN' 
    ? {} 
    : {
        OR: [
          { Email_Empleado: userEmail }, // Ve los tickets que él mismo solicitó
          { auto: { Email_encargado: userEmail } } // Y TAMBIÉN ve los tickets de su auto, aunque los haya creado el Admin
        ]
      };

  // 4. Traemos TODOS los tickets que cumplan la condición
  const historial = await prisma.solicitud.findMany({
    where: condicionDeBusqueda,
    include: { 
      auto: true,      // Traemos datos del auto
      empleado: true   // Traemos datos del chofer
    },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      <div className="mb-6">
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={16} /> Volver al Panel
        </Link>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Historial General de Mantenimientos</h1>
        <p className="text-slate-500 mt-1">
          {usuario?.Rol === 'ADMIN' 
            ? '👑 Vista de Administrador: Mostrando el registro de toda la flota de SIFYGSA.' 
            : '🚗 Vista de Empleado: Mostrando únicamente tus solicitudes.'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-sm">
                <th className="p-4 font-semibold">Folio</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Solicitante</th>
                <th className="p-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No hay registros de mantenimiento todavía.
                  </td>
                </tr>
              ) : (
                historial.map((ticket) => (
                  <tr key={ticket.Pk_folio_ticket} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    
                    <td className="p-4 font-mono text-sm font-bold text-slate-700">
                      {ticket.Pk_folio_ticket}
                    </td>
                    
                    <td className="p-4 text-sm text-slate-600">
                      {ticket.Fecha_Realizacion.toLocaleDateString()}
                    </td>
                    
                    <td className="p-4 text-sm font-medium text-slate-800">
                      {ticket.auto?.Marca} {ticket.auto?.Modelo}
                      <span className="text-xs text-slate-500 block">{ticket.auto?.Placa}</span>
                    </td>
                    
                    <td className="p-4 text-sm text-slate-600">
                      {ticket.empleado?.Nombre_Empleado} {ticket.empleado?.A_Paterno}
                      <span className="text-xs text-slate-400 block">{ticket.Email_Empleado}</span>
                    </td>
                    
                    <td className="p-4 text-center">
                      <Link 
                        href={`/dashboard/tickets/ver/${ticket.Pk_folio_ticket}`}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={16} /> Ver Ticket
                      </Link>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}