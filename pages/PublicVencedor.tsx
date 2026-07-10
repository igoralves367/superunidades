import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Trophy, Medal } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import * as fs from '../services/firestoreDb';
import { buildRankingRows } from '../services/ranking';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade } from '../types';

type RevealPhase = 'loading' | 'suspense' | 'runners' | 'reveal';

const getPublicWinnerRouteValue = () => {
  const hash = window.location.hash || '';
  const match = hash.match(/^#vencedor\/([^?#]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  return params.get('clubId') || '';
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReduced(!!media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
};

const useCountUp = (target: number, enabled: boolean, durationMs = 1200) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    const start = performance.now();
    const to = Math.max(0, Math.floor(target || 0));
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [durationMs, enabled, target]);

  return value;
};

type ConfettiPiece = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; hue: number; life: number };

const Confetti: React.FC<{ run: boolean; reducedMotion: boolean }> = ({ run, reducedMotion }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!run || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.clientWidth;
    const h = () => canvas.clientHeight;
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const pieces: ConfettiPiece[] = Array.from({ length: 60 }, () => ({
      x: w() * rand(0.2, 0.8),
      y: h() * rand(-0.1, 0.3),
      vx: rand(-1.5, 1.5),
      vy: rand(0.8, 2.5),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.1, 0.1),
      size: rand(5, 9),
      hue: Math.random() < 0.5 ? rand(38, 52) : Math.random() < 0.5 ? rand(0, 8) : rand(200, 230),
      life: rand(1800, 3000),
    }));

    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w(), h());
      pieces.forEach((p) => {
        const t = Math.min(1, elapsed / p.life);
        const alpha = t < 0.8 ? 0.9 : (1 - (t - 0.8) / 0.2) * 0.9;
        p.x += p.vx; p.y += p.vy; p.vy += 0.015; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsl(${p.hue}deg 90% 58%)`;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < 3200) rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion, run]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-50 ${run && !reducedMotion ? 'opacity-100' : 'opacity-0'}`}
    />
  );
};

const PlaceIcon: React.FC<{ place: number }> = ({ place }) => {
  if (place === 2) return <Medal size={16} className="text-gray-300" />;
  if (place === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="text-xs font-bold text-gray-500">{place}º</span>;
};

const RunnerCard: React.FC<{ row: any; place: number; visible: boolean; delay: number }> = ({ row, place, visible, delay }) => {
  const maxPts = row.total;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0D1220] border border-[#1F2937]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      <div className="w-8 h-8 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center flex-shrink-0">
        <PlaceIcon place={place} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200 truncate">{row.unidade?.nome || '—'}</p>
        <div className="mt-1.5 h-1.5 rounded-full bg-black/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#374151] transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(4, (maxPts / (row.total || 1)) * 100))}%` }}
          />
        </div>
      </div>
      <p className="text-sm font-black text-gray-300 tabular-nums flex-shrink-0">{row.total}</p>
    </div>
  );
};

export const PublicVencedor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [units, setUnits] = useState<Unidade[]>([]);
  const [quarters, setQuarters] = useState<RankingQuarter[]>([]);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [phase, setPhase] = useState<RevealPhase>('loading');
  const [suspenseDots, setSuspenseDots] = useState(0);
  const [runnersVisible, setRunnersVisible] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const routeValue = getPublicWinnerRouteValue();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorInfo(null);
      setPhase('loading');
      try {
        if (!routeValue) throw new Error('Link inválido. Clube não identificado.');
        const club = routeValue.startsWith('clube-')
          ? await fs.getClub(routeValue)
          : await fs.findClubByPublicSlug(routeValue);
        if (!club) throw new Error('Clube não encontrado ou inativo.');

        setClubId(club.id);
        setClubName(club.nome);

        const [fetchedUnits, fetchedQuarters] = await Promise.all([
          fs.listUnidades(club.id),
          fs.listRankingQuarters(club.id),
        ]);

        const activeQuarter = fetchedQuarters.find(q => q.status === 'ACTIVE' && q.ativo) || fetchedQuarters.find(q => q.ativo) || null;
        if (!activeQuarter) throw new Error('Nenhum trimestre ativo encontrado para este clube.');

        const fetchedRequirements = await fs.listRankingRequirements(club.id, activeQuarter.id);
        await fs.syncLegacyClubaoToRanking(club.id, activeQuarter.id, fetchedRequirements.filter(r => r.active));
        const fetchedDocs = await fs.listRankingProgress(club.id, activeQuarter.id);

        setUnits(fetchedUnits.filter(u => u.ativo && u.participatesClubao !== false));
        setQuarters(fetchedQuarters.filter(q => q.ativo));
        setRequirements(fetchedRequirements.filter(r => r.active));
        setProgressDocs(fetchedDocs);

        setLoading(false);

        if (reducedMotion) {
          setPhase('reveal');
          setRunnersVisible(true);
        } else {
          setPhase('suspense');
        }
      } catch (err: any) {
        setErrorInfo(err?.message || 'Erro ao carregar os dados.');
        setLoading(false);
      }
    };
    load();
  }, [reducedMotion, routeValue]);

  // Suspense dots animation
  useEffect(() => {
    if (phase !== 'suspense') return;
    const iv = setInterval(() => setSuspenseDots(d => (d + 1) % 4), 420);
    return () => clearInterval(iv);
  }, [phase]);

  // Suspense → runners after 2.2s
  useEffect(() => {
    if (phase !== 'suspense') return;
    const t1 = window.setTimeout(() => {
      setPhase('runners');
      // Slight delay before animating cards in
      window.setTimeout(() => setRunnersVisible(true), 80);
    }, 2200);
    return () => clearTimeout(t1);
  }, [phase]);

  // Runners → reveal after 1.8s
  useEffect(() => {
    if (phase !== 'runners') return;
    const t = window.setTimeout(() => setPhase('reveal'), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const activeQuarter = useMemo(() => quarters.find(q => q.status === 'ACTIVE') || quarters[0] || null, [quarters]);
  const ranking = useMemo(() => buildRankingRows(units, requirements, progressDocs), [progressDocs, requirements, units]);

  const leader = ranking[0] || null;
  const leaderPoints = leader?.total || 0;
  const runners = ranking.slice(1); // 2nd place onwards

  const pointsAnimated = useCountUp(leaderPoints, phase === 'reveal' && !reducedMotion, 1200);

  // ── Loading
  if (loading) return <LoadingScreen inline />;

  // ── Error
  if (errorInfo) {
    return (
      <div className="min-h-screen bg-[#060A14] text-gray-100 flex items-center justify-center px-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 w-full max-w-lg">
          <p className="text-sm text-gray-400">Super Unidades</p>
          <h1 className="text-xl font-bold text-white mt-1">Não foi possível carregar</h1>
          <p className="text-gray-400 mt-3">{errorInfo}</p>
          <a
            href={clubId ? `#ranking/${encodeURIComponent(clubId)}` : '#'}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B0F1A] border border-[#1F2937] text-sm text-gray-200 hover:border-[#374151] transition-colors"
          >
            <Trophy size={16} className="text-[#FFD60A]" /> Abrir ranking público
          </a>
        </div>
      </div>
    );
  }

  // ── Suspense screen
  if (phase === 'suspense') {
    const dots = '.'.repeat(suspenseDots);
    return (
      <div className="min-h-screen bg-[#060A14] flex flex-col items-center justify-center px-4 select-none">
        <div className="flex flex-col items-center gap-6">
          {/* Pulsing crown */}
          <div
            className="relative flex items-center justify-center"
            style={{ animation: 'pulse-glow 1.4s ease-in-out infinite' }}
          >
            <div className="absolute w-24 h-24 rounded-full bg-[#FFD60A]/10 blur-2xl" />
            <div className="w-20 h-20 rounded-full bg-[#111827] border border-[#FFD60A]/30 flex items-center justify-center">
              <Crown size={36} className="text-[#FFD60A]" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase mb-2">
              {clubName} {activeQuarter ? `• ${activeQuarter.name} ${activeQuarter.year}` : ''}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Calculando resultados{dots}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Preparando a revelação</p>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-[#1F2937] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E53935] to-[#FFD60A] rounded-full"
              style={{ animation: 'suspense-bar 2.1s ease-in-out forwards' }}
            />
          </div>
        </div>

        <style>{`
          @keyframes pulse-glow {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.08); opacity: 1; }
          }
          @keyframes suspense-bar {
            0% { width: 0%; }
            60% { width: 70%; }
            85% { width: 88%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ── Runners + Reveal (shared layout)
  const winnerRevealed = phase === 'reveal';

  return (
    <div className="min-h-screen bg-[#060A14] text-gray-100 overflow-x-hidden">
      <Confetti run={winnerRevealed} reducedMotion={reducedMotion} />

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}
        <header className="text-center mb-10">
          <p className="text-[11px] text-gray-500 font-semibold tracking-widest uppercase">
            {clubName} {activeQuarter ? `• ${activeQuarter.name} ${activeQuarter.year}` : ''}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
            Vencedora do Trimestre
          </h1>
        </header>

        <main className="flex flex-col gap-4">

          {/* ── WINNER CARD */}
          <div
            className="relative rounded-[28px] overflow-hidden border"
            style={{
              borderColor: winnerRevealed ? '#FFD60A40' : '#1F2937',
              background: winnerRevealed
                ? 'linear-gradient(135deg, #141008 0%, #0D0D0D 60%, #0C0A00 100%)'
                : '#0D1220',
              opacity: winnerRevealed ? 1 : 0,
              transform: winnerRevealed ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(12px)',
              transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1), border-color 0.6s ease, background 0.6s ease',
              boxShadow: winnerRevealed ? '0 0 60px -10px rgba(255,214,10,0.2)' : 'none',
            }}
          >
            {/* Glow background */}
            {winnerRevealed && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#FFD60A]/8 blur-3xl rounded-full" />
              </div>
            )}

            <div className="relative p-6 sm:p-10">
              {/* Badge */}
              <div className="flex items-center justify-center mb-6">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide"
                  style={{
                    background: winnerRevealed ? 'linear-gradient(90deg, #FFD60A22, #FFD60A15)' : '#111827',
                    border: winnerRevealed ? '1px solid #FFD60A50' : '1px solid #1F2937',
                    color: winnerRevealed ? '#FFD60A' : '#6B7280',
                    transition: 'all 0.5s ease 0.2s',
                  }}
                >
                  <Crown size={14} />
                  1º LUGAR
                </div>
              </div>

              {/* Name */}
              <div className="text-center">
                <h2
                  className="text-3xl sm:text-5xl font-black tracking-tight"
                  style={{
                    color: winnerRevealed ? '#FFFFFF' : '#6B7280',
                    transition: 'color 0.5s ease 0.3s',
                  }}
                >
                  {leader?.unidade?.nome || '—'}
                </h2>
                {winnerRevealed && (
                  <p className="text-gray-400 mt-2 text-sm">
                    Parabéns pela liderança no trimestre! 🏆
                  </p>
                )}
              </div>

              {/* Score */}
              <div className="mt-8 flex items-center justify-center">
                <div
                  className="w-full max-w-xs rounded-[20px] p-5"
                  style={{
                    background: winnerRevealed ? '#0B0A00' : '#111827',
                    border: winnerRevealed ? '1px solid #FFD60A30' : '1px solid #1F2937',
                    transition: 'all 0.5s ease 0.3s',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Pontuação</p>
                      <p
                        className="text-4xl font-black tabular-nums mt-1"
                        style={{ color: winnerRevealed ? '#FFD60A' : '#374151', transition: 'color 0.5s ease 0.4s' }}
                      >
                        {reducedMotion ? leaderPoints : pointsAnimated}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: winnerRevealed ? '#FFD60A15' : '#111827',
                        border: winnerRevealed ? '1px solid #FFD60A30' : '1px solid #1F2937',
                        transition: 'all 0.5s ease 0.3s',
                      }}
                    >
                      <Trophy size={20} style={{ color: winnerRevealed ? '#FFD60A' : '#374151', transition: 'color 0.5s ease 0.3s' }} />
                    </div>
                  </div>

                  {leader && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: winnerRevealed ? `${Math.min(100, Math.max(18, leader.progressPercent * 100))}%` : '0%',
                            background: 'linear-gradient(90deg, #E53935, #FFD60A)',
                            transition: 'width 1.2s ease 0.5s',
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-600 mt-2">
                        Progresso: {Math.round(leader.progressPercent * 100)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Link */}
              {winnerRevealed && (
                <div className="mt-6 flex justify-center">
                  <a
                    href={`#ranking/${encodeURIComponent(clubId)}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B0F1A] border border-[#1F2937] text-sm font-semibold text-gray-300 hover:border-[#374151] transition-colors"
                  >
                    <Trophy size={15} className="text-[#FFD60A]" /> Ver ranking completo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ── RUNNERS (2nd, 3rd...) */}
          {runners.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <p
                className="text-[11px] text-gray-600 font-semibold uppercase tracking-widest px-1"
                style={{ opacity: runnersVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}
              >
                Outras unidades
              </p>
              {runners.map((row, i) => (
                <RunnerCard
                  key={row.unidade?.id || i}
                  row={row}
                  place={i + 2}
                  visible={runnersVisible}
                  delay={i * 120}
                />
              ))}
            </div>
          )}
        </main>

        <p className="text-center text-[11px] text-gray-700 mt-8">
          #vencedor/{routeValue}
        </p>
      </div>
    </div>
  );
};
