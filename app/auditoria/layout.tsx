import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';

export default async function AuditoriaLayout({
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
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // Solo administradores pueden ver la auditoría
  if (!isAdmin) {
    redirect('/portal');
  }

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Utilizamos la vista de auditoria para habilitar el estilo de navegación */}
        <Navbar type="auditoria" userName={userName} userRole={userRole} isAdmin={isAdmin} maxWidth="max-w-[95%]" />
        <main className="flex-1 w-full pt-24 px-6 md:px-8 max-w-[95%] mx-auto pb-12">
          {children}
        </main>
      </div>
    </>
  );
}
