// components/security/RoleGuard.tsx
// =====================================================
//  Este componente invisible (como el IdleTimer) vigila
//  cada 5 segundos si el rol del usuario sigue siendo
//  el mismo. Si un admin se quita su rol, se le expulsa
//  al login con un mensaje explicando por qué.
// =====================================================
'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ShieldOff, UserX, Clock, LogOut } from 'lucide-react';

// Configuración de mensajes por tipo de expulsión
const KICK_REASONS: Record<string, {
  icon: React.ReactNode;
  title: string;
  message: string;
  accentColor: string;
  bgGlow: string;
}> = {
  role_changed: {
    icon: <ShieldAlert className="w-10 h-10" />,
    title: 'Tu Rol Ha Cambiado',
    message: 'Un administrador ha modificado tu nivel de acceso en el sistema. Por seguridad, es necesario que inicies sesión nuevamente para aplicar los cambios.',
    accentColor: 'text-amber-400',
    bgGlow: 'shadow-[0_0_80px_rgba(251,191,36,0.15)]',
  },
  account_disabled: {
    icon: <ShieldOff className="w-10 h-10" />,
    title: 'Acceso Revocado',
    message: 'Tu cuenta ha sido desactivada por un administrador del sistema. Si consideras que es un error, contacta al departamento de TI.',
    accentColor: 'text-red-400',
    bgGlow: 'shadow-[0_0_80px_rgba(239,68,68,0.15)]',
  },
  user_deleted: {
    icon: <UserX className="w-10 h-10" />,
    title: 'Cuenta No Encontrada',
    message: 'Tu cuenta de usuario ya no existe en el sistema. Contacta a un administrador para más información.',
    accentColor: 'text-red-400',
    bgGlow: 'shadow-[0_0_80px_rgba(239,68,68,0.15)]',
  },
  no_session: {
    icon: <Clock className="w-10 h-10" />,
    title: 'Sesión Expirada',
    message: 'Tu sesión ha caducado por motivos de seguridad. Por favor, inicia sesión de nuevo para continuar.',
    accentColor: 'text-blue-400',
    bgGlow: 'shadow-[0_0_80px_rgba(59,130,246,0.15)]',
  },
};

const FALLBACK_REASON = {
  icon: <ShieldAlert className="w-10 h-10" />,
  title: 'Sesión Invalidada',
  message: 'Tu sesión ha sido cerrada por el sistema de seguridad. Inicia sesión de nuevo.',
  accentColor: 'text-slate-400',
  bgGlow: 'shadow-[0_0_80px_rgba(100,116,139,0.15)]',
};

export default function RoleGuard() {
  const router = useRouter();
  const isLoggingOut = useRef(false);
  const [kickInfo, setKickInfo] = useState<{
    visible: boolean;
    reason: string;
    detail?: string;
  }>({ visible: false, reason: '' });
  const [countdown, setCountdown] = useState(5);

  // Intervalo de verificación: cada 5 segundos
  const CHECK_INTERVAL = 5 * 1000;
  // Tiempo que se muestra el mensaje antes de redirigir (solo lectura, sesión ya destruida)
  const REDIRECT_DELAY = 2 * 1000;

  const forceLogout = useCallback(async (reason: string, detail?: string) => {
    // Evitamos múltiples logouts simultáneos
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    console.warn(` RoleGuard: Sesión invalidada → ${reason}`);

    try {
      // 1.  DESTRUIMOS LA SESIÓN INSTANTÁNEAMENTE (antes de todo)
      await fetch('/api/logout', { method: 'POST' });

      // 2. Limpiamos almacenamiento local
      localStorage.clear();
    } catch (error) {
      console.error('Error al forzar cierre de sesión:', error);
    }

    // 3. DESPUÉS de destruir, mostramos el mensaje informativo
    //    (el usuario ya NO tiene sesión, solo lee por qué lo sacaron)
    setKickInfo({ visible: true, reason, detail });
    setCountdown(2);

    // 4. Esperamos el delay para que lea el mensaje, luego redirigimos
    setTimeout(() => {
      router.push('/');
      router.refresh();
      // Fallback por si el router no responde
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }, REDIRECT_DELAY);
  }, [router, REDIRECT_DELAY]);

  // Cuenta regresiva visual
  useEffect(() => {
    if (!kickInfo.visible) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [kickInfo.visible]);

  const checkRole = useCallback(async () => {
    // No verificar si ya estamos en proceso de logout
    if (isLoggingOut.current) return;

    try {
      const res = await fetch('/api/auth/check-role', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const data = await res.json();

      // Si la sesión ya no es válida, forzamos logout con mensaje
      if (!data.valid) {
        const detail = data.reason === 'role_changed'
          ? `${data.oldRole} → ${data.newRole}`
          : undefined;

        forceLogout(data.reason || 'unknown', detail);
      }
    } catch (error) {
      // Si hay error de red, no cerramos sesión (podría ser temporal)
      console.warn('⚠️ RoleGuard: Error de red al verificar rol', error);
    }
  }, [forceLogout]);

  useEffect(() => {
    // Verificación inmediata al montar el componente
    checkRole();

    // Configurar el intervalo de verificación periódica
    const interval = setInterval(checkRole, CHECK_INTERVAL);

    // Cleanup al desmontar
    return () => {
      clearInterval(interval);
    };
  }, [checkRole, CHECK_INTERVAL]);

  // =====================================================
  //   OVERLAY DE NOTIFICACIÓN
  // =====================================================
  if (!kickInfo.visible) return null;

  const reasonConfig = KICK_REASONS[kickInfo.reason] || FALLBACK_REASON;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">

      {/* Tarjeta central */}
      <div className={`
        relative max-w-md w-[90%] bg-[#132d46] border border-slate-700/50 
        rounded-2xl overflow-hidden ${reasonConfig.bgGlow}
        animate-in slide-in-from-bottom-4 zoom-in-95 duration-500
      `}>

        {/* Barra superior de acento */}
        <div className={`h-1 w-full ${kickInfo.reason === 'role_changed' ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500' :
          kickInfo.reason === 'account_disabled' || kickInfo.reason === 'user_deleted' ? 'bg-gradient-to-r from-red-500 via-red-400 to-rose-500' :
            'bg-gradient-to-r from-blue-500 via-blue-400 to-[#01c38e]'
          }`} />

        {/* Contenido */}
        <div className="p-8 flex flex-col items-center text-center">

          {/* Icono con animación de pulso */}
          <div className={`
            ${reasonConfig.accentColor} mb-5 p-4 rounded-full 
            bg-[#1a1e29] border border-[#132d46]
            animate-pulse
          `}>
            {reasonConfig.icon}
          </div>

          {/* Título */}
          <h2 className={`text-xl font-black ${reasonConfig.accentColor} mb-3 tracking-wide uppercase`}>
            {reasonConfig.title}
          </h2>

          {/* Detalle del cambio (ej. ADMIN → USER) */}
          {kickInfo.detail && (
            <div className="mb-4 bg-[#1a1e29] border border-[#132d46] rounded-xl px-4 py-2.5 inline-flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-red-400 line-through">{kickInfo.detail.split(' → ')[0]}</span>
              <span className="text-slate-600">→</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{kickInfo.detail.split(' → ')[1]}</span>
            </div>
          )}

          {/* Mensaje descriptivo */}
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {reasonConfig.message}
          </p>

          {/* Barra de progreso + Countdown */}
          <div className="w-full space-y-3">
            <div className="w-full bg-[#132d46] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${kickInfo.reason === 'role_changed' ? 'bg-amber-500' :
                  kickInfo.reason === 'account_disabled' || kickInfo.reason === 'user_deleted' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                style={{ width: `${(countdown / 2) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-500">
              <LogOut size={14} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Sesión cerrada • Redirigiendo...
              </span>
            </div>
          </div>
        </div>

        {/* Branding sutil en el footer */}
        <div className="bg-[#1a1e29]/50 border-t border-[#132d46] px-6 py-3 text-center">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            SIFYGSA Fleet • Módulo de Seguridad
          </span>
        </div>
      </div>
    </div>
  );
}
