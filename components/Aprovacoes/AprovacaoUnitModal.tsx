import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade, Usuario } from '../../types';
import * as fs from '../../services/firestoreDb';

interface AprovacaoUnitModalProps {
  clubeId: string;
  user: Usuario;
  quarter: RankingQuarter;
  unit: Unidade;
  requirements: RankingRequirement[];
  doc: RankingUnitProgressDoc | null;
  onClose: () => void;
  onReviewed: () => void;
}

export const AprovacaoUnitModal: React.FC<AprovacaoUnitModalProps> = ({
  clubeId,
  user,
  quarter,
  unit,
  requirements,
  doc,
  onClose,
  onReviewed
}) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const resultados = doc?.resultados ?? {};

  // Apenas requisitos que o conselheiro enviou (têm submission).
  const submitted = requirements
    .filter(r => resultados[r.id]?.submission)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const review = async (req: RankingRequirement, decision: 'APPROVE' | 'REJECT') => {
    setBusyId(req.id);
    try {
      await fs.reviewRequirementSubmission(
        clubeId,
        quarter.id,
        unit.id,
        req,
        decision,
        { id: user.id, nome: user.nome },
        decision === 'REJECT' ? rejectReasons[req.id]?.trim() || undefined : undefined
      );
      onReviewed();
    } catch (err) {
      console.error('Erro ao revisar requisito:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">{unit.nome}</h2>
            <p className="text-xs text-gray-400">{quarter.name} — validação de requisitos</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {submitted.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum requisito enviado por esta unidade.</p>
          )}
          {submitted.map(req => {
            const entry = resultados[req.id];
            const status = entry?.submission?.status;
            const busy = busyId === req.id;
            return (
              <div key={req.id} className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{req.category}</p>
                    <p className="font-bold text-white">{req.name}</p>
                    <p className="text-xs text-gray-400">{req.points} pts{req.requiresQuantity && entry?.quantity != null ? ` · qtd: ${entry.quantity}` : ''}</p>
                  </div>
                  {status === 'PENDING' && <span className="flex items-center gap-1 text-xs font-bold text-[#FFD60A]"><Clock size={14} />Pendente</span>}
                  {status === 'APPROVED' && <span className="flex items-center gap-1 text-xs font-bold text-[#34D399]"><CheckCircle2 size={14} />Aprovado</span>}
                  {status === 'REJECTED' && <span className="flex items-center gap-1 text-xs font-bold text-[#F87171]"><XCircle size={14} />Reprovado</span>}
                </div>

                {entry?.submission?.observation && (
                  <p className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-300">
                    <span className="font-bold text-gray-400">Conselheiro: </span>
                    {entry.submission.observation}
                  </p>
                )}

                <textarea
                  placeholder="Motivo da reprovação (opcional)"
                  value={rejectReasons[req.id] ?? ''}
                  onChange={e => setRejectReasons(prev => ({ ...prev, [req.id]: e.target.value }))}
                  rows={1}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-[#F87171] focus:outline-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => review(req, 'APPROVE')}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-xl bg-[#34D399] px-4 py-2 text-sm font-black text-[#06291D] disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    Aprovar
                  </button>
                  <button
                    onClick={() => review(req, 'REJECT')}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-xl border border-[#F87171]/50 px-4 py-2 text-sm font-bold text-[#F87171] disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Reprovar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
