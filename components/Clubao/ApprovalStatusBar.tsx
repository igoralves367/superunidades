import React, { useState } from 'react';
import { CheckCircle2, Clock, Send, XCircle, Loader2 } from 'lucide-react';
import { PerfilAcesso, RankingApprovalMeta, RankingApprovalStatus } from '../../types';

interface ApprovalStatusBarProps {
  status: RankingApprovalStatus;
  approvalMeta?: RankingApprovalMeta;
  perfil: PerfilAcesso;
  onSubmit: () => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
}

const statusConfig: Record<RankingApprovalStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pendente',
    color: 'text-gray-400',
    bg: 'bg-gray-800/50',
    border: 'border-gray-600/30',
    icon: <Clock size={14} />
  },
  SUBMITTED: {
    label: 'Aguardando aprovação',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    icon: <Send size={14} />
  },
  APPROVED: {
    label: 'Aprovado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 size={14} />
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    icon: <XCircle size={14} />
  }
};

export const ApprovalStatusBar: React.FC<ApprovalStatusBarProps> = ({
  status,
  approvalMeta,
  perfil,
  onSubmit,
  onApprove,
  onReject
}) => {
  const [loading, setLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const config = statusConfig[status];
  const isConselheiro = perfil === PerfilAcesso.CONSELHEIRO;
  const isDiretoria = perfil === PerfilAcesso.DIRETORIA;

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  const handleReject = async () => {
    await handle(() => onReject(rejectionReason.trim() || undefined));
    setShowRejectInput(false);
    setRejectionReason('');
  };

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
      <div className="flex items-center gap-3">
        <span className={`${config.color} flex items-center gap-1.5 font-black text-xs uppercase tracking-widest`}>
          {config.icon}
          {config.label}
        </span>
        {status === 'REJECTED' && approvalMeta?.rejectionReason && (
          <span className="text-xs text-red-300 font-medium">— {approvalMeta.rejectionReason}</span>
        )}
        {status === 'SUBMITTED' && approvalMeta?.submittedBy && (
          <span className="text-xs text-gray-400">por {approvalMeta.submittedBy.nome}</span>
        )}
        {status === 'APPROVED' && approvalMeta?.reviewedBy && (
          <span className="text-xs text-gray-400">por {approvalMeta.reviewedBy.nome}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isConselheiro && (status === 'PENDING' || status === 'REJECTED') && (
          <button
            onClick={() => handle(onSubmit)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-yellow-500 text-black text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
            Enviar para aprovação
          </button>
        )}

        {isDiretoria && status === 'SUBMITTED' && !showRejectInput && (
          <>
            <button
              onClick={() => handle(onApprove)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
              Aprovar
            </button>
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-700/50 text-red-300 border border-red-500/30 text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
            >
              <XCircle size={12} />
              Rejeitar
            </button>
          </>
        )}

        {isDiretoria && status === 'REJECTED' && !showRejectInput && (
          <>
            <button
              onClick={() => handle(onApprove)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
              Aprovar mesmo assim
            </button>
          </>
        )}

        {showRejectInput && (
          <div className="flex gap-2 items-center w-full">
            <input
              autoFocus
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Motivo da rejeição (opcional)"
              className="flex-1 bg-[#0B0F1A] border border-red-500/30 rounded-xl px-3 py-2 text-sm font-bold text-gray-200"
            />
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-red-700 text-white text-xs font-black disabled:opacity-60 flex items-center gap-1"
            >
              {loading ? <Loader2 className="animate-spin" size={12} /> : 'Confirmar'}
            </button>
            <button
              onClick={() => { setShowRejectInput(false); setRejectionReason(''); }}
              className="px-3 py-2 rounded-xl border border-gray-600 text-gray-400 text-xs font-black"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
