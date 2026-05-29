import React from 'react';
import { CheckCircle2, Circle, FileCheck2, Lock } from 'lucide-react';
import { RankingProgressEntry, RankingRequirement, Unidade } from '../../types';
import { requirementId } from '../../services/validacoes';

export interface ValidacaoTipoDef {
  tipo: string;
  label: string;
}

export const VALIDACAO_TIPOS: ValidacaoTipoDef[] = [
  { tipo: 'frequencia-conselheiros', label: 'Conselheiros' },
  { tipo: 'frequencia-reunioes-clube', label: 'Reuniões' },
  { tipo: 'frequencia-cultos', label: 'Cultos' },
  { tipo: 'frequentar-pg', label: 'PG' },
  { tipo: 'devocional-pessoal', label: 'Devocional' },
  { tipo: 'classes', label: 'Classes' },
];

interface ValidacaoUnitCardProps {
  unit: Unidade;
  quarterNumber: number;
  requirements: RankingRequirement[];
  resultados: Record<string, RankingProgressEntry>;
  canEdit: boolean;
  onOpen: () => void;
}

export const ValidacaoUnitCard: React.FC<ValidacaoUnitCardProps> = ({
  unit,
  quarterNumber,
  requirements,
  resultados,
  canEdit,
  onOpen,
}) => {
  const reqIds = new Set(requirements.map(r => r.id));
  const total = VALIDACAO_TIPOS.reduce((sum, t) => {
    const id = requirementId(quarterNumber, t.tipo);
    return sum + (resultados[id]?.calculatedPoints ?? 0);
  }, 0);

  return (
    <div className="rounded-3xl border border-[#1F2937] bg-[#0D1220] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{unit.tipo}</p>
          <h3 className="text-lg font-black text-white leading-tight">{unit.nome}</h3>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/5 text-sm font-black text-white text-right">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Total validações</span>
          {total} pts
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {VALIDACAO_TIPOS.map(t => {
          const id = requirementId(quarterNumber, t.tipo);
          const exists = reqIds.has(id);
          const entry = resultados[id];
          const done = !!entry && (entry.completed || (entry.calculatedPoints ?? 0) > 0);
          return (
            <div
              key={t.tipo}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                !exists
                  ? 'border-[#1F2937] bg-[#0B0F1A] text-gray-600'
                  : done
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                    : 'border-[#1F2937] bg-[#0B0F1A] text-gray-400'
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              {t.label}
            </div>
          );
        })}
      </div>

      <button
        onClick={onOpen}
        className="w-full px-4 py-2 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
      >
        {canEdit ? <FileCheck2 size={14} /> : <Lock size={14} />}
        {canEdit ? 'Validar unidade' : 'Visualizar'}
      </button>
    </div>
  );
};
