import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import IdleTimer from '@/components/security/IdleTimer';
import RoleGuard from '@/components/security/RoleGuard';

import ScrollToTop from '@/components/ui/ScrollToTop';
import Navbar from '@/components/ui/Navbar';

export default async function ComputoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    redirect('/');
  }

  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9999] animate-entrance-overlay" />
      <div className="min-h-screen bg-transparent">
        <IdleTimer />
        <RoleGuard />
        
        {/* HEADER GLOBAL DEL MÓDULO */}
        <Navbar type="computo" userName={userName} userRole={userRole} isAdmin={isAdmin} maxWidth="max-w-[95%]" />

        <main className="flex-1 w-full bg-emerald-50/10 pt-24">
          {children}
        </main>
      </div>

      <ScrollToTop />
    </>
  );
}
