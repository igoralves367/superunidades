import { describe, it, expect } from 'vitest';
import {
  buildSubmittedEntry,
  buildApprovedEntry,
  buildRejectedEntry,
  resolveRequirementDisplayStatus,
  sumTotalPoints
} from './clubaoSubmission';
import type { RankingProgressEntry, RankingRequirement } from '../types';

const makeReq = (overrides: Partial<RankingRequirement> = {}): RankingRequirement => ({
  id: 'q1-classe-biblica',
  quarterId: 'qx',
  quarterNumber: 1,
  category: 'Evangelismo',
  name: 'Classe Bíblica',
  description: '',
  points: 300,
  ruleType: 'BOOLEAN',
  requiresQuantity: false,
  active: true,
  displayOrder: 1,
  origem: 'PADRAO',
  ...overrides
} as RankingRequirement);

const reviewer = { id: 'dir1', nome: 'Diretor' };
const counselor = { id: 'con1', nome: 'Conselheiro' };

describe('clubaoSubmission', () => {
  it('exibe como aprovado quando a diretoria marcou o requisito diretamente', () => {
    const entry = buildApprovedEntry(makeReq(), undefined, reviewer, 1);
    delete entry.submission;

    expect(resolveRequirementDisplayStatus(entry)).toBe('APPROVED');
  });

  it('mantém o status da submissão quando ainda não existe resultado definitivo', () => {
    const pending = buildSubmittedEntry(makeReq().id, undefined, {}, counselor, 1);

    expect(resolveRequirementDisplayStatus(pending)).toBe('PENDING');
  });

  it('exibe como não enviado quando não existe resultado nem submissão', () => {
    expect(resolveRequirementDisplayStatus(undefined)).toBe('NONE');
  });

  it('submissão fica PENDENTE e não soma pontos', () => {
    const entry = buildSubmittedEntry('q1-classe-biblica', undefined, { observation: 'feito' }, counselor, 1);
    expect(entry.submission?.status).toBe('PENDING');
    expect(entry.completed).toBe(false);
    expect(entry.calculatedPoints).toBe(0);
    expect(entry.submission?.observation).toBe('feito');
  });

  it('aprovação aplica os pontos e marca completed', () => {
    const req = makeReq({ points: 300 });
    const pending = buildSubmittedEntry(req.id, undefined, {}, counselor, 1);
    const approved = buildApprovedEntry(req, pending, reviewer, 2);
    expect(approved.submission?.status).toBe('APPROVED');
    expect(approved.completed).toBe(true);
    expect(approved.calculatedPoints).toBe(300);
    expect(approved.submission?.reviewedBy).toEqual(reviewer);
  });

  it('reprovação zera os pontos e guarda o motivo', () => {
    const req = makeReq();
    const pending = buildSubmittedEntry(req.id, undefined, {}, counselor, 1);
    const rejected = buildRejectedEntry(req.id, pending, reviewer, 2, 'sem evidência');
    expect(rejected.submission?.status).toBe('REJECTED');
    expect(rejected.completed).toBe(false);
    expect(rejected.calculatedPoints).toBe(0);
    expect(rejected.submission?.rejectionReason).toBe('sem evidência');
  });

  it('sumTotalPoints conta só os requisitos com pontos calculados', () => {
    const req = makeReq({ points: 300 });
    const resultados: Record<string, RankingProgressEntry> = {
      a: buildApprovedEntry(req, undefined, reviewer, 2),
      b: buildSubmittedEntry('b', undefined, {}, counselor, 1),
      c: buildRejectedEntry('c', undefined, reviewer, 2)
    };
    expect(sumTotalPoints(resultados)).toBe(300);
  });
});
