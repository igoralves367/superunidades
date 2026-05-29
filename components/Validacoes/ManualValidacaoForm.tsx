import React from 'react';
import { RankingProgressEntry, RankingRequirement } from '../../types';
import { BONUS_THRESHOLD_PERCENT } from '../../services/validacoes';

interface ManualValidacaoFormProps {
  requirement: RankingRequirement;
  entry: RankingProgressEntry | undefined;
  disabled?: boolean;
  onChange: (patch: Partial<RankingProgressEntry>) => void;
}

/**
 * Form genérico para validações de presença (Cultos, PG).
 * Concede pontos base ao marcar "participou" e bônus automático com >= 85%.
 */
export const ManualValidacaoForm: React.FC<ManualValidacaoFormProps> = ({ requirement, entry, disabled, onChange }) => {
  const percent = entry?.validacaoMeta?.presencaPercent ?? 0;

  const handlePercent = (value: number) => {
    const pct = Math.max(0, Math.min(100, value));
    onChange({
      bonusInput: pct >= BONUS_THRESHOLD_PERCENT ? 1 : 0,
      validacaoMeta: { ...entry?.validacaoMeta, presencaPercent: pct },
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
        <span className="text-sm font-bold text-gray-200">Unidade participou ({requirement.points} pts)</span>
      </label>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
          % de presença da unidade
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={percent}
          disabled={disabled}
          onChange={e => handlePercent(Number(e.target.value))}
          className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
        />
        <p className="text-[11px] text-gray-500 ml-1">
          Bônus de +{requirement.bonusValue ?? 50} pts com ≥ {BONUS_THRESHOLD_PERCENT}% de presença.
        </p>
      </div>
    </div>
  );
};
