'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const checkVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
        tickingRef.current = false;
        return;
      }
      const scrollables = document.querySelectorAll('main, .overflow-y-auto, [data-scroll-container]');
      for (let i = 0; i < scrollables.length; i++) {
        if (scrollables[i].scrollTop > 300) {
          setIsVisible(true);
          tickingRef.current = false;
          return;
        }
      }
      setIsVisible(false);
      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(checkVisibility);
        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Escuchar el estado del SIFY Copilot
    const handleCopilotToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsCopilotOpen(Boolean(customEvent.detail));
    };
    window.addEventListener('copilot-toggle', handleCopilotToggle);

    // Initial check
    checkVisibility();

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as any);
      window.removeEventListener('copilot-toggle', handleCopilotToggle);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollables = document.querySelectorAll('main, .overflow-y-auto, [data-scroll-container]');
    scrollables.forEach((el) => {
      if (el.scrollTop > 0) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  if (!isVisible || isCopilotOpen) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className="fixed bottom-24 sm:bottom-28 right-6 sm:right-[34px] z-50 p-3 rounded-full bg-[#0f172a] text-white shadow-2xl border-2 border-[#fcd34d] hover:bg-[#1e293b] hover:scale-110 active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 focus:outline-none focus:ring-2 focus:ring-[#fcd34d] cursor-pointer"
    >
      <ArrowUp className="w-5 h-5 text-[#fcd34d]" />
    </button>
  );
}

