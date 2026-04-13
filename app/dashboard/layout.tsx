import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import IdleTimer from '@/components/security/IdleTimer'; 

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
      {/* 2. Colocamos el cronómetro invisible para que vigile todas las pantallas */}
      <IdleTimer /> 
      
      {/* Todo lo que pongas aquí se verá en todas las páginas del dashboard */}
      {children}
    </div>
  );
}