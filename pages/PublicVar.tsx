import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import * as fs from '../services/firestoreDb';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade } from '../types';
import { buildRankingRows } from '../services/ranking';

// ---------------------------------------------------------------------------
// Route parsing — #var/{clubId|slug}?token=XXXX
// ---------------------------------------------------------------------------
const getVarRouteParams = () => {
  const hash = window.location.hash || '';
  const match = hash.match(/^#var\/([^?#]+)/);
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  const clubValue = match ? decodeURIComponent(match[1]) : params.get('clubId') || '';
  const token = (params.get('token') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20);
  return { clubValue, token };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const medalLabel = (pos: number) => {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `${pos}º`;
};

const medalBorder = (pos: number) => {
  if (pos === 1) return 'border-[#FFD60A]/60';
  if (pos === 2) return 'border-[#D1D5DB]/40';
  if (pos === 3) return 'border-[#F97316]/50';
  return 'border-[#1F2937]';
};

// ---------------------------------------------------------------------------
// RequirementRow
// ---------------------------------------------------------------------------
interface RequirementRowProps {
  requirement: RankingRequirement;
  entry?: RankingUnitProgressDoc['resultados'][string];
}

const RequirementRow: React.FC<RequirementRowProps> = ({ requirement, entry }) => {
  const points = entry?.calculatedPoints ?? 0;
  const validated = points > 0 || entry?.completed === true;

  return (
    <div className={`flex items-start gap-3 py-2 px-3 rounded-xl ${validated ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
      <div className="mt-0.5 shrink-0">
        {validated
          ? <CheckCircle2 size={16} className="text-green-400" />
          : <XCircle size={16} className="text-red-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-200 leading-tight">{requirement.name}</p>
        {requirement.category && (
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{requirement.category}</p>
        )}
        {entry?.notes && (
          <p className="text-[11px] text-amber-300/80 mt-1 italic">
            Obs: {entry.notes}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className={`text-xs font-black ${validated ? 'text-green-400' : 'text-red-500'}`}>
          {validated ? `+${points}` : '0'} pts
        </span>
        {entry?.bonusPoints != null && entry.bonusPoints > 0 && (
          <p className="text-[10px] text-amber-400">+{entry.bonusPoints} bônus</p>
        )}
        {entry?.penaltyPoints != null && entry.penaltyPoints > 0 && (
          <p className="text-[10px] text-red-400">-{entry.penaltyPoints} pen.</p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// UnitCard
// ---------------------------------------------------------------------------
interface UnitCardProps {
  position: number;
  unidade: Unidade;
  requirements: RankingRequirement[];
  progressDoc?: RankingUnitProgressDoc;
  total: number;
}

const UnitCard: React.FC<UnitCardProps> = ({ position, unidade, requirements, progressDoc, total }) => {
  const [expanded, setExpanded] = useState(false);

  const validatedCount = requirements.filter(req => {
    const entry = progressDoc?.resultados?.[req.id];
    return (entry?.calculatedPoints ?? 0) > 0 || entry?.completed === true;
  }).length;

  const invalidatedCount = requirements.length - validatedCount;

  return (
    <div className={`rounded-2xl border ${medalBorder(position)} bg-[#0D1117] overflow-hidden`}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="w-10 h-10 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center shrink-0">
          <span className="text-base font-black text-gray-200">{medalLabel(position)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white uppercase tracking-wide truncate">{unidade.nome}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-green-400 font-bold">{validatedCount} ok</span>
            {invalidatedCount > 0 && (
              <span className="text-[11px] text-red-400 font-bold">{invalidatedCount} pendente{invalidatedCount > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl font-black text-white">{total.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">pontos</p>
        </div>

        <span className="text-gray-600 text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Requirements list */}
      {expanded && (
        <div className="border-t border-[#1F2937] px-4 pb-4 pt-3 flex flex-col gap-1">
          {requirements.map(req => (
            <RequirementRow
              key={req.id}
              requirement={req}
              entry={progressDoc?.resultados?.[req.id]}
            />
          ))}
          {requirements.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">Nenhum requisito cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const PublicVar: React.FC = () => {
  const { clubValue, token } = getVarRouteParams();
  const accessRegistered = useRef(false);

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [clubId, setClubId] = useState('');
  const [units, setUnits] = useState<Unidade[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<RankingQuarter | null>(null);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);

  useEffect(() => {
    if (!clubValue || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const resolvedId = clubValue.startsWith('clube-')
          ? clubValue
          : (await fs.findClubByPublicSlug(clubValue))?.id || '';

        if (!resolvedId || cancelled) { setLoading(false); return; }

        // Validate token
        const varConfig = await fs.getVarConfig(resolvedId);
        if (!varConfig?.token || varConfig.token !== token) {
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) {
          setClubId(resolvedId);
          setTokenValid(true);
        }

        // Register access once
        if (!accessRegistered.current) {
          accessRegistered.current = true;
          fs.registerVarAccess(resolvedId).catch(() => {});
        }

        const [fetchedUnits, fetchedQuarters] = await Promise.all([
          fs.listUnidades(resolvedId),
          fs.listRankingQuarters(resolvedId)
        ]);

        if (cancelled) return;

        const eligibleUnits = fetchedUnits.filter(u => u.ativo && u.tipo !== 'DIRETORIA');
        const activeQuarter =
          fetchedQuarters.find(q => q.status === 'ACTIVE') ||
          fetchedQuarters.find(q => q.status === 'CLOSED') ||
          fetchedQuarters[0] ||
          null;

        setUnits(eligibleUnits);
        setCurrentQuarter(activeQuarter);

        if (activeQuarter) {
          const [fetchedReqs, fetchedDocs] = await Promise.all([
            fs.listRankingRequirements(resolvedId, activeQuarter.id),
            fs.listRankingProgress(resolvedId, activeQuarter.id)
          ]);
          if (cancelled) return;
          setRequirements(fetchedReqs.filter(r => r.active));
          setProgressDocs(fetchedDocs);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [clubValue, token]);

  const ranking = useMemo(
    () => buildRankingRows(units, requirements, progressDocs),
    [units, requirements, progressDocs]
  );

  const progressByUnit = useMemo(
    () => new Map(progressDocs.map(d => [d.unitId, d])),
    [progressDocs]
  );

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-[#FFD60A] animate-spin" size={36} />
          <p className="text-gray-400 text-xs uppercase tracking-widest font-black animate-pulse">Carregando VAR...</p>
        </div>
      </div>
    );
  }

  // Token inválido / ausente
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Acesso Negado</h1>
            <p className="text-sm text-gray-400 mt-2">
              Token inválido ou ausente. Solicite o link correto à Diretoria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0B0F1A]/95 backdrop-blur border-b border-[#1F2937]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <img
            src="/var-mascote.png"
            alt="VAR"
            className="h-12 w-auto object-contain drop-shadow-lg"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-white uppercase tracking-wide leading-tight">
              VAR — Revisão de Resultados
            </h1>
            {currentQuarter && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {currentQuarter.name} · {currentQuarter.year} ·{' '}
                <span className={`font-bold ${currentQuarter.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                  {currentQuarter.status === 'ACTIVE' ? 'Em andamento' : 'Encerrado'}
                </span>
              </p>
            )}
          </div>
          <div className="shrink-0 bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] text-[#FFD60A] font-black uppercase tracking-wide">Confidencial</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-3">
        {/* Summary bar */}
        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] px-5 py-3 flex items-center justify-between gap-4">
          <div className="text-center">
            <p className="text-xl font-black text-white">{ranking.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Unidades</p>
          </div>
          <div className="w-px h-8 bg-[#1F2937]" />
          <div className="text-center">
            <p className="text-xl font-black text-white">{requirements.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Requisitos</p>
          </div>
          <div className="w-px h-8 bg-[#1F2937]" />
          <div className="text-center">
            <p className="text-xl font-black text-white">
              {ranking[0]?.total.toLocaleString('pt-BR') ?? '—'}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Líder (pts)</p>
          </div>
        </div>

        {/* Tip */}
        <p className="text-[11px] text-gray-500 text-center">
          Toque em cada unidade para expandir os requisitos
        </p>

        {/* Ranking list */}
        {ranking.map((row, idx) => (
          <UnitCard
            key={row.unidade.id}
            position={idx + 1}
            unidade={row.unidade}
            requirements={requirements}
            progressDoc={progressByUnit.get(row.unidade.id)}
            total={row.total}
          />
        ))}

        {ranking.length === 0 && (
          <div className="rounded-2xl border border-[#1F2937] bg-[#111827] px-5 py-10 text-center">
            <p className="text-sm text-gray-400">Nenhuma unidade com dados de ranking.</p>
          </div>
        )}

        <p className="text-[10px] text-gray-600 text-center mt-4 uppercase tracking-widest">
          Super Unidades · Acesso Restrito
        </p>
      </main>
    </div>
  );
};
