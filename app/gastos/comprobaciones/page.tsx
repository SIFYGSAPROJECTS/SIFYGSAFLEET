import { cookies } from 'next/headers';
import ComprobacionesClient from './ComprobacionesClient';

export default async function ComprobacionesPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value || '';
  const userRole = cookieStore.get('user_role')?.value || '';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  return <ComprobacionesClient userEmail={userEmail} isAdmin={isAdmin} />;
}
