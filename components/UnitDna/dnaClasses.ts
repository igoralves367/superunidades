import { Desbravador, Requisito } from '../../types';

export interface DnaProgressEntry {
  requisitoId: string;
  feito?: boolean;
}

export interface DnaClassesResult {
  classesAvgPercent: number | null; // 0-100; null se nenhum desbravador com classe
  classesCompletedCount: number;    // desbravadores com 100% na classe atual
  classesMemberCount: number;       // desbravadores com classeId atribuído
}

// Percentual de classe de um desbravador: requisitos feitos / total da classe atual.
const memberClassPercent = (
  classReqs: Requisito[],
  progresso: DnaProgressEntry[]
): number => {
  if (classReqs.length === 0) return 0;
  const done = classReqs.filter(r => progresso.find(p => p.requisitoId === r.id)?.feito).length;
  return Math.round((done / classReqs.length) * 100);
};

// Calcula os indicadores de progresso de classes para os desbravadores de uma unidade.
// Desbravadores sem classeId são ignorados (não contam como 0%).
export const buildDnaClasses = (
  desbravadores: Desbravador[],
  requisitos: Requisito[],
  progressoPorDbv: Record<string, DnaProgressEntry[]>
): DnaClassesResult => {
  const comClasse = desbravadores.filter(d => !!d.classeId);

  if (comClasse.length === 0) {
    return { classesAvgPercent: null, classesCompletedCount: 0, classesMemberCount: 0 };
  }

  const reqsByClasse = new Map<string, Requisito[]>();
  for (const req of requisitos) {
    if (!req.ativo) continue;
    if (!reqsByClasse.has(req.classeId)) reqsByClasse.set(req.classeId, []);
    reqsByClasse.get(req.classeId)!.push(req);
  }

  let sumPct = 0;
  let completedCount = 0;
  for (const dbv of comClasse) {
    const classReqs = reqsByClasse.get(dbv.classeId) ?? [];
    const pct = memberClassPercent(classReqs, progressoPorDbv[dbv.id] ?? []);
    sumPct += pct;
    if (pct === 100) completedCount += 1;
  }

  return {
    classesAvgPercent: Math.round(sumPct / comClasse.length),
    classesCompletedCount: completedCount,
    classesMemberCount: comClasse.length
  };
};

// Estrelas do Clubão a partir do percentual (0-1) de requisitos cumpridos.
export const calcDnaStars = (percent: number | null): 3 | 4 | 5 | null => {
  if (percent === null) return null;
  if (percent >= 0.8) return 5;
  if (percent >= 0.6) return 4;
  return 3;
};
