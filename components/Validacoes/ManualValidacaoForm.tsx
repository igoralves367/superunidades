import React, { useState } from 'react';
import { Desbravador, RankingProgressEntry, RankingRequirement } from '../../types';
import { BONUS_THRESHOLD_PERCENT } from '../../services/validacoes';

interface ManualValidacaoFormProps {
  requirement: RankingRequirement;
  entry: RankingProgressEntry | undefined;
  desbravadores: Desbravador[];
  disabled?: boolean;
  onChange: (patch: Partial<RankingProgressEntry>) => void;
}

export const ManualValidacaoForm: React.FC<ManualValidacaoFormProps> = ({
  requirement,
  entry,
  desbravadores,
  disabled,
  onChange,
}) => {
  const ativos = desbravadores.filter(d => d.status === 'ATIVO');

  const confirmedIds = new Set<string>(
    (entry?.notes || '').split(',').map(s => s.trim()).filter(Boolean)
  );

  const savedMin = entry?.validacaoMeta?.presencaPercent !== undefined
    ? (entry.validacaoMeta as any).minPercent ?? 100
    : 100;
  const [minPercent, setMinPercent] = useState<number>(savedMin);

  const apply = (ids: Set<string>, min: number) => {
    const validIds = ativos.filter(d => ids.has(d.id)).map(d => d.id);
    const pct = ativos.length > 0 ? Math.round((validIds.length / ativos.length) * 100) : 0;
    onChange({
      completed: pct >= min,
      notes: validIds.join(','),
      quantity: validIds.length,
      bonusInput: pct >= BONUS_THRESHOLD_PERCENT ? 1 : 0,
      validacaoMeta: {
        ...entry?.validacaoMeta,
        presencaPercent: pct,
        ...(({ minPercent: min } as any)),
      },
    });
  };

  const toggle = (id: string) => {
    const next = new Set<string>(confirmedIds);
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
  const hasBonus = pct >= BONUS_THRESHOLD_PERCENT;

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
          {hasBonus && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-500/15 text-amber-400">
              +{requirement.bonusValue ?? 50} pts bônus
            </span>
          )}
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
            <label key={d.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#E53935]"
                checked={confirmedIds.has(d.id)}
                disabled={disabled}
                onChange={() => toggle(d.id)}
              />
              <span className="text-sm font-bold text-gray-200">{d.nome}</span>
            </label>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
          % mínimo para pontuar ({requirement.points} pts)
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
          {' · '}Bônus de +{requirement.bonusValue ?? 50} pts com ≥ {BONUS_THRESHOLD_PERCENT}%
        </p>
      </div>
    </div>
  );
};
