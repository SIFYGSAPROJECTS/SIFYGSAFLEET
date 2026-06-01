"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getVerificationPeriods } from "@/lib/utils/verificaciones";

/**
 * Genera (o actualiza) los registros de verificación esperados para un año específico 
 * basándose en el inventario de automóviles activos.
 */
export async function generarPlazosVerificacion(anio: number, shouldRevalidate = true) {
  try {
    // 1. Obtener los vehículos activos
    const vehiculos = await prisma.inventario_Automoviles.findMany({
      where: {
        Estado_Unidad: true
      }
    });

    let creados = 0;

    for (const vehiculo of vehiculos) {
      if (!vehiculo.Placa) continue;

      // Calcular los dos periodos del año según la placa
      const plazos = getVerificationPeriods(vehiculo.Placa, anio);
      if (!plazos) continue;

      for (const plazo of plazos) {
        // Verificar si ya existe el registro para no duplicar
        const existe = await prisma.verificacion_Vehicular.findFirst({
          where: {
            Consecutivo: vehiculo.Consecutivo,
            Anio: anio,
            Periodo: plazo.periodo
          }
        });

        if (!existe) {
          await prisma.verificacion_Vehicular.create({
            data: {
              Consecutivo: vehiculo.Consecutivo,
              Anio: anio,
              Periodo: plazo.periodo,
              Fecha_Inicio_Plazo: plazo.fechaInicio,
              Fecha_Fin_Plazo: plazo.fechaFin,
              Estado: "PENDIENTE"
            }
          });
          creados++;
        }
      }
    }

    if (shouldRevalidate) {
      revalidatePath("/verificaciones");
    }
    return { success: true, message: `Se generaron ${creados} registros de verificación.` };
  } catch (error: any) {
    console.error("Error al generar plazos de verificación:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene todas las verificaciones para mostrarlas en el calendario,
 * incluyendo información básica del vehículo.
 */
export async function getVerificacionesCalendario(anio: number) {
  try {
    const verificaciones = await prisma.verificacion_Vehicular.findMany({
      where: { Anio: anio },
      include: {
        vehiculo: {
          select: {
            Consecutivo: true,
            Placa: true,
            Marca: true,
            Modelo: true
          }
        }
      },
      orderBy: [
        { vehiculo: { Consecutivo: 'asc' } },
        { Periodo: 'asc' }
      ]
    });
    return { success: true, data: verificaciones };
  } catch (error: any) {
    console.error("Error al obtener verificaciones:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Registra que una verificación fue realizada y actualiza su estado.
 */
export async function registrarVerificacion(
  idVerificacion: number,
  fechaRealizacion: Date,
  evidenciaPDF?: string,
  costo?: number
) {
  try {
    await prisma.verificacion_Vehicular.update({
      where: { Id_Verificacion: idVerificacion },
      data: {
        Fecha_Realizacion: fechaRealizacion,
        Evidencia_PDF: evidenciaPDF,
        Costo: costo,
        Estado: "REALIZADO"
      }
    });

    revalidatePath("/verificaciones");
    return { success: true, message: "Verificación registrada correctamente." };
  } catch (error: any) {
    console.error("Error al registrar verificación:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Recalcula o genera los plazos para un vehículo específico.
 * Útil cuando se cambia la placa de un vehículo o se da de alta uno nuevo.
 */
export async function recalcularPlazosVehiculo(consecutivo: string, placa: string, anio: number) {
  try {
    const plazos = getVerificationPeriods(placa, anio);
    if (!plazos) return { success: false, error: "Placa inválida" };

    for (const plazo of plazos) {
      const existe = await prisma.verificacion_Vehicular.findFirst({
        where: { Consecutivo: consecutivo, Anio: anio, Periodo: plazo.periodo }
      });

      if (existe) {
        // Solo actualizamos las fechas si sigue pendiente
        if (existe.Estado === "PENDIENTE") {
          await prisma.verificacion_Vehicular.update({
            where: { Id_Verificacion: existe.Id_Verificacion },
            data: {
              Fecha_Inicio_Plazo: plazo.fechaInicio,
              Fecha_Fin_Plazo: plazo.fechaFin
            }
          });
        }
      } else {
        await prisma.verificacion_Vehicular.create({
          data: {
            Consecutivo: consecutivo,
            Anio: anio,
            Periodo: plazo.periodo,
            Fecha_Inicio_Plazo: plazo.fechaInicio,
            Fecha_Fin_Plazo: plazo.fechaFin,
            Estado: "PENDIENTE"
          }
        });
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error al recalcular plazos:", error);
    return { success: false };
  }
}
