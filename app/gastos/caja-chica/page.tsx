import { cookies } from 'next/headers';
import CajaChicaClient from './CajaChicaClient';

export default async function CajaChicaPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value || '';

  return <CajaChicaClient userEmail={userEmail} />;
}
