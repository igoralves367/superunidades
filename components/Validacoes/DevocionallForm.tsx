import React, { useState } from 'react';
import { Desbravador, RankingProgressEntry, RankingRequirement } from '../../types';

interface DevocionallFormProps {
  requirement: RankingRequirement;
  entry: RankingProgressEntry | undefined;
  desbravadores: Desbravador[];
  disabled?: boolean;
  onChange: (patch: Partial<RankingProgressEntry>) => void;
}

export const DevocionallForm: React.FC<DevocionallFormProps> = ({
  requirement,
  entry,
  desbravadores,
  disabled,
  onChange,
}) => {
  const ativos = desbravadores.filter(d => d.status === 'ATIVO');
  const naoBatizados = new Set(ativos.filter(d => d.batizado !== true).map(d => d.id));

  const confirmedIds = new Set<string>(
    (entry?.notes || '').split(',').map(s => s.trim()).filter(Boolean)
  );

  const savedMin = entry?.validacaoMeta?.devocionaMinPercent ?? 100;
  const [minPercent, setMinPercent] = useState(savedMin);

  const apply = (ids: Set<string>, min: number) => {
    const validIds = ativos.filter(d => ids.has(d.id)).map(d => d.id);
    const pct = ativos.length > 0 ? Math.round((validIds.length / ativos.length) * 100) : 0;
    const confirmedNaoBatizados = validIds.filter(id => naoBatizados.has(id)).length;
    onChange({
      completed: pct >= min,
      notes: validIds.join(','),
      quantity: validIds.length,
      bonusInput: confirmedNaoBatizados,
      validacaoMeta: {
        ...entry?.validacaoMeta,
        devocionaPercent: pct,
        devocionaMinPercent: min,
        quantidadeNaoBatizados: confirmedNaoBatizados,
      },
    });
  };

  const toggle = (id: string) => {
    const next = new Set(confirmedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    apply(next, minPercent);
  };

  const toggleAll = () => {
    const next: Set<string> = confirmedIds.size >= ativos.length
      ? new Set<string>()
      : new Set<string>(ativos.map(d => d.id));
    apply(next, minPercent);
  };

  const handleMinPercent = (value: number) => {
    const clamped = Math.max(1, Math.min(100, value));
    setMinPercent(clamped);
    apply(confirmedIds, clamped);
  };

  const confirmedCount = ativos.filter(d => confirmedIds.has(d.id)).length;
  const pct = ativos.length > 0 ? Math.round((confirmedCount / ativos.length) * 100) : 0;
  const confirmedNaoBatizados = ativos.filter(d => confirmedIds.has(d.id) && naoBatizados.has(d.id)).length;
  const bonusValue = requirement.bonusValue ?? 50;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400 font-bold">
            {confirmedCount}/{ativos.length} confirmados
          </p>
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black ${pct >= minPercent ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>
            {pct}%
          </span>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled || ativos.length === 0}
          className="px-3 py-1.5 rounded-lg border border-[#1F2937] text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 disabled:opacity-60"
        >
          {confirmedCount >= ativos.length && ativos.length > 0 ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      {ativos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1F2937] p-5 text-center text-sm text-gray-500">
          Nenhum desbravador ativo nesta unidade.
        </div>
      ) : (
        <div className="rounded-xl border border-[#1F2937] bg-[#0B0F1A] divide-y divide-[#1F2937]">
          {ativos.map(d => (
            <label key={d.id} className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#E53935]"
                  checked={confirmedIds.has(d.id)}
                  disabled={disabled}
                  onChange={() => toggle(d.id)}
                />
                <span className="text-sm font-bold text-gray-200">{d.nome}</span>
              </div>
              {naoBatizados.has(d.id) && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-500/10 text-amber-400">
                  Não batizado
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
            % mínimo para pontuar
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={minPercent}
            disabled={disabled}
            onChange={e => handleMinPercent(Number(e.target.value))}
            className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
          />
          <p className="text-[11px] text-gray-500 ml-1">
            {pct >= minPercent
              ? `✓ ${pct}% ≥ ${minPercent}% → ${requirement.points} pts`
              : `${pct}% < ${minPercent}% → 0 pts`}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
            Não batizados confirmados
          </label>
          <div className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3 text-sm font-bold text-gray-200">
            {confirmedNaoBatizados} de {naoBatizados.size}
          </div>
          <p className="text-[11px] text-gray-500 ml-1">
            +{confirmedNaoBatizados * bonusValue} pts ({confirmedNaoBatizados} × {bonusValue})
          </p>
        </div>
      </div>
    </div>
  );
};
