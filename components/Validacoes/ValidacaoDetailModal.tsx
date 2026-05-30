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
    rankingResultados: Record<string, RankingProgressEntry>,
    close?: boolean
  ) => Promise<void>;
  onClose: () => void;
}

type ValidationState = Record<string, ValidacaoResultadoEntry>;
type TabKey = 'frequencia' | 'cultos' | 'pg' | 'devocional' | 'classes';

const MANUAL_TIPOS = ['frequencia-cultos', 'frequentar-pg', 'devocional-pessoal', 'classes'] as const;
const AUTO_TIPOS = ['frequencia-conselheiros', 'frequencia-reunioes-clube'] as const;
const ALL_TIPOS = [...AUTO_TIPOS, ...MANUAL_TIPOS] as const;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'frequencia', label: 'Frequência' },
  { key: 'cultos', label: 'Cultos' },
  { key: 'pg', label: 'PG' },
  { key: 'devocional', label: 'Devocional' },
  { key: 'classes', label: 'Classes' },
];

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
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('frequencia');

  const reqByTipo = useMemo(() => {
    const map = new Map<string, RankingRequirement>();
    requirements.forEach(r => map.set(r.id, r));
    return map;
  }, [requirements]);

  const findReq = (tipo: string) => reqByTipo.get(requirementId(quarter.number, tipo));

  useEffect(() => {
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
      return { ...prev, [req.id]: toValidacaoEntry({ ...merged, ...breakdown }) };
    });
  };

  const toggleConfirm = (reqId: string) => {
    setConfirmed(prev => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId); else next.add(reqId);
      return next;
    });
  };

  const buildPayload = () => {
    const validacaoResultados: Record<string, ValidacaoResultadoEntry> = {};
    ALL_TIPOS.forEach(tipo => {
      const req = findReq(tipo);
      if (!req) return;
      validacaoResultados[req.id] = {
        ...state[req.id],
        validacaoMeta: { ...state[req.id]?.validacaoMeta, confirmadoRanking: confirmed.has(req.id) },
      };
    });
    const rankingResultados: Record<string, RankingProgressEntry> = {};
    confirmed.forEach(reqId => {
      if (state[reqId]) rankingResultados[reqId] = toRankingEntry(state[reqId]);
    });
    return { validacaoResultados, rankingResultados };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { validacaoResultados, rankingResultados } = buildPayload();
      await onSave(validacaoResultados, rankingResultados, false);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      const { validacaoResultados, rankingResultados } = buildPayload();
      await onSave(validacaoResultados, rankingResultados, true);
    } finally {
      setSaving(false);
    }
  };

  const conselheirosReq = findReq('frequencia-conselheiros');
  const reunioesReq = findReq('frequencia-reunioes-clube');
  const conselheirosPoints = conselheirosReq ? (state[conselheirosReq.id]?.calculatedPoints ?? 0) : 0;
  const reunioesPoints = reunioesReq ? (state[reunioesReq.id]?.calculatedPoints ?? 0) : 0;

  const confirmedCount = confirmed.size;
  const totalConfirmedPts = [...confirmed].reduce((sum, id) => sum + (state[id]?.calculatedPoints ?? 0), 0);

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
        {isConfirmed ? 'Confirmado' : 'Confirmar para ranking'}
      </button>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'frequencia': {
        return (
          <div className="space-y-4">
            <FrequenciaAutoCard
              auto={autoFrequencia}
              conselheirosPoints={conselheirosPoints}
              reunioesPoints={reunioesPoints}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {conselheirosReq && (
                <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-gray-300">Conselheiros</p>
                    <p className={`text-lg font-black ${conselheirosPoints < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{conselheirosPoints} pts</p>
                  </div>
                  {renderConfirmToggle(conselheirosReq.id)}
                </div>
              )}
              {reunioesReq && (
                <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-gray-300">Reuniões do Clube</p>
                    <p className={`text-lg font-black ${reunioesPoints < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{reunioesPoints} pts</p>
                  </div>
                  {reunioesReq && renderConfirmToggle(reunioesReq.id)}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'cultos':
      case 'pg': {
        const tipo = activeTab === 'cultos' ? 'frequencia-cultos' : 'frequentar-pg';
        const req = findReq(tipo);
        if (!req) return <p className="text-sm text-gray-500 text-center py-8">Requisito não encontrado.</p>;
        const entry = state[req.id];
        const points = entry?.calculatedPoints ?? 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xl font-black ${points > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>{points} pts</span>
              {renderConfirmToggle(req.id)}
            </div>
            <ManualValidacaoForm
              requirement={req}
              entry={entry ? toRankingEntry(entry) : undefined}
              desbravadores={desbravadores}
              disabled={!canEdit}
              onChange={p => handleChange(req, p)}
            />
          </div>
        );
      }

      case 'devocional': {
        const req = findReq('devocional-pessoal');
        if (!req) return <p className="text-sm text-gray-500 text-center py-8">Requisito não encontrado.</p>;
        const entry = state[req.id];
        const points = entry?.calculatedPoints ?? 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xl font-black ${points > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>{points} pts</span>
              {renderConfirmToggle(req.id)}
            </div>
            <DevocionallForm
              requirement={req}
              entry={entry ? toRankingEntry(entry) : undefined}
              desbravadores={desbravadores}
              disabled={!canEdit}
              onChange={p => handleChange(req, p)}
            />
          </div>
        );
      }

      case 'classes': {
        const req = findReq('classes');
        if (!req) return <p className="text-sm text-gray-500 text-center py-8">Requisito não encontrado.</p>;
        const entry = state[req.id];
        const points = entry?.calculatedPoints ?? 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xl font-black ${points > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>{points} pts</span>
              {renderConfirmToggle(req.id)}
            </div>
            <ClassesForm
              requirement={req}
              entry={entry ? toRankingEntry(entry) : undefined}
              desbravadores={desbravadores}
              classes={classes}
              disabled={!canEdit}
              onChange={p => handleChange(req, p)}
            />
          </div>
        );
      }
    }
  };

  const getTabPoints = (tab: TabKey): number => {
    const tipoMap: Record<TabKey, string[]> = {
      frequencia: ['frequencia-conselheiros', 'frequencia-reunioes-clube'],
      cultos: ['frequencia-cultos'],
      pg: ['frequentar-pg'],
      devocional: ['devocional-pessoal'],
      classes: ['classes'],
    };
    return tipoMap[tab].reduce((sum, tipo) => {
      const req = findReq(tipo);
      return sum + (req ? (state[req.id]?.calculatedPoints ?? 0) : 0);
    }, 0);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Validações — ${unit.nome}`} icon={<ShieldCheck size={20} className="text-[#E53935]" />} maxWidthClassName="max-w-2xl">
      <div className="space-y-4">

        {/* Abas */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const pts = getTabPoints(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'bg-[#E53935]/15 border border-[#E53935]/40 text-[#E53935]'
                    : 'bg-[#111827] border border-[#1F2937] text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
                {pts !== 0 && (
                  <span className={`ml-1.5 ${pts > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pts > 0 ? `+${pts}` : pts}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conteúdo da aba */}
        <div className="min-h-[280px]">
          {renderTabContent()}
        </div>

        {/* Resumo confirmados */}
        {confirmedCount > 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
              <CheckCircle2 size={16} />
              {confirmedCount} confirmada(s) para o ranking
            </div>
            <span className="font-black text-emerald-300">{totalConfirmedPts} pts</span>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1F2937]">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase tracking-widest text-gray-300">
              Fechar
            </button>
            {savedAt && (
              <span className="text-[11px] text-emerald-400 font-bold">
                ✓ Salvo às {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving || !canEdit}
              className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase tracking-widest text-gray-300 disabled:opacity-60 flex items-center gap-2 hover:border-gray-500"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Salvar rascunho
            </button>
            <button
              onClick={handleSaveAndClose}
              disabled={saving || !canEdit}
              className="px-5 py-2 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
              Salvar e fechar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
