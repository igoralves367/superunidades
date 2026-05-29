import React from 'react';
import { CheckCircle2, Circle, Clock, FileCheck2, Lock } from 'lucide-react';
import { Unidade, ValidacaoUnitDoc } from '../../types';
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
  validacaoDoc: ValidacaoUnitDoc | null;
  canEdit: boolean;
  onOpen: () => void;
}

type BadgeStatus = 'confirmed' | 'validated' | 'empty';

function getBadgeStatus(validacaoDoc: ValidacaoUnitDoc | null, reqId: string): BadgeStatus {
  const entry = validacaoDoc?.resultados[reqId];
  if (!entry) return 'empty';
  if (entry.validacaoMeta?.confirmadoRanking) return 'confirmed';
  if (entry.completed || (entry.calculatedPoints ?? 0) > 0) return 'validated';
  return 'empty';
}

export const ValidacaoUnitCard: React.FC<ValidacaoUnitCardProps> = ({
  unit,
  quarterNumber,
  validacaoDoc,
  canEdit,
  onOpen,
}) => {
  const confirmedPts = VALIDACAO_TIPOS.reduce((sum, t) => {
    const id = requirementId(quarterNumber, t.tipo);
    const entry = validacaoDoc?.resultados[id];
    return sum + (entry?.validacaoMeta?.confirmadoRanking ? (entry.calculatedPoints ?? 0) : 0);
  }, 0);

  const confirmedCount = VALIDACAO_TIPOS.filter(t => {
    const id = requirementId(quarterNumber, t.tipo);
    return validacaoDoc?.resultados[id]?.validacaoMeta?.confirmadoRanking;
  }).length;

  return (
    <div className="rounded-3xl border border-[#1F2937] bg-[#0D1220] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{unit.tipo}</p>
          <h3 className="text-lg font-black text-white leading-tight">{unit.nome}</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">No ranking</p>
          <p className="text-lg font-black text-emerald-400">{confirmedPts} pts</p>
          <p className="text-[10px] text-gray-500">{confirmedCount}/6 confirmadas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {VALIDACAO_TIPOS.map(t => {
          const id = requirementId(quarterNumber, t.tipo);
          const status = getBadgeStatus(validacaoDoc, id);
          return (
            <div
              key={t.tipo}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold ${
                status === 'confirmed'
                  ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300'
                  : status === 'validated'
                    ? 'border-yellow-500/30 bg-yellow-500/8 text-yellow-300'
                    : 'border-[#1F2937] bg-[#0B0F1A] text-gray-500'
              }`}
            >
              {status === 'confirmed' ? <CheckCircle2 size={13} /> : status === 'validated' ? <Clock size={13} /> : <Circle size={13} />}
              {t.label}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
        <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-400" /> Confirmado</span>
        <span className="flex items-center gap-1"><Clock size={11} className="text-yellow-400" /> Validado</span>
        <span className="flex items-center gap-1"><Circle size={11} /> Pendente</span>
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
