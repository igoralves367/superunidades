import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Cargo,
  Classe,
  Desbravador,
  PerfilAcesso,
  RankingProgressEntry,
  RankingQuarter,
  RankingRequirement,
  RankingUnitProgressDoc,
  ReuniaoPresenca,
  Reuniao,
  Unidade,
  Usuario,
  AutoFrequenciaResult,
  ValidacaoResultadoEntry,
  ValidacaoUnitDoc,
} from '../../types';
import * as fs from '../../services/firestoreDb';
import { buildAutoFrequencia, requirementId } from '../../services/validacoes';
import { ValidacaoUnitCard, VALIDACAO_TIPOS } from './ValidacaoUnitCard';
import { ValidacaoDetailModal } from './ValidacaoDetailModal';

interface ValidacoesPanelProps {
  clubeId: string;
  user: Usuario;
  quarters: RankingQuarter[];
  unidades: Unidade[];
}

const VALIDACAO_REQ_IDS = (quarterNumber: number) =>
  new Set(VALIDACAO_TIPOS.map(t => requirementId(quarterNumber, t.tipo)));

export const ValidacoesPanel: React.FC<ValidacoesPanelProps> = ({ clubeId, user, quarters, unidades }) => {
  const [selectedQuarterId, setSelectedQuarterId] = useState('');
  const [loading, setLoading] = useState(true);

  const [requirements, setRequirements] = useState<RankingRequirement[]>([]);
  const [rankingDocs, setRankingDocs] = useState<RankingUnitProgressDoc[]>([]);
  const [validacaoDocs, setValidacaoDocs] = useState<ValidacaoUnitDoc[]>([]);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [presencas, setPresencas] = useState<ReuniaoPresenca[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedQuarterId && quarters.length > 0) {
      const active = quarters.find(q => q.ativo && q.status === 'ACTIVE') || quarters[0];
      setSelectedQuarterId(active.id);
    }
  }, [quarters, selectedQuarterId]);

  const selectedQuarter = useMemo(
    () => quarters.find(q => q.id === selectedQuarterId) || null,
    [quarters, selectedQuarterId]
  );

  const loadData = async () => {
    if (!clubeId || !selectedQuarter) return;
    setLoading(true);
    try {
      const [reqs, rankingDs, validacaoDs, dbvs, cgs, cls, reus, pres] = await Promise.all([
        fs.listRankingRequirements(clubeId, selectedQuarter.id),
        fs.listRankingProgress(clubeId, selectedQuarter.id),
        fs.listValidacaoResults(clubeId, selectedQuarter.id),
        fs.listDesbravadores(clubeId),
        fs.listCargos(clubeId),
        fs.listClasses(clubeId),
        fs.listReunioes(clubeId),
        fs.listPresencasPorTrimestre(clubeId, selectedQuarter.number),
      ]);
      const validIds = VALIDACAO_REQ_IDS(selectedQuarter.number);
      setRequirements(reqs.filter(r => r.active && validIds.has(r.id)));
      setRankingDocs(rankingDs);
      setValidacaoDocs(validacaoDs);
      setDesbravadores(dbvs);
      setCargos(cgs);
      setClasses(cls);
      setReunioes(reus);
      setPresencas(pres);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clubeId, selectedQuarterId]);

  const autoFrequenciaByUnit = useMemo(() => {
    if (!selectedQuarter) return new Map<string, AutoFrequenciaResult>();
    const results = buildAutoFrequencia(presencas, desbravadores, unidades, reunioes, selectedQuarter.number, cargos);
    return new Map(results.map(r => [r.unitId, r]));
  }, [presencas, desbravadores, unidades, reunioes, selectedQuarter, cargos]);

  const canEditUnit = (unitId: string) => {
    if (user.perfil === PerfilAcesso.DIRETORIA) return true;
    if (user.perfil === PerfilAcesso.CONSELHEIRO) return user.unidadeId === unitId;
    return false;
  };

  const visibleUnits = useMemo(() => {
    if (user.perfil === PerfilAcesso.CONSELHEIRO) {
      return unidades.filter(u => u.id === user.unidadeId);
    }
    return unidades;
  }, [unidades, user]);

  const getValidacaoDoc = (unitId: string) =>
    validacaoDocs.find(d => d.unitId === unitId && d.quarterId === selectedQuarterId) || null;

  const getRankingDoc = (unitId: string) =>
    rankingDocs.find(d => d.unitId === unitId && d.quarterId === selectedQuarterId) || null;

  const handleSave = async (
    unitId: string,
    validacaoResultados: Record<string, ValidacaoResultadoEntry>,
    rankingResultados: Record<string, RankingProgressEntry>,
    close = false
  ) => {
    if (!selectedQuarter) return;
    setSaving(true);
    try {
      await fs.saveValidacaoResult(clubeId, selectedQuarter.id, unitId, validacaoResultados, {
        id: user.id, nome: user.nome, email: user.email,
      });

      if (Object.keys(rankingResultados).length > 0) {
        const existing = getRankingDoc(unitId)?.resultados || {};
        const merged = { ...existing, ...rankingResultados };
        await fs.saveRankingUnitProgress(clubeId, selectedQuarter.id, unitId, merged, {
          id: user.id, nome: user.nome, email: user.email,
        });
      }

      await loadData();
      if (close) setOpenUnitId(null);
    } catch (error) {
      console.error('Erro ao salvar validações:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const openUnit = openUnitId ? unidades.find(u => u.id === openUnitId) || null : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mr-1">Trimestre</span>
        {quarters.map(q => (
          <button
            key={q.id}
            onClick={() => setSelectedQuarterId(q.id)}
            className={`px-4 py-2 rounded-xl text-sm font-black ${
              q.id === selectedQuarterId
                ? 'bg-[#E53935] text-white'
                : 'bg-[#0B0F1A] border border-[#1F2937] text-gray-300'
            }`}
          >
            {q.number}º
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin text-[#E53935]" />
        </div>
      ) : requirements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F2937] p-8 text-center text-gray-500">
          Nenhum requisito de validação configurado para este trimestre.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleUnits.map(unit => (
            <ValidacaoUnitCard
              key={unit.id}
              unit={unit}
              quarterNumber={selectedQuarter!.number}
              validacaoDoc={getValidacaoDoc(unit.id)}
              canEdit={canEditUnit(unit.id)}
              onOpen={() => setOpenUnitId(unit.id)}
            />
          ))}
        </div>
      )}

      {openUnit && selectedQuarter && (
        <ValidacaoDetailModal
          quarter={selectedQuarter}
          unit={openUnit}
          requirements={requirements}
          rankingProgress={getRankingDoc(openUnit.id)}
          validacaoDoc={getValidacaoDoc(openUnit.id)}
          desbravadores={desbravadores.filter(d => d.unidadeId === openUnit.id)}
          classes={classes}
          autoFrequencia={autoFrequenciaByUnit.get(openUnit.id) || null}
          canEdit={canEditUnit(openUnit.id) && !saving}
          onSave={(validacaoResultados, rankingResultados, close) =>
            handleSave(openUnit.id, validacaoResultados, rankingResultados, close)
          }
          onClose={() => setOpenUnitId(null)}
        />
      )}
    </div>
  );
};
