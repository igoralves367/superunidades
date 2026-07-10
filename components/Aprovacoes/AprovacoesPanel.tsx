import React, { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen';
import { RankingQuarter, RankingRequirement, RankingUnitProgressDoc, Unidade, Usuario } from '../../types';
import * as fs from '../../services/firestoreDb';
import { AprovacaoUnitModal } from './AprovacaoUnitModal';

interface AprovacoesPanelProps {
  clubeId: string;
  user: Usuario;
  quarters: RankingQuarter[];
  unidades: Unidade[];
}

interface UnitCounters {
  pending: number;
  approved: number;
  rejected: number;
}

const countsForUnit = (doc: RankingUnitProgressDoc | undefined): UnitCounters => {
  const counters: UnitCounters = { pending: 0, approved: 0, rejected: 0 };
  if (!doc) return counters;
  for (const entry of Object.values(doc.resultados || {})) {
    const status = entry.submission?.status;
    if (status === 'PENDING') counters.pending += 1;
    else if (status === 'APPROVED') counters.approved += 1;
    else if (status === 'REJECTED') counters.rejected += 1;
  }
  return counters;
};

export const AprovacoesPanel: React.FC<AprovacoesPanelProps> = ({ clubeId, user, quarters, unidades }) => {
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [docs, setDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);

  const activeQuarter = useMemo(
    () =>
      quarters.find(q => q.ativo && q.status === 'ACTIVE') ??
      quarters.find(q => q.ativo) ??
      quarters[0] ??
      null,
    [quarters]
  );

  const load = async () => {
    if (!clubeId || !activeQuarter) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reqs, progressDocs] = await Promise.all([
        fs.listRankingRequirements(clubeId, activeQuarter.id),
        fs.listRankingProgress(clubeId, activeQuarter.id)
      ]);
      setRequirements(reqs.filter(r => r.active));
      setDocs(progressDocs);
    } catch (err) {
      console.error('Erro ao carregar aprovações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubeId, activeQuarter?.id]);

  if (loading) return <LoadingScreen inline />;

  if (!activeQuarter) {
    return <p className="text-sm text-gray-400">Nenhum trimestre ativo.</p>;
  }

  const participantes = unidades.filter(u => u.participatesClubao !== false);
  const openUnit = participantes.find(u => u.id === openUnitId) ?? null;
  const openDoc = docs.find(d => d.unitId === openUnitId) ?? null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Clique numa unidade para revisar os requisitos enviados pelos conselheiros. Aprovar aplica os pontos ao ranking.
      </p>
      {participantes.map(unit => {
        const counters = countsForUnit(docs.find(d => d.unitId === unit.id));
        return (
          <button
            key={unit.id}
            onClick={() => setOpenUnitId(unit.id)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 text-left hover:border-[#22D3EE]/50"
          >
            <span className="font-bold text-white">{unit.nome}</span>
            <span className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-[#FFD60A]"><Clock size={14} />{counters.pending}</span>
              <span className="flex items-center gap-1 text-[#34D399]"><CheckCircle2 size={14} />{counters.approved}</span>
              <span className="flex items-center gap-1 text-[#F87171]"><XCircle size={14} />{counters.rejected}</span>
              <ChevronRight size={16} className="text-gray-500" />
            </span>
          </button>
        );
      })}

      {openUnit && (
        <AprovacaoUnitModal
          clubeId={clubeId}
          user={user}
          quarter={activeQuarter}
          unit={openUnit}
          requirements={requirements}
          doc={openDoc}
          onClose={() => setOpenUnitId(null)}
          onReviewed={load}
        />
      )}
    </div>
  );
};
