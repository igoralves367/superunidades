
import React from 'react';
import { ClasseTipo } from '../types';
import { NEON_COLORS } from '../constants';

interface BadgeProps {
  label: string;
  classe?: ClasseTipo;
  color?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, classe, color }) => {
  // Priorizar a cor vinda do banco (color prop)
  const badgeColor = color || (classe ? NEON_COLORS[classe] : '#9CA3AF');
  
  return (
    <span 
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ 
        backgroundColor: `${badgeColor}15`,
        color: badgeColor,
        border: `1px solid ${badgeColor}30`
      }}
    >
      {label}
    </span>
  );
};
