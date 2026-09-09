import {
  RankingModifierType,
  RankingProgressEntry,
  RankingRequirement,
  RankingRequirementRuleType,
  RankingUnitProgressDoc,
  Unidade
} from '../types';

export interface RankingTotals {
  base: number;
  bonus: number;
  penalty: number;
  total: number;
  completedCount: number;
}

export interface RankingRow extends RankingTotals {
  unidade: Unidade;
  progressPercent: number;
  firstSavedAtMs: number;
}

const safeNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const clampNonNegative = (value: unknown) => Math.max(0, safeNumber(value));

const toMillis = (value: unknown) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const maybeTimestamp = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof maybeTimestamp.toMillis === 'function') return maybeTimestamp.toMillis();
    if (typeof maybeTimestamp.seconds === 'number') {
      return maybeTimestamp.seconds * 1000 + Math.floor((maybeTimestamp.nanoseconds || 0) / 1_000_000);
    }
  }
  return Number.MAX_SAFE_INTEGER;
};

const normalizeQuantity = (requirement: RankingRequirement, entry?: Partial<RankingProgressEntry>) => {
  if (!requirement.requiresQuantity) return 0;
  const raw = clampNonNegative(entry?.quantity);
  if (requirement.maxQuantity == null) return raw;
  return Math.min(raw, requirement.maxQuantity);
};

const calculateModifierPoints = (
  type: RankingModifierType | null,
  configuredValue: number | null,
  inputValue: unknown
) => {
  if (!type) return 0;
  if (type === 'FIXED') return clampNonNegative(configuredValue);
  if (type === 'PER_UNIT') return clampNonNegative(configuredValue) * clampNonNegative(inputValue);
  return clampNonNegative(inputValue);
};

const calculateBasePoints = (
  requirement: RankingRequirement,
  entry?: Partial<RankingProgressEntry>
) => {
  const completed = !!entry?.completed;
  const quantity = normalizeQuantity(requirement, entry);
  const perUnit = requirement.pointsPerUnit ?? requirement.points;

  switch (requirement.ruleType as RankingRequirementRuleType) {
    case 'BOOLEAN':
    case 'BOOLEAN_WITH_BONUS':
    case 'BOOLEAN_WITH_PENALTY':
      return completed ? requirement.points : 0;
    case 'QUANTITY':
    case 'QUANTITY_WITH_PENALTY':
    case 'RECURRING':
      return perUnit * quantity;
    case 'MANUAL_SCORE': {
      const cap = requirement.maxManualScore ?? Number.MAX_SAFE_INTEGER;
      return Math.min(clampNonNegative(entry?.manualScore), cap);
    }
    default:
      return 0;
  }
};

const calculateBonusPoints = (
  requirement: RankingRequirement,
  entry?: Partial<RankingProgressEntry>
) => {
  if (!requirement.allowBonus || !requirement.bonusType) return 0;

  const quantity = normalizeQuantity(requirement, entry);

  if (requirement.bonusType === 'FIXED') {
    return clampNonNegative(entry?.bonusInput) > 0 ? clampNonNegative(requirement.bonusValue) : 0;
  }

  if (requirement.bonusType === 'PER_UNIT') {
    // Use bonusInput if explicitly set (> 0), otherwise fall back to quantity.
    // This ensures conselheiro submissions (which carry quantity) are honoured on approval.
    const multiplier =
      clampNonNegative(entry?.bonusInput) > 0
        ? clampNonNegative(entry?.bonusInput)
        : quantity;
    return clampNonNegative(requirement.bonusValue) * multiplier;
  }

  return calculateModifierPoints(requirement.bonusType, requirement.bonusValue, entry?.bonusInput);
};

const calculatePenaltyPoints = (
  requirement: RankingRequirement,
  entry?: Partial<RankingProgressEntry>
) => {
  if (!requirement.allowPenalty || !requirement.penaltyType) return 0;
  const quantity = normalizeQuantity(requirement, entry);

  if (requirement.penaltyType === 'FIXED') {
    return clampNonNegative(entry?.penaltyInput) > 0 ? clampNonNegative(requirement.penaltyValue) : 0;
  }

  if (requirement.penaltyType === 'PER_UNIT') {
    return calculateModifierPoints(requirement.penaltyType, requirement.penaltyValue, entry?.penaltyInput ?? quantity);
  }

  if (requirement.penaltyType === 'MANUAL') {
    // When requiresQuantity, multiply penaltyValue by quantity (e.g. students without uniform × penalty per student).
    // Otherwise, penaltyInput is the raw value entered by the reviewer.
    if (requirement.requiresQuantity) {
      return clampNonNegative(requirement.penaltyValue) * quantity;
    }
    return clampNonNegative(entry?.penaltyInput);
  }

  return calculateModifierPoints(requirement.penaltyType, requirement.penaltyValue, entry?.penaltyInput);
};

export const calculateRequirementBreakdown = (
  requirement: RankingRequirement,
  entry?: Partial<RankingProgressEntry>
) => {
  const basePoints = calculateBasePoints(requirement, entry);
  const bonusPoints = calculateBonusPoints(requirement, entry);
  const penaltyPoints = calculatePenaltyPoints(requirement, entry);
  const calculatedPoints = Math.max(0, basePoints + bonusPoints - penaltyPoints);

  return {
    basePoints,
    bonusPoints,
    penaltyPoints,
    calculatedPoints
  };
};

export const calculateRequirementPoints = (
  requirement: RankingRequirement,
  entry?: Partial<RankingProgressEntry>
): number => calculateRequirementBreakdown(requirement, entry).calculatedPoints;

export const calculateRankingTotals = (
  requirements: RankingRequirement[],
  resultados: Record<string, RankingProgressEntry> = {}
): RankingTotals => {
  let base = 0;
  let bonus = 0;
  let penalty = 0;
  let completedCount = 0;

  requirements.forEach(requirement => {
    const entry = resultados[requirement.id];
    if (!entry) return;

    const breakdown = calculateRequirementBreakdown(requirement, entry);
    base += breakdown.basePoints;
    bonus += breakdown.bonusPoints;
    penalty += breakdown.penaltyPoints;

    const shouldCount =
      requirement.ruleType === 'MANUAL_SCORE'
        ? breakdown.basePoints > 0
        : requirement.requiresQuantity
          ? normalizeQuantity(requirement, entry) > 0 || entry.completed
          : entry.completed;

    if (shouldCount) completedCount += 1;
  });

  return {
    base: safeNumber(base),
    bonus: safeNumber(bonus),
    penalty: safeNumber(penalty),
    total: safeNumber(base + bonus - penalty),
    completedCount
  };
};

export const buildRankingRows = (
  units: Unidade[],
  requirements: RankingRequirement[],
  progressDocs: RankingUnitProgressDoc[]
): RankingRow[] => {
  const progressByUnit = new Map(progressDocs.map(doc => [doc.unitId, doc]));

  return units
    .map(unidade => {
      const doc = progressByUnit.get(unidade.id);
      const totals = calculateRankingTotals(requirements, doc?.resultados || {});

      return {
        unidade,
        ...totals,
        progressPercent: requirements.length > 0 ? totals.completedCount / requirements.length : 0,
        firstSavedAtMs: toMillis(doc?.firstSavedAt || doc?.updatedAt)
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.base - a.base ||
        a.firstSavedAtMs - b.firstSavedAtMs ||
        a.unidade.nome.localeCompare(b.unidade.nome)
    );
};

export const buildRankingProgressState = (
  requirements: RankingRequirement[],
  resultados: Record<string, RankingProgressEntry> = {}
) => {
  return requirements.reduce<Record<string, RankingProgressEntry>>((acc, requirement) => {
    const existing = resultados[requirement.id];
    const draft: RankingProgressEntry = {
      requirementId: requirement.id,
      completed: existing?.completed ?? false,
      quantity: existing?.quantity ?? (requirement.requiresQuantity ? 0 : undefined),
      bonusInput: existing?.bonusInput ?? 0,
      penaltyInput: existing?.penaltyInput ?? 0,
      manualScore: existing?.manualScore ?? 0,
      notes: existing?.notes ?? '',
      submission: existing?.submission,
      updatedBy: existing?.updatedBy,
      updatedAt: existing?.updatedAt,
      validacaoMeta: existing?.validacaoMeta,
      basePoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      calculatedPoints: 0
    };

    const breakdown = calculateRequirementBreakdown(requirement, draft);
    draft.basePoints = breakdown.basePoints;
    draft.bonusPoints = breakdown.bonusPoints;
    draft.penaltyPoints = breakdown.penaltyPoints;
    draft.calculatedPoints = breakdown.calculatedPoints;
    acc[requirement.id] = draft;
    return acc;
  }, {});
};

// Generates a stable 6-char alphanumeric code from a unit ID.
// Uses djb2 hash so every unit gets a unique code regardless of ID format
// (seed IDs like "unidade_brasil" and Firestore auto-IDs both work correctly).
export const generateUnitCode = (unitId: string): string => {
  let hash = 5381;
  for (let i = 0; i < unitId.length; i++) {
    hash = Math.imul((hash << 5) + hash, 1) ^ unitId.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(-6);
};

export const getRequirementRuleLabel = (ruleType: RankingRequirementRuleType) => {
  switch (ruleType) {
    case 'BOOLEAN':
      return 'Booleano';
    case 'BOOLEAN_WITH_BONUS':
      return 'Booleano + bônus';
    case 'BOOLEAN_WITH_PENALTY':
      return 'Booleano + penalidade';
    case 'QUANTITY':
      return 'Quantidade';
    case 'QUANTITY_WITH_PENALTY':
      return 'Quantidade + penalidade';
    case 'RECURRING':
      return 'Recorrente';
    case 'MANUAL_SCORE':
      return 'Pontuação manual';
    default:
      return ruleType;
  }
};
