import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, Loader2, Save, Trophy } from 'lucide-react';
import { Usuario, Unidade, RankingQuarter, RankingRequirement, RankingProgressEntry, RankingUnitProgressDoc } from '../types';
import * as fs from '../services/firestoreDb';
import {
  buildRankingProgressState,
  buildRankingRows,
  calculateRequirementBreakdown,
  calculateRankingTotals,
  getRequirementRuleLabel
} from '../services/ranking';

interface RankingProps {
  user: Usuario;
}

type ProgressState = Record<string, RankingProgressEntry>;

const groupRequirements = (requirements: RankingRequirement[]) => {
  const map = new Map<string, RankingRequirement[]>();
  requirements.forEach(requirement => {
    const list = map.get(requirement.category) || [];
    list.push(requirement);
    map.set(requirement.category, list);
  });
  return [...map.entries()];
};

const buildPublicLink = (clubId: string) =>
  `${window.location.origin}${window.location.pathname}#ranking/${encodeURIComponent(clubId)}`;

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

export const Ranking: React.FC<RankingProps> = ({ user }) => {
  const clubId = user.clubeId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [quarters, setQuarters] = useState<RankingQuarter[]>([]);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [state, setState] = useState<ProgressState>({});
  const [closingQuarter, setClosingQuarter] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');

  const loadBase = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [fetchedUnits, fetchedQuarters] = await Promise.all([
        fs.listUnidades(clubId),
        fs.listRankingQuarters(clubId)
      ]);
      const slug = await fs.ensureClubPublicSlug(clubId);
      const eligibleUnits = fetchedUnits.filter(unit => unit.ativo && unit.tipo !== 'DIRETORIA');
      setUnits(eligibleUnits);
      setQuarters(fetchedQuarters.filter(quarter => quarter.ativo));
      setPublicSlug(slug);

      const activeQuarter = fetchedQuarters.find(quarter => quarter.status === 'ACTIVE') || fetchedQuarters[0];
      if (activeQuarter && !selectedQuarterId) setSelectedQuarterId(activeQuarter.id);
      if (eligibleUnits[0] && !selectedUnitId) setSelectedUnitId(eligibleUnits[0].id);
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
    setState(buildRankingProgressState(requirements, currentDoc?.resultados));
  }, [requirements, currentDoc]);

  const ranking = useMemo(() => buildRankingRows(units, requirements, progressDocs), [units, requirements, progressDocs]);
  const selectedUnit = useMemo(() => units.find(unit => unit.id === selectedUnitId) || null, [units, selectedUnitId]);
  const selectedQuarter = useMemo(() => quarters.find(quarter => quarter.id === selectedQuarterId) || null, [quarters, selectedQuarterId]);
  const groupedRequirements = useMemo(() => groupRequirements(requirements), [requirements]);
  const totals = useMemo(() => calculateRankingTotals(requirements, state), [requirements, state]);

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

  const handleSave = async () => {
    if (!clubId || !selectedQuarterId || !selectedUnitId) return;
    setSaving(true);
    try {
      await fs.saveRankingUnitProgress(clubId, selectedQuarterId, selectedUnitId, state, {
        id: user.id,
        nome: user.nome,
        email: user.email
      });
      await loadQuarterData(selectedQuarterId);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar progresso do ranking.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildPublicLink(publicSlug || clubId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      alert('Não foi possível copiar o link público.');
    }
  };

  const handleCloseQuarter = async () => {
    if (!clubId || !selectedQuarter || selectedQuarter.status === 'CLOSED') return;
    if (!window.confirm(`Encerrar ${selectedQuarter.name}? A página pública passará a mostrar campeã e pódio desse trimestre.`)) return;

    setClosingQuarter(true);
    try {
      await fs.updateRankingQuarterStatus(clubId, selectedQuarter.id, 'CLOSED');
      const refreshed = await fs.listRankingQuarters(clubId);
      setQuarters(refreshed.filter(quarter => quarter.ativo));
    } catch (error) {
      console.error(error);
      alert('Erro ao encerrar trimestre.');
    } finally {
      setClosingQuarter(false);
    }
  };

  if (loading && quarters.length === 0) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#E53935]" /></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Ranking Trimestral</h1>
          <p className="text-gray-400 font-medium">Regras reais por trimestre, com bônus, penalidade, recorrência e pontuação manual</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCloseQuarter}
            disabled={!selectedQuarter || selectedQuarter.status === 'CLOSED' || closingQuarter}
            className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase text-gray-200 flex items-center gap-2 disabled:opacity-50"
          >
            {closingQuarter ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            {selectedQuarter?.status === 'CLOSED' ? 'Trimestre encerrado' : 'Encerrar trimestre'}
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase text-gray-200 flex items-center gap-2"
          >
            <Copy size={14} /> {copied ? 'Link copiado' : 'Copiar link público'}
          </button>
          <a
            href={buildPublicLink(publicSlug || clubId)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black uppercase text-gray-200 flex items-center gap-2"
          >
            <ArrowUpRight size={14} /> Abrir ranking público
          </a>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#1F2937] bg-[#111827] p-5 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Trimestre</label>
                <select
                  value={selectedQuarterId}
                  onChange={e => setSelectedQuarterId(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none"
                >
                  {quarters.map(quarter => (
                    <option key={quarter.id} value={quarter.id}>{quarter.name} {quarter.year}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Unidade</label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none"
                >
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-white mt-2">{totals.total}</p>
              </div>
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</p>
                <p className="text-sm font-black text-white mt-3">{selectedQuarter?.status === 'CLOSED' ? 'Encerrado' : 'Em andamento'}</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !selectedUnitId || !selectedQuarterId}
              className="w-full py-4 rounded-2xl bg-[#E53935] text-white text-sm font-black uppercase tracking-[0.2em] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar unidade
            </button>
          </div>

          <div className="rounded-3xl border border-[#1F2937] bg-[#111827] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-[#FFD60A]" />
              <h2 className="font-black uppercase text-xs tracking-widest text-gray-300">Preview do ranking</h2>
            </div>
            <div className="space-y-3">
              {ranking.map((row, index) => (
                <button
                  key={row.unidade.id}
                  onClick={() => setSelectedUnitId(row.unidade.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    row.unidade.id === selectedUnitId
                      ? 'border-[#E53935]/60 bg-[#0B0F1A]'
                      : 'border-[#1F2937] bg-[#0B0F1A]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">#{index + 1}</p>
                      <h3 className="font-black text-white">{row.unidade.nome}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{row.total}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">pts</p>
                    </div>
                  </div>
                </button>
              ))}
              {ranking.length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma unidade elegível encontrada.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-[#1F2937] bg-[#111827] p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Unidade selecionada</p>
              <h2 className="text-2xl font-black text-white">{selectedUnit?.nome || 'Selecione uma unidade'}</h2>
            </div>
            <div className="flex gap-2 text-xs font-black uppercase">
              <span className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/10">Base {totals.base}</span>
              <span className="px-3 py-2 rounded-xl bg-blue-500/10 text-blue-200 border border-blue-500/10">Bônus {totals.bonus}</span>
              <span className="px-3 py-2 rounded-xl bg-red-500/10 text-red-300 border border-red-500/10">Penalidade {totals.penalty}</span>
            </div>
          </div>

          {groupedRequirements.map(([category, items]) => (
            <div key={category} className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1F2937]">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{category}</p>
                <p className="text-sm text-gray-300">{items.length} requisitos</p>
              </div>
              <div className="divide-y divide-[#1F2937]">
                {items.map(requirement => {
                  const row = state[requirement.id];
                  return (
                    <div key={requirement.id} className="p-5 space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-white">{requirement.name}</span>
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-white/5 text-gray-300">
                              {getRequirementRuleLabel(requirement.ruleType)}
                            </span>
                            {requirement.pointsPerUnit != null && (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-500/10 text-blue-200">
                                {requirement.pointsPerUnit} por unidade
                              </span>
                            )}
                            {requirement.maxManualScore != null && (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-300">
                                Máx {requirement.maxManualScore}
                              </span>
                            )}
                          </div>
                          {requirement.description && <p className="text-sm text-gray-500">{requirement.description}</p>}
                          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            {requirement.bonusDescription && <span>Bônus: {requirement.bonusDescription}</span>}
                            {requirement.penaltyDescription && <span>Penalidade: {requirement.penaltyDescription}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">{row?.calculatedPoints || 0}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                            base {row?.basePoints || 0} | b {row?.bonusPoints || 0} | p {row?.penaltyPoints || 0}
                          </p>
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
                            value={row?.notes || ''}
                            onChange={e => handleChange(requirement, { notes: e.target.value })}
                            className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                            placeholder="Observação rápida"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {requirements.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#1F2937] p-10 text-center text-gray-500">
              Nenhum requisito configurado para este trimestre.
            </div>
          )}
        </section>
      </section>
    </div>
  );
};
