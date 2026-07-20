import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';
import { render } from '@react-email/render';
import MantenimientoAsignadoEmail from '@/components/emails/MantenimientoAsignadoEmail';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const c_interno = searchParams.get('c_interno');
    const estado = searchParams.get('estado');
    
    // Security check
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;
    
    let whereClause: any = {};
    if (c_interno) whereClause.C_Interno = c_interno;
    if (estado) whereClause.Estado = estado;
    
    // If not admin, only fetch records for their assigned equipment
    if (!isAdmin && userEmail) {
      whereClause.equipo = { Email_Empleado: userEmail };
    } else if (!isAdmin && !userEmail) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const reportes = await prisma.reporte_Mantenimiento.findMany({
      where: whereClause,
      include: {
        equipo: {
          select: {
            Marca: true,
            Modelo: true,
            Service_Tag: true,
            Usuario: true,
            Email_Empleado: true,
            Tipo: true,
            Cargador: true,
            Departamento: true,
          }
        },
        partes_cambiadas: true
      },
      orderBy: {
        Fecha_Programada: 'desc'
      }
    });

    return NextResponse.json(reportes);
  } catch (error) {
    console.error('Error fetching reportes:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.Id_Plan || !data.C_Interno || !data.Fecha_Programada || !data.Tipo_Mtto) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the equipment data to get the assigned user's email
    const equipoInfo = await prisma.inventario_Computo.findUnique({
      where: { C_Interno: data.C_Interno }
    });

    // Generate FRM consecutivo (e.g. FRM-26-0001)
    const count = await prisma.reporte_Mantenimiento.count();
    const year = new Date().getFullYear().toString().slice(-2);
    const numStr = (count + 1).toString().padStart(4, '0');
    const consecutivo = `FRM-${year}-${numStr}`;

    const nuevoReporte = await prisma.reporte_Mantenimiento.create({
      data: {
        Consecutivo_FRM: consecutivo,
        Id_Plan: data.Id_Plan,
        C_Interno: data.C_Interno,
        Fecha_Programada: new Date(data.Fecha_Programada),
        Tipo_Mtto: data.Tipo_Mtto,
        Estado: 'PENDIENTE',
        Email_Notificado: equipoInfo?.Email_Empleado || null,
        Tecnico: data.Tecnico || null,
        Observaciones: data.Observaciones || null,
      }
    });

    // Send email notification to the user if they have an email assigned
    if (equipoInfo?.Email_Empleado) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // Formatear la fecha directamente del registro recién creado, forzando UTC para evitar corrimientos
        const fechaString = new Date(nuevoReporte.Fecha_Programada).toLocaleDateString('es-MX', {
          timeZone: 'UTC',
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        const emailHtml = await render(
          MantenimientoAsignadoEmail({
            equipoData: {
              C_Interno: equipoInfo.C_Interno,
              Marca: equipoInfo.Marca || 'Desconocida',
              Modelo: equipoInfo.Modelo || 'Desconocido',
              Service_Tag: equipoInfo.Service_Tag || 'N/A'
            },
            fechaProgramada: fechaString,
            tipoMtto: data.Tipo_Mtto,
            reporteId: nuevoReporte.Id_Reporte,
            appUrl
          })
        );
        
        await enviarCorreo({
          to: equipoInfo.Email_Empleado,
          subject: `🔧 Mantenimiento programado para tu equipo: ${equipoInfo.C_Interno}`,
          html: emailHtml
        });
        console.log(`Email enviado a ${equipoInfo.Email_Empleado}`);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json(nuevoReporte, { status: 201 });
  } catch (error) {
    console.error('Error creating reporte:', error);
    return NextResponse.json({ error: 'Error creating data' }, { status: 500 });
  }
}
