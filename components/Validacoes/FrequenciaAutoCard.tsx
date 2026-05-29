import React from 'react';
import { Zap, Users, CalendarCheck } from 'lucide-react';
import { AutoFrequenciaResult } from '../../types';

interface FrequenciaAutoCardProps {
  auto: AutoFrequenciaResult | null;
  conselheirosPoints: number;
  reunioesPoints: number;
}

const AutoBadge: React.FC = () => (
  <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#00B2FF]/10 text-[#7FD7FF] inline-flex items-center gap-1">
    <Zap size={11} /> Automático
  </span>
);

export const FrequenciaAutoCard: React.FC<FrequenciaAutoCardProps> = ({ auto, conselheirosPoints, reunioesPoints }) => {
  if (!auto) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1F2937] p-5 text-center text-sm text-gray-500">
        Sem dados de reuniões para este trimestre.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="font-black text-gray-100">Frequência dos conselheiros</span>
            <AutoBadge />
          </div>
          <span className={`text-sm font-black ${conselheirosPoints < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {conselheirosPoints} pts
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {auto.conselheiros.absences === 0
            ? 'Todos os conselheiros com 100% de presença.'
            : `${auto.conselheiros.absences} conselheiro(s) com ausência — penalidade de -${auto.conselheiros.penaltyPoints} pts.`}
        </p>
        {auto.conselheiros.details.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {auto.conselheiros.details.map(d => (
              <span
                key={d.nome}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  d.presencaPercent >= 100 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                }`}
              >
                {d.nome}: {d.presencaPercent}%
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} className="text-gray-400" />
            <span className="font-black text-gray-100">Frequência às reuniões do clube</span>
            <AutoBadge />
          </div>
          <span className="text-sm font-black text-emerald-400">{reunioesPoints} pts</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Presença média da unidade: <span className="font-bold text-gray-300">{auto.reunioes.presencaPercent}%</span>
          {auto.reunioes.bonusPoints > 0
            ? ` — bônus de +${auto.reunioes.bonusPoints} pts (≥ 85%).`
            : ' — sem bônus (abaixo de 85%).'}
        </p>
      </div>
    </div>
  );
};
