import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Loader2, Medal, Trophy, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import * as fs from '../services/firestoreDb';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade } from '../types';
import { buildRankingRows } from '../services/ranking';

const getPublicRouteValue = () => {
  const hash = window.location.hash || '';

  const rankingMatch = hash.match(/^#ranking\/([^?]+)/);
  if (rankingMatch?.[1]) {
    return decodeURIComponent(rankingMatch[1]);
  }

  const directMatch = hash.match(/^#ranking-publico\/([^?]+)/);
  if (directMatch?.[1]) {
    return decodeURIComponent(directMatch[1]);
  }

  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  return params.get('clubId') || '';
};

const fallbackAvatar = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'SU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const medalStyles = [
  'from-[#FFD60A] to-[#F59E0B] text-[#1A1200]',
  'from-[#D1D5DB] to-[#94A3B8] text-[#0B0F1A]',
  'from-[#F97316] to-[#EA580C] text-white'
];

const buildPodiumRows = (ranking: ReturnType<typeof buildRankingRows>) => {
  const scoredRows = ranking.filter(row => row.total > 0);
  const podium = [];

  for (let index = 0; index < Math.min(3, scoredRows.length); index += 1) {
    const row = scoredRows[index];
    const previousRow = scoredRows[index - 1];
    const nextRow = scoredRows[index + 1];

    const tiedWithPrevious = previousRow ? previousRow.total === row.total : false;
    const tiedWithNext = nextRow ? nextRow.total === row.total : false;
    const isAboveNext = nextRow ? row.total > nextRow.total : true;

    if (tiedWithPrevious || tiedWithNext || !isAboveNext) {
      break;
    }

    podium.push(row);
  }

  return podium;
};

export const PublicRanking: React.FC = () => {
  const routeValue = getPublicRouteValue();

  const [loading, setLoading] = useState(true);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [clubId, setClubId] = useState('');
  const [units, setUnits] = useState<Unidade[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<RankingQuarter | null>(null);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async (showLoader = false) => {
      const resolvedClubId = routeValue.startsWith('clube-')
        ? routeValue
        : (await fs.findClubByPublicSlug(routeValue))?.id || '';

      if (!resolvedClubId) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (showLoader && !cancelled) setLoading(true);
      try {
        if (!cancelled) setClubId(resolvedClubId);
        const [fetchedUnits, fetchedQuarters] = await Promise.all([
          fs.listUnidades(resolvedClubId),
          fs.listRankingQuarters(resolvedClubId)
        ]);

        const eligibleUnits = fetchedUnits.filter(unit => unit.ativo && unit.tipo !== 'DIRETORIA');
        const availableQuarters = fetchedQuarters.filter(quarter => quarter.ativo);
        const activeQuarter =
          availableQuarters.find(quarter => quarter.status === 'ACTIVE') ||
          availableQuarters.find(quarter => quarter.status === 'CLOSED') ||
          availableQuarters[0] ||
          null;

        if (cancelled) return;

        setUnits(eligibleUnits);
        setCurrentQuarter(activeQuarter);

        if (activeQuarter) {
          const fetchedRequirements = await fs.listRankingRequirements(resolvedClubId, activeQuarter.id);
          const fetchedDocs = await fs.listRankingProgress(resolvedClubId, activeQuarter.id);

          if (cancelled) return;

          setRequirements(fetchedRequirements.filter(requirement => requirement.active));
          setProgressDocs(fetchedDocs);
        } else {
          if (cancelled) return;
          setRequirements([]);
          setProgressDocs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load(true);

    const intervalId = window.setInterval(() => {
      load(false);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [routeValue]);

  const ranking = useMemo(() => buildRankingRows(units, requirements, progressDocs), [units, requirements, progressDocs]);
  const podium = useMemo(() => buildPodiumRows(ranking), [ranking]);
  const leader = currentQuarter?.status === 'CLOSED' && podium.length > 0 ? podium[0] : null;
  const otherRows = ranking.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FFD60A]" size={32} />
      </div>
    );
  }

  if (!clubId) {
    return (
      <div className="min-h-screen bg-[#050816] text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-[32px] border border-[#1F2937] bg-[#0B0F1A] p-8 text-center">
          <h1 className="text-3xl font-black">Ranking indisponível</h1>
          <p className="text-gray-400 mt-3">Abra este painel com um link contendo `clubId` no hash público.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,214,10,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(229,57,53,0.22),_transparent_28%),linear-gradient(180deg,#050816_0%,#0B0F1A_100%)] text-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-8 md:px-6 md:py-12 space-y-4 sm:space-y-8">
        <header className="relative rounded-[28px] sm:rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] backdrop-blur-xl p-5 sm:p-6 md:p-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,10,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(229,57,53,0.18),transparent_30%)] pointer-events-none" />
          <div className="relative flex flex-col items-center gap-8 text-center">
            <div className="space-y-5 sm:space-y-6 max-w-3xl w-full">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-[32px] border border-[#243047] bg-[radial-gradient(circle_at_top,rgba(255,214,10,0.16),rgba(11,15,26,0.94)_70%)] flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(229,57,53,0.18)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(229,57,53,0.18),transparent_55%)] pointer-events-none" />
                  <img
                    src="/logo-clube.png"
                    alt="Logo do clube"
                    className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain scale-110 drop-shadow-[0_0_24px_rgba(255,214,10,0.22)]"
                  />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-none">
                  Super <span className="text-[#FFD60A]">Ranking</span>
                </h1>
              </div>
            </div>

          </div>
        </header>

        {leader && (
          <section className="relative rounded-[28px] sm:rounded-[36px] border border-[#FFD60A]/20 bg-[linear-gradient(135deg,rgba(255,214,10,0.10),rgba(255,255,255,0.04),rgba(229,57,53,0.08))] p-5 sm:p-6 md:p-8 shadow-[0_0_60px_rgba(255,214,10,0.08)] overflow-hidden">
            <div className="absolute right-[-32px] top-[-28px] w-40 h-40 rounded-full bg-[#FFD60A]/10 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4 md:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-[28px] bg-[#FFD60A]/10 border border-[#FFD60A]/20 flex items-center justify-center shrink-0">
                  <Crown className="text-[#FFD60A]" size={34} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.35em] uppercase font-black text-[#FFD60A]">Campeã do Trimestre</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mt-3 break-words">{leader.unidade.nome}</h2>
                  <p className="text-gray-400 mt-2">
                    {leader.completedCount}/{requirements.length} requisitos pontuados
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <div className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-4 min-w-[132px]">
                  <p className="text-[10px] tracking-[0.25em] uppercase font-black text-gray-500">Posição</p>
                  <p className="text-3xl font-black mt-2">#1</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-4 min-w-[132px]">
                  <p className="text-[10px] tracking-[0.25em] uppercase font-black text-gray-500">Pontuação</p>
                  <p className="text-3xl font-black mt-2">{leader.total}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {podium.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-end">
            {podium.map((row, index) => {
              const visualIndex = index === 0 ? 1 : index === 1 ? 2 : 3;
              const orderClass = index === 0 ? 'lg:order-2 lg:-translate-y-4' : index === 1 ? 'lg:order-1' : 'lg:order-3';
              const medalClass = medalStyles[index] || medalStyles[2];
              return (
                <article
                  key={row.unidade.id}
                  className={`rounded-[28px] sm:rounded-[32px] border p-5 sm:p-6 transition-all ${index === 0 ? 'border-[#FFD60A]/30 bg-[linear-gradient(180deg,rgba(255,214,10,0.10),rgba(17,24,39,0.92))]' : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(11,15,26,0.95))]'} ${orderClass}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${medalClass} flex items-center justify-center shadow-lg`}>
                      <Medal size={22} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-500">Posição</p>
                      <p className="text-2xl font-black mt-1">#{visualIndex}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3 sm:gap-4">
                    <div className="w-20 h-12 rounded-[18px] bg-[#0B0F1A] border border-white/10 overflow-hidden flex items-center justify-center p-1">
                      {row.unidade.imageUrl ? (
                        <img src={row.unidade.imageUrl} alt={row.unidade.nome} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-black text-lg text-gray-300">{fallbackAvatar(row.unidade.nome)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black break-words">{row.unidade.nome}</h3>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-500">Total</p>
                      <p className="text-4xl font-black mt-2">{row.total}</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <p>Progresso {Math.round(row.progressPercent * 100)}%</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {currentQuarter?.status !== 'CLOSED' && (
          <section className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,15,26,0.96))] p-5 sm:p-6 md:p-8 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase font-black text-gray-500">Trimestre em andamento</p>
          </section>
        )}

        {podium.length === 0 && (
          <section className="rounded-[28px] sm:rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,15,26,0.96))] p-5 sm:p-6 md:p-8 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase font-black text-gray-500">Pódio indisponível</p>
            <h2 className="text-2xl md:text-3xl font-black mt-3">O pódio só aparece quando houver posições definidas sem empate</h2>
          </section>
        )}

        <section className="rounded-[28px] sm:rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,15,26,0.96))] p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase font-black text-gray-500">Classificação Completa</p>
              <h2 className="text-2xl md:text-3xl font-black mt-2">{currentQuarter?.name || '1º Trimestre'}</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-gray-300">
              <Trophy size={14} className="text-[#FFD60A]" />
              Atualização Pública
            </div>
          </div>

          <div className="space-y-3">
            {ranking.map((row, index) => (
              <article
                key={row.unidade.id}
                onClick={() => setExpandedUnitId(expandedUnitId === row.unidade.id ? null : row.unidade.id)}
                className={`rounded-[28px] border p-4 md:p-5 transition-all cursor-pointer hover:border-white/30 ${
                  index === 0
                    ? 'border-[#FFD60A]/20 bg-[linear-gradient(90deg,rgba(255,214,10,0.08),rgba(17,24,39,0.96))]'
                    : 'border-white/10 bg-[#0B0F1A]/80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg bg-[#111827] text-white border border-white/5 shrink-0">
                    #{index + 1}
                  </div>
                    <div className="w-20 h-12 rounded-[18px] bg-[#111827] border border-white/10 overflow-hidden flex items-center justify-center p-1 shrink-0">
                      {row.unidade.imageUrl ? (
                        <img src={row.unidade.imageUrl} alt={row.unidade.nome} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-black text-sm text-gray-300">{fallbackAvatar(row.unidade.nome)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black break-words">{row.unidade.nome}</h3>
                        {leader && row.unidade.id === leader.unidade.id && <Crown size={18} className="text-[#FFD60A]" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:justify-end">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 min-w-[112px]">
                      <p className="text-[10px] tracking-[0.2em] uppercase font-black text-gray-500">Total</p>
                      <p className="text-2xl font-black mt-1">{row.total}</p>
                    </div>
                    <div className="flex items-center justify-center p-3 text-gray-400 hover:text-white transition-colors bg-black/20 rounded-2xl border border-white/5">
                      {expandedUnitId === row.unidade.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.25em] font-black text-gray-500 mb-2">
                    <span>Progresso</span>
                    <span>{Math.round(row.progressPercent * 100)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-[linear-gradient(90deg,#FFD60A_0%,#E53935_50%,#00B2FF_100%)]"
                      style={{ width: `${Math.min(100, row.progressPercent * 100)}%` }}
                    />
                  </div>
                </div>

                {expandedUnitId === row.unidade.id && (
                  <div className="mt-5 pt-5 border-t border-white/10 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-4">Requisitos Pontuados</h4>
                    <div className="space-y-2">
                      {requirements.map(req => {
                        const progress = progressDocs.find(d => d.unitId === row.unidade.id);
                        const result = progress?.resultados?.[req.id];
                        const points = result ? (result.calculatedPoints || 0) : 0;
                        if (points <= 0) return null;
                        
                        return (
                          <div key={req.id} className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-white/5 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-[#00F5A0] shrink-0" />
                              <span className="text-sm font-medium text-gray-300">{req.name}</span>
                            </div>
                            <span className="text-sm font-black text-[#FFD60A] shrink-0 ml-3">+{points}</span>
                          </div>
                        );
                      })}
                      {(!progressDocs.find(d => d.unitId === row.unidade.id)?.resultados || 
                        !requirements.some(req => (progressDocs.find(d => d.unitId === row.unidade.id)?.resultados?.[req.id]?.calculatedPoints || 0) > 0)) && (
                        <p className="text-sm text-gray-500 italic text-center py-4 bg-black/20 rounded-xl border border-white/5">
                          Nenhum requisito pontuado.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}

            {ranking.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-[#1F2937] p-10 text-center text-gray-500">
                Nenhuma unidade disponível no ranking deste trimestre.
              </div>
            )}
          </div>

          {otherRows.length > 0 && (
            <div className="mt-6 text-center text-[10px] uppercase tracking-[0.35em] font-black text-gray-600">
              Total de {ranking.length} unidades classificadas
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
