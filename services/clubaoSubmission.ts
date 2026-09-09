import {
  RankingProgressEntry,
  RankingRequirement,
  RequirementSubmissionStatus
} from '../types';
import { calculateRequirementBreakdown } from './ranking';

export const emptyEntry = (requirementId: string): RankingProgressEntry => ({
  requirementId,
  completed: false,
  quantity: 0,
  bonusInput: 0,
  penaltyInput: 0,
  manualScore: 0,
  basePoints: 0,
  bonusPoints: 0,
  penaltyPoints: 0,
  calculatedPoints: 0
});

/**
 * Resolve o status exibido para a unidade.
 *
 * A diretoria pode validar um requisito diretamente no painel do Clubão,
 * sem passar pelo fluxo de submissão do conselheiro. Nessa situação não há
 * `submission.status`, mas o resultado já é definitivo e deve aparecer como
 * aprovado no painel da unidade.
 */
export const resolveRequirementDisplayStatus = (
  entry?: RankingProgressEntry
): RequirementSubmissionStatus | 'NONE' => {
  const hasValidatedResult =
    entry?.completed === true ||
    Number(entry?.calculatedPoints || 0) > 0 ||
    entry?.validacaoMeta?.confirmadoRanking === true;

  if (hasValidatedResult) return 'APPROVED';
  return entry?.submission?.status ?? 'NONE';
};

// Entrada PENDENTE: conselheiro marcou, pontos ainda não aplicados.
export const buildSubmittedEntry = (
  requirementId: string,
  current: RankingProgressEntry | undefined,
  payload: { observation?: string; quantity?: number },
  submittedBy: { id: string; nome: string },
  submittedAt: any
): RankingProgressEntry => {
  const base = current ?? emptyEntry(requirementId);
  return {
    ...base,
    requirementId,
    completed: false,
    quantity: payload.quantity ?? base.quantity ?? 0,
    basePoints: 0,
    bonusPoints: 0,
    penaltyPoints: 0,
    calculatedPoints: 0,
    submission: {
      status: 'PENDING',
      observation: payload.observation || undefined,
      submittedBy,
      submittedAt
    }
  };
};

// Aprovação: aplica os pontos calculados ao ranking.
export const buildApprovedEntry = (
  requirement: RankingRequirement,
  current: RankingProgressEntry | undefined,
  reviewer: { id: string; nome: string },
  reviewedAt: any
): RankingProgressEntry => {
  const base = current ?? emptyEntry(requirement.id);
  const breakdown = calculateRequirementBreakdown(requirement, { ...base, completed: true });
  return {
    ...base,
    completed: true,
    basePoints: breakdown.basePoints,
    bonusPoints: breakdown.bonusPoints,
    penaltyPoints: breakdown.penaltyPoints,
    calculatedPoints: breakdown.calculatedPoints,
    submission: {
      ...(base.submission ?? { status: 'PENDING' }),
      status: 'APPROVED',
      reviewedBy: reviewer,
      reviewedAt,
      rejectionReason: undefined
    }
  };
};

// Reprovação: zera os pontos e registra o motivo.
export const buildRejectedEntry = (
  requirementId: string,
  current: RankingProgressEntry | undefined,
  reviewer: { id: string; nome: string },
  reviewedAt: any,
  rejectionReason?: string
): RankingProgressEntry => {
  const base = current ?? emptyEntry(requirementId);
  return {
    ...base,
    completed: false,
    basePoints: 0,
    bonusPoints: 0,
    penaltyPoints: 0,
    calculatedPoints: 0,
    submission: {
      ...(base.submission ?? { status: 'PENDING' }),
      status: 'REJECTED',
      reviewedBy: reviewer,
      reviewedAt,
      rejectionReason: rejectionReason || undefined
    }
  };
};

export const sumTotalPoints = (resultados: Record<string, RankingProgressEntry>): number =>
  Object.values(resultados).reduce((sum, entry) => sum + Number(entry.calculatedPoints || 0), 0);
