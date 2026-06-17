import { cookies } from 'next/headers';
import ViaticoDetalleClient from './ViaticoDetalleClient';

export default async function ViaticoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';

  return <ViaticoDetalleClient viaticoId={parseInt(id)} isAdmin={['ADMIN', 'GERENCIAL'].includes(userRole)} />;
}
