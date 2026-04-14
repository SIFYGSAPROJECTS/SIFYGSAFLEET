import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import IdleTimer from '@/components/security/IdleTimer';
import RoleGuard from '@/components/security/RoleGuard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  //  SI NO HAY COOKIE, PARA AFUERA INMEDIATAMENTE
  if (!userEmail) {
    redirect('/login'); // (Asegúrate de que tu ruta de login sea esta o '/')
  }

  return (
    <div className="min-h-screen bg-[#0B101E]">
      {/* 1. Cronómetro de inactividad (15 min sin actividad = logout) */}
      <IdleTimer />

      {/* 2. (cada 5s verifica si el rol cambió) */}
      <RoleGuard />

      {/* Todo lo que pongas aquí se verá en todas las páginas del dashboard */}
      {children}
    </div>
  );
}