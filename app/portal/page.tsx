import { cookies } from 'next/headers';
import PortalClient from './PortalClient';

export default async function PortalPage() {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get('user_role')?.value;
  const areasCookie = cookieStore.get('user_areas')?.value;

  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(roleCookie || '');
  let userAreas: string[] = [];
  
  if (areasCookie) {
    try {
      userAreas = JSON.parse(decodeURIComponent(areasCookie));
    } catch (e) {}
  }

  return <PortalClient isAdmin={isAdmin} userAreas={userAreas} />;
}
