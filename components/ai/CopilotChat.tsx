'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Download, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';

interface Message {
  role: 'user' | 'model';
  content: string;
  excelBase64?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hola, soy SIFY Copilot. ¿En qué te puedo ayudar con la flota hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Emitir evento para que otros componentes sepan si el chat está abierto
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('copilot-toggle', { detail: isOpen }));
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: data.text,
        excelBase64: data.excelBase64,
        fileUrl: data.fileUrl,
        fileName: data.fileName
      }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (base64: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Flota_SIFYGSA_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0f172a] hover:bg-[#1e293b] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center border-2 border-[#fcd34d]"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center border-b-4 border-[#fcd34d]">
            <div className="flex items-center gap-2">
              <Bot size={24} className="text-[#fcd34d]" />
              <h3 className="font-bold font-serif tracking-wide">SIFY Asistente IA</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300">
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#0f172a] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                  {/* Formatear texto simple */}
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Botón de Excel si viene en la respuesta */}
                  {msg.excelBase64 && (
                    <button
                      onClick={() => handleDownload(msg.excelBase64!)}
                      className="mt-3 flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-bold transition-colors"
                    >
                      <Download size={18} /> Descargar Reporte
                    </button>
                  )}

                  {/* Botón de Archivo Directo (PDF, Factura, etc.) */}
                  {msg.fileUrl && (
                    <a 
                      href={msg.fileUrl}
                      download={msg.fileName || 'documento'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-bold transition-colors no-underline"
                    >
                      <Download size={18} /> Descargar {msg.fileName || 'Archivo'}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-500">
                  <Loader2 size={16} className="animate-spin" /> Analizando datos...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregúntale a SIFY Copilot..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-[#0f172a] text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-[#0f172a] text-[#fcd34d] p-2 rounded-full hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
