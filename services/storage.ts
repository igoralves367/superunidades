
import { Desbravador, SecretariaStatus, Unidade } from '../types';
import { mockDesbravadores, mockSecretaria, mockUnidades } from '../mockData';

const KEY = 'pm_desbravadores';
const KEY_SECRETARIA = 'pm_secretaria';
const KEY_UNIDADES = 'pm_unidades';

export function loadDesbravadores(clubeId: string): Desbravador[] {
  try {
    const raw = localStorage.getItem(KEY);
    let desbravadores: Desbravador[] = [];
    if (!raw) {
      desbravadores = mockDesbravadores;
    } else {
      desbravadores = JSON.parse(raw) as Desbravador[];
    }
    
    return desbravadores
      .filter(d => d.clubeId === clubeId)
      .map(d => ({ ...d, status: d.status || 'ATIVO' }));
  } catch {
    return mockDesbravadores.filter(d => d.clubeId === clubeId).map(d => ({ ...d, status: 'ATIVO' }));
  }
}

export function saveDesbravadores(all: Desbravador[]) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function loadUnits(clubeId: string): Unidade[] {
  try {
    const raw = localStorage.getItem(KEY_UNIDADES);
    if (!raw) return mockUnidades.filter(u => u.clubeId === clubeId);
    const units = JSON.parse(raw) as Unidade[];
    return units.filter(u => u.clubeId === clubeId);
  } catch {
    return mockUnidades.filter(u => u.clubeId === clubeId);
  }
}

export function saveUnits(all: Unidade[]) {
  localStorage.setItem(KEY_UNIDADES, JSON.stringify(all));
}

export function loadSecretariaStatuses(clubeId: string, desbravadoresDoClube: Desbravador[]): SecretariaStatus[] {
  try {
    const raw = localStorage.getItem(KEY_SECRETARIA);
    const stored = raw ? (JSON.parse(raw) as SecretariaStatus[]) : [];
    const base = stored.length > 0 ? stored : mockSecretaria;
    const map = new Map<string, SecretariaStatus>();
    base.forEach(s => map.set(s.desbravadorId, s));
    const normalized: SecretariaStatus[] = desbravadoresDoClube.map(d => {
      const existing = map.get(d.id);
      if (existing) return existing;
      return {
        id: `sec-${d.id}`,
        desbravadorId: d.id,
        sgcEmDia: false,
        autorizacaoPais: false,
        fichaMedica: false,
        documentos: false,
        observacao: ''
      };
    });
    return normalized;
  } catch {
    return desbravadoresDoClube.map(d => ({
      id: `sec-${d.id}`,
      desbravadorId: d.id,
      sgcEmDia: false,
      autorizacaoPais: false,
      fichaMedica: false,
      documentos: false,
      observacao: ''
    }));
  }
}

export function saveSecretariaStatuses(all: SecretariaStatus[]) {
  localStorage.setItem(KEY_SECRETARIA, JSON.stringify(all));
}
