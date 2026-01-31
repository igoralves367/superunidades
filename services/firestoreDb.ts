
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp,
  getDoc,
  writeBatch,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Unidade, 
  Classe, 
  Requisito, 
  Cargo, 
  Desbravador, 
  SecretariaStatus, 
  MemberCargo,
  Usuario,
  Despesa,
  Doacao,
  Socio,
  CarneCampori,
  Parcela,
  LancamentoCaixa,
  ReceitaCampori,
  ClubaoUnidadeDoc
} from '../types';
import { DEFAULT_REQUISITOS } from '../seed/defaultRequisitos';

const validateClub = (clubId: string) => {
  if (!clubId) throw new Error("ID do Clube não identificado.");
};

/**
 * Utilitário para remover recursivamente todas as chaves 'undefined' de um objeto ou array.
 * O Firestore não aceita valores undefined.
 */
export const deepCleanUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj
      .map(v => deepCleanUndefined(v))
      .filter(v => v !== undefined);
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      const val = deepCleanUndefined(obj[key]);
      if (val !== undefined) {
        newObj[key] = val;
      }
    });
    // Se o objeto resultante estiver vazio, retornamos undefined para que ele seja removido do pai
    return Object.keys(newObj).length > 0 ? newObj : undefined;
  }
  return obj;
};

// --- NORMALIZATION HELPERS ---

export const normalizeSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, '')
    .trim()
    .replace(/\s+/g, '_');
};

export const createDedupeKey = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\(a\)$/g, '') // remove (a) no final
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\u0300-\u036f\w\s]/gi, '')
    .trim()
    .replace(/\s+/g, '');
};

const mapColData = (docId: string, data: any, path: string): any => {
  const ativo = data.ativo !== undefined ? data.ativo : true;
  let origem = data.origem;
  
  if (!origem) {
    const basePrefixes = ['classe_', 'cargo_', 'unidade_', 'tipo_instrutor_', 'req_'];
    const isBaseId = basePrefixes.some(p => docId.startsWith(p));
    origem = isBaseId ? 'PADRAO' : 'CUSTOM';
  }

  return { id: docId, ...data, ativo, origem };
};

const listCol = async (clubId: string, path: string) => {
  validateClub(clubId);
  const colRef = collection(db, 'clubs', clubId, path);
  const snap = await getDocs(colRef);
  const items = snap.docs.map(d => mapColData(d.id, d.data(), path));
  return items.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
};

// --- CARGOS ---
export const listCargos = async (clubId: string): Promise<Cargo[]> => {
  return await listCol(clubId, 'cargos') as Cargo[];
};

export const createCargo = async (clubId: string, payload: any) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'cargos'));
  const slug = normalizeSlug(payload.nome);
  const dedupeKey = createDedupeKey(payload.nome);
  const cleaned = deepCleanUndefined({ 
    ...payload, 
    id: docRef.id, 
    slug, 
    dedupeKey,
    origem: 'CUSTOM',
    ativo: true, 
    createdAt: serverTimestamp() 
  });
  await setDoc(docRef, cleaned);
};

export const updateCargo = (clubId: string, id: string, payload: any) => {
  const update: any = { ...payload, updatedAt: serverTimestamp() };
  if (payload.nome) {
    update.slug = normalizeSlug(payload.nome);
    update.dedupeKey = createDedupeKey(payload.nome);
  }
  return updateDoc(doc(db, 'clubs', clubId, 'cargos', id), deepCleanUndefined(update));
};

export const deleteCargo = async (clubId: string, id: string) => {
  validateClub(clubId);
  const cargoDoc = await getDoc(doc(db, 'clubs', clubId, 'cargos', id));
  if (!cargoDoc.exists()) return;
  const cargo = mapColData(id, cargoDoc.data(), 'cargos');

  if (cargo.origem === 'PADRAO' && cargo.locked) {
    throw new Error("PROIBIDO|Este é um cargo padrão do sistema e não pode ser excluído.");
  }

  const members = await listDesbravadores(clubId);
  const inUse = members.filter(m => m.cargos?.some(c => c.cargoId === id) || m.cargoId === id);

  if (inUse.length > 0) {
    await updateDoc(doc(db, 'clubs', clubId, 'cargos', id), { ativo: false });
    throw new Error(`ESTA_EM_USO|O cargo está sendo usado por ${inUse.length} membros. Foi desativado para manter a integridade.`);
  }
  await deleteDoc(doc(db, 'clubs', clubId, 'cargos', id));
};

export const resolveDuplicateCargos = async (clubId: string) => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'cargos'));
  const all = snap.docs.map(d => mapColData(d.id, d.data(), 'cargos') as Cargo);
  const members = await listDesbravadores(clubId);
  
  const groups: Record<string, Cargo[]> = {};
  all.forEach(c => {
    if (!groups[c.dedupeKey]) groups[c.dedupeKey] = [];
    groups[c.dedupeKey].push(c);
  });

  const batch = writeBatch(db);
  let migrated = 0;

  for (const key in groups) {
    const list = groups[key];
    if (list.length <= 1) continue;

    // Prioridade: IDs de seed > PADRAO > Mais antigo
    const sorted = list.sort((a, b) => {
      const isASeed = a.id.startsWith('cargo_');
      const isBSeed = b.id.startsWith('cargo_');
      if (isASeed && !isBSeed) return -1;
      if (isBSeed && !isASeed) return 1;
      if (a.origem === 'PADRAO' && b.origem !== 'PADRAO') return -1;
      if (b.origem === 'PADRAO' && a.origem !== 'PADRAO') return 1;
      return 0;
    });

    const primary = sorted[0];
    const duplicates = sorted.slice(1);

    for (const member of members) {
      let changed = false;
      const newCargos = member.cargos?.map(mc => {
        if (duplicates.some(d => d.id === mc.cargoId)) {
          changed = true;
          return { ...mc, cargoId: primary.id };
        }
        return mc;
      }) || [];

      const oldCargoId = member.cargoId;
      let newCargoId = oldCargoId;
      if (oldCargoId && duplicates.some(d => d.id === oldCargoId)) {
        changed = true;
        newCargoId = primary.id;
      }

      if (changed) {
        batch.update(doc(db, 'clubs', clubId, 'desbravadores', member.id), deepCleanUndefined({ 
          cargos: newCargos,
          cargoId: newCargoId 
        }));
        migrated++;
      }
    }

    duplicates.forEach(d => {
      if (!d.id.startsWith('cargo_')) {
        batch.delete(doc(db, 'clubs', clubId, 'cargos', d.id));
      } else {
        batch.update(doc(db, 'clubs', clubId, 'cargos', d.id), { ativo: false });
      }
    });
  }

  await batch.commit();
  return migrated;
};

// --- CLASSES ---
export const listClasses = (clubId: string) => listCol(clubId, 'classes') as Promise<Classe[]>;
export const createClasse = (clubId: string, payload: any) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'classes'));
  return setDoc(docRef, deepCleanUndefined({ ...payload, id: docRef.id, origem: 'CUSTOM', ativo: true, createdAt: serverTimestamp() }));
};
export const deleteClasse = async (clubId: string, id: string) => {
  validateClub(clubId);
  const members = await listDesbravadores(clubId);
  if (members.some(m => m.classeId === id)) {
    await updateDoc(doc(db, 'clubs', clubId, 'classes', id), { ativo: false });
    throw new Error("ESTA_EM_USO|Classe em uso por membros. Foi desativada.");
  }
  await deleteDoc(doc(db, 'clubs', clubId, 'classes', id));
};
export const updateClasse = (clubId: string, id: string, payload: any) => updateDoc(doc(db, 'clubs', clubId, 'classes', id), deepCleanUndefined(payload));

// --- UNIDADES ---
export const listUnidades = (clubId: string) => listCol(clubId, 'unidades') as Promise<Unidade[]>;
export const createUnidade = (clubId: string, payload: any) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'unidades'));
  return setDoc(docRef, deepCleanUndefined({ ...payload, participatesClubao: payload.participatesClubao ?? true, id: docRef.id, origem: 'CUSTOM', ativo: true, createdAt: serverTimestamp() }));
};
export const updateUnidade = (clubId: string, id: string, payload: any) => updateDoc(doc(db, 'clubs', clubId, 'unidades', id), deepCleanUndefined(payload));
export const deleteUnidade = async (clubId: string, id: string) => {
  validateClub(clubId);
  const members = await listDesbravadores(clubId);
  if (members.some(m => m.unidadeId === id)) {
    await updateDoc(doc(db, 'clubs', clubId, 'unidades', id), { ativo: false });
    throw new Error("ESTA_EM_USO|Unidade em uso. Foi desativada.");
  }
  await deleteDoc(doc(db, 'clubs', clubId, 'unidades', id));
};

// --- TIPOS INSTRUTOR ---
export const listTiposInstrutor = (clubId: string) => listCol(clubId, 'tipos_instrutor');
export const createTipoInstrutor = (clubId: string, payload: any) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'tipos_instrutor'));
  return setDoc(docRef, deepCleanUndefined({ ...payload, id: docRef.id, origem: 'CUSTOM', ativo: true, createdAt: serverTimestamp() }));
};
export const updateTipoInstrutor = (clubId: string, id: string, payload: any) => updateDoc(doc(db, 'clubs', clubId, 'tipos_instrutor', id), deepCleanUndefined(payload));
export const deleteTipoInstrutor = async (clubId: string, id: string) => {
  validateClub(clubId);
  const members = await listDesbravadores(clubId);
  const inUse = members.some(m => m.cargos?.some(mc => mc.especialidades?.some(s => s.tipoInstrutorId === id)));
  if (inUse) {
    await updateDoc(doc(db, 'clubs', clubId, 'tipos_instrutor', id), { ativo: false });
    throw new Error("ESTA_EM_USO|Especialidade em uso. Foi desativada.");
  }
  await deleteDoc(doc(db, 'clubs', clubId, 'tipos_instrutor', id));
};

// --- REQUISITOS ---
export const listRequisitos = async (clubId: string, classeId?: string): Promise<Requisito[]> => {
  validateClub(clubId);
  const colRef = collection(db, 'clubs', clubId, 'requisitos');
  let snap;
  if (classeId) {
    const q = query(colRef, where('classeId', '==', classeId));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(colRef);
  }
  const items = snap.docs.map(d => mapColData(d.id, d.data(), 'requisitos') as Requisito);
  return items.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
};
export const createRequisito = (clubId: string, payload: any) => setDoc(doc(collection(db, 'clubs', clubId, 'requisitos')), deepCleanUndefined({ ...payload, origem: 'CUSTOM', ativo: true, createdAt: serverTimestamp() }));
export const updateRequisito = (clubId: string, id: string, payload: any) => updateDoc(doc(db, 'clubs', clubId, 'requisitos', id), deepCleanUndefined(payload));
export const deleteRequisito = (clubId: string, id: string) => deleteDoc(doc(db, 'clubs', clubId, 'requisitos', id));

// --- DESBRAVADORES ---
export const listDesbravadores = async (clubId: string): Promise<Desbravador[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'desbravadores'));
  return snap.docs.map(doc => {
    const data = doc.data();
    const cargos = data.cargos || (data.cargoId ? [{ cargoId: data.cargoId }] : []);
    return { id: doc.id, ...data, cargos } as Desbravador;
  });
};

export const createDesbravador = (clubId: string, payload: any) => {
  validateClub(clubId);
  const cleaned = deepCleanUndefined({ ...payload, createdAt: serverTimestamp() });
  return setDoc(doc(collection(db, 'clubs', clubId, 'desbravadores')), cleaned);
};

export const updateDesbravador = (clubId: string, id: string, payload: any) => {
  validateClub(clubId);
  const cleaned = deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() });
  return updateDoc(doc(db, 'clubs', clubId, 'desbravadores', id), cleaned);
};

export const deleteDesbravador = (clubId: string, id: string) => deleteDoc(doc(db, 'clubs', clubId, 'desbravadores', id));

// --- PROGRESSO ---
export const setProgressoRequisito = (clubId: string, dbvId: string, reqId: string, payload: any) => setDoc(doc(db, 'clubs', clubId, 'desbravadores', dbvId, 'progresso', reqId), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }), { merge: true });
export const listProgressoDesbravador = async (clubId: string, dbvId: string) => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'desbravadores', dbvId, 'progresso'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- SECRETARIA ---
export const listSecretariaStatus = async (clubId: string): Promise<SecretariaStatus[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'secretaria'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SecretariaStatus));
};
export const updateSecretariaStatus = (clubId: string, dbvId: string, payload: any) => setDoc(doc(db, 'clubs', clubId, 'secretaria', dbvId), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }), { merge: true });
export const listDiretoria = async (clubId: string) => listDesbravadores(clubId);

// --- USUÁRIOS ---
export const listUsuarios = async (clubId: string): Promise<Usuario[]> => {
  validateClub(clubId);
  const q = query(collection(db, 'users'), where('clubeId', '==', clubId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Usuario));
};

export const updateUsuario = async (clubId: string, id: string, payload: Partial<Usuario>) => {
  validateClub(clubId);
  const cleaned = deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() });
  await updateDoc(doc(db, 'users', id), cleaned);
};

// --- SEEDS ---
export const ensureDefaultClasses = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_classes');
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  const defaults = [
    { id: 'classe_amigo', nome: 'Amigo', ordem: 1, corHex: '#00B2FF', categoria: 'NORMAL' },
    { id: 'classe_companheiro', nome: 'Companheiro', ordem: 2, corHex: '#FF2D55', categoria: 'NORMAL' },
    { id: 'classe_pesquisador', nome: 'Pesquisador', ordem: 3, corHex: '#00F5A0', categoria: 'NORMAL' },
    { id: 'classe_pioneiro', nome: 'Pioneiro', ordem: 4, corHex: '#9CA3AF', categoria: 'NORMAL' },
    { id: 'classe_excursionista', nome: 'Excursionista', ordem: 5, corHex: '#A855F7', categoria: 'NORMAL' },
    { id: 'classe_guia', nome: 'Guia', ordem: 6, corHex: '#FFD60A', categoria: 'NORMAL' },
    { id: 'classe_lider', nome: 'Líder', ordem: 7, corHex: '#FBBF24', categoria: 'NORMAL' },
    { id: 'classe_agrupadas', nome: 'Agrupadas', ordem: 99, corHex: '#374151', categoria: 'AGRUPADA' },
  ];
  defaults.forEach(c => batch.set(doc(db, 'clubs', clubId, 'classes', c.id), { ...c, ativo: true, origem: 'PADRAO', locked: true }, { merge: true }));
  batch.set(metaRef, { done: true });
  await batch.commit();
};

export const ensureDefaultCargos = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_cargos');
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  const defaults = [
    { id: 'cargo_diretor', nome: 'Diretor(a)', ordem: 1, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_associado', nome: 'Associado(a)', ordem: 2, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_secretaria', nome: 'Secretário(a)', ordem: 3, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_tesoureiro', nome: 'Tesoureiro(a)', ordem: 4, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_anciao', nome: 'Ancião', ordem: 5, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_capelao', nome: 'Capelão', ordem: 6, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_instrutor', nome: 'Instrutor', ordem: 7, tipo: 'INSTRUTOR', locked: true },
    { id: 'cargo_conselheiro', nome: 'Conselheiro(a)', ordem: 8, tipo: 'CONSELHEIRO', locked: true },
    { id: 'cargo_midia', nome: 'Diretor de Mídia', ordem: 9, tipo: 'DIRETORIA', locked: false },
    { id: 'cargo_capitao', nome: 'Capitão/Capitã', ordem: 10, tipo: 'MEMBRO', locked: false },
    { id: 'cargo_desbravador', nome: 'Desbravador', ordem: 11, tipo: 'MEMBRO', locked: false },
  ];
  defaults.forEach(c => batch.set(doc(db, 'clubs', clubId, 'cargos', c.id), { ...c, slug: normalizeSlug(c.nome), dedupeKey: createDedupeKey(c.nome), ativo: true, origem: 'PADRAO' }, { merge: true }));
  batch.set(metaRef, { done: true });
  await batch.commit();
};

export const ensureDefaultUnidades = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_unidades');
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  batch.set(doc(db, 'clubs', clubId, 'unidades', 'unidade_onu'), { id: 'unidade_onu', nome: 'ONU (Diretoria)', tipo: 'DIRETORIA', ordem: 0, ativo: true, origem: 'PADRAO', locked: true, participatesClubao: false }, { merge: true });
  batch.set(metaRef, { done: true });
  await batch.commit();
};

export const ensureDefaultInstructorTypes = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_instrutores');
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  const defaults = [
    { id: 'tipo_instrutor_classe', nome: 'Instrutor de Classe', ordem: 1 },
    { id: 'tipo_instrutor_fanfarra', nome: 'Instrutor de Fanfarra', ordem: 2 },
    { id: 'tipo_instrutor_ordem_unida', nome: 'Instrutor de Ordem Unida', ordem: 3 },
    { id: 'tipo_instrutor_nos', nome: 'Instrutor de Nós e Amarras', ordem: 4 },
  ];
  defaults.forEach(d => batch.set(doc(db, 'clubs', clubId, 'tipos_instrutor', d.id), { ...d, ativo: true, origem: 'PADRAO' }, { merge: true }));
  batch.set(metaRef, { done: true });
  await batch.commit();
};

export const ensureDefaultRequisitos = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_requisitos');
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  DEFAULT_REQUISITOS.forEach(req => batch.set(doc(db, 'clubs', clubId, 'requisitos', req.id), { ...req, origem: 'PADRAO', ativo: true }, { merge: true }));
  batch.set(metaRef, { done: true });
  await batch.commit();
};

// --- FINANCEIRO (CLUBE) ---
const listSimpleCol = async <T>(clubId: string, path: string): Promise<T[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, path));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
};

export const listLancamentosCaixa = (clubId: string): Promise<LancamentoCaixa[]> => listSimpleCol<LancamentoCaixa>(clubId, 'caixa');
export const createLancamentoCaixa = async (clubId: string, payload: Omit<LancamentoCaixa, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'caixa'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as LancamentoCaixa;
};

export const listDespesasClube = (clubId: string): Promise<Despesa[]> => listSimpleCol<Despesa>(clubId, 'despesas');
export const createDespesaClube = async (clubId: string, payload: Omit<Despesa, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'despesas'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as Despesa;
};

export const listDoacoesClube = (clubId: string): Promise<Doacao[]> => listSimpleCol<Doacao>(clubId, 'doacoes');
export const listDoacoesByReferenciaMes = async (clubId: string, refMes: string): Promise<Doacao[]> => {
  validateClub(clubId);
  const q = query(collection(db, 'clubs', clubId, 'doacoes'), where('referenciaMes', '==', refMes));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Doacao));
};
export const createDoacaoClube = async (clubId: string, payload: Omit<Doacao, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'doacoes'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as Doacao;
};

export const listSocios = (clubId: string): Promise<Socio[]> => listSimpleCol<Socio>(clubId, 'socios');
export const createSocio = async (clubId: string, payload: Omit<Socio, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'socios'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as Socio;
};
export const deleteSocio = async (clubId: string, id: string) => {
  validateClub(clubId);
  await deleteDoc(doc(db, 'clubs', clubId, 'socios', id));
};

// --- CAMPORI ---
export const listCamporiCarnes = (clubId: string): Promise<CarneCampori[]> => listSimpleCol<CarneCampori>(clubId, 'campori_carnes');
export const listCamporiParcelas = (clubId: string): Promise<Parcela[]> => listSimpleCol<Parcela>(clubId, 'campori_parcelas');
export const listCamporiDespesas = (clubId: string): Promise<Despesa[]> => listSimpleCol<Despesa>(clubId, 'campori_despesas');
export const listCamporiReceitas = (clubId: string): Promise<ReceitaCampori[]> => listSimpleCol<ReceitaCampori>(clubId, 'campori_receitas');

export const createCamporiCarne = async (clubId: string, payload: Omit<CarneCampori, 'id' | 'clubeId' | 'status'>) => {
  validateClub(clubId);
  const carneRef = doc(collection(db, 'clubs', clubId, 'campori_carnes'));
  const batch = writeBatch(db);
  const carne: CarneCampori = {
    id: carneRef.id,
    clubeId: clubId,
    desbravadorId: payload.desbravadorId,
    titulo: payload.titulo,
    valorTotal: payload.valorTotal,
    qtdParcelas: payload.qtdParcelas,
    dataInicio: payload.dataInicio,
    status: 'EM_ANDAMENTO'
  };
  batch.set(carneRef, deepCleanUndefined({ ...carne, createdAt: serverTimestamp() }));

  const parcelas: Parcela[] = [];
  const baseDate = new Date(payload.dataInicio);
  const valorParcela = payload.valorTotal / payload.qtdParcelas;
  for (let i = 0; i < payload.qtdParcelas; i++) {
    const vencimento = new Date(baseDate);
    vencimento.setMonth(baseDate.getMonth() + i);
    const parcRef = doc(collection(db, 'clubs', clubId, 'campori_parcelas'));
    const parcela: Parcela = {
      id: parcRef.id,
      clubeId: clubId,
      carneId: carneRef.id,
      numeroParcela: i + 1,
      valor: valorParcela,
      vencimento: vencimento.toISOString().split('T')[0],
      pago: false
    };
    parcelas.push(parcela);
    batch.set(parcRef, deepCleanUndefined({ ...parcela, createdAt: serverTimestamp() }));
  }

  await batch.commit();
  return { carne, parcelas };
};

export const updateCamporiParcela = async (clubId: string, id: string, payload: Partial<Parcela>) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'campori_parcelas', id), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }));
};

export const createCamporiDespesa = async (clubId: string, payload: Omit<Despesa, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'campori_despesas'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as Despesa;
};

export const createCamporiReceita = async (clubId: string, payload: Omit<ReceitaCampori, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'campori_receitas'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as ReceitaCampori;
};

// --- CLUBÃO ---
export const listClubaoUnidades = async (clubId: string): Promise<ClubaoUnidadeDoc[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'clubao_unidades'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClubaoUnidadeDoc));
};

export const updateClubaoRequisito = async (
  clubId: string,
  unidadeId: string,
  requisitoId: string,
  payload: any
) => {
  validateClub(clubId);
  const docRef = doc(db, 'clubs', clubId, 'clubao_unidades', unidadeId);
  const cleaned = deepCleanUndefined({
    id: unidadeId,
    unidadeId,
    clubeId: clubId,
    updatedAt: serverTimestamp(),
    resultados: {
      [requisitoId]: {
        requisitoId,
        ...payload,
        updatedAt: serverTimestamp()
      }
    }
  });
  await setDoc(docRef, cleaned, { merge: true });
};
