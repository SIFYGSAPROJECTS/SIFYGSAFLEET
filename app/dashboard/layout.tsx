import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  // 🛡️ SI NO HAY COOKIE, PARA AFUERA INMEDIATAMENTE
  if (!userEmail) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Todo lo que pongas aquí se verá en todas las páginas del dashboard */}
      {children}
    </div>
  );
}