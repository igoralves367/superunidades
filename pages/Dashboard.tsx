import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Flag, Loader2, Target, Trophy } from 'lucide-react';
import { NeonCard } from '../components/NeonCard';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade, Usuario } from '../types';
import * as fs from '../services/firestoreDb';
import { buildRankingRows } from '../services/ranking';

interface DashboardProps {
  user: Usuario;
  onNavigate: (tab: string) => void;
}

const buildPublicLink = (clubId: string) =>
  `${window.location.origin}${window.location.pathname}#ranking/${encodeURIComponent(clubId)}`;

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [quarters, setQuarters] = useState<RankingQuarter[]>([]);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [progressDocs, setProgressDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [publicSlug, setPublicSlug] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user.clubeId) return;
      setLoading(true);
      try {
        const [fetchedUnits, fetchedQuarters] = await Promise.all([
          fs.listUnidades(user.clubeId),
          fs.listRankingQuarters(user.clubeId)
        ]);
        const slug = await fs.ensureClubPublicSlug(user.clubeId);

        const activeQuarter = fetchedQuarters.find(quarter => quarter.status === 'ACTIVE') || fetchedQuarters[0];
        const eligibleUnits = fetchedUnits.filter(unit => unit.ativo && unit.tipo !== 'DIRETORIA');

        setUnits(eligibleUnits);
        setQuarters(fetchedQuarters.filter(quarter => quarter.ativo));
        setPublicSlug(slug);

        if (activeQuarter) {
          const fetchedRequirements = await fs.listRankingRequirements(user.clubeId, activeQuarter.id);
          await fs.syncLegacyClubaoToRanking(user.clubeId, activeQuarter.id, fetchedRequirements.filter(requirement => requirement.active));
          const fetchedDocs = await fs.listRankingProgress(user.clubeId, activeQuarter.id);
          setRequirements(fetchedRequirements.filter(requirement => requirement.active));
          setProgressDocs(fetchedDocs);
        } else {
          setRequirements([]);
          setProgressDocs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user.clubeId]);

  const ranking = useMemo(() => buildRankingRows(units, requirements, progressDocs), [units, requirements, progressDocs]);
  const leader = ranking[0];
  const activeQuarter = quarters.find(quarter => quarter.status === 'ACTIVE') || quarters[0];
  const totalPoints = ranking.reduce((sum, row) => sum + row.total, 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#E53935]" size={40} />
        <p className="text-gray-500 font-bold uppercase text-[10px] mt-4 tracking-widest">Carregando central do Clubão...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-3">
        <p className="text-[10px] text-[#FFD60A] uppercase font-black tracking-[0.4em]">Clubão</p>
        <h1 className="text-4xl font-black tracking-tight text-white">Central de Unidades e Ranking</h1>
        <p className="text-gray-400 max-w-3xl">
          O sistema agora está focado apenas em unidades, requisitos do Clubão e ranking trimestral.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NeonCard color="#00B2FF">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Unidades ativas</p>
          <h3 className="text-4xl font-black mt-3">{units.length}</h3>
        </NeonCard>
        <NeonCard color="#FFD60A">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Trimestre atual</p>
          <h3 className="text-2xl font-black mt-3">{activeQuarter ? `${activeQuarter.name} ${activeQuarter.year}` : 'Não definido'}</h3>
        </NeonCard>
        <NeonCard color="#E53935">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Pontuação total</p>
          <h3 className="text-4xl font-black mt-3">{totalPoints}</h3>
        </NeonCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-8">
        <NeonCard color="#1F2937" className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Acesso rápido</p>
              <h2 className="text-2xl font-black text-white mt-2">Módulos principais</h2>
            </div>
            <a
              href={buildPublicLink(publicSlug || user.clubeId)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black uppercase text-gray-200 flex items-center gap-2"
            >
              <ArrowUpRight size={14} /> Ranking público
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => onNavigate('units')} className="text-left rounded-3xl border border-[#1F2937] bg-[#0B0F1A] p-5 hover:border-[#00B2FF]/50 transition-all">
              <Flag className="text-[#00B2FF]" size={24} />
              <h3 className="font-black text-lg mt-4">Unidades</h3>
              <p className="text-sm text-gray-500 mt-2">Cadastro e manutenção das unidades participantes.</p>
            </button>
            <button onClick={() => onNavigate('clubao')} className="text-left rounded-3xl border border-[#1F2937] bg-[#0B0F1A] p-5 hover:border-[#E53935]/50 transition-all">
              <Target className="text-[#E53935]" size={24} />
              <h3 className="font-black text-lg mt-4">Clubão</h3>
              <p className="text-sm text-gray-500 mt-2">Lançamento dos requisitos anuais e acompanhamento das unidades.</p>
            </button>
            <button onClick={() => onNavigate('ranking')} className="text-left rounded-3xl border border-[#1F2937] bg-[#0B0F1A] p-5 hover:border-[#FFD60A]/50 transition-all">
              <Trophy className="text-[#FFD60A]" size={24} />
              <h3 className="font-black text-lg mt-4">Ranking</h3>
              <p className="text-sm text-gray-500 mt-2">Pontuação trimestral, bônus, penalidades e ordenação pública.</p>
            </button>
          </div>
        </NeonCard>

        <NeonCard color="#FFD60A" className="space-y-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Liderança atual</p>
            <h2 className="text-2xl font-black text-white mt-2">{leader?.unidade.nome || 'Sem pontuação ainda'}</h2>
            <p className="text-sm text-gray-500 mt-2">
              {leader ? `${leader.total} pontos no trimestre selecionado.` : 'Assim que as unidades começarem a ser pontuadas, o ranking aparecerá aqui.'}
            </p>
          </div>

          <div className="space-y-3">
            {ranking.slice(0, 5).map((row, index) => (
              <div key={row.unidade.id} className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">#{index + 1}</p>
                  <h3 className="font-black text-white">{row.unidade.nome}</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{row.total}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">pts</p>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#1F2937] p-6 text-center text-gray-500">
                Nenhum ranking calculado ainda.
              </div>
            )}
          </div>
        </NeonCard>
      </div>
    </div>
  );
};
