
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
  where,
  deleteField
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Clube,
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
  ClubaoUnidadeDoc,
  RankingQuarter,
  RankingRequirement,
  RankingProgressEntry,
  RankingUnitProgressDoc,
  EventoCampori,
  EventoCamporiParticipante,
  EventoCamporiSaida,
  CampanhaVenda,
  VendaItem,
  Reuniao,
  ReuniaoPresenca,
  FanfarraInstrumento,
  PagamentoSocio
} from '../types';
import { DEFAULT_REQUISITOS } from '../seed/defaultRequisitos';
import { RANKING_SEED_VERSION, buildDefaultRankingQuarters, buildDefaultRankingRequirements } from '../seed/rankingSeed';
import { baseUnitsSeed } from '../seed/baseUnits';
import { calculateRequirementBreakdown } from './ranking';

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

export const createPublicClubSlug = (text: string): string => {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/gi, ' ')
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');

  return base || 'clube';
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

export const getClub = async (clubId: string): Promise<Clube | null> => {
  validateClub(clubId);
  const snap = await getDoc(doc(db, 'clubs', clubId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Clube;
};

export const ensureClubPublicSlug = async (clubId: string): Promise<string> => {
  const club = await getClub(clubId);
  if (!club) return clubId;

  const slug = club.publicSlug || createPublicClubSlug(club.nome || clubId);
  if (club.publicSlug !== slug) {
    await updateDoc(doc(db, 'clubs', clubId), deepCleanUndefined({
      publicSlug: slug,
      updatedAt: serverTimestamp()
    }));
  }

  return slug;
};

export const findClubByPublicSlug = async (publicSlug: string): Promise<Clube | null> => {
  const slug = publicSlug.trim().toLowerCase();
  if (!slug) return null;

  const snap = await getDocs(query(collection(db, 'clubs'), where('publicSlug', '==', slug)));
  if (snap.empty) return null;

  const first = snap.docs[0];
  return { id: first.id, ...first.data() } as Clube;
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
export const listClasses = async (clubId: string): Promise<Classe[]> => {
  const items = await listCol(clubId, 'classes') as Classe[];
  return items.map(c => {
    // Corrige a cor da classe líder para clubes antigos (retrocompatibilidade)
    if (c.id === 'classe_lider' && (c.corHex === '#FBBF24' || c.corHex === '#FFD60A')) {
      return { ...c, corHex: 'linear-gradient(135deg, #111827 50%, #FFD60A 50%)' };
    }
    return c;
  });
};
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
export const listUnidades = async (clubId: string): Promise<Unidade[]> => {
  const unidades = await listCol(clubId, 'unidades') as Unidade[];

  return unidades.map(u => {
    const legacyImage =
      (u as any).fotoUrl ||
      (u as any).imagemUrl ||
      (u as any).foto ||
      (u as any).image ||
      (u as any).logoUrl;

    const normalizedSlug = normalizeSlug(u.nome || u.id || '');
    const localAsset = normalizedSlug ? `/unidades/${normalizedSlug}.png` : undefined;

    return {
      ...u,
      // Prioridade: campo novo → legados → asset local na pasta public/unidades (mesmo nome da unidade em slug)
      imageUrl: u.imageUrl || legacyImage || localAsset || undefined
    };
  });
};
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

const MAX_BATCH_WRITES = 450;
const commitBatchOperations = async (operations: Array<(batch: ReturnType<typeof writeBatch>) => void>) => {
  for (let idx = 0; idx < operations.length; idx += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    operations.slice(idx, idx + MAX_BATCH_WRITES).forEach(run => run(batch));
    await batch.commit();
  }
};

export const deleteDesbravador = async (clubId: string, id: string) => {
  validateClub(clubId);

  const [
    presencasSnap,
    fanfarraSnap,
    progressoSnap,
    sociosPorDesbravadorSnap,
    sociosPorIndicacaoSnap,
    vendaItemsSnap,
    carnesSnap,
    eventosSnap
  ] = await Promise.all([
    getDocs(query(collection(db, 'clubs', clubId, 'reunioes_presencas'), where('desbravadorId', '==', id))),
    getDocs(query(collection(db, 'clubs', clubId, 'fanfarra_instrumentos'), where('desbravadorId', '==', id))),
    getDocs(collection(db, 'clubs', clubId, 'desbravadores', id, 'progresso')),
    getDocs(query(collection(db, 'clubs', clubId, 'socios'), where('desbravadorId', '==', id))),
    getDocs(query(collection(db, 'clubs', clubId, 'socios'), where('indicadoPorMembroId', '==', id))),
    getDocs(query(collection(db, 'clubs', clubId, 'venda_items'), where('vendidoPorMembroId', '==', id))),
    getDocs(query(collection(db, 'clubs', clubId, 'campori_carnes'), where('desbravadorId', '==', id))),
    getDocs(collection(db, 'clubs', clubId, 'campori_eventos'))
  ]);

  const carneIds = new Set(carnesSnap.docs.map(snap => snap.id));
  const parcelasSnap =
    carneIds.size > 0
      ? await getDocs(collection(db, 'clubs', clubId, 'campori_parcelas'))
      : null;

  const eventosComParticipante: Array<{ ref: any; participantes: EventoCamporiParticipante[] }> = [];
  const participanteIdsRemovidos = new Set<string>([id]);

  eventosSnap.docs.forEach(eventoSnap => {
    const eventoData = eventoSnap.data() as EventoCampori;
    const participantes = Array.isArray(eventoData.participantes)
      ? (eventoData.participantes as EventoCamporiParticipante[])
      : [];

    const participantesAtualizados = participantes.filter(participante => {
      const participanteId = String(participante.id || '');
      const vinculadoAoMembro = participante.desbravadorId === id || participanteId === id;

      if (vinculadoAoMembro) {
        participanteIdsRemovidos.add(participanteId || id);
      }

      return !vinculadoAoMembro;
    });

    if (participantesAtualizados.length !== participantes.length) {
      eventosComParticipante.push({
        ref: eventoSnap.ref,
        participantes: participantesAtualizados
      });
    }
  });

  const caixaRefs = new Map<string, any>();
  const participanteIds = Array.from(participanteIdsRemovidos).filter(Boolean);
  if (participanteIds.length > 0) {
    const caixaSnaps = await Promise.all(
      participanteIds.map(participanteId =>
        getDocs(query(collection(db, 'clubs', clubId, 'caixa'), where('participanteEventoId', '==', participanteId)))
      )
    );

    caixaSnaps.forEach(snap => {
      snap.docs.forEach(docSnap => caixaRefs.set(docSnap.id, docSnap.ref));
    });
  }

  const sociosParaLimpar = new Map<string, { ref: any; limparDesbravadorId: boolean; limparIndicacao: boolean }>();
  sociosPorDesbravadorSnap.docs.forEach(docSnap => {
    sociosParaLimpar.set(docSnap.id, { ref: docSnap.ref, limparDesbravadorId: true, limparIndicacao: false });
  });
  sociosPorIndicacaoSnap.docs.forEach(docSnap => {
    const atual = sociosParaLimpar.get(docSnap.id);
    if (atual) {
      sociosParaLimpar.set(docSnap.id, { ...atual, limparIndicacao: true });
      return;
    }
    sociosParaLimpar.set(docSnap.id, { ref: docSnap.ref, limparDesbravadorId: false, limparIndicacao: true });
  });

  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  progressoSnap.docs.forEach(docSnap => {
    operations.push(batch => batch.delete(docSnap.ref));
  });

  operations.push(batch => batch.delete(doc(db, 'clubs', clubId, 'secretaria', id)));

  presencasSnap.docs.forEach(docSnap => {
    operations.push(batch => batch.delete(docSnap.ref));
  });

  fanfarraSnap.docs.forEach(docSnap => {
    operations.push(batch =>
      batch.update(docSnap.ref, {
        desbravadorId: '',
        updatedAt: serverTimestamp()
      })
    );
  });

  sociosParaLimpar.forEach(socio => {
    const updatePayload: Record<string, any> = { updatedAt: serverTimestamp() };
    if (socio.limparDesbravadorId) updatePayload.desbravadorId = deleteField();
    if (socio.limparIndicacao) updatePayload.indicadoPorMembroId = deleteField();

    operations.push(batch => batch.update(socio.ref, updatePayload));
  });

  vendaItemsSnap.docs.forEach(docSnap => {
    operations.push(batch =>
      batch.update(docSnap.ref, {
        vendidoPorMembroId: deleteField(),
        updatedAt: serverTimestamp()
      })
    );
  });

  carnesSnap.docs.forEach(docSnap => {
    operations.push(batch => batch.delete(docSnap.ref));
  });

  if (parcelasSnap) {
    parcelasSnap.docs.forEach(docSnap => {
      const data = docSnap.data() as Parcela;
      if (!carneIds.has(data.carneId)) return;
      operations.push(batch => batch.delete(docSnap.ref));
    });
  }

  eventosComParticipante.forEach(evento => {
    operations.push(batch =>
      batch.update(evento.ref, {
        participantes: evento.participantes,
        updatedAt: serverTimestamp()
      })
    );
  });

  caixaRefs.forEach(ref => {
    operations.push(batch =>
      batch.update(ref, {
        participanteEventoId: deleteField(),
        updatedAt: serverTimestamp()
      })
    );
  });

  operations.push(batch => batch.delete(doc(db, 'clubs', clubId, 'desbravadores', id)));

  await commitBatchOperations(operations);
};

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
    { id: 'classe_lider', nome: 'Líder', ordem: 7, corHex: 'linear-gradient(135deg, #111827 50%, #FFD60A 50%)', categoria: 'NORMAL' },
    { id: 'classe_lider_master', nome: 'Líder Master', ordem: 8, corHex: '#F97316', categoria: 'NORMAL' },
    { id: 'classe_agrupadas', nome: 'Agrupadas', ordem: 99, corHex: '#374151', categoria: 'AGRUPADA' },
  ];
  defaults.forEach(c => batch.set(doc(db, 'clubs', clubId, 'classes', c.id), { ...c, ativo: true, origem: 'PADRAO', locked: true }, { merge: true }));
  batch.set(metaRef, { done: true });
  await batch.commit();
};

export const ensureDefaultClassesV2 = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_classes_v2');
  if ((await getDoc(metaRef)).exists()) return;
  const batch = writeBatch(db);
  batch.set(
    doc(db, 'clubs', clubId, 'classes', 'classe_lider_master'),
    { id: 'classe_lider_master', nome: 'Líder Master', ordem: 8, corHex: '#F97316', categoria: 'NORMAL', ativo: true, origem: 'PADRAO', locked: true },
    { merge: true }
  );
  batch.set(metaRef, { done: true });
  await batch.commit();
};

export const ensureDefaultCargos = async (clubId: string) => {
  validateClub(clubId);
  const defaults = [
    { id: 'cargo_diretor', nome: 'Diretor do Clube', ordem: 1, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_associado', nome: 'Dir. Associado', ordem: 2, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_associada', nome: 'Dir. Associada', ordem: 3, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_secretaria', nome: 'Secretário(a)', ordem: 4, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_tesoureiro', nome: 'Tesoureiro(a)', ordem: 5, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_anciao', nome: 'Ancião', ordem: 6, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_capelao', nome: 'Capelão(a)', ordem: 7, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_instrutor', nome: 'Instrutor', ordem: 8, tipo: 'INSTRUTOR', locked: true },
    { id: 'cargo_conselheiro', nome: 'Conselheiro(a)', ordem: 9, tipo: 'CONSELHEIRO', locked: true },
    { id: 'cargo_almoxarifado_clube', nome: 'Almoxarifado', ordem: 10, tipo: 'DIRETORIA', locked: true },
    { id: 'cargo_midia', nome: 'Diretor de Mídia', ordem: 11, tipo: 'DIRETORIA', locked: false },
    { id: 'cargo_capitao', nome: 'Capitão/Capitã', ordem: 12, tipo: 'MEMBRO', locked: false },
    { id: 'cargo_secretario_unidade', nome: 'Secretário(a)', ordem: 13, tipo: 'MEMBRO', locked: false },
    { id: 'cargo_tesoureiro_unidade', nome: 'Tesoureiro(a)', ordem: 14, tipo: 'MEMBRO', locked: false },
    { id: 'cargo_capelao_unidade', nome: 'Capelão', ordem: 15, tipo: 'MEMBRO', locked: false },
    { id: 'cargo_almoxarife', nome: 'Almoxarifado', ordem: 16, tipo: 'MEMBRO', locked: false },
    { id: 'cargo_desbravador', nome: 'Desbravador', ordem: 17, tipo: 'MEMBRO', locked: false },
  ];

  const snap = await getDocs(collection(db, 'clubs', clubId, 'cargos'));
  const currentIds = snap.docs.map(d => d.id);
  const batch = writeBatch(db);

  // Forçar as nomenclaturas oficiais dos padrões caso já existam (sem sobrescrever a propriedade "ativo" que o usuário configurou)
  defaults.filter(d => currentIds.includes(d.id)).forEach(c => {
    batch.set(doc(db, 'clubs', clubId, 'cargos', c.id), { ...c, slug: normalizeSlug(c.nome), dedupeKey: createDedupeKey(c.nome), origem: 'PADRAO' }, { merge: true });
  });

  // Novos padrões ausentes
  const toAdd = defaults.filter(d => !currentIds.includes(d.id));
  toAdd.forEach(c => {
    batch.set(doc(db, 'clubs', clubId, 'cargos', c.id), { ...c, slug: normalizeSlug(c.nome), dedupeKey: createDedupeKey(c.nome), ativo: true, origem: 'PADRAO' }, { merge: true });
  });

  if (toAdd.length > 0 || currentIds.length > 0) {
    await batch.commit();
  }
};

export const ensureDefaultUnidades = async (clubId: string) => {
  validateClub(clubId);
  const metaRef = doc(db, 'clubs', clubId, 'meta', 'seed_unidades');
  const batch = writeBatch(db);
  baseUnitsSeed.forEach(unit => {
    batch.set(
      doc(db, 'clubs', clubId, 'unidades', unit.id),
      { ...unit, clubeId: clubId, origem: 'PADRAO' },
      { merge: true }
    );
  });
  batch.set(metaRef, { done: true, syncedAt: serverTimestamp(), version: 2 }, { merge: true });
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
export const updateSocio = async (clubId: string, id: string, payload: Partial<Omit<Socio, 'id' | 'clubeId'>>) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'socios', id), deepCleanUndefined(payload));
};

// --- PAGAMENTOS SOCIOS ---
export const listPagamentosSocios = (clubId: string): Promise<PagamentoSocio[]> =>
  listSimpleCol<PagamentoSocio>(clubId, 'pagamentos_socios');

export const createPagamentoSocio = async (
  clubId: string,
  payload: Omit<PagamentoSocio, 'id' | 'clubeId'>
): Promise<PagamentoSocio> => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'pagamentos_socios'));
  const novo: PagamentoSocio = { id: docRef.id, clubeId: clubId, ...payload };
  await setDoc(docRef, deepCleanUndefined({ ...novo, criadoEm: serverTimestamp() }));
  return novo;
};

export const deletePagamentoSocio = async (clubId: string, id: string): Promise<void> => {
  validateClub(clubId);
  await deleteDoc(doc(db, 'clubs', clubId, 'pagamentos_socios', id));
};

export const updatePagamentoSocio = async (
  clubId: string,
  id: string,
  payload: Partial<Pick<PagamentoSocio, 'dataPagamento' | 'valorPago' | 'observacao'>>
): Promise<void> => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'pagamentos_socios', id), deepCleanUndefined(payload));
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

export const syncLegacyClubaoToRanking = async (
  clubId: string,
  quarterId: string,
  requirements: RankingRequirement[]
) => {
  validateClub(clubId);
  if (!quarterId || requirements.length === 0) return;

  const [legacyDocsSnap, rankingSnap] = await Promise.all([
    getDocs(collection(db, 'clubs', clubId, 'clubao_unidades')),
    getDocs(query(collection(db, 'clubs', clubId, 'ranking_progress'), where('quarterId', '==', quarterId)))
  ]);

  if (legacyDocsSnap.empty) return;

  const rankingByUnit = new Map(
    rankingSnap.docs.map(docSnap => [docSnap.data().unitId as string, { id: docSnap.id, ...docSnap.data() } as RankingUnitProgressDoc])
  );

  for (const legacySnap of legacyDocsSnap.docs) {
    const legacy = { id: legacySnap.id, ...legacySnap.data() } as ClubaoUnidadeDoc;
    const legacyResults = legacy.resultados || {};
    const existingDoc = rankingByUnit.get(legacy.unidadeId);
    const merged: Record<string, RankingProgressEntry> = { ...(existingDoc?.resultados || {}) };
    let changed = false;

    requirements.forEach(requirement => {
      const legacyEntry = legacyResults[requirement.id];
      if (!legacyEntry || merged[requirement.id]) return;

      const draft: RankingProgressEntry = {
        requirementId: requirement.id,
        completed: !!legacyEntry.feito,
        quantity: legacyEntry.quantidade ?? (requirement.requiresQuantity ? 0 : undefined),
        bonusInput: legacyEntry.bonusManual ?? 0,
        penaltyInput: legacyEntry.penalidadeManual ?? 0,
        manualScore: 0,
        notes: legacyEntry.observacao || '',
        basePoints: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        calculatedPoints: 0,
        updatedBy: legacyEntry.updatedBy,
        updatedAt: legacyEntry.updatedAt
      };

      const breakdown = calculateRequirementBreakdown(requirement, draft);
      merged[requirement.id] = {
        ...draft,
        basePoints: breakdown.basePoints,
        bonusPoints: breakdown.bonusPoints,
        penaltyPoints: breakdown.penaltyPoints,
        calculatedPoints: breakdown.calculatedPoints
      };
      changed = true;
    });

    if (!changed) continue;

    const docId = existingDoc?.id || `${quarterId}__${legacy.unidadeId}`;
    const totalPoints = Object.values(merged).reduce((sum, current) => sum + Number(current.calculatedPoints || 0), 0);

    await setDoc(doc(db, 'clubs', clubId, 'ranking_progress', docId), deepCleanUndefined({
      id: docId,
      quarterId,
      unitId: legacy.unidadeId,
      clubeId: clubId,
      totalPoints,
      resultados: merged,
      firstSavedAt: existingDoc?.firstSavedAt || existingDoc?.updatedAt || legacy.updatedAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    }), { merge: true });
  }
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

// --- RANKING TRIMESTRAL ---
export const listRankingQuarters = async (clubId: string): Promise<RankingQuarter[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'ranking_quarters'));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as RankingQuarter));
  return items.sort((a, b) => a.ordem - b.ordem);
};

export const updateRankingQuarterStatus = async (
  clubId: string,
  quarterId: string,
  status: RankingQuarter['status']
) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'ranking_quarters', quarterId), deepCleanUndefined({
    status,
    updatedAt: serverTimestamp()
  }));
};

export const updateRankingQuarterPublicMode = async (
  clubId: string,
  quarterId: string,
  publicMode: 'FULL' | 'RESTRICTED'
) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'ranking_quarters', quarterId), {
    publicMode,
    updatedAt: serverTimestamp()
  });
};

export const listRankingRequirements = async (clubId: string, quarterId?: string): Promise<RankingRequirement[]> => {
  validateClub(clubId);
  const colRef = collection(db, 'clubs', clubId, 'ranking_requirements');
  const snap = quarterId
    ? await getDocs(query(colRef, where('quarterId', '==', quarterId)))
    : await getDocs(colRef);
  const items = snap.docs.map(d => ({ id: d.id, active: true, ...d.data() } as RankingRequirement));
  return items.sort((a, b) => a.displayOrder - b.displayOrder);
};

export const createRankingRequirement = async (
  clubId: string,
  payload: Omit<RankingRequirement, 'id' | 'origem' | 'active'>
) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'ranking_requirements'));
  const cleaned = deepCleanUndefined({
    ...payload,
    id: docRef.id,
    active: true,
    origem: 'CUSTOM',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await setDoc(docRef, cleaned);
  return { id: docRef.id, ...cleaned } as RankingRequirement;
};

export const updateRankingRequirement = async (
  clubId: string,
  requirementId: string,
  payload: Partial<RankingRequirement>
) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'ranking_requirements', requirementId), deepCleanUndefined({
    ...payload,
    updatedAt: serverTimestamp()
  }));
};

export const deactivateRankingRequirement = async (
  clubId: string,
  requirementId: string
) => {
  return updateRankingRequirement(clubId, requirementId, { active: false });
};

export const listRankingProgress = async (clubId: string, quarterId: string): Promise<RankingUnitProgressDoc[]> => {
  validateClub(clubId);
  const snap = await getDocs(query(collection(db, 'clubs', clubId, 'ranking_progress'), where('quarterId', '==', quarterId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RankingUnitProgressDoc));
};

export const saveRankingUnitProgress = async (
  clubId: string,
  quarterId: string,
  unitId: string,
  resultados: Record<string, RankingProgressEntry>,
  updatedBy?: { id: string; nome: string; email?: string; }
) => {
  validateClub(clubId);
  const docId = `${quarterId}__${unitId}`;
  const progressRef = doc(db, 'clubs', clubId, 'ranking_progress', docId);
  const existingSnap = await getDoc(progressRef);
  const cleanedResults = Object.entries(resultados).reduce<Record<string, RankingProgressEntry>>((acc, [requirementId, value]) => {
    acc[requirementId] = deepCleanUndefined({
      requirementId,
      completed: !!value.completed,
      quantity: value.quantity ?? null,
      bonusInput: value.bonusInput ?? 0,
      penaltyInput: value.penaltyInput ?? 0,
      manualScore: value.manualScore ?? 0,
      notes: value.notes || null,
      basePoints: value.basePoints ?? 0,
      bonusPoints: value.bonusPoints ?? 0,
      penaltyPoints: value.penaltyPoints ?? 0,
      calculatedPoints: value.calculatedPoints ?? 0,
      validacaoMeta: value.validacaoMeta ?? null,
      updatedBy,
      updatedAt: serverTimestamp()
    });
    return acc;
  }, {});

  const totalPoints = Object.values(resultados).reduce((sum, current) => sum + Number(current.calculatedPoints || 0), 0);

  await setDoc(progressRef, deepCleanUndefined({
    id: docId,
    quarterId,
    unitId,
    clubeId: clubId,
    totalPoints,
    resultados: cleanedResults,
    firstSavedAt: existingSnap.exists() ? existingSnap.data().firstSavedAt || existingSnap.data().updatedAt || serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp()
  }), { merge: true });
};

// --- VALIDAÇÕES (rascunho separado do ranking) ---
import { ValidacaoResultadoEntry, ValidacaoUnitDoc } from '../types';

export const listValidacaoResults = async (clubId: string, quarterId: string): Promise<ValidacaoUnitDoc[]> => {
  validateClub(clubId);
  const snap = await getDocs(query(collection(db, 'clubs', clubId, 'validacoes_resultados'), where('quarterId', '==', quarterId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ValidacaoUnitDoc));
};

export const saveValidacaoResult = async (
  clubId: string,
  quarterId: string,
  unitId: string,
  resultados: Record<string, ValidacaoResultadoEntry>,
  updatedBy?: { id: string; nome: string; email?: string }
) => {
  validateClub(clubId);
  const docId = `${quarterId}__${unitId}`;
  const ref = doc(db, 'clubs', clubId, 'validacoes_resultados', docId);
  await setDoc(ref, deepCleanUndefined({
    id: docId,
    quarterId,
    unitId,
    clubeId: clubId,
    resultados,
    updatedBy,
    updatedAt: serverTimestamp(),
  }), { merge: true });
};

export const ensureDefaultRanking = async (clubId: string) => {
  validateClub(clubId);
  const year = new Date().getFullYear();
  const metaRef = doc(db, 'clubs', clubId, 'meta', `seed_ranking_${year}`);
  const metaSnap = await getDoc(metaRef);
  const metaData = metaSnap.exists() ? metaSnap.data() as { version?: number } : null;
  if (metaData?.version === RANKING_SEED_VERSION) return;

  const batch = writeBatch(db);
  const quarters = buildDefaultRankingQuarters(year);
  const requirements = buildDefaultRankingRequirements(year);

  quarters.forEach(quarter => {
    batch.set(doc(db, 'clubs', clubId, 'ranking_quarters', quarter.id), quarter, { merge: true });
  });

  requirements.forEach(requirement => {
    batch.set(doc(db, 'clubs', clubId, 'ranking_requirements', requirement.id), requirement, { merge: true });
  });

  batch.set(metaRef, deepCleanUndefined({
    done: true,
    year,
    version: RANKING_SEED_VERSION,
    createdAt: metaSnap.exists() ? metaSnap.data().createdAt || serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp()
  }), { merge: true });
  await batch.commit();
};

// --- EVENTO CAMPORI ---
export const listEventosCampori = (clubId: string): Promise<EventoCampori[]> => listSimpleCol<EventoCampori>(clubId, 'campori_eventos');
export const createEventoCampori = async (clubId: string, payload: Omit<EventoCampori, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'campori_eventos'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as EventoCampori;
};
export const updateEventoCampori = async (clubId: string, id: string, payload: Partial<EventoCampori>) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'campori_eventos', id), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }));
};
export const deleteEventoCampori = async (clubId: string, id: string) => {
  validateClub(clubId);
  await deleteDoc(doc(db, 'clubs', clubId, 'campori_eventos', id));
};

export const registrarPagamentoEventoCampori = async (
  clubId: string,
  eventoId: string,
  participanteId: string,
  options?: {
    aplicarCondicaoPagamento?: boolean;
    valorCondicaoPagamento?: number;
    dataPagamento?: string;
  }
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const participantes = (evento.participantes || []) as EventoCamporiParticipante[];
  const participante = participantes.find(item => item.id === participanteId);
  if (!participante) {
    throw new Error('Participante não encontrado no evento.');
  }
  if (participante.naoVaiEvento) {
    throw new Error('Participante marcado como "não vai ao evento".');
  }
  if (participante.pago) return;

  const condicaoPagamentoAtiva = Boolean(evento.condicaoPagamentoAtiva);
  const aplicarCondicaoPagamento = Boolean(options?.aplicarCondicaoPagamento) && condicaoPagamentoAtiva;
  const valorBase = Number(participante.valor ?? evento.valorPadrao ?? 0);
  const valorCondicao = Number(evento.condicaoPagamentoValor ?? options?.valorCondicaoPagamento ?? 0);
  const valorPagamento = aplicarCondicaoPagamento && valorCondicao > 0 ? valorCondicao : valorBase;
  const dataPagamento = options?.dataPagamento || new Date().toISOString();
  const caixaRef = doc(collection(db, 'clubs', clubId, 'caixa'));
  const lancamentoCaixaId = caixaRef.id;

  const participantesAtualizados = participantes.map(item => {
    if (item.id !== participanteId) return item;
    return {
      ...item,
      valor: valorPagamento,
      pago: true,
      dataPagamento,
      lancamentoCaixaId,
      condicaoPagamentoAplicada: aplicarCondicaoPagamento || undefined
    };
  });

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    participantes: participantesAtualizados,
    updatedAt: serverTimestamp()
  }));
  batch.set(caixaRef, deepCleanUndefined({
    id: lancamentoCaixaId,
    clubeId: clubId,
    tipo: 'ENTRADA',
    descricao: `Pagamento do evento ${evento.nome} - ${participante.nome}${
      aplicarCondicaoPagamento ? ` (${evento.condicaoPagamentoDescricao || 'condição especial'})` : ''
    }`,
    categoria: 'EVENTO',
    valor: valorPagamento,
    data: dataPagamento,
    eventoCamporiId: eventoId,
    participanteEventoId: participanteId,
    createdAt: serverTimestamp()
  }));

  await batch.commit();
};

export const atualizarDataPagamentoEventoCampori = async (
  clubId: string,
  eventoId: string,
  participanteId: string,
  dataPagamento: string
) => {
  return atualizarPagamentoEventoCampori(clubId, eventoId, participanteId, { dataPagamento });
};

export const atualizarPagamentoEventoCampori = async (
  clubId: string,
  eventoId: string,
  participanteId: string,
  payload: {
    valor?: number;
    dataPagamento?: string;
    condicaoPagamentoAplicada?: boolean;
  }
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const participantes = (evento.participantes || []) as EventoCamporiParticipante[];
  const participante = participantes.find(item => item.id === participanteId);
  if (!participante) {
    throw new Error('Participante não encontrado no evento.');
  }
  if (participante.naoVaiEvento) {
    throw new Error('Participante marcado como "não vai ao evento".');
  }
  if (!participante.pago) {
    throw new Error('Participante ainda não está com pagamento confirmado.');
  }

  const valorAtualizado = Number(payload.valor ?? participante.valor ?? evento.valorPadrao ?? 0);
  const dataPagamentoAtualizada = payload.dataPagamento || participante.dataPagamento || new Date().toISOString();
  const condicaoAplicadaAtualizada = payload.condicaoPagamentoAplicada ?? !!participante.condicaoPagamentoAplicada;

  const participantesAtualizados = participantes.map(item => {
    if (item.id !== participanteId) return item;
    return {
      ...item,
      valor: valorAtualizado,
      dataPagamento: dataPagamentoAtualizada,
      condicaoPagamentoAplicada: condicaoAplicadaAtualizada || undefined
    };
  });

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    participantes: participantesAtualizados,
    updatedAt: serverTimestamp()
  }));

  if (participante.lancamentoCaixaId) {
    batch.update(doc(db, 'clubs', clubId, 'caixa', participante.lancamentoCaixaId), deepCleanUndefined({
      valor: valorAtualizado,
      data: dataPagamentoAtualizada,
      descricao: `Pagamento do evento ${evento.nome} - ${participante.nome}${
        condicaoAplicadaAtualizada ? ` (${evento.condicaoPagamentoDescricao || 'condição especial'})` : ''
      }`,
      updatedAt: serverTimestamp()
    }));
  }

  await batch.commit();
};

export const retirarPagamentoEventoCampori = async (
  clubId: string,
  eventoId: string,
  participanteId: string
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const participantes = (evento.participantes || []) as EventoCamporiParticipante[];
  const participante = participantes.find(item => item.id === participanteId);
  if (!participante) {
    throw new Error('Participante não encontrado no evento.');
  }
  if (!participante.pago) return;

  const participantesAtualizados = participantes.map(item => {
    if (item.id !== participanteId) return item;
    return deepCleanUndefined({
      ...item,
      pago: false,
      dataPagamento: undefined,
      lancamentoCaixaId: undefined,
      condicaoPagamentoAplicada: undefined
    });
  });

  const caixaEventoSnap = await getDocs(
    query(collection(db, 'clubs', clubId, 'caixa'), where('eventoCamporiId', '==', eventoId))
  );

  const caixaRefsToDelete = new Map<string, any>();
  if (participante.lancamentoCaixaId) {
    const ref = doc(db, 'clubs', clubId, 'caixa', participante.lancamentoCaixaId);
    caixaRefsToDelete.set(ref.id, ref);
  }

  caixaEventoSnap.docs.forEach(docSnap => {
    const data = docSnap.data() as LancamentoCaixa;
    if (data.participanteEventoId !== participanteId) return;
    caixaRefsToDelete.set(docSnap.id, docSnap.ref);
  });

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    participantes: participantesAtualizados,
    updatedAt: serverTimestamp()
  }));

  caixaRefsToDelete.forEach(ref => {
    batch.delete(ref);
  });

  await batch.commit();
};

export const atualizarParticipacaoEventoCampori = async (
  clubId: string,
  eventoId: string,
  participanteId: string,
  naoVaiEvento: boolean
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const participantes = (evento.participantes || []) as EventoCamporiParticipante[];
  const participante = participantes.find(item => item.id === participanteId);
  if (!participante) {
    throw new Error('Participante não encontrado no evento.');
  }

  const participantesAtualizados = participantes.map(item => {
    if (item.id !== participanteId) return item;
    if (!naoVaiEvento) {
      return {
        ...item,
        naoVaiEvento: false
      };
    }

    return deepCleanUndefined({
      ...item,
      naoVaiEvento: true,
      pago: false,
      dataPagamento: undefined,
      lancamentoCaixaId: undefined,
      condicaoPagamentoAplicada: undefined,
      autorizacaoSaidaStatus: undefined
    });
  });

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    participantes: participantesAtualizados,
    updatedAt: serverTimestamp()
  }));

  if (naoVaiEvento && participante.pago) {
    const caixaEventoSnap = await getDocs(
      query(collection(db, 'clubs', clubId, 'caixa'), where('eventoCamporiId', '==', eventoId))
    );

    const caixaRefsToDelete = new Map<string, any>();
    if (participante.lancamentoCaixaId) {
      const ref = doc(db, 'clubs', clubId, 'caixa', participante.lancamentoCaixaId);
      caixaRefsToDelete.set(ref.id, ref);
    }

    caixaEventoSnap.docs.forEach(docSnap => {
      const data = docSnap.data() as LancamentoCaixa;
      if (data.participanteEventoId !== participanteId) return;
      caixaRefsToDelete.set(docSnap.id, docSnap.ref);
    });

    caixaRefsToDelete.forEach(ref => {
      batch.delete(ref);
    });
  }

  await batch.commit();
};

export const atualizarAutorizacaoSaidaEventoCampori = async (
  clubId: string,
  eventoId: string,
  participanteId: string,
  status?: EventoCamporiParticipante['autorizacaoSaidaStatus']
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const participantes = (evento.participantes || []) as EventoCamporiParticipante[];
  const participante = participantes.find(item => item.id === participanteId);
  if (!participante) {
    throw new Error('Participante não encontrado no evento.');
  }
  if (participante.naoVaiEvento) {
    throw new Error('Participante marcado como "não vai ao evento".');
  }

  const participantesAtualizados = participantes.map(item => {
    if (item.id !== participanteId) return item;
    return deepCleanUndefined({
      ...item,
      autorizacaoSaidaStatus: status
    });
  });

  await updateDoc(eventoRef, deepCleanUndefined({
    participantes: participantesAtualizados,
    updatedAt: serverTimestamp()
  }));
};

export const adicionarSaidaEventoCampori = async (
  clubId: string,
  eventoId: string,
  payload: Omit<EventoCamporiSaida, 'id' | 'lancamentoCaixaId'>
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const saidasAtuais = (evento.saidas || []) as EventoCamporiSaida[];
  const saidaId = doc(collection(db, 'clubs', clubId, 'caixa')).id;
  const caixaRef = doc(collection(db, 'clubs', clubId, 'caixa'));
  const dataSaida = payload.data || new Date().toISOString();
  const novaSaida: EventoCamporiSaida = {
    id: saidaId,
    descricao: payload.descricao,
    valor: Number(payload.valor || 0),
    data: dataSaida,
    metodoPagamento: payload.metodoPagamento || 'DINHEIRO',
    lancamentoCaixaId: caixaRef.id
  };

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    saidas: [...saidasAtuais, novaSaida],
    updatedAt: serverTimestamp()
  }));
  batch.set(caixaRef, deepCleanUndefined({
    id: caixaRef.id,
    clubeId: clubId,
    tipo: 'SAIDA',
    descricao: `Saída do evento ${evento.nome} - ${payload.descricao} (${payload.metodoPagamento || 'DINHEIRO'})`,
    categoria: 'EVENTO',
    valor: Number(payload.valor || 0),
    data: dataSaida,
    eventoCamporiId: eventoId,
    saidaEventoId: novaSaida.id,
    createdAt: serverTimestamp()
  }));

  await batch.commit();
};

export const atualizarSaidaEventoCampori = async (
  clubId: string,
  eventoId: string,
  saidaId: string,
  payload: {
    descricao: string;
    valor: number;
    data: string;
    metodoPagamento?: EventoCamporiSaida['metodoPagamento'];
  }
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const saidasAtuais = (evento.saidas || []) as EventoCamporiSaida[];
  const saidaAtual = saidasAtuais.find(item => item.id === saidaId);
  if (!saidaAtual) {
    throw new Error('Despesa não encontrada no evento.');
  }

  const metodoPagamento = payload.metodoPagamento || 'DINHEIRO';
  const saidasAtualizadas = saidasAtuais.map(item =>
    item.id === saidaId
      ? {
          ...item,
          descricao: payload.descricao,
          valor: Number(payload.valor || 0),
          data: payload.data || item.data,
          metodoPagamento
        }
      : item
  );

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    saidas: saidasAtualizadas,
    updatedAt: serverTimestamp()
  }));

  if (saidaAtual.lancamentoCaixaId) {
    batch.update(doc(db, 'clubs', clubId, 'caixa', saidaAtual.lancamentoCaixaId), deepCleanUndefined({
      descricao: `Saída do evento ${evento.nome} - ${payload.descricao} (${metodoPagamento})`,
      valor: Number(payload.valor || 0),
      data: payload.data || saidaAtual.data,
      updatedAt: serverTimestamp()
    }));
  }

  await batch.commit();
};

export const removerSaidaEventoCampori = async (
  clubId: string,
  eventoId: string,
  saidaId: string
) => {
  validateClub(clubId);
  const eventoRef = doc(db, 'clubs', clubId, 'campori_eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists()) {
    throw new Error('Evento não encontrado.');
  }

  const evento = eventoSnap.data() as EventoCampori;
  const saidasAtuais = (evento.saidas || []) as EventoCamporiSaida[];
  const saidaAtual = saidasAtuais.find(item => item.id === saidaId);
  if (!saidaAtual) return;

  const saidasAtualizadas = saidasAtuais.filter(item => item.id !== saidaId);

  const caixaEventoSnap = await getDocs(
    query(collection(db, 'clubs', clubId, 'caixa'), where('eventoCamporiId', '==', eventoId))
  );

  const caixaRefsToDelete = new Map<string, any>();
  if (saidaAtual.lancamentoCaixaId) {
    const ref = doc(db, 'clubs', clubId, 'caixa', saidaAtual.lancamentoCaixaId);
    caixaRefsToDelete.set(ref.id, ref);
  }

  caixaEventoSnap.docs.forEach(docSnap => {
    const data = docSnap.data() as LancamentoCaixa;
    if (data.saidaEventoId !== saidaId) return;
    caixaRefsToDelete.set(docSnap.id, docSnap.ref);
  });

  const batch = writeBatch(db);
  batch.update(eventoRef, deepCleanUndefined({
    saidas: saidasAtualizadas,
    updatedAt: serverTimestamp()
  }));
  caixaRefsToDelete.forEach(ref => {
    batch.delete(ref);
  });

  await batch.commit();
};

// --- CAMPANHAS DE VENDAS ---
export const listCampanhasVenda = (clubId: string): Promise<CampanhaVenda[]> => listSimpleCol<CampanhaVenda>(clubId, 'campanhas_venda');
export const createCampanhaVenda = async (clubId: string, payload: Omit<CampanhaVenda, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'campanhas_venda'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as CampanhaVenda;
};
export const updateCampanhaVenda = async (clubId: string, id: string, payload: Partial<CampanhaVenda>) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'campanhas_venda', id), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }));
};
export const deleteCampanhaVenda = async (clubId: string, id: string) => {
  validateClub(clubId);
  await deleteDoc(doc(db, 'clubs', clubId, 'campanhas_venda', id));
};

// --- ITENS DE VENDA ---
export const listVendaItems = (clubId: string, campanhaId?: string): Promise<VendaItem[]> => {
  validateClub(clubId);
  const colRef = collection(db, 'clubs', clubId, 'venda_items');
  if (campanhaId) {
    return getDocs(query(colRef, where('campanhaId', '==', campanhaId)))
      .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as VendaItem)));
  }
  return listSimpleCol<VendaItem>(clubId, 'venda_items');
};
export const createVendaItem = async (clubId: string, payload: Omit<VendaItem, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'venda_items'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as VendaItem;
};
export const updateVendaItem = async (clubId: string, id: string, payload: Partial<VendaItem>) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'venda_items', id), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }));
};
export const deleteVendaItem = async (clubId: string, id: string) => {
  validateClub(clubId);
  await deleteDoc(doc(db, 'clubs', clubId, 'venda_items', id));
};

// --- REUNIÕES ---
export const listReunioes = async (clubId: string): Promise<Reuniao[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'reunioes'));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Reuniao));
  return items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

export const createReuniao = async (clubId: string, payload: Omit<Reuniao, 'id' | 'clubeId'>) => {
  validateClub(clubId);
  const docRef = doc(collection(db, 'clubs', clubId, 'reunioes'));
  const cleaned = deepCleanUndefined({ ...payload, id: docRef.id, clubeId: clubId, ativo: true, createdAt: serverTimestamp() });
  await setDoc(docRef, cleaned);
  return cleaned as Reuniao;
};

export const updateReuniao = async (clubId: string, id: string, payload: Partial<Reuniao>) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'reunioes', id), deepCleanUndefined({ ...payload, updatedAt: serverTimestamp() }));
};

export const deleteReuniao = async (clubId: string, id: string) => {
  validateClub(clubId);
  await updateDoc(doc(db, 'clubs', clubId, 'reunioes', id), { ativo: false });
};

// --- PRESENÇAS EM REUNIÃO ---
export const listPresencas = async (clubId: string, reuniaoId: string): Promise<ReuniaoPresenca[]> => {
  validateClub(clubId);
  const q = query(collection(db, 'clubs', clubId, 'reunioes_presencas'), where('reuniaoId', '==', reuniaoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReuniaoPresenca));
};

export const listPresencasPorTrimestre = async (clubId: string, trimestre: number): Promise<ReuniaoPresenca[]> => {
  // Para filtrar no lado cliente ou buscar agrupado: primeiro pegar reuniões, depois a presença
  validateClub(clubId);
  const reus = await listReunioes(clubId);
  const filterIds = reus.filter(r => r.trimestre === trimestre && r.ativo).map(r => r.id);
  
  if (filterIds.length === 0) return [];
  
  // Como 'in' do Firestore suporta no maixmo 10 items e podemos ter muitas reuniões, vamos trazer todas do clube (na real seria bom filtrar por data ou trimestre, mas como é MVP, vamos trazer e parsear ou iterar em promises)
  const allPresencas = await listSimpleCol<ReuniaoPresenca>(clubId, 'reunioes_presencas');
  return allPresencas.filter(p => filterIds.includes(p.reuniaoId));
};

export const updatePresenca = async (clubId: string, reuniaoId: string, payload: Omit<ReuniaoPresenca, 'id' | 'clubeId' | 'updatedAt'>) => {
  validateClub(clubId);
  // O ID da presenca pode ser algo que garanta unicidade 1:1 ex: reuniaoId__dbvId
  const docId = `${reuniaoId}_${payload.desbravadorId}`;
  const docRef = doc(db, 'clubs', clubId, 'reunioes_presencas', docId);
  
  const cleaned = deepCleanUndefined({
    ...payload,
    id: docId,
    clubeId: clubId,
    reuniaoId,
    updatedAt: serverTimestamp()
  });
  
  await setDoc(docRef, cleaned, { merge: true });
};

// --- FANFARRA ---
const normalizeFanfarraNumero = (input: string): string => {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  const numero = Number(digits);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    throw new Error('VALIDACAO|A numeração do instrumento deve estar entre 01 e 100.');
  }
  return String(numero).padStart(2, '0');
};

const ensureFanfarraNumeroUnique = async (clubId: string, numeroInstrumento: string, ignoreId?: string) => {
  const instrumentos = await listFanfarraInstrumentos(clubId);
  const duplicado = instrumentos.find(item =>
    item.ativo !== false &&
    item.numeroInstrumento === numeroInstrumento &&
    item.id !== ignoreId
  );

  if (duplicado) {
    throw new Error(`VALIDACAO|Já existe um instrumento com a numeração ${numeroInstrumento}.`);
  }
};

export const listFanfarraInstrumentos = async (clubId: string): Promise<FanfarraInstrumento[]> => {
  validateClub(clubId);
  const snap = await getDocs(collection(db, 'clubs', clubId, 'fanfarra_instrumentos'));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FanfarraInstrumento));
  return items.sort((a, b) => a.numeroInstrumento.localeCompare(b.numeroInstrumento, 'pt-BR'));
};

export const createFanfarraInstrumento = async (
  clubId: string,
  payload: Omit<FanfarraInstrumento, 'id' | 'clubeId' | 'ativo' | 'createdAt' | 'updatedAt'>
) => {
  validateClub(clubId);
  const numeroInstrumento = normalizeFanfarraNumero(payload.numeroInstrumento);
  await ensureFanfarraNumeroUnique(clubId, numeroInstrumento);

  const docRef = doc(collection(db, 'clubs', clubId, 'fanfarra_instrumentos'));
  const cleaned = deepCleanUndefined({
    ...payload,
    id: docRef.id,
    clubeId: clubId,
    numeroInstrumento,
    ativo: true,
    createdAt: serverTimestamp()
  });

  await setDoc(docRef, cleaned);
  return cleaned as FanfarraInstrumento;
};

export const updateFanfarraInstrumento = async (
  clubId: string,
  id: string,
  payload: Partial<Omit<FanfarraInstrumento, 'id' | 'clubeId' | 'createdAt'>>
) => {
  validateClub(clubId);

  const updatePayload: Record<string, any> = { ...payload };
  if (payload.numeroInstrumento != null) {
    const numeroInstrumento = normalizeFanfarraNumero(payload.numeroInstrumento);
    await ensureFanfarraNumeroUnique(clubId, numeroInstrumento, id);
    updatePayload.numeroInstrumento = numeroInstrumento;
  }

  await updateDoc(doc(db, 'clubs', clubId, 'fanfarra_instrumentos', id), deepCleanUndefined({
    ...updatePayload,
    updatedAt: serverTimestamp()
  }));
};
