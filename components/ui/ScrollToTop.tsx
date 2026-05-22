'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.addEventListener('scroll', () => {
        if (mainContainer.scrollTop > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }, { passive: true });
    }

    // Escuchar el estado del SIFY Copilot
    const handleCopilotToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsCopilotOpen(customEvent.detail);
    };
    window.addEventListener('copilot-toggle', handleCopilotToggle);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', toggleVisibility);
      }
      window.removeEventListener('copilot-toggle', handleCopilotToggle);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {isVisible && !isCopilotOpen && (
        <button
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className="fixed bottom-28 right-[34px] z-[40] p-3 rounded-full bg-[#0f172a] text-white shadow-2xl border-2 border-[#fcd34d] hover:bg-[#1e293b] hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 focus:outline-none"
        >
          <ArrowUp className="w-5 h-5 text-[#fcd34d]" />
        </button>
      )}
    </>
  );
}
