import React, { useEffect, useState } from 'react';
import { Dna, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen';
import { Usuario, Unidade, PerfilAcesso, RankingRequirement, RankingProgressEntry, RankingQuarter } from '../../types';
import * as fs from '../../services/firestoreDb';
import { buildRankingRows } from '../../services/ranking';
import { buildFrequencySummary } from '../../services/frequencia';
import { requirementId } from '../../services/validacoes';
import { VALIDACAO_TIPOS } from '../Validacoes/ValidacaoUnitCard';
import { DnaIndicatorCard } from './DnaIndicatorCard';
import { CounselorRequirementsList } from './CounselorRequirementsList';
import { buildDnaClasses, calcDnaStars, DnaProgressEntry } from './dnaClasses';

// RN-5: requisitos elegíveis para auto-declaração do conselheiro excluem os de validação
// automática (devocional, classes, frequência) e os de pontuação manual (concursos).
const eligibleForCounselor = (reqs: RankingRequirement[], quarterNumber: number): RankingRequirement[] => {
  const autoIds = new Set(VALIDACAO_TIPOS.map(t => requirementId(quarterNumber, t.tipo)));
  return reqs
    .filter(r => r.active && !autoIds.has(r.id) && r.ruleType !== 'MANUAL_SCORE')
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
};

interface UnitDnaPanelProps {
  user: Usuario;
  unidadeIdOverride?: string | null;
  embedded?: boolean;
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

export const UnitDnaPanel: React.FC<UnitDnaPanelProps> = ({ user, unidadeIdOverride, embedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [dna, setDna] = useState<DnaState>(EMPTY_STATE);
  const [allUnits, setAllUnits] = useState<Unidade[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [quarterMode, setQuarterMode] = useState<'active' | 'previous'>('active');
  const [hasPreviousQuarter, setHasPreviousQuarter] = useState(false);
  const [eligibleReqs, setEligibleReqs] = useState<RankingRequirement[]>([]);
  const [myResultados, setMyResultados] = useState<Record<string, RankingProgressEntry>>({});
  const [viewQuarter, setViewQuarter] = useState<RankingQuarter | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const clubeId = user.clubeId;
  const isDiretoria = user.perfil === PerfilAcesso.DIRETORIA;
  const isActiveView = quarterMode === 'active';
  // Diretoria sem unidade vinculada escolhe qual inspecionar; demais usam a vinculada.
  const effectiveUnitId = unidadeIdOverride ?? user.unidadeId ?? selectedUnitId ?? null;
  // Conselheiro/Instrutor da própria unidade pode auto-declarar requisitos.
  const canDeclare =
    isActiveView && !isDiretoria && !!user.unidadeId && user.unidadeId === effectiveUnitId;

  // Carrega a lista de unidades para o seletor da Diretoria.
  useEffect(() => {
    if (!clubeId || !isDiretoria) return;
    let cancelled = false;
    fs.listUnidades(clubeId)
      .then(units => {
        if (!cancelled) setAllUnits(units.filter(u => u.ativo && u.participatesClubao !== false));
      })
      .catch(err => console.error('Erro ao carregar unidades:', err));
    return () => {
      cancelled = true;
    };
  }, [clubeId, isDiretoria]);

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

        // Trimestre anterior = maior número estritamente menor que o ativo.
        const previousQuarter = activeQuarter
          ? quarters
              .filter(q => q.number < activeQuarter.number)
              .sort((a, b) => b.number - a.number)[0] ?? null
          : null;

        const targetQuarter = quarterMode === 'previous' ? previousQuarter : activeQuarter;

        // Indicador 1 — Clubão (% requisitos cumpridos)
        let rankingPercent: number | null = null;
        let rankingCompletedCount = 0;
        let rankingTotalRequirements = 0;

        // Indicador 2 — Frequência média
        let frequencyPercent: number | null = null;
        let frequencyMemberCount = 0;
        let frequencyTotalMeetings = 0;

        let eligible: RankingRequirement[] = [];
        let resultadosMap: Record<string, RankingProgressEntry> = {};

        if (targetQuarter) {
          const [requirements, progressDocs, presencas] = await Promise.all([
            fs.listRankingRequirements(clubeId, targetQuarter.id),
            fs.listRankingProgress(clubeId, targetQuarter.id),
            fs.listPresencasPorTrimestre(clubeId, targetQuarter.number)
          ]);

          const activeRequirements = requirements.filter(r => r.active);
          const rows = buildRankingRows(unidades, activeRequirements, progressDocs);
          const myRow = rows.find(r => r.unidade.id === effectiveUnitId);
          if (myRow) {
            rankingPercent = myRow.progressPercent;
            rankingCompletedCount = myRow.completedCount;
            rankingTotalRequirements = activeRequirements.length;
          }

          eligible = eligibleForCounselor(requirements, targetQuarter.number);
          resultadosMap =
            progressDocs.find(d => d.unitId === effectiveUnitId)?.resultados ?? {};

          const freq = buildFrequencySummary(
            presencas,
            desbravadores,
            unidades,
            reunioes,
            targetQuarter.number,
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
        setHasPreviousQuarter(!!previousQuarter);
        setViewQuarter(targetQuarter);
        setEligibleReqs(eligible);
        setMyResultados(resultadosMap);
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
          noActiveQuarter: !targetQuarter
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
  }, [clubeId, effectiveUnitId, quarterMode, reloadKey]);

  if (!effectiveUnitId) {
    // Diretoria não tem unidade vinculada: oferecer seletor em vez de erro.
    if (isDiretoria) {
      return (
        <div className="space-y-6">
          <header className="flex items-center gap-3">
            <Dna className="text-[#22D3EE]" size={28} />
            <div>
              <h1 className="text-xl font-extrabold text-white">DNA da Unidade</h1>
              <p className="text-xs font-medium text-gray-400">
                Selecione uma unidade para inspecionar os indicadores
              </p>
            </div>
          </header>
          <div className="max-w-sm">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Unidade
            </label>
            <select
              value={selectedUnitId ?? ''}
              onChange={e => setSelectedUnitId(e.target.value || null)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white focus:border-[#22D3EE] focus:outline-none"
            >
              <option value="">Selecione...</option>
              {allUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-yellow-500" size={40} />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-gray-400">
          Nenhuma unidade vinculada ao seu usuário
        </p>
      </div>
    );
  }

  if (loading) return <LoadingScreen inline />;

  const rankingDisplay = dna.rankingPercent === null ? null : Math.round(dna.rankingPercent * 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Dna className="text-[#22D3EE]" size={28} />
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white">{embedded ? 'Progresso' : 'DNA da Unidade'}</h1>
          <p className="text-xs font-medium text-gray-400">
            {unidade?.nome ?? 'Unidade'} — {viewQuarter?.name ?? 'indicadores do trimestre'}
          </p>
        </div>
        {hasPreviousQuarter && (
          <div className="flex gap-1 rounded-lg border border-gray-700 bg-gray-900 p-1">
            <button
              onClick={() => setQuarterMode('active')}
              className={`rounded-md px-3 py-1 text-xs font-bold ${
                isActiveView ? 'bg-[#22D3EE] text-[#06222A]' : 'text-gray-400'
              }`}
            >
              Trimestre atual
            </button>
            <button
              onClick={() => setQuarterMode('previous')}
              className={`rounded-md px-3 py-1 text-xs font-bold ${
                !isActiveView ? 'bg-[#22D3EE] text-[#06222A]' : 'text-gray-400'
              }`}
            >
              Trimestre anterior
            </button>
          </div>
        )}
        {isDiretoria && !user.unidadeId && (
          <select
            value={selectedUnitId ?? ''}
            onChange={e => setSelectedUnitId(e.target.value || null)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white focus:border-[#22D3EE] focus:outline-none"
          >
            {allUnits.map(u => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        )}
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

      {canDeclare && viewQuarter && (
        <section className="rounded-2xl border border-[#1F2937] bg-[#111827] p-5 space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-white">Requisitos do Trimestre</h2>
            <p className="text-xs text-gray-400">
              Marque o que sua unidade cumpriu e envie para a diretoria validar.
            </p>
          </div>
          <CounselorRequirementsList
            clubeId={clubeId}
            quarterId={viewQuarter.id}
            unitId={effectiveUnitId}
            user={user}
            requirements={eligibleReqs}
            resultados={myResultados}
            onChanged={() => setReloadKey(k => k + 1)}
          />
        </section>
      )}

      {!isActiveView && (
        <p className="text-xs text-gray-500">
          Trimestre anterior em modo leitura — pontuações e validações finalizadas.
        </p>
      )}
    </div>
  );
};
