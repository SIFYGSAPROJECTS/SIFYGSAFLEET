import { cookies } from 'next/headers';
import ViaticosClient from './ViaticosClient';

export default async function ViaticosPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value || '';

  return <ViaticosClient userEmail={userEmail} />;
}
