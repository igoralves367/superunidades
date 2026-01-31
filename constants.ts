
import { ClasseTipo, CargoDesbravador, TipoInstrutor } from './types';

export const BRAND_COLORS = {
  PRIMARY_RED: '#E53935',
  DEEP_RED: '#B71C1C',
  GOLD: '#FFD60A',
  BLUE_NEON: '#00B2FF',
  GREEN_NEON: '#00F5A0',
  BACKGROUND: '#0B0F1A',
  CARD: '#111827',
  BORDER: '#1F2937',
  TEXT: '#E5E7EB',
  TEXT_SEC: '#9CA3AF',
};

export const NEON_COLORS: Record<ClasseTipo, string> = {
  [ClasseTipo.AMIGO]: '#00B2FF',
  [ClasseTipo.COMPANHEIRO]: '#FF2D55',
  [ClasseTipo.PESQUISADOR]: '#00F5A0',
  [ClasseTipo.PIONEIRO]: '#9CA3AF',
  [ClasseTipo.EXCURSIONISTA]: '#A855F7',
  [ClasseTipo.GUIA]: '#FFD60A',
  [ClasseTipo.LIDER]: '#FBBF24',
  [ClasseTipo.AGRUPADAS]: '#4B5563',
  [ClasseTipo.UBN]: '#22D3EE',
};

export const CARGO_LABELS: Record<CargoDesbravador, string> = {
  [CargoDesbravador.INSTRUTOR]: 'Instrutor',
  [CargoDesbravador.AUXILIAR_INSTRUTOR]: 'Auxiliar de Instrutor',
  [CargoDesbravador.CAPELAO]: 'Capelão',
  [CargoDesbravador.ASSOCIADO]: 'Associado(a)',
  [CargoDesbravador.DIRETOR]: 'Diretor(a)',
  [CargoDesbravador.SECRETARIA]: 'Secretário(a)',
  [CargoDesbravador.ANCIAO]: 'Ancião',
  [CargoDesbravador.TESOUREIRA]: 'Tesoureiro(a)',
  [CargoDesbravador.CONSELHEIRO]: 'Conselheiro(a)',
  [CargoDesbravador.ADJUNTO_CONSELHEIRO]: 'Conselheiro(a) Adjunto',
  [CargoDesbravador.DESBRAVADOR]: 'Desbravador',
  [CargoDesbravador.CAPITAO]: 'Capitão/Capitã',
  [CargoDesbravador.DIRETOR_MIDIA]: 'Diretor de Mídia',
};

export const TIPO_INSTRUTOR_LABELS: Record<TipoInstrutor, string> = {
  [TipoInstrutor.INSTRUTOR_CLASSE]: 'Instrutor de Classe',
  [TipoInstrutor.INSTRUTOR_ORDEM_UNIDA]: 'Instrutor de Ordem Unida',
  [TipoInstrutor.INSTRUTOR_FANFARRA]: 'Instrutor de Fanfarra',
  [TipoInstrutor.INSTRUTOR_NOS_AMARRAS]: 'Instrutor de Nós/Amarras',
};
