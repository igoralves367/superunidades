import { describe, it, expect } from 'vitest';
import { computeEngagementRows, EngagementInput } from './engagement';
import type { Reuniao, ReuniaoPresenca, RankingUnitProgressDoc, Unidade } from '../types';

const NOW = new Date('2026-06-08T12:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;
const withinWeek = NOW - 3 * DAY;
const outsideWeek = NOW - 10 * DAY;

const makeUnit = (id: string, nome: string, overrides: Partial<Unidade> = {}): Unidade => ({
  id,
  nome,
  tipo: 'MASCULINA',
  clubeId: 'clube-x',
  ativo: true,
  ...overrides
});

const makeReuniao = (id: string, dateMs: number): Reuniao => ({
  id,
  clubeId: 'clube-x',
  data: new Date(dateMs).toISOString().slice(0, 10),
  ativo: true
});

const makePresenca = (
  unidadeId: string,
  reuniaoId: string,
  presente: boolean,
  updatedAt: number
): ReuniaoPresenca => ({
  id: `${reuniaoId}_${unidadeId}_${Math.random()}`,
  reuniaoId,
  clubeId: 'clube-x',
  desbravadorId: `dbv-${Math.random()}`,
  unidadeId,
  presente,
  updatedAt
});

const makeProgressDoc = (
  unitId: string,
  entries: Record<string, { calculatedPoints: number; updatedAt: number }>,
  docUpdatedAt?: number
): RankingUnitProgressDoc => ({
  id: `prog-${unitId}`,
  quarterId: 'q1',
  unitId,
  clubeId: 'clube-x',
  totalPoints: 0,
  resultados: Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [
      k,
      {
        requirementId: k,
        completed: true,
        basePoints: v.calculatedPoints,
        bonusPoints: 0,
        penaltyPoints: 0,
        calculatedPoints: v.calculatedPoints,
        updatedAt: v.updatedAt
      }
    ])
  ),
  updatedAt: docUpdatedAt ?? NOW
});

const baseInput = (overrides: Partial<EngagementInput> = {}): EngagementInput => ({
  units: [],
  reunioes: [],
  presencas: [],
  progressDocs: [],
  desbravadores: [],
  classProgressByUnit: {},
  now: NOW,
  ...overrides
});

describe('computeEngagementRows', () => {
  it('lista vazia não quebra', () => {
    expect(computeEngagementRows(baseInput())).toEqual([]);
  });

  it('ordena alfabeticamente por nome', () => {
    const input = baseInput({
      units: [makeUnit('b', 'Zebra'), makeUnit('a', 'Alfa')]
    });
    const rows = computeEngagementRows(input);
    expect(rows[0].unidade.id).toBe('a');
    expect(rows[1].unidade.id).toBe('b');
  });

  it('presença em reunião desta semana gera hasMovement', () => {
    const reuniao = makeReuniao('r1', withinWeek);
    const input = baseInput({
      units: [makeUnit('a', 'Alfa')],
      reunioes: [reuniao],
      presencas: [makePresenca('a', 'r1', true, withinWeek)]
    });
    const rows = computeEngagementRows(input);
    expect(rows[0].hasMovement).toBe(true);
  });

  it('presença fora da semana não gera hasMovement', () => {
    const reuniao = makeReuniao('r1', outsideWeek);
    const input = baseInput({
      units: [makeUnit('a', 'Alfa')],
      reunioes: [reuniao],
      presencas: [makePresenca('a', 'r1', true, outsideWeek)]
    });
    const rows = computeEngagementRows(input);
    expect(rows[0].hasMovement).toBe(false);
  });

  it('progresso de requisito desta semana gera hasMovement', () => {
    const input = baseInput({
      units: [makeUnit('a', 'Alfa')],
      progressDocs: [
        makeProgressDoc('a', { req1: { calculatedPoints: 10, updatedAt: withinWeek } }, withinWeek)
      ]
    });
    const rows = computeEngagementRows(input);
    expect(rows[0].hasMovement).toBe(true);
  });

  it('requisito fora da semana não gera hasMovement', () => {
    const input = baseInput({
      units: [makeUnit('a', 'Alfa')],
      progressDocs: [
        makeProgressDoc('a', { req1: { calculatedPoints: 10, updatedAt: outsideWeek } }, outsideWeek)
      ]
    });
    const rows = computeEngagementRows(input);
    expect(rows[0].hasMovement).toBe(false);
  });

  it('sem atividade nenhuma => hasMovement false', () => {
    const input = baseInput({
      units: [makeUnit('a', 'Alfa'), makeUnit('b', 'Beta')]
    });
    const rows = computeEngagementRows(input);
    expect(rows.every(r => !r.hasMovement)).toBe(true);
  });

  it('apenas unidade com atividade recebe hasMovement true', () => {
    const reuniao = makeReuniao('r1', withinWeek);
    const input = baseInput({
      units: [makeUnit('a', 'Alfa'), makeUnit('b', 'Beta')],
      reunioes: [reuniao],
      presencas: [makePresenca('a', 'r1', true, withinWeek)]
    });
    const rows = computeEngagementRows(input);
    expect(rows.find(r => r.unidade.id === 'a')!.hasMovement).toBe(true);
    expect(rows.find(r => r.unidade.id === 'b')!.hasMovement).toBe(false);
  });
});
