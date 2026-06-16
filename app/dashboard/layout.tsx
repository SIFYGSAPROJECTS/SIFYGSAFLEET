import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import IdleTimer from '@/components/security/IdleTimer';
import RoleGuard from '@/components/security/RoleGuard';
import CopilotChat from '@/components/ai/CopilotChat';
import ScrollToTop from '@/components/ui/ScrollToTop';
import Navbar from '@/components/ui/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  //  SI NO HAY COOKIE, PARA AFUERA INMEDIATAMENTE
  if (!userEmail) {
    redirect('/'); // (Asegúrate de que tu ruta de login sea esta o '/')
  }

  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9999] animate-entrance-overlay" />
      <div className="min-h-screen bg-transparent">
        <IdleTimer />
        <RoleGuard />
        
        {/* HEADER GLOBAL DEL MÓDULO */}
        <Navbar type="dashboard" userName={userName} userRole={userRole} isAdmin={isAdmin} maxWidth="max-w-[95%]" />

        <main className="flex-1 w-full bg-gray-50/50 pt-20">
          {children}
        </main>
      </div>
      <CopilotChat />
      <ScrollToTop />
    </>
  );
}