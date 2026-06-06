import React from 'react';
import { Loader2, Star } from 'lucide-react';
import { NeonCard } from '../NeonCard';

interface DnaIndicatorCardProps {
  title: string;
  value: number | null;       // 0-100 (já normalizado para exibição)
  description: string;
  emptyMessage?: string;
  stars?: 3 | 4 | 5 | null;
  color?: string;
  loading?: boolean;
}

export const DnaIndicatorCard: React.FC<DnaIndicatorCardProps> = ({
  title,
  value,
  description,
  emptyMessage = 'Sem dados',
  stars,
  color = '#22D3EE',
  loading = false
}) => {
  return (
    <NeonCard color={color} className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Carregando...</span>
        </div>
      ) : value === null ? (
        <p className="py-3 text-sm font-semibold text-gray-500">{emptyMessage}</p>
      ) : (
        <>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-white leading-none">{value}</span>
            <span className="mb-1 text-lg font-bold text-gray-400">%</span>
          </div>

          {stars != null && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={16}
                  className={i <= stars ? 'text-yellow-400' : 'text-gray-700'}
                  fill={i <= stars ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          )}

          <p className="text-xs font-medium text-gray-400">{description}</p>
        </>
      )}
    </NeonCard>
  );
};
