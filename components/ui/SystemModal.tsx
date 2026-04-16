import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'warning' | 'confirm' | 'info';

interface SystemModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
}

export default function SystemModal({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Continuar',
  cancelText = 'Cancelar',
  isProcessing = false
}: SystemModalProps) {
  
  if (!isOpen) return null;

  // Renderizado Condicional por Tipo para que Tailwind compile clases estáticas
  const styles = {
    success: {
      icon: <CheckCircle className="text-emerald-500 w-8 h-8" />,
      container: "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
      defaultConfirm: "Entendido"
    },
    error: {
      icon: <XCircle className="text-red-500 w-8 h-8" />,
      container: "bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
      btn: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
      defaultConfirm: "Cerrar"
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500 w-8 h-8" />,
      container: "bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]",
      btn: "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-600/20",
      defaultConfirm: "Entendido"
    },
    confirm: {
      icon: <HelpCircle className="text-[#01c38e] w-8 h-8" />,
      container: "bg-[#01c38e]/10 border-[#01c38e]/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
      btn: "bg-[#01ac7c] hover:bg-indigo-700 shadow-[#01ac7c]/20",
      defaultConfirm: "Sí, continuar"
    },
    info: {
      icon: <Info className="text-blue-500 w-8 h-8" />,
      container: "bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
      defaultConfirm: "Entendido"
    }
  };

  const currentTheme = styles[type];
  const finalConfirmText = confirmText === 'Continuar' ? currentTheme.defaultConfirm : confirmText;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#132d46] border border-[#132d46] rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in-95">
        
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border ${currentTheme.container}`}>
          {currentTheme.icon}
        </div>
        
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        
        <div className="text-slate-400 text-sm mb-6 leading-relaxed">
          {message}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {onCancel && (
            <button 
              onClick={onCancel} 
              disabled={isProcessing} 
              className="flex-1 bg-[#1a1e29] border border-slate-700 hover:bg-[#132d46] text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              {cancelText}
            </button>
          )}

          {onConfirm && (
            <button 
              onClick={onConfirm} 
              disabled={isProcessing} 
              className={`flex-1 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg ${currentTheme.btn}`}
            >
              {isProcessing ? 'Procesando...' : finalConfirmText}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
