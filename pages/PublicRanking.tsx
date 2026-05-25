import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Crown, KeyRound, Loader2, Lock, Medal, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import * as fs from '../services/firestoreDb';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade } from '../types';
import { buildRankingRows, generateUnitCode } from '../services/ranking';

// ---------------------------------------------------------------------------
// Route parsing — extracts club slug/id and optional unit code from URL hash.
// Unit code is the first 6 chars of the unit's Firestore ID (uppercase).
// Format: #ranking/<clubSlug>[?u=<UNITCODE>]
// ---------------------------------------------------------------------------
const getPublicRouteParams = () => {
  const hash = window.location.hash || '';

  const rankingMatch = hash.match(/^#ranking\/([^?#]+)/);
  const directMatch = hash.match(/^#ranking-publico\/([^?#]+)/);

  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');

  const clubValue =
    (rankingMatch?.[1] ? decodeURIComponent(rankingMatch[1]) : '') ||
    (directMatch?.[1] ? decodeURIComponent(directMatch[1]) : '') ||
    params.get('clubId') ||
    '';

  // Sanitize unit code: only keep first 6 alphanumeric chars, uppercase
  const rawUnitCode = params.get('u') || '';
  const unitCode = rawUnitCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();

  return { clubValue, unitCode };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// Determines if a requirement was satisfied — used in public views without exposing raw scores.
const isRequirementDone = (result?: RankingUnitProgressDoc['resultados'][string]): boolean => {
  if (!result) return false;
  return (result.calculatedPoints ?? 0) > 0;
};

const toSafeNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getBonusInputCount = (requirement: RankingRequirement, result?: RankingUnitProgressDoc['resultados'][string]) => {
  if (!result || !requirement.allowBonus || !requirement.bonusType) return 0;

  if (requirement.bonusType === 'FIXED') {
    return toSafeNumber(result.bonusInput) > 0 ? 1 : 0;
  }

  if (requirement.bonusType === 'PER_UNIT') {
    return Math.max(0, toSafeNumber(result.bonusInput ?? (requirement.requiresQuantity ? result.quantity : 0)));
  }

  return Math.max(0, toSafeNumber(result.bonusInput));
};

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

interface UnitViewProps {
  unit: Unidade;
  quarter: RankingQuarter | null;
  requirements: RankingRequirement[];
  progressDoc?: RankingUnitProgressDoc;
}

// Shows a single unit's requirements status — NO scores, NO positions, NO other units.
const UnitView: React.FC<UnitViewProps> = ({ unit, quarter, requirements, progressDoc }) => {
  const grouped = useMemo(() => {
    const map = new Map<string, RankingRequirement[]>();
    requirements.forEach(req => {
      const list = map.get(req.category) || [];
      list.push(req);
      map.set(req.category, list);
    });
    return [...map.entries()];
  }, [requirements]);

  const doneCount = requirements.filter(req =>
    isRequirementDone(progressDoc?.resultados?.[req.id])
  ).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,178,255,0.12),_transparent_25%),linear-gradient(180deg,#050816_0%,#0B0F1A_100%)] text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">

        <header className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-6 sm:p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-[20px] bg-[#0B0F1A] border border-white/10 overflow-hidden flex items-center justify-center">
              {unit.imageUrl ? (
                <img src={unit.imageUrl} alt={unit.nome} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-2xl text-gray-300">{fallbackAvatar(unit.nome)}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase font-black text-[#00B2FF]">
              {quarter?.name || 'Trimestre'} {quarter?.year || ''}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">{unit.nome}</h1>
            <p className="text-gray-400 mt-3 text-sm">
              {doneCount} de {requirements.length} requisitos cumpridos
            </p>
          </div>
        </header>

        {grouped.map(([category, items]) => (
          <section key={category} className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,15,26,0.97))] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <p className="text-[10px] tracking-[0.3em] uppercase font-black text-gray-500">{category}</p>
            </div>
            <div className="divide-y divide-white/5">
              {items.map(req => {
                const done = isRequirementDone(progressDoc?.resultados?.[req.id]);
                return (
                  <div key={req.id} className="flex items-center gap-4 px-5 py-4">
                    {done
                      ? <CheckCircle2 size={20} className="text-[#00F5A0] shrink-0" />
                      : <Circle size={20} className="text-gray-700 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-snug ${done ? 'text-gray-200' : 'text-gray-500'}`}>
                        {req.name}
                      </p>
                      {req.description && (
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{req.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {requirements.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center text-gray-500">
            Nenhum requisito disponível para este trimestre.
          </div>
        )}

        <p className="text-center text-[10px] uppercase tracking-[0.3em] font-black text-gray-700 pb-6">
          Super Ranking — Visualização individual
        </p>
      </div>
    </div>
  );
};

interface RestrictedViewProps {
  units: Unidade[];
  quarter: RankingQuarter | null;
  requirements: RankingRequirement[];
  progressDocs: RankingUnitProgressDoc[];
}

// Shows all units alphabetically. Requirements are hidden behind a unit code gate.
const RestrictedView: React.FC<RestrictedViewProps> = ({ units, quarter, requirements, progressDocs }) => {
  const [pendingUnitId, setPendingUnitId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [unlockedUnitIds, setUnlockedUnitIds] = useState<Set<string>>(new Set());
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [units]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, RankingRequirement[]>();
    requirements.forEach(req => {
      const list = map.get(req.category) || [];
      list.push(req);
      map.set(req.category, list);
    });
    return [...map.entries()];
  }, [requirements]);

  const handleUnitClick = (unit: Unidade) => {
    if (unlockedUnitIds.has(unit.id)) {
      setExpandedUnitId(prev => prev === unit.id ? null : unit.id);
      setPendingUnitId(null);
      return;
    }
    const isAlreadyPending = pendingUnitId === unit.id;
    setPendingUnitId(isAlreadyPending ? null : unit.id);
    setCodeInput('');
    setCodeError(false);
    if (!isAlreadyPending) {
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleCodeSubmit = (unit: Unidade) => {
    const expected = generateUnitCode(unit.id);
    const entered = codeInput.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (entered === expected) {
      setUnlockedUnitIds(prev => new Set([...prev, unit.id]));
      setExpandedUnitId(unit.id);
      setPendingUnitId(null);
      setCodeInput('');
      setCodeError(false);
    } else {
      setCodeError(true);
      inputRef.current?.select();
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(229,57,53,0.14),_transparent_25%),linear-gradient(180deg,#050816_0%,#0B0F1A_100%)] text-gray-100 overflow-hidden">
      <div className="max-w-4xl mx-auto px-3 py-6 sm:px-4 sm:py-10 space-y-5">

        <header className="relative rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 sm:p-8 overflow-hidden">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative w-24 h-24 rounded-[24px] border border-[#243047] bg-[radial-gradient(circle_at_top,rgba(229,57,53,0.16),rgba(11,15,26,0.94)_70%)] flex items-center justify-center overflow-hidden">
              <img src="/logo-clube.png" alt="Logo do clube" className="w-20 h-20 object-contain scale-110" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                Super <span className="text-[#E53935]">Ranking</span>
              </h1>
              <p className="text-gray-400 mt-2 text-sm">{quarter?.name} {quarter?.year}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-black text-gray-500">
              Clique na sua unidade para ver seus requisitos
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,15,26,0.96))] p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase font-black text-gray-500">Unidades participantes</p>
            <h2 className="text-2xl font-black mt-2">{sortedUnits.length} unidades</h2>
          </div>

          <div className="space-y-3">
            {sortedUnits.map(unit => {
              const progressDoc = progressDocs.find(d => d.unitId === unit.id);
              const doneCount = requirements.filter(req =>
                isRequirementDone(progressDoc?.resultados?.[req.id])
              ).length;
              const isUnlocked = unlockedUnitIds.has(unit.id);
              const isExpanded = expandedUnitId === unit.id;
              const isPending = pendingUnitId === unit.id;

              return (
                <article key={unit.id} className="rounded-[24px] border border-white/10 bg-[#0B0F1A]/80 overflow-hidden transition-all">

                  {/* Unit header row — always visible */}
                  <div
                    onClick={() => handleUnitClick(unit)}
                    className="flex items-center justify-between gap-4 p-4 md:p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-14 h-10 rounded-[14px] bg-[#111827] border border-white/10 overflow-hidden flex items-center justify-center p-1 shrink-0">
                        {unit.imageUrl ? (
                          <img src={unit.imageUrl} alt={unit.nome} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-black text-sm text-gray-300">{fallbackAvatar(unit.nome)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black break-words">{unit.nome}</h3>
                        {isUnlocked && (
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            {doneCount}/{requirements.length} requisitos
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center p-2 text-gray-500 hover:text-white transition-colors shrink-0">
                      {isUnlocked
                        ? (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)
                        : <Lock size={18} className={isPending ? 'text-[#FFD60A]' : 'text-gray-600'} />
                      }
                    </div>
                  </div>

                  {/* Code input — shown when unit is locked and user clicked */}
                  {isPending && !isUnlocked && (
                    <div
                      className="px-4 pb-4 md:px-5 md:pb-5 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-200"
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-[11px] uppercase tracking-[0.25em] font-black text-gray-500 mb-3 flex items-center gap-2">
                        <KeyRound size={12} />
                        Digite o código da sua unidade
                      </p>
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          maxLength={6}
                          value={codeInput}
                          onChange={e => {
                            setCodeInput(e.target.value.toUpperCase());
                            setCodeError(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCodeSubmit(unit);
                            if (e.key === 'Escape') { setPendingUnitId(null); setCodeInput(''); setCodeError(false); }
                          }}
                          placeholder="XXXXXX"
                          className={`flex-1 bg-[#111827] border rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-center outline-none transition-colors ${
                            codeError
                              ? 'border-[#E53935]/60 text-[#FCA5A5] placeholder-[#E53935]/30'
                              : 'border-[#1F2937] text-white placeholder-gray-700 focus:border-[#FFD60A]/50'
                          }`}
                        />
                        <button
                          onClick={() => handleCodeSubmit(unit)}
                          disabled={codeInput.trim().length === 0}
                          className="px-5 py-3 rounded-xl bg-[#FFD60A] text-[#0B0F1A] text-xs font-black uppercase tracking-widest disabled:opacity-40 transition-opacity"
                        >
                          Ver
                        </button>
                      </div>
                      {codeError && (
                        <p className="text-[11px] text-[#FCA5A5] font-bold mt-2 flex items-center gap-1">
                          Código incorreto. Verifique com sua liderança.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Requirements — shown only after correct code */}
                  {isUnlocked && isExpanded && (
                    <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-200">
                      {grouped.map(([category, items]) => (
                        <div key={category} className="mb-4 last:mb-0">
                          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-600 mb-2">{category}</p>
                          <div className="space-y-1.5">
                            {items.map(req => {
                              const done = isRequirementDone(progressDoc?.resultados?.[req.id]);
                              return (
                                <div key={req.id} className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2.5 border border-white/5">
                                  {done
                                    ? <CheckCircle2 size={14} className="text-[#00F5A0] shrink-0" />
                                    : <Circle size={14} className="text-gray-700 shrink-0" />
                                  }
                                  <span className={`text-sm font-medium leading-snug ${done ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {req.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}

            {sortedUnits.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-[#1F2937] p-10 text-center text-gray-500">
                Nenhuma unidade disponível.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const PublicRanking: React.FC = () => {
  const { clubValue: routeValue, unitCode } = getPublicRouteParams();

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

  // --------------------------------------------------------------------------
  // Derived state
  // --------------------------------------------------------------------------
  const ranking = useMemo(
    () => buildRankingRows(units, requirements, progressDocs),
    [units, requirements, progressDocs]
  );
  const podium = useMemo(() => buildPodiumRows(ranking), [ranking]);
  const leader = currentQuarter?.status === 'CLOSED' && podium.length > 0 ? podium[0] : null;
  const otherRows = ranking.slice(3);
  const publicMode = currentQuarter?.publicMode ?? 'FULL';

  // Unit resolved from code (only when a unit code is present in the URL)
  const unitFromCode = useMemo(() => {
    if (!unitCode) return null;
    return units.find(u => generateUnitCode(u.id) === unitCode) || null;
  }, [unitCode, units]);

  // --------------------------------------------------------------------------
  // Loading screen
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FFD60A]" size={32} />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Club not found
  // --------------------------------------------------------------------------
  if (!clubId) {
    return (
      <div className="min-h-screen bg-[#050816] text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-[32px] border border-[#1F2937] bg-[#0B0F1A] p-8 text-center">
          <h1 className="text-3xl font-black">Ranking indisponível</h1>
          <p className="text-gray-400 mt-3">Abra este painel com um link contendo o clube no hash público.</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Mode: individual unit code — shows ONLY that unit's requirements, no scores
  // --------------------------------------------------------------------------
  if (unitCode) {
    if (!unitFromCode) {
      return (
        <div className="min-h-screen bg-[#050816] text-gray-200 flex items-center justify-center p-6">
          <div className="max-w-lg rounded-[32px] border border-[#1F2937] bg-[#0B0F1A] p-8 text-center">
            <h1 className="text-3xl font-black">Código inválido</h1>
            <p className="text-gray-400 mt-3">Este link de unidade não é válido. Verifique com sua liderança.</p>
          </div>
        </div>
      );
    }

    const unitProgressDoc = progressDocs.find(d => d.unitId === unitFromCode.id);

    return (
      <UnitView
        unit={unitFromCode}
        quarter={currentQuarter}
        requirements={requirements}
        progressDoc={unitProgressDoc}
      />
    );
  }

  // --------------------------------------------------------------------------
  // Mode: restricted — alphabetical list, no scores, no podium
  // --------------------------------------------------------------------------
  if (publicMode === 'RESTRICTED') {
    return (
      <RestrictedView
        units={units}
        quarter={currentQuarter}
        requirements={requirements}
        progressDocs={progressDocs}
      />
    );
  }

  // --------------------------------------------------------------------------
  // Mode: full — original ranking with scores, podium, etc.
  // --------------------------------------------------------------------------
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
                  <div className="mt-5 pt-5 border-t border-white/10 animate-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-4">Requisitos Pontuados</h4>
                    <div className="space-y-2">
                      {requirements.map(req => {
                        const progress = progressDocs.find(d => d.unitId === row.unidade.id);
                        const result = progress?.resultados?.[req.id];
                        const points = result ? (result.calculatedPoints || 0) : 0;
                        const basePoints = result?.basePoints || 0;
                        const bonusPoints = result?.bonusPoints || 0;
                        const penaltyPoints = result?.penaltyPoints || 0;
                        const bonusInputCount = getBonusInputCount(req, result);
                        if (points <= 0) return null;

                        return (
                          <div key={req.id} className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-white/5 hover:bg-white/5 transition-colors gap-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-[#00F5A0] shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-gray-300">{req.name}</span>
                                <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                                  Base +{basePoints}
                                  {bonusPoints > 0 && ` | Bônus +${bonusPoints}`}
                                  {bonusPoints > 0 && bonusInputCount > 0 && ` (${bonusInputCount} bônus)`}
                                  {penaltyPoints > 0 && ` | Penal -${penaltyPoints}`}
                                </p>
                              </div>
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
