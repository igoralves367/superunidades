
import React from 'react';

interface NeonCardProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export const NeonCard: React.FC<NeonCardProps> = ({ children, color = '#1F2937', className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[#111827] border rounded-xl p-4 transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} ${className}`}
      style={{ 
        borderColor: color,
        boxShadow: `0 0 10px ${color}1A`,
      }}
    >
      {children}
    </div>
  );
};
