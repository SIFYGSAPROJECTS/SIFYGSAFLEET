'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MobilePDFViewer = dynamic(() => import('./MobilePDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-stone-500 bg-stone-50">
      <Loader2 size={32} className="animate-spin text-amber-500" />
      <p className="text-sm font-medium animate-pulse">Cargando motor PDF...</p>
    </div>
  ),
});

export default function DynamicMobilePDFViewer({ url }: { url: string }) {
  return <MobilePDFViewer url={url} />;
}
