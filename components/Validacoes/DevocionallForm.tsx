import React from 'react';
import { Desbravador, RankingProgressEntry, RankingRequirement } from '../../types';

interface DevocionallFormProps {
  requirement: RankingRequirement;
  entry: RankingProgressEntry | undefined;
  desbravadores: Desbravador[];
  disabled?: boolean;
  onChange: (patch: Partial<RankingProgressEntry>) => void;
}

/**
 * Devocional Pessoal: pontos base ao confirmar e bônus por desbravador não batizado
 * presente na Escola Sabatina.
 */
export const DevocionallForm: React.FC<DevocionallFormProps> = ({
  requirement,
  entry,
  desbravadores,
  disabled,
  onChange,
}) => {
  const naoBatizados = desbravadores.filter(d => d.batizado !== true);
  const quantidade = entry?.quantity ?? 0;

  const handleQuantidade = (value: number) => {
    const qtd = Math.max(0, value);
    onChange({
      quantity: qtd,
      bonusInput: qtd,
      validacaoMeta: { ...entry?.validacaoMeta, quantidadeNaoBatizados: qtd },
    });
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 rounded-xl border border-[#1F2937] bg-[#111827] p-3 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 accent-[#E53935]"
          checked={!!entry?.completed}
          disabled={disabled}
          onChange={e => onChange({ completed: e.target.checked })}
        />
        <span className="text-sm font-bold text-gray-200">
          Todos realizam devocional e lição da Escola Sabatina ({requirement.points} pts)
        </span>
      </label>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
          Não batizados presentes na Escola Sabatina
        </label>
        <input
          type="number"
          min={0}
          max={naoBatizados.length || undefined}
          value={quantidade}
          disabled={disabled}
          onChange={e => handleQuantidade(Number(e.target.value))}
          className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
        />
        <p className="text-[11px] text-gray-500 ml-1">
          +{requirement.bonusValue ?? 50} pts por não batizado presente. Unidade tem {naoBatizados.length} não batizado(s).
        </p>
      </div>

      {naoBatizados.length > 0 && (
        <div className="rounded-xl border border-[#1F2937] bg-[#0B0F1A] p-3">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">
            Desbravadores não batizados (referência)
          </p>
          <div className="flex flex-wrap gap-2">
            {naoBatizados.map(d => (
              <span key={d.id} className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white/5 text-gray-300">
                {d.nome}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
