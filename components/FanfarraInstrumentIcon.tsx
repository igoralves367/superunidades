import React from 'react';
import { FanfarraTipoInstrumento } from '../types';

interface IconProps {
  size?: number;
  className?: string;
}

const CymbalPairIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <ellipse cx="9" cy="14.5" rx="5" ry="2.8" />
    <ellipse cx="15" cy="9.5" rx="5" ry="2.8" />
    <circle cx="9" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <path d="M6 19l2.2-2.4" />
    <path d="M18 5l-2.2 2.4" />
  </svg>
);

const BassDrumIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="11" cy="12" r="6.5" />
    <circle cx="11" cy="12" r="4.2" />
    <path d="M4.5 18.5L3 21" />
    <path d="M17.5 18.5L19 21" />
    <path d="M18 11.5h3" />
    <circle cx="21.1" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M19.5 15.5h2.2v2h-2.2z" />
  </svg>
);

const SnareBoxIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="9" width="14" height="7" rx="2" />
    <path d="M5 12.5h14" />
    <path d="M7 6l4 3" />
    <path d="M17 6l-4 3" />
    <path d="M8 16v2.5" />
    <path d="M16 16v2.5" />
  </svg>
);

const isCaixaFamily = (tipo: FanfarraTipoInstrumento) =>
  tipo === 'SURDO' || tipo === 'BACURINHA' || tipo === 'REPIQUE' || tipo === 'MARCACAO';

export const FanfarraInstrumentIcon: React.FC<IconProps & { tipo: FanfarraTipoInstrumento }> = ({
  tipo,
  size = 20,
  className
}) => {
  if (tipo === 'PRATO') return <CymbalPairIcon size={size} className={className} />;
  if (tipo === 'BUMBO') return <BassDrumIcon size={size} className={className} />;
  if (isCaixaFamily(tipo)) return <SnareBoxIcon size={size} className={className} />;
  return <SnareBoxIcon size={size} className={className} />;
};

