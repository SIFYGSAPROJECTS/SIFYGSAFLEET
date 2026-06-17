import { cookies } from 'next/headers';
import CajaChicaClient from './CajaChicaClient';

export default async function CajaChicaPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value || '';
  const userRole = cookieStore.get('user_role')?.value || '';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  return <CajaChicaClient userEmail={userEmail} isAdmin={isAdmin} />;
}
