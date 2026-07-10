import React from 'react';
import { EngagementRow } from '../../types';
import { MovimentouBadge } from './FlameBadge';

interface EngagementUnitCardProps {
  row: EngagementRow;
}

const fallbackAvatar = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'SU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const EngagementUnitCard: React.FC<EngagementUnitCardProps> = ({ row }) => (
  <article className="rounded-[28px] border border-[#F5C518]/20 bg-[linear-gradient(90deg,rgba(245,197,24,0.05),rgba(10,8,0,0.85))] p-4 md:p-5 flex items-center gap-4">
    <div className="w-20 h-12 rounded-[18px] bg-[#111827] border border-white/10 overflow-hidden flex items-center justify-center p-1 shrink-0">
      {row.unidade.imageUrl ? (
        <img src={row.unidade.imageUrl} alt={row.unidade.nome} className="w-full h-full object-contain" />
      ) : (
        <span className="font-black text-sm text-gray-300">{fallbackAvatar(row.unidade.nome)}</span>
      )}
    </div>

    <h3 className="text-lg sm:text-xl md:text-2xl font-black flex-1 min-w-0 break-words">
      {row.unidade.nome}
    </h3>

    <MovimentouBadge />
  </article>
);
