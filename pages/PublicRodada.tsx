import React, { useEffect, useMemo, useState } from 'react';
import { LoadingScreen } from '../components/LoadingScreen';
import * as fs from '../services/firestoreDb';
import { Desbravador, RankingQuarter, RankingUnitProgressDoc, Reuniao, ReuniaoPresenca, Unidade } from '../types';
import { computeEngagementRows } from '../services/engagement';

// ---------------------------------------------------------------------------
// Route parsing
// ---------------------------------------------------------------------------
const getClubValue = () => {
  const hash = window.location.hash || '';
  // Handles: #ranking/super-unidades-nacoes OR #rodada/slug
  const matchRanking = hash.match(/^#ranking\/([^?#]+)/);
  const matchRodada = hash.match(/^#rodada\/([^?#]+)/);
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  return (
    (matchRanking?.[1] ? decodeURIComponent(matchRanking[1]) : '') ||
    (matchRodada?.[1] ? decodeURIComponent(matchRodada[1]) : '') ||
    params.get('clubId') || ''
  );
};

// ---------------------------------------------------------------------------
// Unit configuration — ordem, lado e cor por nome (case-insensitive match)
// ---------------------------------------------------------------------------
interface UnitConfig {
  nameKey: string;   // lowercase partial match
  side: 'left' | 'right';
  order: number;     // 0-based dentro do lado
  color: string;
  glow: string;
  lineColor: string;
}

const UNIT_CONFIGS: UnitConfig[] = [
  // Femininas — lado esquerdo
  { nameKey: 'brasil',    side: 'left',  order: 0, color: '#FFD60A', glow: 'rgba(255,214,10,0.35)',   lineColor: '#FFD60A' },
  { nameKey: 'frança',    side: 'left',  order: 1, color: '#3B82F6', glow: 'rgba(59,130,246,0.35)',   lineColor: '#3B82F6' },
  { nameKey: 'franca',    side: 'left',  order: 1, color: '#3B82F6', glow: 'rgba(59,130,246,0.35)',   lineColor: '#3B82F6' },
  { nameKey: 'espanha',   side: 'left',  order: 2, color: '#F97316', glow: 'rgba(249,115,22,0.35)',   lineColor: '#F97316' },
  { nameKey: 'itália',    side: 'left',  order: 3, color: '#22C55E', glow: 'rgba(34,197,94,0.35)',    lineColor: '#22C55E' },
  { nameKey: 'italia',    side: 'left',  order: 3, color: '#22C55E', glow: 'rgba(34,197,94,0.35)',    lineColor: '#22C55E' },
  // Masculinas — lado direito
  { nameKey: 'eua',       side: 'right', order: 0, color: '#60A5FA', glow: 'rgba(96,165,250,0.35)',   lineColor: '#60A5FA' },
  { nameKey: 'portugal',  side: 'right', order: 1, color: '#22C55E', glow: 'rgba(34,197,94,0.35)',    lineColor: '#22C55E' },
  { nameKey: 'rússia',    side: 'right', order: 2, color: '#EF4444', glow: 'rgba(239,68,68,0.35)',    lineColor: '#EF4444' },
  { nameKey: 'russia',    side: 'right', order: 2, color: '#EF4444', glow: 'rgba(239,68,68,0.35)',    lineColor: '#EF4444' },
  { nameKey: 'inglaterra',side: 'right', order: 3, color: '#DC2626', glow: 'rgba(220,38,38,0.35)',    lineColor: '#DC2626' },
];

const matchConfig = (name: string): UnitConfig | null => {
  const lower = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const cfg of UNIT_CONFIGS) {
    const key = cfg.nameKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes(key)) return cfg;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Trophy SVG component
// ---------------------------------------------------------------------------
const TrophySVG: React.FC<{ glow?: boolean }> = ({ glow }) => (
  <svg
    viewBox="0 0 120 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    style={{ filter: glow ? 'drop-shadow(0 0 18px #FFD60A) drop-shadow(0 0 36px rgba(255,214,10,0.4))' : undefined }}
  >
    {/* Cup body */}
    <path
      d="M30 10 H90 L80 75 Q60 95 40 75 Z"
      fill="url(#cupGrad)"
      stroke="#B8860B"
      strokeWidth="1.5"
    />
    {/* Cup handles */}
    <path d="M30 20 Q10 20 10 42 Q10 58 30 56" stroke="#B8860B" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M90 20 Q110 20 110 42 Q110 58 90 56" stroke="#B8860B" strokeWidth="4" fill="none" strokeLinecap="round"/>
    {/* Star */}
    <path
      d="M60 28 L63.5 38.5 H74.5 L65.5 45 L69 55 L60 49 L51 55 L54.5 45 L45.5 38.5 H56.5 Z"
      fill="#FFF8DC"
      opacity="0.9"
    />
    {/* Stem */}
    <rect x="53" y="75" width="14" height="28" rx="3" fill="url(#stemGrad)" stroke="#B8860B" strokeWidth="1"/>
    {/* Base */}
    <rect x="35" y="103" width="50" height="10" rx="4" fill="url(#baseGrad)" stroke="#B8860B" strokeWidth="1.5"/>
    <rect x="40" y="113" width="40" height="6" rx="3" fill="url(#footGrad)" stroke="#B8860B" strokeWidth="1"/>
    {/* Shine lines */}
    <line x1="45" y1="20" x2="40" y2="65" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round"/>
    <line x1="55" y1="15" x2="52" y2="55" stroke="rgba(255,255,255,0.10)" strokeWidth="2" strokeLinecap="round"/>

    <defs>
      <linearGradient id="cupGrad" x1="30" y1="10" x2="90" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFD700"/>
        <stop offset="40%" stopColor="#FFA500"/>
        <stop offset="100%" stopColor="#8B6914"/>
      </linearGradient>
      <linearGradient id="stemGrad" x1="53" y1="75" x2="67" y2="103" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DAA520"/>
        <stop offset="100%" stopColor="#8B6914"/>
      </linearGradient>
      <linearGradient id="baseGrad" x1="35" y1="103" x2="85" y2="113" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DAA520"/>
        <stop offset="100%" stopColor="#6B5011"/>
      </linearGradient>
      <linearGradient id="footGrad" x1="40" y1="113" x2="80" y2="119" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C8860A"/>
        <stop offset="100%" stopColor="#5A4008"/>
      </linearGradient>
    </defs>
  </svg>
);

// ---------------------------------------------------------------------------
// Unit card
// ---------------------------------------------------------------------------
interface UnitCardData {
  unidade: Unidade;
  hasMovement: boolean;
  config: UnitConfig;
}

const UnitCard: React.FC<{ data: UnitCardData; side: 'left' | 'right'; compact?: boolean }> = ({ data, side, compact }) => {
  const { unidade, hasMovement, config } = data;
  const active = hasMovement;

  const dotClass = side === 'right'
    ? 'absolute top-2 left-2 w-1.5 h-1.5 rounded-full'
    : 'absolute top-2 right-2 w-1.5 h-1.5 rounded-full';

  return (
    <div
      className="unit-card relative flex items-center rounded-[12px] transition-all duration-500 select-none w-full"
      style={{
        gap: compact ? 5 : 12,
        padding: compact ? '7px 8px' : undefined,
        paddingTop: !compact ? 12 : undefined,
        paddingBottom: !compact ? 12 : undefined,
        paddingLeft: !compact ? (side === 'right' ? '2rem' : '1rem') : undefined,
        paddingRight: !compact ? '1rem' : undefined,
        background: active
          ? `linear-gradient(135deg, rgba(${hexToRgb(config.color)},0.12) 0%, rgba(10,14,30,0.95) 100%)`
          : 'linear-gradient(135deg, rgba(15,20,40,0.95) 0%, rgba(8,12,24,0.98) 100%)',
        border: active
          ? `1.5px solid rgba(${hexToRgb(config.color)},0.55)`
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: active
          ? `0 0 20px -4px ${config.glow}, inset 0 0 20px -12px ${config.glow}`
          : '0 2px 8px rgba(0,0,0,0.4)',
        opacity: active ? 1 : 0.45,
        animation: active ? 'cardPulse 3s ease-in-out infinite' : 'none',
      }}
    >
      {/* Status dot — oculto em compact para não sobrepor conteúdo */}
      {!compact && (
        <div
          className={dotClass}
          style={{
            background: active ? config.color : '#374151',
            boxShadow: active ? `0 0 6px ${config.color}` : 'none',
          }}
        />
      )}

      {/* Flag / image */}
      <div
        className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center border-2"
        style={{
          width: compact ? 28 : 40,
          height: compact ? 28 : 40,
          borderColor: active ? `rgba(${hexToRgb(config.color)},0.7)` : 'rgba(255,255,255,0.1)',
          background: active ? `rgba(${hexToRgb(config.color)},0.1)` : 'rgba(20,25,50,0.8)',
          boxShadow: active ? `0 0 10px ${config.glow}` : 'none',
        }}
      >
        {unidade.imageUrl ? (
          <img src={unidade.imageUrl} alt={unidade.nome} className="w-full h-full object-cover" />
        ) : (
          <span
            style={{ fontSize: compact ? 9 : 14, fontWeight: 900, color: active ? config.color : '#6B7280' }}
          >
            {unidade.nome.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <span
        className="font-black tracking-wide truncate"
        style={{ color: active ? '#FFFFFF' : '#6B7280', fontSize: compact ? 11 : 14 }}
      >
        {unidade.nome}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SVG connector lines
// ---------------------------------------------------------------------------
interface ConnectorProps {
  leftCards: UnitCardData[];
  rightCards: UnitCardData[];
  leftRefs: React.RefObject<HTMLDivElement>[];
  rightRefs: React.RefObject<HTMLDivElement>[];
  trophyRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}

const Connectors: React.FC<ConnectorProps> = ({
  leftCards, rightCards, leftRefs, rightRefs, trophyRef, containerRef
}) => {
  const [lines, setLines] = useState<Array<{ d: string; color: string; active: boolean; key: string }>>([]);

  const computeLines = () => {
    const container = containerRef.current;
    const trophy = trophyRef.current;
    if (!container || !trophy) return;

    const cRect = container.getBoundingClientRect();
    const tRect = trophy.getBoundingClientRect();

    const trophyCX = tRect.left - cRect.left + tRect.width / 2;
    const trophyCY = tRect.top - cRect.top + tRect.height / 2;
    const trophyLeft = tRect.left - cRect.left;
    const trophyRight = tRect.right - cRect.left;

    const newLines: typeof lines = [];

    // Left side cards → horizontal run → elbow → vertical merge to trophyCY → enter trophy from left
    leftRefs.forEach((ref, i) => {
      const el = ref.current;
      const card = leftCards[i];
      if (!el || !card) return;
      const eRect = el.getBoundingClientRect();
      const startX = eRect.right - cRect.left + 2;
      const startY = eRect.top - cRect.top + eRect.height / 2;

      // Elbow midpoint X — halfway between card edge and trophy
      const elbowX = trophyLeft - 20;
      const cornerR = 10;
      const goingUp = startY < trophyCY;
      const dy = goingUp ? -cornerR : cornerR;

      // Path: go right to elbow, curve down/up to center Y, then into trophy
      const d = [
        `M ${startX} ${startY}`,
        `H ${elbowX - cornerR}`,
        `Q ${elbowX} ${startY} ${elbowX} ${startY + dy}`,
        `V ${trophyCY - (goingUp ? -cornerR : cornerR)}`,
        `Q ${elbowX} ${trophyCY} ${elbowX + cornerR} ${trophyCY}`,
        `H ${trophyLeft}`,
      ].join(' ');

      newLines.push({ d, color: card.config.lineColor, active: card.hasMovement, key: `left-${i}` });
    });

    // Right side cards — mirror of left
    rightRefs.forEach((ref, i) => {
      const el = ref.current;
      const card = rightCards[i];
      if (!el || !card) return;
      const eRect = el.getBoundingClientRect();
      const startX = eRect.left - cRect.left - 2;
      const startY = eRect.top - cRect.top + eRect.height / 2;

      const elbowX = trophyRight + 20;
      const cornerR = 10;
      const goingUp = startY < trophyCY;
      const dy = goingUp ? -cornerR : cornerR;

      const d = [
        `M ${startX} ${startY}`,
        `H ${elbowX + cornerR}`,
        `Q ${elbowX} ${startY} ${elbowX} ${startY + dy}`,
        `V ${trophyCY - (goingUp ? -cornerR : cornerR)}`,
        `Q ${elbowX} ${trophyCY} ${elbowX - cornerR} ${trophyCY}`,
        `H ${trophyRight}`,
      ].join(' ');

      newLines.push({ d, color: card.config.lineColor, active: card.hasMovement, key: `right-${i}` });
    });

    setLines(newLines);
  };

  useEffect(() => {
    const timer = setTimeout(computeLines, 100);
    window.addEventListener('resize', computeLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', computeLines);
    };
  });

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        {lines.map(line => (
          line.active && (
            <filter key={`glow-${line.key}`} id={`glow-${line.key}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )
        ))}
      </defs>
      {lines.map(line => (
        <g key={line.key}>
          {/* Background shadow line */}
          <path
            d={line.d}
            stroke={line.active ? line.color : '#1F2937'}
            strokeWidth={line.active ? 3 : 1.5}
            fill="none"
            opacity={line.active ? 0.15 : 0.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main line */}
          <path
            d={line.d}
            stroke={line.active ? line.color : '#374151'}
            strokeWidth={line.active ? 2 : 1}
            fill="none"
            opacity={line.active ? 0.9 : 0.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={line.active ? 'none' : '4 4'}
            filter={line.active ? `url(#glow-${line.key})` : undefined}
            style={{
              transition: 'stroke 0.6s ease, opacity 0.6s ease',
            }}
          />
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const PublicRodada: React.FC = () => {
  const routeValue = getClubValue();

  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState('');
  const [units, setUnits] = useState<Unidade[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [presencas, setPresencas] = useState<ReuniaoPresenca[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const trophyRef = React.useRef<HTMLDivElement>(null);
  const mobileContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileTrophyRef = React.useRef<HTMLDivElement>(null);

  // Create stable refs for up to 4 cards on each side (desktop + mobile)
  const leftRefs = [
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
  ];
  const rightRefs = [
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
  ];
  const mobileLeftRefs = [
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
  ];
  const mobileRightRefs = [
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
    React.useRef<HTMLDivElement>(null),
  ];

  useEffect(() => {
    let cancelled = false;

    const resolveClubId = async () =>
      routeValue.startsWith('clube-')
        ? routeValue
        : (await fs.findClubByPublicSlug(routeValue))?.id || '';

    const loadData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const resolvedId = await resolveClubId();
        if (!resolvedId) {
          if (!cancelled) setErrorMsg('Clube não encontrado.');
          return;
        }

        const [fetchedUnits, fetchedReunioes, fetchedPresencas, fetchedQuarters] = await Promise.all([
          fs.listUnidades(resolvedId),
          fs.listReunioes(resolvedId),
          fs.listReuniaoPresencas(resolvedId),
          fs.listRankingQuarters(resolvedId),
        ]);

        const activeQuarter =
          fetchedQuarters.find(q => q.ativo && q.status === 'ACTIVE') ||
          fetchedQuarters.find(q => q.ativo) ||
          null;

        const fetchedDocs = activeQuarter
          ? await fs.listRankingProgress(resolvedId, activeQuarter.id)
          : [];

        if (cancelled) return;

        setClubId(resolvedId);
        setUnits(fetchedUnits.filter(u => u.ativo && u.participatesClubao !== false));
        setReunioes(fetchedReunioes);
        setPresencas(fetchedPresencas);
        setProgressDocs(fetchedDocs);
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err?.message || 'Erro ao carregar dados.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    // Poll every 30s
    const iv = window.setInterval(loadData, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [routeValue]);

  // Compute engagement rows
  const engagementRows = useMemo(
    () =>
      computeEngagementRows({
        units,
        reunioes,
        presencas,
        progressDocs,
        desbravadores: [],
        classProgressByUnit: {},
        now: Date.now(),
      }),
    [units, reunioes, presencas, progressDocs]
  );

  // Map to UnitCardData with config, split by side
  const { leftCards, rightCards } = useMemo(() => {
    const withConfig: UnitCardData[] = engagementRows
      .map(row => {
        const cfg = matchConfig(row.unidade.nome);
        if (!cfg) return null;
        return { unidade: row.unidade, hasMovement: row.hasMovement, config: cfg };
      })
      .filter(Boolean) as UnitCardData[];

    // Dedup by nameKey + side — keep only first match per order slot
    const seen = new Set<string>();
    const deduped = withConfig.filter(c => {
      const key = `${c.config.side}-${c.config.order}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const left = deduped
      .filter(c => c.config.side === 'left')
      .sort((a, b) => a.config.order - b.config.order);

    const right = deduped
      .filter(c => c.config.side === 'right')
      .sort((a, b) => a.config.order - b.config.order);

    return { leftCards: left, rightCards: right };
  }, [engagementRows]);

  if (loading) return <LoadingScreen inline />;

  if (errorMsg || !clubId) {
    return (
      <div className="min-h-screen bg-[#050B1A] flex items-center justify-center p-6">
        <div className="rounded-[24px] border border-white/10 bg-[#0B0F1A] p-8 text-center max-w-md">
          <p className="text-2xl font-black text-white mb-2">Painel indisponível</p>
          <p className="text-gray-400">{errorMsg || 'Abra com um link contendo o slug do clube.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes cardPulse {
          0%, 100% { box-shadow: var(--pulse-shadow-min); }
          50% { box-shadow: var(--pulse-shadow-max); }
        }
        @keyframes trophyFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes trophyGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .trophy-container {
          animation: trophyFloat 4s ease-in-out infinite;
        }
        .trophy-glow-ring {
          animation: trophyGlow 3s ease-in-out infinite;
        }
        .bg-pulse {
          animation: bgPulse 5s ease-in-out infinite;
        }
      `}</style>

      <div
        className="min-h-screen text-white overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,40,100,0.4) 0%, transparent 60%), linear-gradient(180deg, #050916 0%, #060B1C 40%, #040810 100%)',
        }}
      >
        {/* ── CAMPO DE FUTEBOL — fundo quase imperceptível ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <svg
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.028 }}
          >
            {/* Campo principal */}
            <rect x="40" y="30" width="720" height="440" rx="6" fill="none" stroke="white" strokeWidth="2"/>
            {/* Linha do meio */}
            <line x1="400" y1="30" x2="400" y2="470" stroke="white" strokeWidth="1.5"/>
            {/* Círculo central */}
            <circle cx="400" cy="250" r="70" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Ponto central */}
            <circle cx="400" cy="250" r="3" fill="white"/>
            {/* Área grande esquerda */}
            <rect x="40" y="140" width="110" height="220" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Área pequena esquerda */}
            <rect x="40" y="195" width="50" height="110" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Área grande direita */}
            <rect x="650" y="140" width="110" height="220" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Área pequena direita */}
            <rect x="710" y="195" width="50" height="110" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Arco área esquerda */}
            <path d="M 150 195 Q 195 250 150 305" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Arco área direita */}
            <path d="M 650 195 Q 605 250 650 305" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Ponto pênalti esquerdo */}
            <circle cx="110" cy="250" r="2.5" fill="white"/>
            {/* Ponto pênalti direito */}
            <circle cx="690" cy="250" r="2.5" fill="white"/>
            {/* Canto esquerdo superior */}
            <path d="M 40 30 Q 55 30 55 45" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Canto esquerdo inferior */}
            <path d="M 40 470 Q 55 470 55 455" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Canto direito superior */}
            <path d="M 760 30 Q 745 30 745 45" fill="none" stroke="white" strokeWidth="1.5"/>
            {/* Canto direito inferior */}
            <path d="M 760 470 Q 745 470 745 455" fill="none" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Ambient glow spots */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div
            className="bg-pulse absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(255,214,10,0.06) 0%, transparent 70%)' }}
          />
          <div
            className="bg-pulse absolute top-1/2 left-0 w-[300px] h-[400px] -translate-y-1/2 -translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)', animationDelay: '1.5s' }}
          />
          <div
            className="bg-pulse absolute top-1/2 right-0 w-[300px] h-[400px] -translate-y-1/2 translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(239,68,68,0.05) 0%, transparent 70%)', animationDelay: '3s' }}
          />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* ── HEADER ── */}
          <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
            {/* Spacer esquerdo para balancear o badge direito */}
            <div style={{ width: 110 }} />

            {/* Espaço central vazio — logo removido (aparece no troféu) */}
            <div style={{ width: 56 }} />

            {/* Semana Atual badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{
                background: 'rgba(255,214,10,0.08)',
                border: '1px solid rgba(255,214,10,0.25)',
                color: '#FFD60A',
                width: 110,
                justifyContent: 'center',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#FFD60A', boxShadow: '0 0 5px #FFD60A', animation: 'dotBlink 2s ease-in-out infinite' }}
              />
              Semana Atual
            </div>
          </header>

          {/* ── TITLE ── */}
          <div className="text-center py-2 px-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none">
              RODADA DAS{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #FFD60A, #FFA500, #FFD60A)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s linear infinite',
                }}
              >
                UNIDADES
              </span>
            </h1>
          </div>

          {/* ── DIAGRAM ── */}
          {/* Desktop layout */}
          <div className="hidden md:flex flex-1 items-center justify-center px-6 py-4">
            <div className="relative w-full max-w-5xl" ref={containerRef}>

              {/* Column labels */}
              <div className="flex justify-between mb-4 px-2">
                <p className="text-[9px] uppercase tracking-[0.35em] font-black text-gray-500">
                  Unidades Femininas
                </p>
                <p className="text-[9px] uppercase tracking-[0.35em] font-black text-gray-500">
                  Unidades Masculinas
                </p>
              </div>

              {/* Three-column flex: left cards | trophy | right cards */}
              <div className="flex items-center gap-4" style={{ position: 'relative', zIndex: 2 }}>

                {/* Left column */}
                <div className="flex flex-col gap-4 flex-shrink-0" style={{ width: 240 }}>
                  {leftCards.map((card, i) => (
                    <div key={card.unidade.id} ref={leftRefs[i] as React.RefObject<HTMLDivElement>}>
                      <UnitCard data={card} side="left" />
                    </div>
                  ))}
                  {/* Placeholders for missing units */}
                  {Array.from({ length: Math.max(0, 4 - leftCards.length) }).map((_, i) => (
                    <div
                      key={`ph-left-${i}`}
                      className="h-[52px] rounded-[14px]"
                      style={{ border: '1px dashed rgba(255,255,255,0.05)' }}
                    />
                  ))}
                </div>

                {/* Center — trophy */}
                <div className="flex-1 flex flex-col items-center justify-center" style={{ minHeight: 320 }}>
                  {/* Trophy wrapper */}
                  <div
                    className="relative flex items-center justify-center"
                    ref={trophyRef}
                    style={{ width: 180, height: 200, zIndex: 2 }}
                  >
                    {/* Outer glow ring */}
                    <div
                      className="trophy-glow-ring absolute inset-0 rounded-[32px]"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(255,214,10,0.12) 0%, transparent 70%)',
                        boxShadow: '0 0 60px -10px rgba(255,214,10,0.3)',
                      }}
                    />

                    {/* Trophy card background */}
                    <div
                      className="absolute inset-0 rounded-[24px]"
                      style={{
                        background: 'linear-gradient(160deg, rgba(40,30,5,0.6) 0%, rgba(10,10,20,0.7) 100%)',
                        border: '1.5px solid rgba(255,214,10,0.2)',
                        backdropFilter: 'blur(4px)',
                      }}
                    />

                    {/* Logo de fundo — marca d'água atrás do troféu */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ zIndex: 1, alignItems: 'flex-start', paddingTop: 16 }}
                    >
                      <img
                        src="/logo.png"
                        alt=""
                        style={{
                          width: 160,
                          height: 160,
                          objectFit: 'contain',
                          opacity: 0.22,
                          filter: 'blur(0.3px) saturate(0.6)',
                        }}
                      />
                    </div>

                    {/* Trophy SVG — empurrado para baixo */}
                    <div className="relative trophy-container" style={{ width: 65, height: 90, zIndex: 2, marginTop: 60 }}>
                      <TrophySVG glow />
                    </div>
                  </div>

                  {/* Quarter label abaixo do troféu */}
                  <div className="mt-3 flex items-center gap-1.5" style={{ zIndex: 2 }}>
                    <span
                      className="text-[11px] font-black uppercase tracking-[0.25em]"
                      style={{ color: 'rgba(255,214,10,0.6)' }}
                    >
                      2º Trimestre
                    </span>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4 flex-shrink-0" style={{ width: 240 }}>
                  {rightCards.map((card, i) => (
                    <div key={card.unidade.id} ref={rightRefs[i] as React.RefObject<HTMLDivElement>}>
                      <UnitCard data={card} side="right" />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - rightCards.length) }).map((_, i) => (
                    <div
                      key={`ph-right-${i}`}
                      className="h-[52px] rounded-[14px]"
                      style={{ border: '1px dashed rgba(255,255,255,0.05)' }}
                    />
                  ))}
                </div>
              </div>

              {/* SVG connector lines drawn on top of everything */}
              <Connectors
                leftCards={leftCards}
                rightCards={rightCards}
                leftRefs={leftRefs as React.RefObject<HTMLDivElement>[]}
                rightRefs={rightRefs as React.RefObject<HTMLDivElement>[]}
                trophyRef={trophyRef}
                containerRef={containerRef}
              />
            </div>
          </div>

          {/* ── MOBILE LAYOUT ── mesmo bracket do desktop, compacto ── */}
          <div className="flex md:hidden flex-1 items-center justify-center px-3 py-2">
            <div className="relative w-full" ref={mobileContainerRef}>

              {/* Column labels */}
              <div className="flex justify-between mb-3 px-1">
                <p className="text-[8px] uppercase tracking-[0.3em] font-black text-gray-500">Femininas</p>
                <p className="text-[8px] uppercase tracking-[0.3em] font-black text-gray-500">Masculinas</p>
              </div>

              {/* Three-column: left | trophy | right */}
              <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 2 }}>

                {/* Left column */}
                <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 115 }}>
                  {leftCards.map((card, i) => (
                    <div key={card.unidade.id} ref={mobileLeftRefs[i] as React.RefObject<HTMLDivElement>}>
                      <UnitCard data={card} side="left" compact />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - leftCards.length) }).map((_, i) => (
                    <div key={`ph-ml-${i}`} className="h-[44px] rounded-[10px]" style={{ border: '1px dashed rgba(255,255,255,0.05)' }} />
                  ))}
                </div>

                {/* Center — trophy */}
                <div className="flex-1 flex flex-col items-center justify-center" style={{ minHeight: 260 }}>
                  <div
                    className="relative flex items-center justify-center"
                    ref={mobileTrophyRef}
                    style={{ width: 100, height: 116, zIndex: 2 }}
                  >
                    <div
                      className="trophy-glow-ring absolute inset-0 rounded-[20px]"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(255,214,10,0.12) 0%, transparent 70%)',
                        boxShadow: '0 0 40px -8px rgba(255,214,10,0.3)',
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-[18px]"
                      style={{
                        background: 'linear-gradient(160deg, rgba(40,30,5,0.6) 0%, rgba(10,10,20,0.7) 100%)',
                        border: '1.5px solid rgba(255,214,10,0.2)',
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-start justify-center pointer-events-none"
                      style={{ zIndex: 1, paddingTop: 8 }}
                    >
                      <img
                        src="/logo.png"
                        alt=""
                        style={{ width: 84, height: 84, objectFit: 'contain', opacity: 0.22, filter: 'blur(0.3px) saturate(0.6)' }}
                      />
                    </div>
                    <div className="relative trophy-container" style={{ width: 38, height: 52, zIndex: 2, marginTop: 32 }}>
                      <TrophySVG glow />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1" style={{ zIndex: 2 }}>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,214,10,0.6)' }}>
                      2º Trimestre
                    </span>
                  </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 115 }}>
                  {rightCards.map((card, i) => (
                    <div key={card.unidade.id} ref={mobileRightRefs[i] as React.RefObject<HTMLDivElement>}>
                      <UnitCard data={card} side="right" compact />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - rightCards.length) }).map((_, i) => (
                    <div key={`ph-mr-${i}`} className="h-[44px] rounded-[10px]" style={{ border: '1px dashed rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              </div>

              {/* Connector lines mobile */}
              <Connectors
                leftCards={leftCards}
                rightCards={rightCards}
                leftRefs={mobileLeftRefs as React.RefObject<HTMLDivElement>[]}
                rightRefs={mobileRightRefs as React.RefObject<HTMLDivElement>[]}
                trophyRef={mobileTrophyRef}
                containerRef={mobileContainerRef}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="py-4" />
        </div>
      </div>
    </>
  );
};
