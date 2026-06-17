import { cookies } from 'next/headers';
import ViaticosClient from './ViaticosClient';

export default async function ViaticosPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value || '';
  const userRole = cookieStore.get('user_role')?.value || '';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  return <ViaticosClient userEmail={userEmail} isAdmin={isAdmin} />;
}
