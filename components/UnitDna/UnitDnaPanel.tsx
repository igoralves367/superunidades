import React, { useEffect, useState } from 'react';
import { Loader2, Dna, AlertCircle } from 'lucide-react';
import { Usuario, Unidade } from '../../types';
import * as fs from '../../services/firestoreDb';
import { buildRankingRows } from '../../services/ranking';
import { buildFrequencySummary } from '../../services/frequencia';
import { DnaIndicatorCard } from './DnaIndicatorCard';
import { buildDnaClasses, calcDnaStars, DnaProgressEntry } from './dnaClasses';

interface UnitDnaPanelProps {
  user: Usuario;
  unidadeIdOverride?: string | null;
}

interface DnaState {
  rankingPercent: number | null;
  rankingStars: 3 | 4 | 5 | null;
  rankingCompletedCount: number;
  rankingTotalRequirements: number;
  frequencyPercent: number | null;
  frequencyMemberCount: number;
  frequencyTotalMeetings: number;
  classesAvgPercent: number | null;
  classesCompletedCount: number;
  classesMemberCount: number;
  noActiveQuarter: boolean;
}

const EMPTY_STATE: DnaState = {
  rankingPercent: null,
  rankingStars: null,
  rankingCompletedCount: 0,
  rankingTotalRequirements: 0,
  frequencyPercent: null,
  frequencyMemberCount: 0,
  frequencyTotalMeetings: 0,
  classesAvgPercent: null,
  classesCompletedCount: 0,
  classesMemberCount: 0,
  noActiveQuarter: false
};

export const UnitDnaPanel: React.FC<UnitDnaPanelProps> = ({ user, unidadeIdOverride }) => {
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [dna, setDna] = useState<DnaState>(EMPTY_STATE);

  const effectiveUnitId = unidadeIdOverride ?? user.unidadeId ?? null;
  const clubeId = user.clubeId;

  useEffect(() => {
    if (!clubeId || !effectiveUnitId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [unidades, quarters, reunioes, desbravadores, requisitos, cargos] = await Promise.all([
          fs.listUnidades(clubeId),
          fs.listRankingQuarters(clubeId),
          fs.listReunioes(clubeId),
          fs.listDesbravadores(clubeId),
          fs.listRequisitos(clubeId),
          fs.listCargos(clubeId)
        ]);

        const targetUnit = unidades.find(u => u.id === effectiveUnitId) ?? null;

        const activeQuarter =
          quarters.find(q => q.ativo && q.status === 'ACTIVE') ??
          quarters.find(q => q.status === 'CLOSED') ??
          quarters.find(q => q.ativo) ??
          null;

        // Indicador 1 — Clubão (% requisitos cumpridos)
        let rankingPercent: number | null = null;
        let rankingCompletedCount = 0;
        let rankingTotalRequirements = 0;

        // Indicador 2 — Frequência média
        let frequencyPercent: number | null = null;
        let frequencyMemberCount = 0;
        let frequencyTotalMeetings = 0;

        if (activeQuarter) {
          const [requirements, progressDocs, presencas] = await Promise.all([
            fs.listRankingRequirements(clubeId, activeQuarter.id),
            fs.listRankingProgress(clubeId, activeQuarter.id),
            fs.listPresencasPorTrimestre(clubeId, activeQuarter.number)
          ]);

          const activeRequirements = requirements.filter(r => r.active);
          const rows = buildRankingRows(unidades, activeRequirements, progressDocs);
          const myRow = rows.find(r => r.unidade.id === effectiveUnitId);
          if (myRow) {
            rankingPercent = myRow.progressPercent;
            rankingCompletedCount = myRow.completedCount;
            rankingTotalRequirements = activeRequirements.length;
          }

          const freq = buildFrequencySummary(
            presencas,
            desbravadores,
            unidades,
            reunioes,
            activeQuarter.number,
            cargos
          );
          const mySummary = freq.find(s => s.unidadeId === effectiveUnitId);
          if (mySummary) {
            frequencyPercent = mySummary.unitFrequencyPct;
            frequencyMemberCount = mySummary.memberCount;
            frequencyTotalMeetings = mySummary.totalMeetings;
          }
        }

        // Indicador 3 — Progresso de classes
        const dbvsUnidade = desbravadores.filter(
          d => d.unidadeId === effectiveUnitId && d.status === 'ATIVO'
        );
        const progressoEntries = await Promise.all(
          dbvsUnidade.map(async d => {
            const docs = await fs.listProgressoDesbravador(clubeId, d.id);
            const progresso: DnaProgressEntry[] = docs.map(p => ({
              requisitoId: (p as { requisitoId?: string }).requisitoId ?? p.id,
              feito: (p as { feito?: boolean }).feito
            }));
            return { id: d.id, progresso };
          })
        );
        const progressoPorDbv: Record<string, DnaProgressEntry[]> = {};
        for (const entry of progressoEntries) progressoPorDbv[entry.id] = entry.progresso;

        const classes = buildDnaClasses(dbvsUnidade, requisitos, progressoPorDbv);

        if (cancelled) return;

        setUnidade(targetUnit);
        setDna({
          rankingPercent,
          rankingStars: calcDnaStars(rankingPercent),
          rankingCompletedCount,
          rankingTotalRequirements,
          frequencyPercent,
          frequencyMemberCount,
          frequencyTotalMeetings,
          classesAvgPercent: classes.classesAvgPercent,
          classesCompletedCount: classes.classesCompletedCount,
          classesMemberCount: classes.classesMemberCount,
          noActiveQuarter: !activeQuarter
        });
      } catch (err) {
        console.error('Erro ao carregar DNA da unidade:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [clubeId, effectiveUnitId]);

  if (!effectiveUnitId) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-yellow-500" size={40} />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Nenhuma unidade vinculada ao seu usuário
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#E53935]" size={40} />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Acessando Nuvem...
        </p>
      </div>
    );
  }

  const rankingDisplay = dna.rankingPercent === null ? null : Math.round(dna.rankingPercent * 100);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Dna className="text-[#22D3EE]" size={28} />
        <div>
          <h1 className="text-xl font-extrabold text-white">DNA da Unidade</h1>
          <p className="text-xs font-medium text-gray-400">
            {unidade?.nome ?? 'Unidade'} — indicadores do trimestre ativo
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DnaIndicatorCard
          title="Requisitos do Clubão"
          value={rankingDisplay}
          stars={dna.rankingStars}
          color="#22D3EE"
          emptyMessage={dna.noActiveQuarter ? 'Nenhum trimestre ativo' : 'Sem dados de ranking'}
          description={`${dna.rankingCompletedCount} de ${dna.rankingTotalRequirements} requisitos cumpridos`}
        />

        <DnaIndicatorCard
          title="Frequência Média"
          value={dna.frequencyPercent}
          color="#A78BFA"
          emptyMessage={
            dna.frequencyTotalMeetings === 0 ? 'Sem reuniões registradas' : 'Sem membros na unidade'
          }
          description={`${dna.frequencyMemberCount} membros · ${dna.frequencyTotalMeetings} reuniões`}
        />

        <DnaIndicatorCard
          title="Progresso de Classes"
          value={dna.classesAvgPercent}
          color="#34D399"
          emptyMessage="Nenhum desbravador com classe"
          description={`${dna.classesCompletedCount} de ${dna.classesMemberCount} concluíram a classe atual`}
        />
      </div>
    </div>
  );
};
