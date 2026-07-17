'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, AlertCircle } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuración del worker necesaria para react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MobilePDFViewerProps {
  url: string;
}

export default function MobilePDFViewer({ url }: MobilePDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      // Ajustamos el ancho al tamaño de la pantalla menos el padding
      setContainerWidth(Math.min(window.innerWidth - 32, 600)); 
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error al cargar PDF:", error);
    setError("No se pudo previsualizar el documento.");
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--bg-screen)] flex flex-col items-center py-4">
      {error ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-stone-500">
          <AlertCircle size={32} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-stone-500">
              <Loader2 size={32} className="animate-spin text-amber-500" />
              <p className="text-sm font-medium animate-pulse">Cargando visualizador...</p>
            </div>
          }
        >
          {Array.from(new Array(numPages || 0), (el, index) => (
            <div key={`page_${index + 1}`} className="mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg overflow-hidden bg-white mx-4 flex justify-center">
              <Page 
                pageNumber={index + 1} 
                width={containerWidth} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
