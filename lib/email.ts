import { Resend } from 'resend';

// Verifica si la llave de API de Resend existe, de lo contrario da una advertencia (útil para desarrollo)
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_build';
export const resend = new Resend(resendApiKey);

// El correo desde el cual se enviarán los mensajes. Debe ser un dominio verificado en Resend.
// Por defecto se toma de las variables de entorno, o un fallback.
const EMAIL_FROM = process.env.EMAIL_FROM || 'SIFYGSA Notificaciones <notificaciones@sifygsa.com>';

interface EnviarCorreoParams {
  to: string | string[];
  subject: string;
  react?: React.ReactElement | React.ReactNode | null;
  html?: string;
  /** Módulo de origen: si es 'computo', respeta el switch de modo pruebas de Cómputo/TI */
  modulo?: 'computo' | 'vehiculos' | 'seguridad' | 'auth' | 'general';
}

// Variable global en el servidor para activar/desactivar envío de correos EXCLUSIVAMENTE de Cómputo (Modo Pruebas)
declare global {
  // eslint-disable-next-line no-var
  var __DISABLE_COMPUTO_EMAILS__: boolean | undefined;
}

export function isComputoEmailDisabled(): boolean {
  if (process.env.DISABLE_COMPUTO_EMAILS === 'true') return true;
  return globalThis.__DISABLE_COMPUTO_EMAILS__ === true;
}

export function setComputoEmailDisabled(disabled: boolean) {
  globalThis.__DISABLE_COMPUTO_EMAILS__ = disabled;
}

/**
 * Función centralizada para enviar correos usando Resend
 */
export async function enviarCorreo({ to, subject, react, html, modulo }: EnviarCorreoParams) {
  // Si el correo pertenece al módulo de Cómputo y los correos de Cómputo están pausados, se omite
  if (modulo === 'computo' && isComputoEmailDisabled()) {
    console.log(`[EMAILS CÓMPUTO DESACTIVADOS / MODO PRUEBAS] Correo omitido a: ${to}, Asunto: ${subject}`);
    return { success: true, skipped: true, message: 'Envío de correos de Cómputo desactivado por modo pruebas' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      ...(react ? { react } : {}),
      ...(html ? { html } : {}),
      ...(!react && !html ? { text: subject } : {})
    } as any);

    if (error) {
      console.error('Error al enviar correo (Resend API):', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Excepción al enviar correo:', error);
    return { success: false, error };
  }
}
