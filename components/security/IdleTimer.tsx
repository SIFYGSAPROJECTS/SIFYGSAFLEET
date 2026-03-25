// components/security/IdleTimer.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function IdleTimer() {
  const router = useRouter();
 const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos en milisegundos

  const handleLogout = useCallback(async () => {
    try {
      // 1. Mandamos llamar a nuestra API para borrar las cookies
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Limpiamos almacenamiento local por seguridad
      localStorage.clear();
      
      // 3. Redirigimos al login y forzamos recarga para que el Middleware actúe
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  }, [router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Esta función reinicia el reloj a cero
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    // Lista de movimientos que consideramos "actividad"
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'click'
    ];

    // Le decimos al navegador que escuche estos movimientos
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Arrancamos el reloj por primera vez
    resetTimer();

    // Cuando el usuario sale del sistema, apagamos los escuchadores
    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [handleLogout]);

  // Este componente es un "fantasma", no dibuja nada en la pantalla
  return null; 
}