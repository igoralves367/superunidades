import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { VarAccessLogEntry } from '../types';
import * as fs from '../services/firestoreDb';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade } from '../types';
import { buildRankingRows } from '../services/ranking';

// ---------------------------------------------------------------------------
// Device detection + UA parsing
// ---------------------------------------------------------------------------
const parseDeviceInfo = (): Omit<VarAccessLogEntry, 'accessedAt'> => {
  const ua = navigator.userAgent;

  // Device type
  const isTablet = /tablet|ipad|playbook|silk/i.test(ua);
  const isMobile = !isTablet && /mobi|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua);
  const deviceType: VarAccessLogEntry['deviceType'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // OS
  let os = 'Desconhecido';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/mac os x/i.test(ua) && !/iphone|ipad/i.test(ua)) os = 'macOS';
  else if (/android (\d+[\.\d]*)/i.test(ua)) os = `Android ${ua.match(/android (\d+[\.\d]*)/i)?.[1] ?? ''}`.trim();
  else if (/iphone os ([\d_]+)/i.test(ua)) os = `iOS ${(ua.match(/iphone os ([\d_]+)/i)?.[1] ?? '').replace(/_/g, '.')}`;
  else if (/ipad.*os ([\d_]+)/i.test(ua)) os = `iPadOS ${(ua.match(/os ([\d_]+)/i)?.[1] ?? '').replace(/_/g, '.')}`;
  else if (/linux/i.test(ua)) os = 'Linux';

  // Device model
  let deviceModel = 'Desconhecido';
  if (/iphone/i.test(ua)) {
    deviceModel = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    deviceModel = 'iPad';
  } else if (/android/i.test(ua)) {
    // Android UA: "(...; Device Model Build/...)" — extract model between "; " and " Build" or ")"
    const modelMatch = ua.match(/;\s*([^;)]+?)\s+(?:Build\/|MIUI\/|\))/i);
    if (modelMatch) {
      const raw = modelMatch[1].trim();
      // Filter out OS info that sometimes appears here
      if (!/android|linux|mobile/i.test(raw)) {
        deviceModel = raw;
      }
    }
    if (deviceModel === 'Desconhecido') {
      const fallback = ua.match(/android[^;]*;\s*([^)]+)\)/i);
      deviceModel = fallback?.[1]?.trim() ?? 'Android';
    }
  } else if (/windows/i.test(ua)) {
    deviceModel = 'PC Windows';
  } else if (/macintosh/i.test(ua)) {
    deviceModel = 'Mac';
  }

  return { deviceType, deviceModel, os };
};

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
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center shrink-0">
          <span className="text-base sm:text-lg font-black text-gray-200">{medalLabel(position)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-black text-white uppercase tracking-wide truncate">{unidade.nome}</p>
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-green-400 font-bold">{validatedCount} ok</span>
            {invalidatedCount > 0 && (
              <span className="text-[11px] text-red-400 font-bold">{invalidatedCount} pendente{invalidatedCount > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg sm:text-xl font-black text-white">{total.toLocaleString('pt-BR')}</p>
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

        // Validate token — lê o clube (doc público), sem necessidade de auth
        const club = await fs.getClub(resolvedId);
        if (!club?.varToken || club.varToken !== token) {
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) {
          setClubId(resolvedId);
          setTokenValid(true);
        }

        // Register access once — sign in anonymously so Firestore rules allow the write
        if (!accessRegistered.current) {
          accessRegistered.current = true;
          const ensureAuth = auth.currentUser
            ? Promise.resolve()
            : signInAnonymously(auth).then(() => {});
          ensureAuth
            .then(() => fs.registerVarAccess(resolvedId, parseDeviceInfo()))
            .catch(() => {});
        }

        const [fetchedUnits, fetchedQuarters] = await Promise.all([
          fs.listUnidades(resolvedId),
          fs.listRankingQuarters(resolvedId)
        ]);

        if (cancelled) return;

        const eligibleUnits = fetchedUnits.filter(u => u.ativo && u.participatesClubao !== false);
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
  if (loading) return <LoadingScreen inline />;

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
      {/* Hero header — mascote centralizado, subtítulo abaixo */}
      <header className="bg-[#0B0F1A] border-b border-[#1F2937] pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-2 text-center">
          {/* Mascote em destaque */}
          <img
            src="/var-mascote.png"
            alt="VAR"
            className="h-40 sm:h-52 w-auto object-contain drop-shadow-2xl"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />

          {/* Subtítulo */}
          <p className="text-base sm:text-lg font-bold text-gray-300 tracking-wide">
            Revisão de Resultados
          </p>

          {/* Trimestre */}
          {currentQuarter && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 font-semibold">
                {currentQuarter.name} · {currentQuarter.year}
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                currentQuarter.status === 'ACTIVE'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}>
                {currentQuarter.status === 'ACTIVE' ? 'Em andamento' : 'Encerrado'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-3">
        {/* Summary bar */}
        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-4 grid grid-cols-3 divide-x divide-[#1F2937]">
          <div className="text-center px-2">
            <p className="text-2xl sm:text-3xl font-black text-white">{ranking.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Unidades</p>
          </div>
          <div className="text-center px-2">
            <p className="text-2xl sm:text-3xl font-black text-white">{requirements.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Requisitos</p>
          </div>
          <div className="text-center px-2">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {ranking[0]?.total.toLocaleString('pt-BR') ?? '—'}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Líder (pts)</p>
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
