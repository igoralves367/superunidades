# Padrões Firebase — Superunidades

**SDKs**: firebase@latest (Firestore modular + Auth)

---

## Princípio Multi-Tenant

**CRÍTICO**: O projeto é multi-clube. Todos os dados são isolados por `clubeId`.

```
TODA coleção de dados de clube DEVE estar em:
  clubs/{clubeId}/{subcoleção}
```

### Estrutura de Coleções

```
clubs/
  {clubeId}/
    membros/           → Membros do clube
    chamadas/          → Chamadas de presença
    caixa/             → Transações financeiras
    unidades/          → Unidades do clube
    ranking/           → Dados de ranking
    especialidades/    → Especialidades disponíveis
    config/            → Configurações do clube
    meta/              → Metadados internos (seeds, etc.)
```

### Verificação Rápida

```typescript
// ❌ PROIBIDO — sem clubeId
collection(db, 'membros')
collection(db, 'chamadas')

// ✅ OBRIGATÓRIO — sempre com clubeId
collection(db, 'clubs', clubeId, 'membros')
collection(db, 'clubs', clubeId, 'chamadas')
```

---

## Operações de Leitura

```typescript
import {
  collection, getDocs, getDoc, query, where, orderBy, limit, doc
} from 'firebase/firestore';
import { db } from '../firebase';

// Listar documentos com filtros
async function getMembrosAtivos(clubeId: string): Promise<Membro[]> {
  const q = query(
    collection(db, 'clubs', clubeId, 'membros'),
    where('ativo', '==', true),
    orderBy('nome')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Membro));
}

// Buscar documento único
async function getMembro(clubeId: string, membroId: string): Promise<Membro | null> {
  const snap = await getDoc(doc(db, 'clubs', clubeId, 'membros', membroId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Membro;
}
```

---

## Operações de Escrita

```typescript
import { addDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Criar (ID automático)
async function criarMembro(clubeId: string, dados: Omit<Membro, 'id'>): Promise<string> {
  const ref = await addDoc(
    collection(db, 'clubs', clubeId, 'membros'),
    deepCleanUndefined({
      ...dados,
      clubeId,
      ativo: true,
      criadoEm: Timestamp.now()
    })
  );
  return ref.id;
}

// Criar (ID específico)
async function criarMembroComId(
  clubeId: string, membroId: string, dados: Omit<Membro, 'id'>
): Promise<void> {
  await setDoc(
    doc(db, 'clubs', clubeId, 'membros', membroId),
    deepCleanUndefined({ ...dados, clubeId, ativo: true })
  );
}

// Atualizar parcialmente
async function atualizarMembro(
  clubeId: string, membroId: string, dados: Partial<Membro>
): Promise<void> {
  await updateDoc(
    doc(db, 'clubs', clubeId, 'membros', membroId),
    deepCleanUndefined({ ...dados, atualizadoEm: Timestamp.now() })
  );
}
```

---

## Soft Delete

```typescript
// ✅ SEMPRE usar soft delete para recursos principais
async function desativarMembro(clubeId: string, membroId: string): Promise<void> {
  await updateDoc(
    doc(db, 'clubs', clubeId, 'membros', membroId),
    { ativo: false, desativadoEm: Timestamp.now() }
  );
}

// ❌ PROIBIDO para recursos com dados vinculados
// await deleteDoc(doc(db, 'clubs', clubeId, 'membros', membroId));
```

**Quando usar `deleteDoc`**: apenas para documentos auxiliares sem dados vinculados (ex: tokens temporários, sessões).

---

## writeBatch (Operações Atômicas)

Use `writeBatch` quando múltiplos documentos devem ser escritos/atualizados juntos:

```typescript
import { writeBatch, doc } from 'firebase/firestore';

async function registrarPresencaLote(
  clubeId: string,
  chamadaId: string,
  presencas: Array<{ membroId: string; presente: boolean }>
): Promise<void> {
  const batch = writeBatch(db);

  for (const p of presencas) {
    const ref = doc(
      db, 'clubs', clubeId, 'chamadas', chamadaId, 'presencas', p.membroId
    );
    batch.set(ref, {
      membroId: p.membroId,
      presente: p.presente,
      registradoEm: Timestamp.now()
    });
  }

  // Atualizar status da chamada no mesmo batch
  const chamadaRef = doc(db, 'clubs', clubeId, 'chamadas', chamadaId);
  batch.update(chamadaRef, { status: 'registrada', totalPresentes: presencas.filter(p => p.presente).length });

  await batch.commit();
}
```

**Limites do batch**: Máximo 500 operações por batch. Para listas maiores, dividir em múltiplos batches.

---

## deepCleanUndefined

Firestore rejeita valores `undefined`. Sempre limpar antes de salvar:

```typescript
function deepCleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepCleanUndefined) as unknown as T;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, deepCleanUndefined(v)])
  ) as T;
}
```

*(Verificar se já existe no firestoreDb.ts antes de criar nova cópia)*

---

## Seeds Idempotentes

```typescript
async function seedDadosBase(clubeId: string): Promise<void> {
  // Verificar se seed já foi executado
  const metaRef = doc(db, 'clubs', clubeId, 'meta', 'seeds');
  const metaSnap = await getDoc(metaRef);

  if (metaSnap.exists() && metaSnap.data()?.dadosBase) {
    return; // Já foi seed — não repetir
  }

  const batch = writeBatch(db);

  // Inserir dados base
  DADOS_BASE.forEach(item => {
    const ref = doc(collection(db, 'clubs', clubeId, 'colecao'));
    batch.set(ref, { ...item, clubeId, ativo: true });
  });

  // Marcar seed como executado
  batch.set(metaRef, { dadosBase: true, seedEm: Timestamp.now() }, { merge: true });

  await batch.commit();
}
```

---

## Timestamps

```typescript
import { Timestamp } from 'firebase/firestore';

// Criar timestamp atual
const agora = Timestamp.now();

// Converter Date para Timestamp
const ts = Timestamp.fromDate(new Date());

// Converter Timestamp para Date (para exibição)
const data = timestamp.toDate();
const dataFormatada = timestamp.toDate().toLocaleDateString('pt-BR');
```

---

## Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `permission-denied` | Query sem `clubeId` ou Security Rule | Verificar path da coleção |
| `not-found` | Documento não existe | Usar `getDoc` + verificar `exists()` |
| `invalid-argument` | Campo `undefined` no documento | Usar `deepCleanUndefined()` |
| `Resource exhausted` | Muitas operações em sequência | Usar `writeBatch` |
| `Missing or insufficient permissions` | Security Rule bloqueando | Verificar regra + `clubeId` |
