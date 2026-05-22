import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import IdleTimer from '@/components/security/IdleTimer';
import RoleGuard from '@/components/security/RoleGuard';
import CopilotChat from '@/components/ai/CopilotChat';
import ScrollToTop from '@/components/ui/ScrollToTop';
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
    <>
      <div className="fixed inset-0 pointer-events-none z-[9999] animate-entrance-overlay" />
      <div className="min-h-screen bg-transparent">
        <IdleTimer />

        <RoleGuard />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50">
          {children}
        </main>
      </div>
      <CopilotChat />
      <ScrollToTop />
    </>
  );
}