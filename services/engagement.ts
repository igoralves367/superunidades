import {
  Desbravador,
  EngagementRow,
  RankingUnitProgressDoc,
  Reuniao,
  ReuniaoPresenca,
  Unidade
} from '../types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface EngagementInput {
  units: Unidade[];
  reunioes: Reuniao[];
  presencas: ReuniaoPresenca[];
  progressDocs: RankingUnitProgressDoc[];
  desbravadores: Desbravador[];
  classProgressByUnit: Record<string, number>;
  now: number;
}

const toMillis = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'object') {
    const ts = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof ts.toMillis === 'function') {
      const ms = ts.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof ts.seconds === 'number') {
      return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1_000_000);
    }
  }
  return null;
};

// Retorna true se a unidade teve qualquer atividade nos últimos 7 dias.
const hasActivityThisWeek = (unit: Unidade, input: EngagementInput, weekStart: number): boolean => {
  const reuniaoInWindow = new Map<string, boolean>();
  input.reunioes.forEach(reuniao => {
    if (!reuniao.ativo) return;
    const ms = toMillis(reuniao.data);
    reuniaoInWindow.set(reuniao.id, ms != null && ms >= weekStart);
  });

  for (const presenca of input.presencas) {
    if (presenca.unidadeId !== unit.id) continue;
    if (!presenca.presente) continue;
    if (reuniaoInWindow.get(presenca.reuniaoId)) return true;
    const updatedMs = toMillis(presenca.updatedAt);
    if (updatedMs != null && updatedMs >= weekStart) return true;
  }

  for (const docProgress of input.progressDocs) {
    if (docProgress.unitId !== unit.id) continue;
    // doc-level updatedAt — set by serverTimestamp() on every write
    const docUpdatedMs = toMillis(docProgress.updatedAt);
    if (docUpdatedMs != null && docUpdatedMs >= weekStart) return true;
    for (const entry of Object.values(docProgress.resultados || {})) {
      // any points applied counts
      if ((entry.calculatedPoints ?? 0) > 0) return true;
      // pending/rejected submission counts as activity regardless of timestamp
      const subStatus = (entry as any).submission?.status;
      if (subStatus === 'PENDING' || subStatus === 'REJECTED') return true;
      // timestamp-based fallbacks
      const submittedAtMs = toMillis((entry as any).submission?.submittedAt);
      if (submittedAtMs != null && submittedAtMs >= weekStart) return true;
    }
  }

  return false;
};

// Retorna todas as unidades com flag hasMovement. Função pura, sem I/O.
export const computeEngagementRows = (input: EngagementInput): EngagementRow[] => {
  const weekStart = input.now - WEEK_MS;

  return input.units
    .map(unit => ({
      unidade: unit,
      hasMovement: unit.manualMovimentoSemana != null
        ? unit.manualMovimentoSemana
        : hasActivityThisWeek(unit, input, weekStart)
    }))
    .sort((a, b) => a.unidade.nome.localeCompare(b.unidade.nome, 'pt-BR'));
};
