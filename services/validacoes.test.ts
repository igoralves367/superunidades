import { describe, it, expect } from 'vitest';
import { buildAutoFrequencia, requirementId } from './validacoes';
import type { ReuniaoPresenca, Desbravador, Unidade, Reuniao, Cargo } from '../types';

const makeReuniao = (id: string, trimestre: 1 | 2 | 3 | 4 = 1, titulo = 'Reunião Regular'): Reuniao => ({
  id, clubeId: 'clube1', data: '2024-01-01', trimestre, titulo, ativo: true,
});

const makeUnidade = (id: string, nome: string): Unidade => ({
  id, nome, tipo: 'MASCULINA', clubeId: 'clube1', ativo: true,
});

const makeMembro = (id: string, unidadeId: string, cargos: Desbravador['cargos'] = []): Desbravador => ({
  id, nome: `Membro ${id}`, unidadeId, classeId: 'c1', clubeId: 'clube1',
  dataNascimento: '2010-01-01', status: 'ATIVO', cargos, sexo: 'M',
});

const makePresenca = (desbravadorId: string, reuniaoId: string, presente: boolean): ReuniaoPresenca => ({
  id: `${desbravadorId}-${reuniaoId}`, reuniaoId, clubeId: 'clube1',
  desbravadorId, unidadeId: 'u1', presente,
});

const cargoConselheiro: Cargo = {
  id: 'cargo_conselheiro', nome: 'Conselheiro', slug: 'conselheiro',
  dedupeKey: 'conselheiro', ordem: 1, ativo: true, origem: 'PADRAO', tipo: 'CONSELHEIRO',
};

const unidade = makeUnidade('u1', 'Leões');
const cargos: Cargo[] = [cargoConselheiro];
// 10 reuniões no trimestre 1 para permitir thresholds precisos de %
const reunioes: Reuniao[] = Array.from({ length: 10 }, (_, i) => makeReuniao(`r${i + 1}`));

const presencaTotal = (dbvId: string, qtd: number): ReuniaoPresenca[] =>
  reunioes.slice(0, qtd).map(r => makePresenca(dbvId, r.id, true));

describe('requirementId', () => {
  it('constrói o id no padrão qN-tipo', () => {
    expect(requirementId(1, 'frequencia-conselheiros')).toBe('q1-frequencia-conselheiros');
    expect(requirementId(2, 'frequencia-reunioes-clube')).toBe('q2-frequencia-reunioes-clube');
  });
});

describe('buildAutoFrequencia — conselheiros', () => {
  it('sem penalidade quando conselheiro tem 100% de presença', () => {
    const conselheiro = makeMembro('c1', 'u1', [{ cargoId: 'cargo_conselheiro', unidadeId: 'u1' }]);
    const presencas = presencaTotal('c1', 10);

    const [result] = buildAutoFrequencia(presencas, [conselheiro], [unidade], reunioes, 1, cargos);

    expect(result.conselheiros.absences).toBe(0);
    expect(result.conselheiros.penaltyPoints).toBe(0);
  });

  it('aplica -100 pts por conselheiro com ausência', () => {
    const conselheiro = makeMembro('c1', 'u1', [{ cargoId: 'cargo_conselheiro', unidadeId: 'u1' }]);
    const presencas = presencaTotal('c1', 9); // 90% < 100%

    const [result] = buildAutoFrequencia(presencas, [conselheiro], [unidade], reunioes, 1, cargos);

    expect(result.conselheiros.absences).toBe(1);
    expect(result.conselheiros.penaltyPoints).toBe(100);
  });
});

describe('buildAutoFrequencia — reuniões do clube', () => {
  it('concede 60 pts base sem bônus com 84% de presença', () => {
    const membros = Array.from({ length: 50 }, (_, i) => makeMembro(`m${i}`, 'u1'));
    // 42 membros 100%, 8 membros 0% → média 84%
    const presencas: ReuniaoPresenca[] = [];
    membros.slice(0, 42).forEach(m => presencas.push(...presencaTotal(m.id, 10)));

    const [result] = buildAutoFrequencia(presencas, membros, [unidade], reunioes, 1, cargos);

    expect(result.reunioes.presencaPercent).toBe(84);
    expect(result.reunioes.basePoints).toBe(60);
    expect(result.reunioes.bonusPoints).toBe(0);
  });

  it('aplica bônus +50 pts com 85% de presença', () => {
    const membros = Array.from({ length: 20 }, (_, i) => makeMembro(`m${i}`, 'u1'));
    // 17 membros 100%, 3 membros 0% → média 85%
    const presencas: ReuniaoPresenca[] = [];
    membros.slice(0, 17).forEach(m => presencas.push(...presencaTotal(m.id, 10)));

    const [result] = buildAutoFrequencia(presencas, membros, [unidade], reunioes, 1, cargos);

    expect(result.reunioes.presencaPercent).toBe(85);
    expect(result.reunioes.basePoints).toBe(60);
    expect(result.reunioes.bonusPoints).toBe(50);
  });
});

describe('buildAutoFrequencia — sem reuniões', () => {
  it('retorna entries vazios sem erro quando não há reuniões no trimestre', () => {
    const membros = [makeMembro('m1', 'u1')];
    const result = buildAutoFrequencia([], membros, [unidade], [], 1, cargos);

    expect(result).toHaveLength(1);
    expect(result[0].reunioes.basePoints).toBe(0);
    expect(result[0].reunioes.bonusPoints).toBe(0);
    expect(result[0].conselheiros.absences).toBe(0);
  });
});
