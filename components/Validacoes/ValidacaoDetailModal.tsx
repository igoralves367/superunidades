import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Save, ShieldCheck } from 'lucide-react';
import {
  AutoFrequenciaResult,
  Classe,
  Desbravador,
  RankingProgressEntry,
  RankingQuarter,
  RankingRequirement,
  RankingUnitProgressDoc,
  Unidade,
  ValidacaoResultadoEntry,
  ValidacaoUnitDoc,
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
  rankingProgress: RankingUnitProgressDoc | null;
  validacaoDoc: ValidacaoUnitDoc | null;
  desbravadores: Desbravador[];
  classes: Classe[];
  autoFrequencia: AutoFrequenciaResult | null;
  canEdit: boolean;
  onSave: (
    validacaoResultados: Record<string, ValidacaoResultadoEntry>,
    rankingResultados: Record<string, RankingProgressEntry>
  ) => Promise<void>;
  onClose: () => void;
}

type ValidationState = Record<string, ValidacaoResultadoEntry>;

const MANUAL_TIPOS = ['frequencia-cultos', 'frequentar-pg', 'devocional-pessoal', 'classes'] as const;
const AUTO_TIPOS = ['frequencia-conselheiros', 'frequencia-reunioes-clube'] as const;
const ALL_TIPOS = [...AUTO_TIPOS, ...MANUAL_TIPOS] as const;

function toValidacaoEntry(entry: RankingProgressEntry): ValidacaoResultadoEntry {
  return {
    requirementId: entry.requirementId,
    completed: entry.completed,
    quantity: entry.quantity,
    bonusInput: entry.bonusInput,
    penaltyInput: entry.penaltyInput,
    basePoints: entry.basePoints,
    bonusPoints: entry.bonusPoints,
    penaltyPoints: entry.penaltyPoints,
    calculatedPoints: entry.calculatedPoints,
    notes: entry.notes,
    validacaoMeta: entry.validacaoMeta,
  };
}

function toRankingEntry(entry: ValidacaoResultadoEntry): RankingProgressEntry {
  return {
    requirementId: entry.requirementId,
    completed: entry.completed,
    quantity: entry.quantity,
    bonusInput: entry.bonusInput ?? 0,
    penaltyInput: entry.penaltyInput ?? 0,
    basePoints: entry.basePoints,
    bonusPoints: entry.bonusPoints,
    penaltyPoints: entry.penaltyPoints,
    calculatedPoints: entry.calculatedPoints,
    notes: entry.notes,
    validacaoMeta: entry.validacaoMeta,
  };
}

export const ValidacaoDetailModal: React.FC<ValidacaoDetailModalProps> = ({
  quarter,
  unit,
  requirements,
  rankingProgress,
  validacaoDoc,
  desbravadores,
  classes,
  autoFrequencia,
  canEdit,
  onSave,
  onClose,
}) => {
  const [state, setState] = useState<ValidationState>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const reqByTipo = useMemo(() => {
    const map = new Map<string, RankingRequirement>();
    requirements.forEach(r => map.set(r.id, r));
    return map;
  }, [requirements]);

  const findReq = (tipo: string) => reqByTipo.get(requirementId(quarter.number, tipo));

  useEffect(() => {
    // Inicializar a partir do doc de validação (rascunho) ou do ranking (já confirmados)
    const base = buildRankingProgressState(requirements, rankingProgress?.resultados);
    const draft: ValidationState = {};

    ALL_TIPOS.forEach(tipo => {
      const req = findReq(tipo);
      if (!req) return;
      const saved = validacaoDoc?.resultados[req.id];
      if (saved) {
        draft[req.id] = saved;
      } else {
        draft[req.id] = toValidacaoEntry(base[req.id] || {
          requirementId: req.id,
          completed: false,
          basePoints: 0,
          bonusPoints: 0,
          penaltyPoints: 0,
          calculatedPoints: 0,
        });
      }
    });

    // Auto-cálculo para frequência
    if (autoFrequencia) {
      const conselheirosReq = findReq('frequencia-conselheiros');
      if (conselheirosReq) {
        const hasAbsence = autoFrequencia.conselheiros.absences > 0;
        const rankingEntry: RankingProgressEntry = {
          ...base[conselheirosReq.id],
          completed: !hasAbsence,
          penaltyInput: hasAbsence ? 1 : 0,
          validacaoMeta: { autoCalculated: true, counselorAbsences: autoFrequencia.conselheiros.absences },
        };
        const b = calculateRequirementBreakdown(conselheirosReq, rankingEntry);
        draft[conselheirosReq.id] = toValidacaoEntry({ ...rankingEntry, ...b });
      }
      const reunioesReq = findReq('frequencia-reunioes-clube');
      if (reunioesReq) {
        const pct = autoFrequencia.reunioes.presencaPercent;
        const hasBase = autoFrequencia.reunioes.basePoints > 0;
        const rankingEntry: RankingProgressEntry = {
          ...base[reunioesReq.id],
          completed: hasBase,
          bonusInput: autoFrequencia.reunioes.bonusPoints > 0 ? 1 : 0,
          validacaoMeta: { autoCalculated: true, presencaPercent: pct },
        };
        const b = calculateRequirementBreakdown(reunioesReq, rankingEntry);
        draft[reunioesReq.id] = toValidacaoEntry({ ...rankingEntry, ...b });
      }
    }

    setState(draft);

    // Pré-marcar como confirmados os que já foram aplicados ao ranking
    const alreadyConfirmed = new Set<string>();
    ALL_TIPOS.forEach(tipo => {
      const req = findReq(tipo);
      if (!req) return;
      if (validacaoDoc?.resultados[req.id]?.validacaoMeta?.confirmadoRanking) {
        alreadyConfirmed.add(req.id);
      }
    });
    setConfirmed(alreadyConfirmed);
  }, [requirements, rankingProgress, validacaoDoc, autoFrequencia, quarter.number]);

  const handleChange = (req: RankingRequirement, patch: Partial<RankingProgressEntry>) => {
    setState(prev => {
      const current = prev[req.id];
      const merged: RankingProgressEntry = { ...toRankingEntry(current), ...patch };
      const breakdown = calculateRequirementBreakdown(req, merged);
      return {
        ...prev,
        [req.id]: toValidacaoEntry({ ...merged, ...breakdown }),
      };
    });
  };

  const toggleConfirm = (reqId: string) => {
    setConfirmed(prev => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validações: salva tudo + flag confirmado por entry
      const validacaoResultados: Record<string, ValidacaoResultadoEntry> = {};
      ALL_TIPOS.forEach(tipo => {
        const req = findReq(tipo);
        if (!req) return;
        validacaoResultados[req.id] = {
          ...state[req.id],
          validacaoMeta: {
            ...state[req.id]?.validacaoMeta,
            confirmadoRanking: confirmed.has(req.id),
          },
        };
      });

      // Ranking: só os confirmados
      const rankingResultados: Record<string, RankingProgressEntry> = {};
      confirmed.forEach(reqId => {
        if (state[reqId]) rankingResultados[reqId] = toRankingEntry(state[reqId]);
      });

      await onSave(validacaoResultados, rankingResultados);
    } finally {
      setSaving(false);
    }
  };

  const conselheirosReq = findReq('frequencia-conselheiros');
  const reunioesReq = findReq('frequencia-reunioes-clube');
  const conselheirosPoints = conselheirosReq ? (state[conselheirosReq.id]?.calculatedPoints ?? 0) : 0;
  const reunioesPoints = reunioesReq ? (state[reunioesReq.id]?.calculatedPoints ?? 0) : 0;

  const renderConfirmToggle = (reqId: string) => {
    const isConfirmed = confirmed.has(reqId);
    return (
      <button
        type="button"
        onClick={() => toggleConfirm(reqId)}
        disabled={!canEdit}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors disabled:opacity-60 ${
          isConfirmed
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            : 'bg-[#111827] border border-[#1F2937] text-gray-400 hover:border-gray-500'
        }`}
      >
        {isConfirmed ? <CheckCircle2 size={13} /> : <Circle size={13} />}
        {isConfirmed ? 'Confirmado para ranking' : 'Confirmar para ranking'}
      </button>
    );
  };

  const renderAutoSection = (tipo: (typeof AUTO_TIPOS)[number], label: string, points: number) => {
    const req = findReq(tipo);
    if (!req) return null;
    return (
      <div key={tipo} className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-black text-gray-100 text-sm">{label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${points < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{points} pts</span>
            {renderConfirmToggle(req.id)}
          </div>
        </div>
      </div>
    );
  };

  const renderManualForm = (tipo: (typeof MANUAL_TIPOS)[number]) => {
    const req = findReq(tipo);
    if (!req) return null;
    const entry = state[req.id];
    const rankingEntry = entry ? toRankingEntry(entry) : undefined;
    const points = entry?.calculatedPoints ?? 0;

    let body: React.ReactNode;
    if (tipo === 'devocional-pessoal') {
      body = <DevocionallForm requirement={req} entry={rankingEntry} desbravadores={desbravadores} disabled={!canEdit} onChange={p => handleChange(req, p)} />;
    } else if (tipo === 'classes') {
      body = <ClassesForm requirement={req} entry={rankingEntry} desbravadores={desbravadores} classes={classes} disabled={!canEdit} onChange={p => handleChange(req, p)} />;
    } else {
      body = <ManualValidacaoForm requirement={req} entry={rankingEntry} disabled={!canEdit} onChange={p => handleChange(req, p)} />;
    }

    return (
      <details key={req.id} open className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A]">
        <summary className="cursor-pointer px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="font-black text-gray-100">{req.name}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${points < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{points} pts</span>
            {renderConfirmToggle(req.id)}
          </div>
        </summary>
        <div className="p-4 pt-2">{body}</div>
      </details>
    );
  };

  const confirmedCount = confirmed.size;
  const totalConfirmedPts = [...confirmed].reduce((sum, id) => sum + (state[id]?.calculatedPoints ?? 0), 0);

  return (
    <Modal isOpen onClose={onClose} title={`Validações — ${unit.nome}`} icon={<ShieldCheck size={20} className="text-[#E53935]" />} maxWidthClassName="max-w-3xl">
      <div className="space-y-5">

        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Frequência (calculado automaticamente)</p>
          <FrequenciaAutoCard auto={autoFrequencia} conselheirosPoints={conselheirosPoints} reunioesPoints={reunioesPoints} />
          <div className="flex gap-2 mt-2 flex-wrap">
            {conselheirosReq && renderAutoSection('frequencia-conselheiros', 'Conselheiros', conselheirosPoints)}
            {reunioesReq && renderAutoSection('frequencia-reunioes-clube', 'Reuniões do Clube', reunioesPoints)}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Validações manuais</p>
          {MANUAL_TIPOS.map(renderManualForm)}
        </div>

        {confirmedCount > 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
              <CheckCircle2 size={16} />
              {confirmedCount} validação(ões) confirmada(s) para o ranking
            </div>
            <span className="font-black text-emerald-300">{totalConfirmedPts} pts</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#1F2937]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase tracking-widest text-gray-300">
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
