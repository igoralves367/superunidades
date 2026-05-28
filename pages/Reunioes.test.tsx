import { describe, it, expect } from 'vitest';
import { buildFrequencySummary } from './Reunioes';
import type { ReuniaoPresenca, Desbravador, Unidade, Reuniao, Cargo } from '../types';

const makeReuniao = (id: string, trimestre: 1|2|3|4 = 1, titulo = 'Reunião Regular'): Reuniao => ({
  id, clubeId: 'clube1', data: '2024-01-01', trimestre, titulo, ativo: true,
});

const makeUnidade = (id: string, nome: string): Unidade => ({
  id, nome, tipo: 'MASCULINA', clubeId: 'clube1', ativo: true,
});

const makeMembro = (id: string, unidadeId: string, cargos: Desbravador['cargos'] = []): Desbravador => ({
  id, nome: `Membro ${id}`, unidadeId, classeId: 'c1', clubeId: 'clube1',
  dataNascimento: '2010-01-01', status: 'ATIVO', cargos, sexo: 'M',
});

const makePresenca = (
  desbravadorId: string,
  reuniaoId: string,
  presente: boolean,
  justificativa?: string,
): ReuniaoPresenca => ({
  id: `${desbravadorId}-${reuniaoId}`, reuniaoId, clubeId: 'clube1',
  desbravadorId, unidadeId: 'u1', presente, justificativa,
});

const cargoConselheiro: Cargo = {
  id: 'cargo_conselheiro', nome: 'Conselheiro', slug: 'conselheiro',
  dedupeKey: 'conselheiro', ordem: 1, ativo: true, origem: 'PADRAO', tipo: 'CONSELHEIRO',
};

const reunioes = [makeReuniao('r1'), makeReuniao('r2'), makeReuniao('r3', 2)];
const unidade = makeUnidade('u1', 'Leões');
const trimestre = 1;
const cargos: Cargo[] = [cargoConselheiro];

describe('buildFrequencySummary', () => {
  it('calcula frequência correta para unidade com presenças parciais', () => {
    const membros = [makeMembro('m1', 'u1'), makeMembro('m2', 'u1')];
    const presencas: ReuniaoPresenca[] = [
      makePresenca('m1', 'r1', true),
      makePresenca('m1', 'r2', true),
      makePresenca('m2', 'r1', true),
      makePresenca('m2', 'r2', false),
    ];

    const result = buildFrequencySummary(presencas, membros, [unidade], reunioes, trimestre, cargos);

    expect(result).toHaveLength(1);
    // m1: 2/2 = 100%, m2: 1/2 = 50% → média = 75%
    expect(result[0].unitFrequencyPct).toBe(75);
    expect(result[0].memberCount).toBe(2);
    expect(result[0].totalMeetings).toBe(2);
  });

  it('retorna 0% para unidade sem registros de presença', () => {
    const membros = [makeMembro('m1', 'u1'), makeMembro('m2', 'u1')];
    const result = buildFrequencySummary([], membros, [unidade], reunioes, trimestre, cargos);

    expect(result[0].unitFrequencyPct).toBe(0);
    expect(result[0].memberCount).toBe(2);
  });

  it('retorna unitFrequencyPct null para unidade sem membros ativos', () => {
    const result = buildFrequencySummary([], [], [unidade], reunioes, trimestre, cargos);

    expect(result[0].unitFrequencyPct).toBeNull();
    expect(result[0].memberCount).toBe(0);
    expect(result[0].byMeetingType).toHaveLength(0);
  });

  it('identifica conselheiro e exclui da média da unidade', () => {
    const conselheiro = makeMembro('c1', 'u1', [{ cargoId: 'cargo_conselheiro', unidadeId: 'u1' }]);
    const membro = makeMembro('m1', 'u1');
    const presencas: ReuniaoPresenca[] = [
      makePresenca('c1', 'r1', true),
      makePresenca('c1', 'r2', true),
      makePresenca('m1', 'r1', false),
      makePresenca('m1', 'r2', false),
    ];

    const result = buildFrequencySummary(presencas, [conselheiro, membro], [unidade], reunioes, trimestre, cargos);

    expect(result[0].counselors).toHaveLength(1);
    expect(result[0].counselors[0].counselorId).toBe('c1');
    expect(result[0].counselors[0].present).toBe(2);
    expect(result[0].counselors[0].pct).toBe(100);
    // conselheiro excluído da média — apenas m1 conta
    expect(result[0].memberCount).toBe(1);
    expect(result[0].unitFrequencyPct).toBe(0);
  });

  it('suporta múltiplos conselheiros na mesma unidade', () => {
    const c1 = makeMembro('c1', 'u1', [{ cargoId: 'cargo_conselheiro', unidadeId: 'u1' }]);
    const c2 = makeMembro('c2', 'u1', [{ cargoId: 'cargo_conselheiro', unidadeId: 'u1' }]);
    const membro = makeMembro('m1', 'u1');
    const presencas: ReuniaoPresenca[] = [
      makePresenca('c1', 'r1', true),
      makePresenca('c1', 'r2', false),
      makePresenca('c2', 'r1', true),
      makePresenca('c2', 'r2', true),
      makePresenca('m1', 'r1', true),
      makePresenca('m1', 'r2', true),
    ];

    const result = buildFrequencySummary(presencas, [c1, c2, membro], [unidade], reunioes, trimestre, cargos);

    expect(result[0].counselors).toHaveLength(2);
    const pcts = result[0].counselors.map(c => c.pct).sort((a, b) => a - b);
    expect(pcts).toEqual([50, 100]);
    // nenhum conselheiro entra na média da unidade
    expect(result[0].memberCount).toBe(1);
    expect(result[0].unitFrequencyPct).toBe(100);
  });

  it('retorna lista vazia de conselheiros para unidade sem conselheiro', () => {
    const membros = [makeMembro('m1', 'u1')];
    const result = buildFrequencySummary([], membros, [unidade], reunioes, trimestre, cargos);

    expect(result[0].counselors).toHaveLength(0);
  });

  it('retorna totalMeetings 0 e unitFrequencyPct null para trimestre sem reuniões ativas', () => {
    const membros = [makeMembro('m1', 'u1')];
    const result = buildFrequencySummary([], membros, [unidade], reunioes, 4, cargos);

    expect(result[0].totalMeetings).toBe(0);
    expect(result[0].unitFrequencyPct).toBeNull();
    expect(result[0].counselors).toHaveLength(0);
  });

  it('não inclui unidades inativas no resultado', () => {
    const unidadeInativa: Unidade = { ...unidade, id: 'u2', nome: 'Inativa', ativo: false };
    const result = buildFrequencySummary([], [], [unidade, unidadeInativa], reunioes, trimestre, cargos);

    expect(result).toHaveLength(1);
    expect(result[0].unidadeId).toBe('u1');
  });

  it('agrupa breakdown por tipo de reunião e contabiliza justificativas', () => {
    const reunioesMistas = [
      makeReuniao('r1', 1, 'Reunião Regular'),
      makeReuniao('r2', 1, 'Reunião Regular'),
      makeReuniao('r3', 1, 'Capelania'),
    ];
    const membros = [makeMembro('m1', 'u1'), makeMembro('m2', 'u1')];
    const presencas: ReuniaoPresenca[] = [
      makePresenca('m1', 'r1', true),
      makePresenca('m1', 'r2', false, 'Doença'),
      makePresenca('m1', 'r3', true),
      makePresenca('m2', 'r1', true),
      makePresenca('m2', 'r2', false),
      // m2 não tem registro em r3 → conta como falta
    ];

    const result = buildFrequencySummary(presencas, membros, [unidade], reunioesMistas, trimestre, cargos);

    const regular = result[0].byMeetingType.find(t => t.titulo === 'Reunião Regular')!;
    expect(regular.totalMeetings).toBe(2);
    expect(regular.totalPresent).toBe(2);  // m1+r1, m2+r1
    expect(regular.totalJustified).toBe(1); // m1+r2 com justificativa
    expect(regular.totalAbsent).toBe(1);    // m2+r2 sem justificativa

    const capelania = result[0].byMeetingType.find(t => t.titulo === 'Capelania')!;
    expect(capelania.totalMeetings).toBe(1);
    expect(capelania.totalPresent).toBe(1);  // m1
    expect(capelania.totalAbsent).toBe(1);   // m2 sem registro
    expect(capelania.totalJustified).toBe(0);
  });
});
