import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Lock, Send, Loader2 } from 'lucide-react';
import { RankingProgressEntry, RankingRequirement, Usuario } from '../../types';
import * as fs from '../../services/firestoreDb';
import { resolveRequirementDisplayStatus } from '../../services/clubaoSubmission';

interface CounselorRequirementsListProps {
  clubeId: string;
  quarterId: string;
  unitId: string;
  user: Usuario;
  requirements: RankingRequirement[];
  resultados: Record<string, RankingProgressEntry>;
  onChanged: () => void;
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  NONE: { label: 'Não enviado', className: 'text-gray-400 border-gray-700', icon: null },
  PENDING: { label: 'Aguardando validação', className: 'text-[#FFD60A] border-[#FFD60A]/40', icon: <Clock size={12} /> },
  APPROVED: { label: 'Aprovado', className: 'text-[#34D399] border-[#34D399]/40', icon: <CheckCircle2 size={12} /> },
  REJECTED: { label: 'Reprovado', className: 'text-[#F87171] border-[#F87171]/40', icon: <XCircle size={12} /> }
};

export const CounselorRequirementsList: React.FC<CounselorRequirementsListProps> = ({
  clubeId,
  quarterId,
  unitId,
  user,
  requirements,
  resultados,
  onChanged
}) => {
  const [drafts, setDrafts] = useState<Record<string, { observation: string; quantity: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const getDraft = (req: RankingRequirement) => {
    const entry = resultados[req.id];
    return (
      drafts[req.id] ?? {
        observation: entry?.submission?.observation ?? '',
        quantity: entry?.quantity != null ? String(entry.quantity) : ''
      }
    );
  };

  const setDraft = (reqId: string, patch: Partial<{ observation: string; quantity: string }>) => {
    setDrafts(prev => ({ ...prev, [reqId]: { ...getDraftRaw(reqId), ...patch } }));
  };
  const getDraftRaw = (reqId: string) =>
    drafts[reqId] ?? { observation: resultados[reqId]?.submission?.observation ?? '', quantity: '' };

  const submit = async (req: RankingRequirement) => {
    setBusyId(req.id);
    try {
      const draft = getDraft(req);
      await fs.submitRequirementByCounselor(
        clubeId,
        quarterId,
        unitId,
        req.id,
        {
          observation: draft.observation.trim() || undefined,
          quantity: req.requiresQuantity ? Number(draft.quantity) || 0 : undefined
        },
        { id: user.id, nome: user.nome }
      );
      onChanged();
    } catch (err) {
      console.error('Erro ao enviar requisito:', err);
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = async (req: RankingRequirement) => {
    setBusyId(req.id);
    try {
      await fs.withdrawRequirementSubmission(clubeId, quarterId, unitId, req.id);
      onChanged();
    } catch (err) {
      console.error('Erro ao retirar requisito:', err);
    } finally {
      setBusyId(null);
    }
  };

  if (requirements.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum requisito disponível para auto-declaração neste trimestre.</p>
    );
  }

  return (
    <div className="space-y-3">
      {requirements.map(req => {
        const entry = resultados[req.id];
        const status = resolveRequirementDisplayStatus(entry);
        const badge = STATUS_BADGE[status];
        const isApproved = status === 'APPROVED';
        const isPending = status === 'PENDING';
        const draft = getDraft(req);
        const busy = busyId === req.id;

        return (
          <div key={req.id} className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{req.category}</p>
                <p className="font-bold text-white">{req.name}</p>
                <p className="text-xs text-gray-400">{req.points} pts</p>
              </div>
              <span className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                {badge.icon}
                {badge.label}
              </span>
            </div>

            {status === 'REJECTED' && entry?.submission?.rejectionReason && (
              <p className="rounded-lg bg-[#F87171]/10 px-3 py-2 text-xs text-[#F87171]">
                Motivo: {entry.submission.rejectionReason}
              </p>
            )}

            {isApproved ? (
              <p className="flex items-center gap-2 text-xs text-[#34D399]">
                <Lock size={14} /> Aprovado pela diretoria — pontos aplicados ao ranking.
              </p>
            ) : (
              <>
                {req.requiresQuantity && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {req.quantityLabel || 'Quantidade'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draft.quantity}
                      onChange={e => setDraft(req.id, { quantity: e.target.value })}
                      className="mt-1 w-32 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#22D3EE] focus:outline-none"
                    />
                  </div>
                )}
                <textarea
                  placeholder="Observação (opcional)"
                  value={draft.observation}
                  onChange={e => setDraft(req.id, { observation: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#22D3EE] focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submit(req)}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-xl bg-[#22D3EE] px-4 py-2 text-sm font-black text-[#06222A] disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    {isPending ? 'Atualizar envio' : 'Enviar para validação'}
                  </button>
                  {(isPending || status === 'REJECTED') && (
                    <button
                      onClick={() => withdraw(req)}
                      disabled={busy}
                      className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-bold text-gray-300 disabled:opacity-50"
                    >
                      Retirar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
