import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, EyeOff, Eye, Link2, Loader2, Play, PlusCircle, Trophy, Zap, Snowflake, RotateCcw } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { Usuario, Unidade, RankingQuarter, RankingRequirement, RankingUnitProgressDoc, VarAccessLogEntry } from '../types';
import * as fs from '../services/firestoreDb';
import { buildRankingRows, generateUnitCode } from '../services/ranking';
import { useToast } from '../store/ToastContext';

interface RankingProps {
  user: Usuario;
}

const buildPublicLink = (clubId: string) =>
  `${window.location.origin}${window.location.pathname}#ranking/${encodeURIComponent(clubId)}`;

const buildUnitPublicLink = (clubSlugOrId: string, unitId: string) => {
  const unitCode = generateUnitCode(unitId);
  return `${window.location.origin}${window.location.pathname}#ranking/${encodeURIComponent(clubSlugOrId)}?u=${unitCode}`;
};

export const Ranking: React.FC<RankingProps> = ({ user }) => {
  const clubId = user.clubeId;
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedUnitId, setCopiedUnitId] = useState<string | null>(null);
  const [togglingMode, setTogglingMode] = useState(false);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [quarters, setQuarters] = useState<RankingQuarter[]>([]);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState('');
  const [closingQuarter, setClosingQuarter] = useState(false);
  const [copiedVar, setCopiedVar] = useState(false);
  const [varConfig, setVarConfig] = useState<{ accessCount: number; mobile?: number; desktop?: number; tablet?: number; log?: VarAccessLogEntry[] } | null>(null);
  const [showVarLog, setShowVarLog] = useState(false);
  const [regeneratingVar, setRegeneratingVar] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [creatingQuarter, setCreatingQuarter] = useState(false);
  const [updatingMovimentoId, setUpdatingMovimentoId] = useState<string | null>(null);

  const loadBase = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [fetchedUnits, fetchedQuarters] = await Promise.all([
        fs.listUnidades(clubId),
        fs.listRankingQuarters(clubId)
      ]);
      const slug = await fs.ensureClubPublicSlug(clubId);
      const eligibleUnits = fetchedUnits.filter(unit => unit.ativo && unit.participatesClubao !== false);
      setUnits(eligibleUnits);
      setQuarters(fetchedQuarters);
      setPublicSlug(slug);

      const activeQuarter = fetchedQuarters.find(quarter => quarter.status === 'ACTIVE') || fetchedQuarters[0];
      if (activeQuarter && !selectedQuarterId) setSelectedQuarterId(activeQuarter.id);
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
    if (user.perfil === 'DIRETORIA') loadVarAccessCount();
  }, [clubId]);

  useEffect(() => {
    if (selectedQuarterId) {
      loadQuarterData(selectedQuarterId);
    }
  }, [clubId, selectedQuarterId]);

  const ranking = useMemo(() => buildRankingRows(units, requirements, progressDocs), [units, requirements, progressDocs]);
  const selectedQuarter = useMemo(() => quarters.find(quarter => quarter.id === selectedQuarterId) || null, [quarters, selectedQuarterId]);

  const publicMode = (selectedQuarter?.publicMode ?? 'FULL') as 'FULL' | 'RESTRICTED';

  const handleToggleMovimento = async (unit: Unidade, value: boolean | null) => {
    setUpdatingMovimentoId(unit.id);
    try {
      await fs.updateUnidade(clubId, unit.id, { manualMovimentoSemana: value });
      setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, manualMovimentoSemana: value } : u));
    } catch (error) {
      console.error(error);
      toastError('Erro ao atualizar movimentação da unidade.');
    } finally {
      setUpdatingMovimentoId(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildPublicLink(publicSlug || clubId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      toastError('Não foi possível copiar o link público.');
    }
  };

  const applyVarConfig = (config: Awaited<ReturnType<typeof fs.getVarConfig>>) => {
    if (!config) return;
    setVarConfig({
      accessCount: config.accessCount,
      mobile: config.accessByDevice?.mobile,
      desktop: config.accessByDevice?.desktop,
      tablet: config.accessByDevice?.tablet,
      log: config.accessLog ? [...config.accessLog].reverse() : []
    });
  };

  const handleCopyVarLink = async () => {
    try {
      const config = await fs.ensureVarToken(clubId);
      applyVarConfig(config);
      // Atualiza contador após 3s para capturar acessos recentes
      window.setTimeout(() => loadVarAccessCount(), 3000);
      const origin = window.location.origin + window.location.pathname;
      const url = `${origin}#var/${encodeURIComponent(publicSlug || clubId)}?token=${config.token}`;
      await navigator.clipboard.writeText(url);
      setCopiedVar(true);
      window.setTimeout(() => setCopiedVar(false), 2500);
    } catch (error) {
      console.error(error);
      toastError('Não foi possível copiar o link VAR.');
    }
  };

  const handleRegenerateVarToken = async () => {
    if (!window.confirm('Gerar novo token VAR? O link anterior deixará de funcionar.')) return;
    setRegeneratingVar(true);
    try {
      const config = await fs.regenerateVarToken(clubId);
      applyVarConfig(config);
      const origin = window.location.origin + window.location.pathname;
      const url = `${origin}#var/${encodeURIComponent(publicSlug || clubId)}?token=${config.token}`;
      await navigator.clipboard.writeText(url);
      setCopiedVar(true);
      window.setTimeout(() => setCopiedVar(false), 2500);
    } catch (error) {
      console.error(error);
      toastError('Erro ao regenerar token VAR.');
    } finally {
      setRegeneratingVar(false);
    }
  };

  const loadVarAccessCount = async () => {
    try {
      const config = await fs.getVarConfig(clubId);
      applyVarConfig(config);
    } catch { /* silencioso */ }
  };

  const handleCopyUnitLink = async (unitId: string) => {
    try {
      await navigator.clipboard.writeText(buildUnitPublicLink(publicSlug || clubId, unitId));
      setCopiedUnitId(unitId);
      window.setTimeout(() => setCopiedUnitId(null), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseQuarter = async () => {
    if (!clubId || !selectedQuarter || selectedQuarter.status === 'CLOSED') return;
    if (!window.confirm(`Encerrar ${selectedQuarter.name}? A página pública passará a mostrar campeã e pódio desse trimestre.`)) return;

    setClosingQuarter(true);
    try {
      await fs.updateRankingQuarterStatus(clubId, selectedQuarter.id, 'CLOSED');
      const refreshed = await fs.listRankingQuarters(clubId);
      setQuarters(refreshed);
    } catch (error) {
      console.error(error);
      toastError('Erro ao encerrar trimestre.');
    } finally {
      setClosingQuarter(false);
    }
  };

  const handleActivateQuarter = async () => {
    if (!clubId || !selectedQuarter || selectedQuarter.status !== 'CLOSED') return;
    if (!window.confirm(`Ativar ${selectedQuarter.name}? Ele passará a ser o trimestre em andamento.`)) return;

    setClosingQuarter(true);
    try {
      await fs.updateRankingQuarterStatus(clubId, selectedQuarter.id, 'ACTIVE');
      const refreshed = await fs.listRankingQuarters(clubId);
      setQuarters(refreshed);
    } catch (error) {
      console.error(error);
      toastError('Erro ao ativar trimestre.');
    } finally {
      setClosingQuarter(false);
    }
  };

  const nextMissingQuarterNumber = useMemo((): 1 | 2 | 3 | null => {
    const existing = new Set(quarters.filter(q => q.ativo !== false).map(q => q.number));
    for (const n of [1, 2, 3] as const) {
      if (!existing.has(n)) return n;
    }
    return null;
  }, [quarters]);

  const handleCreateNextQuarter = async () => {
    if (!clubId || nextMissingQuarterNumber === null) return;
    const labels = { 1: '1º Trimestre', 2: '2º Trimestre', 3: '3º Trimestre' };
    if (!window.confirm(`Criar ${labels[nextMissingQuarterNumber]} 2026 com os requisitos padrão?`)) return;
    setCreatingQuarter(true);
    try {
      await fs.ensureQuarterExists(clubId, nextMissingQuarterNumber);
      const refreshed = await fs.listRankingQuarters(clubId);
      setQuarters(refreshed);
      const created = refreshed.find(q => q.number === nextMissingQuarterNumber);
      if (created) setSelectedQuarterId(created.id);
    } catch (error) {
      console.error(error);
      toastError('Erro ao criar trimestre.');
    } finally {
      setCreatingQuarter(false);
    }
  };

  const handleTogglePublicMode = async () => {
    if (!clubId || !selectedQuarter || selectedQuarter.status === 'CLOSED' || togglingMode) return;
    const newMode: 'FULL' | 'RESTRICTED' = publicMode === 'FULL' ? 'RESTRICTED' : 'FULL';
    setTogglingMode(true);
    try {
      await fs.updateRankingQuarterPublicMode(clubId, selectedQuarter.id, newMode);
      setQuarters(prev =>
        prev.map(q => q.id === selectedQuarter.id ? { ...q, publicMode: newMode } : q)
      );
    } catch (error) {
      console.error(error);
      alert('Erro ao alterar modo do ranking público.');
    } finally {
      setTogglingMode(false);
    }
  };

  if (loading && quarters.length === 0) return <LoadingScreen inline />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Ranking Trimestral</h1>
          <p className="text-gray-400 font-medium">Regras reais por trimestre, com bônus, penalidade, recorrência e pontuação manual</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextMissingQuarterNumber !== null && (
            <button
              onClick={handleCreateNextQuarter}
              disabled={creatingQuarter}
              className="px-4 py-2 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 text-xs font-black uppercase text-[#FFD60A] flex items-center gap-2 disabled:opacity-50"
            >
              {creatingQuarter ? <Loader2 className="animate-spin" size={14} /> : <PlusCircle size={14} />}
              Criar {nextMissingQuarterNumber}º Trimestre
            </button>
          )}

          {selectedQuarter?.status === 'CLOSED' && (
            <button
              onClick={handleActivateQuarter}
              disabled={closingQuarter}
              className="px-4 py-2 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-xs font-black uppercase text-[#00F5A0] flex items-center gap-2 disabled:opacity-50"
            >
              {closingQuarter ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
              Ativar trimestre
            </button>
          )}

          <button
            onClick={handleCloseQuarter}
            disabled={!selectedQuarter || selectedQuarter.status === 'CLOSED' || closingQuarter}
            className="px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-xs font-black uppercase text-gray-200 flex items-center gap-2 disabled:opacity-50"
          >
            {closingQuarter ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            {selectedQuarter?.status === 'CLOSED' ? 'Trimestre encerrado' : 'Encerrar trimestre'}
          </button>

          {/* Modo Reta Final oculto — pontuação agora só via VAR ou links individuais
          <button
            onClick={handleTogglePublicMode}
            disabled={!selectedQuarter || selectedQuarter.status === 'CLOSED' || togglingMode}
            title={publicMode === 'RESTRICTED' ? 'Modo Reta Final ativo: placar e pódio ocultos no link público' : 'Ativar Modo Reta Final: oculta placar e pódio no link público'}
            className={`px-4 py-2 rounded-xl border text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50 transition-colors ${
              publicMode === 'RESTRICTED'
                ? 'bg-[#FFD60A]/10 border-[#FFD60A]/40 text-[#FFD60A]'
                : 'bg-[#111827] border-[#1F2937] text-gray-200'
            }`}
          >
            {togglingMode
              ? <Loader2 className="animate-spin" size={14} />
              : publicMode === 'RESTRICTED' ? <EyeOff size={14} /> : <Eye size={14} />
            }
            {publicMode === 'RESTRICTED' ? 'Reta Final: Ativa' : 'Modo Reta Final'}
          </button>
          */}

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

          {user.perfil === 'DIRETORIA' && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#1F2937]">
              <button
                onClick={handleCopyVarLink}
                title="Copiar link VAR confidencial com token de acesso"
                className="px-4 py-2 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/40 text-[#FFD60A] text-xs font-black uppercase flex items-center gap-2 hover:bg-[#FFD60A]/20 transition-colors"
              >
                <Copy size={14} /> {copiedVar ? 'Link VAR copiado!' : 'Link VAR'}
              </button>
              {varConfig !== null && (
                <button
                  onClick={async () => { await loadVarAccessCount(); setShowVarLog(prev => !prev); }}
                  className="flex flex-col gap-0.5 text-left hover:opacity-80 transition-opacity"
                  title="Atualizar e ver log de acessos"
                >
                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap underline decoration-dotted">
                    {varConfig.accessCount} {varConfig.accessCount === 1 ? 'acesso' : 'acessos'} ↻
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(varConfig.mobile ?? 0) > 0 && (
                      <span className="text-[9px] text-gray-600 whitespace-nowrap">📱 {varConfig.mobile}</span>
                    )}
                    {(varConfig.desktop ?? 0) > 0 && (
                      <span className="text-[9px] text-gray-600 whitespace-nowrap">💻 {varConfig.desktop}</span>
                    )}
                    {(varConfig.tablet ?? 0) > 0 && (
                      <span className="text-[9px] text-gray-600 whitespace-nowrap">📟 {varConfig.tablet}</span>
                    )}
                  </div>
                </button>
              )}
              <button
                onClick={handleRegenerateVarToken}
                disabled={regeneratingVar}
                title="Gerar novo token — invalida o link anterior"
                className="px-3 py-2 rounded-xl bg-[#111827] border border-[#1F2937] text-[10px] font-black uppercase text-gray-500 flex items-center gap-1 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
              >
                {regeneratingVar ? <Loader2 size={12} className="animate-spin" /> : '↺'} Novo token
              </button>
            </div>
          )}
        </div>
      </header>

      {showVarLog && varConfig?.log && varConfig.log.length > 0 && (
        <div className="rounded-2xl border border-[#FFD60A]/20 bg-[#111827] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black text-[#FFD60A] uppercase tracking-wider">Log de Acessos VAR</p>
            <button onClick={() => setShowVarLog(false)} className="text-gray-600 hover:text-gray-400 text-xs">✕ fechar</button>
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {varConfig.log.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-[#1F2937] last:border-0">
                <span className="text-base shrink-0">
                  {entry.deviceType === 'mobile' ? '📱' : entry.deviceType === 'tablet' ? '📟' : '💻'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-200 truncate">{entry.deviceModel}</p>
                  <p className="text-[10px] text-gray-500">{entry.os}</p>
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">
                  {entry.accessedAt
                    ? new Date(entry.accessedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '—'
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner Reta Final oculto — ocultar junto com o botão
      {publicMode === 'RESTRICTED' && (
        <div className="rounded-2xl border border-[#FFD60A]/30 bg-[#FFD60A]/5 px-5 py-3 flex items-center gap-3">
          <EyeOff size={16} className="text-[#FFD60A] shrink-0" />
          <p className="text-sm text-[#FFD60A] font-bold">
            Modo Reta Final ativo — o link público está ocultando pontuações e pódio. As unidades veem apenas seus requisitos pelo link individual.
          </p>
        </div>
      )}
      */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-[#1F2937] bg-[#111827] p-5 space-y-4">
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

          <div className="flex items-center gap-2 mb-1 pt-2">
            <Trophy size={16} className="text-[#FFD60A]" />
            <h2 className="font-black uppercase text-xs tracking-widest text-gray-300">Preview do ranking</h2>
          </div>
          <p className="text-[10px] text-gray-500 -mt-2">
            Defina manualmente se a unidade aparece "acesa" (movimentada) ou "em descanso" no ranking público desta semana. Deixe em Automático para seguir a atividade real da unidade.
          </p>
          <div className="space-y-3">
            {ranking.map((row, index) => {
              const manual = row.unidade.manualMovimentoSemana;
              const isUpdating = updatingMovimentoId === row.unidade.id;
              return (
                <div key={row.unidade.id} className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A]/60 p-4 space-y-3">
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleMovimento(row.unidade, null)}
                      disabled={isUpdating}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                        manual == null ? 'bg-white/10 border-white/20 text-white' : 'border-[#1F2937] text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <RotateCcw size={11} /> Auto
                    </button>
                    <button
                      onClick={() => handleToggleMovimento(row.unidade, true)}
                      disabled={isUpdating}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                        manual === true ? 'bg-[#FFD60A]/15 border-[#FFD60A]/40 text-[#FFD60A]' : 'border-[#1F2937] text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Zap size={11} /> Sim
                    </button>
                    <button
                      onClick={() => handleToggleMovimento(row.unidade, false)}
                      disabled={isUpdating}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                        manual === false ? 'bg-white/5 border-white/15 text-gray-300' : 'border-[#1F2937] text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Snowflake size={11} /> Não
                    </button>
                  </div>
                </div>
              );
            })}
            {ranking.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma unidade elegível encontrada.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#1F2937] bg-[#111827] p-5 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={16} className="text-[#00B2FF]" />
            <h2 className="font-black uppercase text-xs tracking-widest text-gray-300">Links individuais</h2>
          </div>
          <p className="text-[10px] text-gray-500 mb-4">Envie para cada unidade ver apenas os próprios requisitos.</p>
          <div className="space-y-2">
            {units.map(unit => {
              const unitCode = generateUnitCode(unit.id);
              const isCopied = copiedUnitId === unit.id;
              return (
                <div key={unit.id} className="rounded-xl border border-[#1F2937] bg-[#0B0F1A] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-white truncate">{unit.nome}</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">#{unitCode}</p>
                  </div>
                  <button
                    onClick={() => handleCopyUnitLink(unit.id)}
                    className="px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#111827] text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {isCopied
                      ? <><CheckCircle2 size={12} className="text-emerald-400" /> Copiado</>
                      : <><Copy size={12} /> Link</>
                    }
                  </button>
                </div>
              );
            })}
            {units.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma unidade elegível.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
