import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Save, Star } from 'lucide-react';
import { Usuario, Unidade, RankingQuarter, RankingRequirement, RankingProgressEntry, RankingUnitProgressDoc } from '../types';
import * as fs from '../services/firestoreDb';
import {
  buildRankingProgressState,
  buildRankingRows,
  calculateRequirementBreakdown,
  calculateRankingTotals,
  getRequirementRuleLabel
} from '../services/ranking';

interface ClubaoProps {
  user: Usuario;
}

type ProgressState = Record<string, RankingProgressEntry>;

const formatNumber = (n: number) => n.toLocaleString('pt-BR');

const fallbackAvatar = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const groupByCategory = (requirements: RankingRequirement[]) => {
  const map = new Map<string, RankingRequirement[]>();
  requirements.forEach(requirement => {
    const list = map.get(requirement.category) || [];
    list.push(requirement);
    map.set(requirement.category, list);
  });
  return [...map.entries()];
};

const calcStars = (percent: number) => {
  if (percent >= 0.8) return 5;
  if (percent >= 0.6) return 4;
  return 3;
};

const allowsCompletionToggle = (requirement: RankingRequirement) =>
  requirement.ruleType === 'BOOLEAN' ||
  requirement.ruleType === 'BOOLEAN_WITH_BONUS' ||
  requirement.ruleType === 'BOOLEAN_WITH_PENALTY';

const supportsManualScore = (requirement: RankingRequirement) => requirement.ruleType === 'MANUAL_SCORE';

const bonusInputLabel = (requirement: RankingRequirement) => {
  if (!requirement.allowBonus) return '';
  if (requirement.bonusType === 'PER_UNIT') return 'Qtd. bônus';
  return 'Bônus';
};

const penaltyInputLabel = (requirement: RankingRequirement) => {
  if (!requirement.allowPenalty) return '';
  if (requirement.penaltyType === 'PER_UNIT') return 'Qtd. penalidade';
  if (requirement.penaltyType === 'MANUAL') return 'Penalidade';
  return 'Aplicar penalidade';
};

export const Clubao: React.FC<ClubaoProps> = ({ user }) => {
  const clubId = user.clubeId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [quarters, setQuarters] = useState<RankingQuarter[]>([]);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unidade | null>(null);
  const [state, setState] = useState<ProgressState>({});
  const [filter, setFilter] = useState('');
  const [requirementFilter, setRequirementFilter] = useState('');

  const loadBase = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [fetchedUnits, fetchedQuarters] = await Promise.all([
        fs.listUnidades(clubId),
        fs.listRankingQuarters(clubId)
      ]);

      const eligibleUnits = fetchedUnits.filter(unit => unit.ativo && unit.tipo !== 'DIRETORIA');
      const activeQuarter =
        fetchedQuarters.find(quarter => quarter.ativo && quarter.status === 'ACTIVE') ||
        fetchedQuarters.find(quarter => quarter.ativo && quarter.status === 'CLOSED') ||
        fetchedQuarters.find(quarter => quarter.ativo) ||
        null;

      setUnidades(eligibleUnits);
      setQuarters(fetchedQuarters.filter(quarter => quarter.ativo));

      if (activeQuarter) {
        setSelectedQuarterId(prev => prev || activeQuarter.id);
      }

    } finally {
      setLoading(false);
    }
  };

  const loadQuarterData = async (quarterId: string) => {
    if (!clubId || !quarterId) return;
    setLoading(true);
    try {
      const fetchedRequirements = await fs.listRankingRequirements(clubId, quarterId);
      await fs.syncLegacyClubaoToRanking(clubId, quarterId, fetchedRequirements.filter(requirement => requirement.active));
      const fetchedDocs = await fs.listRankingProgress(clubId, quarterId);

      setRequirements(fetchedRequirements.filter(requirement => requirement.active));
      setProgressDocs(fetchedDocs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, [clubId]);

  useEffect(() => {
    if (selectedQuarterId) {
      loadQuarterData(selectedQuarterId);
    }
  }, [clubId, selectedQuarterId]);

  const currentDoc = useMemo(
    () => progressDocs.find(doc => doc.quarterId === selectedQuarterId && doc.unitId === selectedUnitId),
    [progressDocs, selectedQuarterId, selectedUnitId]
  );

  useEffect(() => {
    setSelectedUnit(unidades.find(unit => unit.id === selectedUnitId) || null);
  }, [unidades, selectedUnitId]);

  useEffect(() => {
    setState(buildRankingProgressState(requirements, currentDoc?.resultados));
  }, [requirements, currentDoc]);

  const ranking = useMemo(() => {
    const filteredUnits = unidades.filter(unit => unit.nome.toLowerCase().includes(filter.toLowerCase()));
    return buildRankingRows(filteredUnits, requirements, progressDocs);
  }, [unidades, requirements, progressDocs, filter]);

  const filteredRequirements = useMemo(() => {
    const query = requirementFilter.trim().toLowerCase();
    if (!query) return requirements;

    return requirements.filter(requirement =>
      [requirement.name, requirement.description, requirement.category, requirement.bonusDescription, requirement.penaltyDescription]
        .filter(Boolean)
        .some(value => (value || '').toLowerCase().includes(query))
    );
  }, [requirements, requirementFilter]);
  const groupedRequirements = useMemo(() => groupByCategory(filteredRequirements), [filteredRequirements]);
  const selectedQuarter = useMemo(
    () => quarters.find(quarter => quarter.id === selectedQuarterId) || null,
    [quarters, selectedQuarterId]
  );
  const selectedTotals = useMemo(() => calculateRankingTotals(requirements, state), [requirements, state]);
  const selectedProgressPercent = requirements.length > 0 ? selectedTotals.completedCount / requirements.length : 0;
  const selectedStars = calcStars(selectedProgressPercent);

  const handleChange = (requirement: RankingRequirement, patch: Partial<RankingProgressEntry>) => {
    setState(prev => {
      const nextRow = {
        ...prev[requirement.id],
        ...patch
      } as RankingProgressEntry;
      const breakdown = calculateRequirementBreakdown(requirement, nextRow);

      return {
        ...prev,
        [requirement.id]: {
          ...nextRow,
          basePoints: breakdown.basePoints,
          bonusPoints: breakdown.bonusPoints,
          penaltyPoints: breakdown.penaltyPoints,
          calculatedPoints: breakdown.calculatedPoints
        }
      };
    });
  };

  const handleSaveUnit = async () => {
    if (!clubId || !selectedQuarterId || !selectedUnitId) return;
    setSaving(true);
    try {
      await fs.saveRankingUnitProgress(clubId, selectedQuarterId, selectedUnitId, state, {
        id: user.id,
        nome: user.nome,
        email: user.email
      });
      await loadQuarterData(selectedQuarterId);
      alert('Unidade salva com sucesso.');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar a unidade.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && quarters.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-[#E53935]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Clubão de Unidades</h1>
          <p className="text-gray-400 font-medium">
            Lançamento do trimestre atual com reflexo direto no ranking público
          </p>
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Filtrar unidade..."
            className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-4 py-2 text-sm"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          {selectedUnit && (
            <button
              onClick={() => setSelectedUnitId('')}
              className="px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar para ranking
            </button>
          )}
        </div>
      </header>

      {!selectedUnitId && (
        <div className="space-y-3">
          {ranking.map((row, idx) => {
            const stars = calcStars(row.progressPercent);
            const isLeader = idx === 0;
            return (
              <div
                key={row.unidade.id}
                className={`rounded-[28px] border p-5 shadow-xl transition hover:-translate-y-0.5 ${
                  isLeader
                    ? 'border-[#E53935]/40 bg-gradient-to-r from-[#0B0F1A] via-[#111827] to-[#1F1B2E] shadow-[#E53935]/10'
                    : 'border-[#1F2937] bg-[#0D1220]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center">
                      {row.unidade.imageUrl ? (
                        <img src={row.unidade.imageUrl} alt={row.unidade.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-gray-400">{fallbackAvatar(row.unidade.nome)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${isLeader ? 'bg-[#E53935]/20 text-[#FFD60A]' : 'bg-[#111827] text-gray-300'} border border-white/5`}>
                          #{idx + 1}
                        </div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{row.unidade.tipo}</p>
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight mt-1">{row.unidade.nome}</h3>
                      <div className="flex gap-1 text-[#FFD60A] mt-1">
                        {Array.from({ length: stars }).map((_, i) => (
                          <Star key={i} size={18} fill="#FFD60A" stroke="none" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-sm font-black">
                      <span className="text-gray-400 text-[10px] uppercase tracking-widest">Total</span><br />
                      <span className="text-white">{formatNumber(row.total)} pts</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-gray-300">
                      Base +{formatNumber(row.base)}
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-emerald-300">
                      Bônus +{formatNumber(row.bonus)}
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-red-300">
                      Penal -{formatNumber(row.penalty)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(row.progressPercent * 100)}%</span>
                  </div>
                  <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#00F5A0] via-[#00B2FF] to-[#E53935]"
                      style={{ width: `${Math.min(100, row.progressPercent * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  <button
                    onClick={() => setSelectedUnitId(row.unidade.id)}
                    className="px-4 py-2 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase flex items-center gap-2"
                  >
                    <FileText size={14} /> Ver requisitos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedUnit && (
        <div className="rounded-3xl border border-[#1F2937] bg-[#111827] p-6 space-y-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Unidade</p>
              <h2 className="text-2xl font-black">{selectedUnit.nome}</h2>
              <p className="text-gray-500 text-sm">{selectedUnit.tipo}</p>
              <p className="text-gray-500 text-sm mt-1">{selectedQuarter?.name || 'Trimestre atual'}</p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3">
              <div className="flex gap-1 text-[#FFD60A]">
                {Array.from({ length: selectedStars }).map((_, i) => (
                  <Star key={i} size={20} fill="#FFD60A" stroke="none" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-sm font-black text-white">
                  Total {formatNumber(selectedTotals.total)} pts
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-gray-300">
                  Base +{formatNumber(selectedTotals.base)}
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-emerald-300">
                  Bônus +{formatNumber(selectedTotals.bonus)}
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-red-300">
                  Penal -{formatNumber(selectedTotals.penalty)}
                </div>
              </div>
              <button
                onClick={handleSaveUnit}
                disabled={saving || !selectedQuarterId || !selectedUnitId}
                className="px-5 py-3 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.2em] disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Salvar unidade
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Buscar requisito</label>
            <input
              value={requirementFilter}
              onChange={e => setRequirementFilter(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
              placeholder="Digite nome, categoria ou descrição..."
            />
          </div>

          {[...groupedRequirements].map(([category, items]) => (
            <details key={category} open className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl">
              <summary className="cursor-pointer px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{category}</p>
                  <p className="text-gray-300 text-sm">{items.length} requisitos</p>
                </div>
              </summary>
              <div className="divide-y divide-[#1F2937]">
                {items.map(requirement => {
                  const row = state[requirement.id];

                  return (
                    <div key={requirement.id} className="p-4 flex flex-col gap-4">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-gray-100">{requirement.name}</span>
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-white/5 text-gray-300">
                              {getRequirementRuleLabel(requirement.ruleType)}
                            </span>
                          </div>
                          {requirement.description && <p className="text-xs text-gray-500 mt-1">{requirement.description}</p>}
                          <p className="text-xs text-gray-400 mt-1 font-bold">
                            Base {row?.basePoints || 0} | Bônus {row?.bonusPoints || 0} | Penalidade {row?.penaltyPoints || 0}
                          </p>
                          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2">
                            {requirement.bonusDescription && <span>Bônus: {requirement.bonusDescription}</span>}
                            {requirement.penaltyDescription && <span>Penalidade: {requirement.penaltyDescription}</span>}
                          </div>
                        </div>
                        <div className="text-right text-sm font-black">
                          <span className={(row?.calculatedPoints || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}>
                            {formatNumber(row?.calculatedPoints || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {allowsCompletionToggle(requirement) && (
                          <label className="flex items-center gap-3 rounded-xl border border-[#1F2937] bg-[#111827] p-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-[#E53935]"
                              checked={!!row?.completed}
                              onChange={e => handleChange(requirement, { completed: e.target.checked })}
                            />
                            <span className="text-sm font-bold text-gray-200">Cumprido</span>
                          </label>
                        )}

                        {requirement.requiresQuantity && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
                              {requirement.quantityLabel || 'Quantidade'}
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={requirement.maxQuantity ?? undefined}
                              value={row?.quantity ?? 0}
                              onChange={e => handleChange(requirement, { quantity: Number(e.target.value) })}
                              className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                            />
                          </div>
                        )}

                        {supportsManualScore(requirement) && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Pontuação manual</label>
                            <input
                              type="number"
                              min={0}
                              max={requirement.maxManualScore ?? undefined}
                              value={row?.manualScore ?? 0}
                              onChange={e => handleChange(requirement, { manualScore: Number(e.target.value) })}
                              className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                            />
                          </div>
                        )}

                        {requirement.allowBonus && requirement.bonusType && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">{bonusInputLabel(requirement)}</label>
                            {requirement.bonusType === 'FIXED' ? (
                              <label className="flex items-center gap-3 rounded-xl border border-[#1F2937] bg-[#111827] p-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-[#E53935]"
                                  checked={(row?.bonusInput ?? 0) > 0}
                                  onChange={e => handleChange(requirement, { bonusInput: e.target.checked ? 1 : 0 })}
                                />
                                <span className="text-sm font-bold text-gray-200">Aplicar bônus</span>
                              </label>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                value={row?.bonusInput ?? 0}
                                onChange={e => handleChange(requirement, { bonusInput: Number(e.target.value) })}
                                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                              />
                            )}
                          </div>
                        )}

                        {requirement.allowPenalty && requirement.penaltyType && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">{penaltyInputLabel(requirement)}</label>
                            {requirement.penaltyType === 'FIXED' ? (
                              <label className="flex items-center gap-3 rounded-xl border border-[#1F2937] bg-[#111827] p-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-[#E53935]"
                                  checked={(row?.penaltyInput ?? 0) > 0}
                                  onChange={e => handleChange(requirement, { penaltyInput: e.target.checked ? 1 : 0 })}
                                />
                                <span className="text-sm font-bold text-gray-200">Aplicar penalidade</span>
                              </label>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                value={row?.penaltyInput ?? 0}
                                onChange={e => handleChange(requirement, { penaltyInput: Number(e.target.value) })}
                                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                              />
                            )}
                          </div>
                        )}

                        <div className="space-y-1 md:col-span-2 xl:col-span-4">
                          <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Observação</label>
                          <input
                            className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                            value={row?.notes || ''}
                            onChange={e => handleChange(requirement, { notes: e.target.value })}
                            placeholder="Observação rápida"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}

          {groupedRequirements.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#1F2937] p-8 text-center text-gray-500">
              Nenhum requisito encontrado para a busca informada.
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl">
            <div className="flex gap-3 items-center">
              <AlertCircle className="text-[#FFD60A]" size={20} />
              <div className="text-sm text-gray-300">
                <p className="font-bold">Salvamento por unidade</p>
                <p className="text-gray-500 text-xs">
                  Marque todos os requisitos desta unidade e use um único botão de salvar no final.
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveUnit}
              disabled={saving || !selectedQuarterId || !selectedUnitId}
              className="px-5 py-3 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.2em] disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
              Salvar unidade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
