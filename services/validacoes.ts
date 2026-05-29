import { Reuniao, Cargo, Unidade, Desbravador, ReuniaoPresenca, AutoFrequenciaResult } from '../types';
import { buildFrequencySummary } from './frequencia';

export const VALIDACAO_REQUIREMENT_TIPOS = [
  'frequencia-conselheiros',
  'frequencia-reunioes-clube',
  'frequencia-cultos',
  'frequentar-pg',
  'devocional-pessoal',
  'classes',
] as const;

export const CONSELHEIRO_PENALTY = 100;
export const FREQUENCIA_CLUBE_BASE = 60;
export const FREQUENCIA_CLUBE_BONUS = 50;
export const BONUS_THRESHOLD_PERCENT = 85;

export function requirementId(quarterNumber: number, tipo: string): string {
  return `q${quarterNumber}-${tipo}`;
}

/**
 * Calcula frequência de conselheiros e frequência às reuniões do clube por unidade.
 * Função pura: não persiste no Firestore.
 */
export function buildAutoFrequencia(
  presencas: ReuniaoPresenca[],
  membros: Desbravador[],
  unidades: Unidade[],
  reunioes: Reuniao[],
  quarterNumber: number,
  cargos: Cargo[]
): AutoFrequenciaResult[] {
  const summary = buildFrequencySummary(presencas, membros, unidades, reunioes, quarterNumber, cargos);
  const conselheirosReqId = requirementId(quarterNumber, 'frequencia-conselheiros');
  const reunioesReqId = requirementId(quarterNumber, 'frequencia-reunioes-clube');

  return summary.map(unit => {
    const absentees = unit.counselors.filter(c => c.pct < 100);
    const absences = absentees.length;

    const hasMeetings = unit.totalMeetings > 0;
    const pct = unit.unitFrequencyPct ?? 0;
    const basePoints = hasMeetings && unit.memberCount > 0 ? FREQUENCIA_CLUBE_BASE : 0;
    const bonusPoints = pct >= BONUS_THRESHOLD_PERCENT ? FREQUENCIA_CLUBE_BONUS : 0;

    return {
      unitId: unit.unidadeId,
      conselheiros: {
        requirementId: conselheirosReqId,
        absences,
        penaltyPoints: absences * CONSELHEIRO_PENALTY,
        details: unit.counselors.map(c => ({ nome: c.counselorNome, presencaPercent: c.pct })),
      },
      reunioes: {
        requirementId: reunioesReqId,
        presencaPercent: unit.unitFrequencyPct ?? 0,
        bonusPoints,
        basePoints,
      },
    };
  });
}
