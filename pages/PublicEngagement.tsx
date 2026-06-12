import React, { useEffect, useMemo, useState } from 'react';
import { Snowflake } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import * as fs from '../services/firestoreDb';
import { Desbravador, RankingQuarter, RankingUnitProgressDoc, Reuniao, ReuniaoPresenca, Unidade } from '../types';
import { computeEngagementRows } from '../services/engagement';
import { EngagementUnitCard } from '../components/Engagement/EngagementUnitCard';

const getClubValue = () => {
  const hash = window.location.hash || '';
  const match = hash.match(/^#engajamento\/([^?#]+)/);
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  return (match?.[1] ? decodeURIComponent(match[1]) : '') || params.get('clubId') || '';
};

const aggregateClassProgress = async (
  clubId: string,
  desbravadores: Desbravador[]
): Promise<Record<string, number>> => {
  const ativos = desbravadores.filter(d => d.status === 'ATIVO');
  const perDbv = await Promise.all(
    ativos.map(async dbv => {
      try {
        const progresso = await fs.listProgressoDesbravador(clubId, dbv.id);
        const done = progresso.filter((p: any) => p.concluido || p.feito).length;
        return { unidadeId: dbv.unidadeId, done };
      } catch {
        return { unidadeId: dbv.unidadeId, done: 0 };
      }
    })
  );
  return perDbv.reduce<Record<string, number>>((acc, { unidadeId, done }) => {
    if (!unidadeId) return acc;
    acc[unidadeId] = (acc[unidadeId] || 0) + done;
    return acc;
  }, {});
};

export const PublicEngagement: React.FC = () => {
  const routeValue = getClubValue();

  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState('');
  const [units, setUnits] = useState<Unidade[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [presencas, setPresencas] = useState<ReuniaoPresenca[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [classProgressByUnit, setClassProgressByUnit] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    const resolveClubId = async () =>
      routeValue.startsWith('clube-')
        ? routeValue
        : (await fs.findClubByPublicSlug(routeValue))?.id || '';

    const pickActiveQuarter = (quarters: RankingQuarter[]): RankingQuarter | null => {
      const available = quarters.filter(q => q.ativo);
      return (
        available.find(q => q.status === 'ACTIVE') ||
        available.find(q => q.status === 'CLOSED') ||
        available[0] ||
        null
      );
    };

    const loadCheapSignals = async (resolvedClubId: string) => {
      const quarters = await fs.listRankingQuarters(resolvedClubId);
      const activeQuarter = pickActiveQuarter(quarters);
      const [fetchedPresencas, fetchedDocs] = await Promise.all([
        fs.listReuniaoPresencas(resolvedClubId),
        activeQuarter
          ? fs.listRankingProgress(resolvedClubId, activeQuarter.id)
          : Promise.resolve([] as RankingUnitProgressDoc[])
      ]);
      return { fetchedPresencas, fetchedDocs };
    };

    const initialLoad = async () => {
      const resolvedClubId = await resolveClubId();
      if (!resolvedClubId) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const [fetchedUnits, fetchedReunioes, fetchedDbvs] = await Promise.all([
          fs.listUnidades(resolvedClubId),
          fs.listReunioes(resolvedClubId),
          fs.listDesbravadores(resolvedClubId)
        ]);
        const eligibleUnits = fetchedUnits.filter(u => u.ativo && u.participatesClubao !== false);
        const { fetchedPresencas, fetchedDocs } = await loadCheapSignals(resolvedClubId);
        const classProgress = await aggregateClassProgress(resolvedClubId, fetchedDbvs);
        if (cancelled) return;
        setClubId(resolvedClubId);
        setUnits(eligibleUnits);
        setReunioes(fetchedReunioes);
        setDesbravadores(fetchedDbvs);
        setPresencas(fetchedPresencas);
        setProgressDocs(fetchedDocs);
        setClassProgressByUnit(classProgress);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const pollCheapSignals = async () => {
      const resolvedClubId = await resolveClubId();
      if (!resolvedClubId || cancelled) return;
      try {
        const { fetchedPresencas, fetchedDocs } = await loadCheapSignals(resolvedClubId);
        if (cancelled) return;
        setPresencas(fetchedPresencas);
        setProgressDocs(fetchedDocs);
      } catch { /* mantém estado anterior */ }
    };

    initialLoad();
    const intervalId = window.setInterval(pollCheapSignals, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [routeValue]);

  const allRows = useMemo(
    () =>
      computeEngagementRows({
        units,
        reunioes,
        presencas,
        progressDocs,
        desbravadores,
        classProgressByUnit,
        now: Date.now()
      }),
    [units, reunioes, presencas, progressDocs, desbravadores, classProgressByUnit]
  );

  const activeRows = useMemo(() => allRows.filter(r => r.hasMovement), [allRows]);
  const hasAny = activeRows.length > 0;

  if (loading) return <LoadingScreen inline />;

  if (!clubId) {
    return (
      <div className="min-h-screen bg-[#050816] text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-[32px] border border-[#1F2937] bg-[#0B0F1A] p-8 text-center">
          <h1 className="text-3xl font-black">Painel indisponível</h1>
          <p className="text-gray-400 mt-3">Abra este painel com um link contendo o clube no hash público.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen text-gray-100 overflow-hidden transition-colors duration-700 ${
        hasAny
          ? 'bg-[linear-gradient(180deg,#0A0800_0%,#0E0C00_50%,#111000_100%)]'
          : 'bg-[linear-gradient(180deg,#020B18_0%,#050E1A_100%)]'
      }`}
    >
      <div className="max-w-5xl mx-auto px-3 py-6 sm:px-4 sm:py-10 space-y-5">

        {/* Header */}
        <header className="relative rounded-[28px] sm:rounded-[36px] border border-[#F5C518]/20 bg-[linear-gradient(135deg,rgba(245,197,24,0.06),rgba(0,0,0,0.60))] p-5 sm:p-8 overflow-hidden text-center">
          <div className="flex flex-col items-center gap-4">
            <img src="/logo.png" alt="Clubão de Unidades" className="w-28 h-28 object-contain drop-shadow-xl" />
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
                Unidades em <span className="text-[#F5C518]">Movimento</span>
              </h1>
              <p className="text-gray-400 mt-3 text-sm">
                Unidades que registraram movimentações nesta semana
              </p>
            </div>
          </div>
        </header>

        {/* Lista de unidades movimentadas */}
        {hasAny ? (
          <section className="space-y-3">
            {activeRows.map(row => (
              <EngagementUnitCard key={row.unidade.id} row={row} />
            ))}
          </section>
        ) : (
          /* Empty state — Semana Gelada */
          <div className="rounded-[28px] border border-sky-900/40 bg-[linear-gradient(135deg,rgba(14,30,60,0.8),rgba(5,14,26,0.95))] p-10 sm:p-14 text-center relative overflow-hidden">
            {/* Partículas decorativas */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
              {['top-4 left-8', 'top-10 right-12', 'bottom-8 left-16', 'bottom-4 right-8', 'top-1/2 left-4', 'top-1/3 right-6'].map((pos, i) => (
                <Snowflake
                  key={i}
                  size={i % 2 === 0 ? 16 : 10}
                  className={`absolute ${pos} text-sky-800/50`}
                />
              ))}
            </div>

            <div className="relative flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-[24px] border border-sky-700/30 bg-sky-900/20 flex items-center justify-center">
                <Snowflake size={36} className="text-sky-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-sky-200">Semana Gelada</h2>
              <p className="text-sky-400/70 text-sm max-w-sm">
                Nenhuma unidade registrou movimentação nesta semana.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] uppercase tracking-[0.3em] font-black text-gray-700 pb-6">
          Super Unidades — Unidades em Movimento
        </p>
      </div>
    </div>
  );
};
