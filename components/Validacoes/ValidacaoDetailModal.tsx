import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import {
  AutoFrequenciaResult,
  Classe,
  Desbravador,
  RankingProgressEntry,
  RankingQuarter,
  RankingRequirement,
  RankingUnitProgressDoc,
  Unidade,
} from '../../types';
import { Modal } from '../Modal';
import { buildRankingProgressState, calculateRequirementBreakdown } from '../../services/ranking';
import { requirementId } from '../../services/validacoes';
import { FrequenciaAutoCard } from './FrequenciaAutoCard';
import { ManualValidacaoForm } from './ManualValidacaoForm';
import { DevocionallForm } from './DevocionallForm';
import { ClassesForm } from './ClassesForm';

interface ValidacaoDetailModalProps {
  quarter: RankingQuarter;
  unit: Unidade;
  requirements: RankingRequirement[];
  progress: RankingUnitProgressDoc | null;
  desbravadores: Desbravador[];
  classes: Classe[];
  autoFrequencia: AutoFrequenciaResult | null;
  canEdit: boolean;
  onSave: (resultados: Record<string, RankingProgressEntry>) => Promise<void>;
  onClose: () => void;
}

type ProgressState = Record<string, RankingProgressEntry>;

const MANUAL_TIPOS = ['frequencia-cultos', 'frequentar-pg', 'devocional-pessoal', 'classes'] as const;

export const ValidacaoDetailModal: React.FC<ValidacaoDetailModalProps> = ({
  quarter,
  unit,
  requirements,
  progress,
  desbravadores,
  classes,
  autoFrequencia,
  canEdit,
  onSave,
  onClose,
}) => {
  const [state, setState] = useState<ProgressState>({});
  const [saving, setSaving] = useState(false);

  const reqByTipo = useMemo(() => {
    const map = new Map<string, RankingRequirement>();
    requirements.forEach(r => map.set(r.id, r));
    return map;
  }, [requirements]);

  const findReq = (tipo: string) => reqByTipo.get(requirementId(quarter.number, tipo));

  useEffect(() => {
    const base = buildRankingProgressState(requirements, progress?.resultados);

    // Aplica auto-cálculo de frequência sobre os dois requisitos automáticos
    if (autoFrequencia) {
      const conselheirosReq = findReq('frequencia-conselheiros');
      if (conselheirosReq) {
        const hasAbsence = autoFrequencia.conselheiros.absences > 0;
        const entry: RankingProgressEntry = {
          ...base[conselheirosReq.id],
          completed: !hasAbsence,
          penaltyInput: hasAbsence ? 1 : 0,
          validacaoMeta: {
            autoCalculated: true,
            counselorAbsences: autoFrequencia.conselheiros.absences,
          },
        };
        const b = calculateRequirementBreakdown(conselheirosReq, entry);
        base[conselheirosReq.id] = { ...entry, ...b };
      }

      const reunioesReq = findReq('frequencia-reunioes-clube');
      if (reunioesReq) {
        const pct = autoFrequencia.reunioes.presencaPercent;
        const hasBase = autoFrequencia.reunioes.basePoints > 0;
        const entry: RankingProgressEntry = {
          ...base[reunioesReq.id],
          completed: hasBase,
          bonusInput: autoFrequencia.reunioes.bonusPoints > 0 ? 1 : 0,
          validacaoMeta: { autoCalculated: true, presencaPercent: pct },
        };
        const b = calculateRequirementBreakdown(reunioesReq, entry);
        base[reunioesReq.id] = { ...entry, ...b };
      }
    }

    setState(base);
  }, [requirements, progress, autoFrequencia, quarter.number]);

  const handleChange = (requirement: RankingRequirement, patch: Partial<RankingProgressEntry>) => {
    setState(prev => {
      const nextRow = { ...prev[requirement.id], ...patch } as RankingProgressEntry;
      const breakdown = calculateRequirementBreakdown(requirement, nextRow);
      return {
        ...prev,
        [requirement.id]: { ...nextRow, ...breakdown },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(state);
    } finally {
      setSaving(false);
    }
  };

  const conselheirosPoints = (() => {
    const r = findReq('frequencia-conselheiros');
    return r ? state[r.id]?.calculatedPoints ?? 0 : 0;
  })();
  const reunioesPoints = (() => {
    const r = findReq('frequencia-reunioes-clube');
    return r ? state[r.id]?.calculatedPoints ?? 0 : 0;
  })();

  const renderManualForm = (tipo: (typeof MANUAL_TIPOS)[number]) => {
    const req = findReq(tipo);
    if (!req) return null;
    const entry = state[req.id];
    const onChange = (patch: Partial<RankingProgressEntry>) => handleChange(req, patch);
    const points = entry?.calculatedPoints ?? 0;

    let body: React.ReactNode;
    if (tipo === 'devocional-pessoal') {
      body = <DevocionallForm requirement={req} entry={entry} desbravadores={desbravadores} disabled={!canEdit} onChange={onChange} />;
    } else if (tipo === 'classes') {
      body = <ClassesForm requirement={req} entry={entry} desbravadores={desbravadores} classes={classes} disabled={!canEdit} onChange={onChange} />;
    } else {
      body = <ManualValidacaoForm requirement={req} entry={entry} disabled={!canEdit} onChange={onChange} />;
    }

    return (
      <details key={req.id} open className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A]">
        <summary className="cursor-pointer px-4 py-3 flex items-center justify-between">
          <span className="font-black text-gray-100">{req.name}</span>
          <span className={`text-sm font-black ${points < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{points} pts</span>
        </summary>
        <div className="p-4 pt-0">{body}</div>
      </details>
    );
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Validações — ${unit.nome}`}
      icon={<ShieldCheck size={20} className="text-[#E53935]" />}
      maxWidthClassName="max-w-3xl"
    >
      <div className="space-y-5">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Frequência (automático)</p>
          <FrequenciaAutoCard auto={autoFrequencia} conselheirosPoints={conselheirosPoints} reunioesPoints={reunioesPoints} />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Validações manuais</p>
          {MANUAL_TIPOS.map(renderManualForm)}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#1F2937]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase tracking-widest text-gray-300"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canEdit}
            className="px-5 py-2 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Salvar validações
          </button>
        </div>
      </div>
    </Modal>
  );
};
