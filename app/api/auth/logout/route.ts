// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Borramos los datos que identifican al usuario en el servidor
  cookieStore.delete('user_email');
  cookieStore.delete('user_role');
  cookieStore.delete('user_name');

  return NextResponse.json({ success: true, message: "Sesión cerrada por inactividad" });
}