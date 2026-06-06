import { describe, it, expect } from 'vitest';
import { buildDnaClasses, calcDnaStars, DnaProgressEntry } from './dnaClasses';
import type { Desbravador, Requisito } from '../../types';

const makeDbv = (id: string, classeId: string): Desbravador => ({
  id, nome: `Dbv ${id}`, unidadeId: 'u1', classeId, clubeId: 'clube1',
  dataNascimento: '2010-01-01', status: 'ATIVO', cargos: [], sexo: 'M'
});

const makeReq = (id: string, classeId: string): Requisito => ({
  id, classeId, codigo: id, titulo: id, descricao: '', categoria: '',
  ordem: 0, origem: 'PADRAO', ativo: true
});

const feito = (requisitoId: string): DnaProgressEntry => ({ requisitoId, feito: true });

describe('calcDnaStars', () => {
  it('retorna 5 estrelas para >= 0.8', () => {
    expect(calcDnaStars(0.8)).toBe(5);
    expect(calcDnaStars(1)).toBe(5);
  });
  it('retorna 4 estrelas para 0.6 <= pct < 0.8', () => {
    expect(calcDnaStars(0.79)).toBe(4);
    expect(calcDnaStars(0.6)).toBe(4);
  });
  it('retorna 3 estrelas abaixo de 0.6', () => {
    expect(calcDnaStars(0.59)).toBe(3);
    expect(calcDnaStars(0)).toBe(3);
  });
  it('retorna null quando percent é null', () => {
    expect(calcDnaStars(null)).toBeNull();
  });
});

describe('buildDnaClasses', () => {
  const reqsC1 = [makeReq('r1', 'c1'), makeReq('r2', 'c1'), makeReq('r3', 'c1'), makeReq('r4', 'c1')];

  it('calcula média dos percentuais individuais', () => {
    const dbvs = [makeDbv('a', 'c1'), makeDbv('b', 'c1')];
    const progresso: Record<string, DnaProgressEntry[]> = {
      a: [feito('r1'), feito('r2'), feito('r3'), feito('r4')], // 100%
      b: [feito('r1'), feito('r2')] // 50%
    };
    const result = buildDnaClasses(dbvs, reqsC1, progresso);
    expect(result.classesAvgPercent).toBe(75);
    expect(result.classesMemberCount).toBe(2);
    expect(result.classesCompletedCount).toBe(1);
  });

  it('ignora desbravadores sem classeId', () => {
    const dbvs = [makeDbv('a', 'c1'), makeDbv('b', '')];
    const progresso: Record<string, DnaProgressEntry[]> = {
      a: [feito('r1'), feito('r2'), feito('r3'), feito('r4')]
    };
    const result = buildDnaClasses(dbvs, reqsC1, progresso);
    expect(result.classesMemberCount).toBe(1);
    expect(result.classesAvgPercent).toBe(100);
  });

  it('retorna null quando nenhum desbravador tem classe', () => {
    const dbvs = [makeDbv('a', ''), makeDbv('b', '')];
    const result = buildDnaClasses(dbvs, reqsC1, {});
    expect(result.classesAvgPercent).toBeNull();
    expect(result.classesCompletedCount).toBe(0);
    expect(result.classesMemberCount).toBe(0);
  });

  it('conta como concluído apenas quem tem 100%', () => {
    const dbvs = [makeDbv('a', 'c1'), makeDbv('b', 'c1'), makeDbv('c', 'c1')];
    const progresso: Record<string, DnaProgressEntry[]> = {
      a: [feito('r1'), feito('r2'), feito('r3'), feito('r4')], // 100%
      b: [feito('r1'), feito('r2'), feito('r3'), feito('r4')], // 100%
      c: [feito('r1')] // 25%
    };
    const result = buildDnaClasses(dbvs, reqsC1, progresso);
    expect(result.classesCompletedCount).toBe(2);
  });

  it('ignora requisitos inativos no total da classe', () => {
    const reqs = [makeReq('r1', 'c1'), makeReq('r2', 'c1'), { ...makeReq('r3', 'c1'), ativo: false }];
    const dbvs = [makeDbv('a', 'c1')];
    const progresso: Record<string, DnaProgressEntry[]> = { a: [feito('r1'), feito('r2')] };
    const result = buildDnaClasses(dbvs, reqs, progresso);
    expect(result.classesAvgPercent).toBe(100);
  });
});
