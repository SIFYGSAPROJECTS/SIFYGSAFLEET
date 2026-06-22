import { prisma } from '@/lib/db';

/**
 * OpenClaw - Auditor Silencioso
 * Analiza eventos crudos del sistema y escribe bitácoras inteligentes.
 */

// Simularemos el llamado al LLM por ahora (puedes reemplazar esto con la API de OpenAI, Gemini o Llama local).
async function analizarConLLM(usuario: string, accion: string, modulo: string, detalleRaw: string) {
  let analisisInteligente = '';
  let payload: any = null;

  // 1. Intentamos parsear el detalleRaw como JSON para ver si contiene Diffs
  try {
    payload = JSON.parse(detalleRaw);
  } catch (e) {
    // Es un string plano
  }

  // 2. Si hay diffs (cambios explícitos), armamos el texto analítico
  if (payload && payload.changes) {
    const contextMsg = payload.message || '';
    const changes = payload.changes;
    const keys = Object.keys(changes);
    
    if (keys.length > 0) {
      let diffText = keys.map(k => `${k}: de '${changes[k].from ?? 'Nada'}' a '${changes[k].to ?? 'Nada'}'`).join(', ');
      analisisInteligente = `El usuario ${usuario} actualizó registros. ${contextMsg ? `Detalle: ${contextMsg}.` : ''} Cambios exactos: ${diffText}`;
    } else {
      analisisInteligente = `El usuario ${usuario} realizó una acción. ${contextMsg ? `Detalle: ${contextMsg}.` : ''} (Sin cambios detectados en campos clave).`;
    }
  } 
  // 3. Casos anteriores y reglas de negocio genéricas
  else if (accion.includes('LOGIN') && detalleRaw.includes('nocturno')) {
    analisisInteligente = `⚠️ ALERTA: El usuario ${usuario} inició sesión en horario inusual (nocturno). Se recomienda verificar si había guardia autorizada.`;
  } else if (modulo === 'GASTOS' && accion === 'UPDATE') {
    analisisInteligente = `✏️ MODIFICACIÓN: El usuario ${usuario} alteró un registro de Caja Chica existente. Razón aparente: ${detalleRaw || 'No especificada'}. Se recomienda revisar el comprobante adjunto.`;
  } else if (modulo === 'VEHICULOS' && accion === 'CREATE') {
    analisisInteligente = `🚗 ALTA: El usuario ${usuario} registró un nuevo vehículo en la flotilla. Datos base: ${payload?.message || detalleRaw}.`;
  } else if (accion === 'DELETE') {
    analisisInteligente = `🗑️ ELIMINACIÓN CRÍTICA: El usuario ${usuario} borró información del sistema. Detalle de lo borrado: ${payload?.message || detalleRaw}.`;
  } else {
    // Respuesta genérica inteligente (sin revelar variables de backend)
    const textMsg = payload?.message || detalleRaw;
    analisisInteligente = `El usuario ${usuario} registró un evento: ${textMsg}`;
  }

  return analisisInteligente;
}

/**
 * Función principal que intercepta el evento de auditoría, lo analiza con IA
 * y lo guarda asincrónicamente en la Bitacora_Auditoria existente.
 */
export async function openClawAuditor(usuario: string, accion: string, modulo: string, detalleRaw: string) {
  try {
    // 1. La IA analiza el evento (esto puede tomar 1-2 segundos)
    const detalleInteligente = await analizarConLLM(usuario, accion, modulo, detalleRaw);

    // 2. OpenClaw escribe el resultado en tu tabla existente
    await prisma.bitacora_Auditoria.create({
      data: {
        Usuario: usuario,
        Accion: accion,
        Modulo: modulo,
        Detalle: detalleInteligente,
      }
    });

    console.log(`[OpenClaw] Evento analizado y registrado para ${usuario} en ${modulo}`);
  } catch (error) {
    console.error('[OpenClaw] Error al analizar o registrar evento:', error);
  }
}
