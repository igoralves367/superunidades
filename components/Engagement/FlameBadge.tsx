import React from 'react';
import { Zap } from 'lucide-react';

export const MovimentouBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5C518]/40 bg-[#F5C518]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#F5C518]">
    <Zap size={12} className="fill-[#F5C518] text-[#F5C518]" />
    Movimentou
  </span>
);
