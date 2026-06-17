import { cookies } from 'next/headers';
import ComprobacionesClient from './ComprobacionesClient';

export default async function ComprobacionesPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value || '';

  return <ComprobacionesClient userEmail={userEmail} />;
}
