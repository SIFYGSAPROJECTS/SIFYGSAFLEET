import { prisma } from '@/lib/db';
import { openClawAuditor } from '@/lib/ai/openclaw';

/**
 * Registra una acción en la bitácora de auditoría global del sistema.
 * Ahora redirige la información a OpenClaw para su análisis inteligente antes de guardar.
 * 
 * @param usuario Correo electrónico o identificador del usuario que realizó la acción.
 * @param accion Tipo de acción (ej. 'LOGIN', 'INSERT', 'UPDATE', 'DELETE', 'VIEW').
 * @param modulo Módulo del sistema afectado (ej. 'AUTH', 'AUTOS', 'COMPUTO', 'EMPLEADOS', 'GASTOS').
 * @param detalle Descripción detallada de lo que ocurrió o datos en formato string/JSON.
 */
export async function logAuditoria(usuario: string, accion: string, modulo: string, detalle: string) {
  try {
    // Evitamos fallos fatales si falta algún dato esencial
    if (!usuario || !accion || !modulo) {
      console.warn('logAuditoria: Faltan parámetros obligatorios. Registro omitido.');
      return;
    }

    // Delegamos a OpenClaw la responsabilidad de analizar y guardar el evento
    // en la tabla Bitacora_Auditoria
    await openClawAuditor(usuario, accion, modulo, detalle);
    
  } catch (error) {
    // Capturamos el error para no interrumpir el flujo principal de la aplicación,
    // pero lo registramos en consola para depuración.
    console.error('Error al registrar en Bitácora de Auditoría (OpenClaw):', error);
  }
}
