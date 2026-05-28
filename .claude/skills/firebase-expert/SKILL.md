# Skill: firebase-expert

**Versão**: 1.0.0
**Propósito**: Especialista em Firebase (Firestore + Auth) para o projeto superunidades

---

## Quando Invocar

Invocar esta skill quando:
- Projetando coleções e estrutura de dados Firestore
- Escrevendo queries com filtros, ordenação ou paginação
- Implementando operações de escrita (create/update/soft-delete)
- Configurando Firebase Auth e permissões
- Debugando erros de Firestore (permission-denied, not-found)
- Revisando Security Rules

---

## Estrutura de Coleções

### Padrão Multi-Tenant

**TODAS** as coleções de dados do clube seguem este padrão:
```
clubs/{clubeId}/{subcoleção}
```

Coleções documentadas:
```
clubs/{clubeId}/membros           → Membros do clube
clubs/{clubeId}/chamadas          → Registros de presença
clubs/{clubeId}/caixa             → Transações financeiras
clubs/{clubeId}/unidades          → Unidades do clube
clubs/{clubeId}/ranking           → Dados de ranking
clubs/{clubeId}/especialidades    → Especialidades disponíveis
clubs/{clubeId}/config            → Configurações do clube
```

### Nunca Fazer

```typescript
// ❌ Coleção global sem clubeId — NUNCA FAZER
const ref = collection(db, 'membros');

// ✅ Sempre com clubeId
const ref = collection(db, 'clubs', clubeId, 'membros');
```

---

## Padrões de Query

```typescript
import {
  collection, getDocs, getDoc, addDoc, setDoc, updateDoc,
  query, where, orderBy, limit, doc, writeBatch, Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ✅ Query com filtros
const q = query(
  collection(db, 'clubs', clubeId, 'membros'),
  where('ativo', '==', true),
  orderBy('nome')
);
const snapshot = await getDocs(q);
const membros = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

// ✅ Buscar documento único
const docRef = doc(db, 'clubs', clubeId, 'membros', membroId);
const docSnap = await getDoc(docRef);
if (!docSnap.exists()) throw new Error('Membro não encontrado');
const membro = { id: docSnap.id, ...docSnap.data() };

// ✅ Criar documento com ID automático
const novoDocRef = await addDoc(
  collection(db, 'clubs', clubeId, 'membros'),
  { ...dadosMembro, clubeId, ativo: true, criadoEm: Timestamp.now() }
);

// ✅ Criar documento com ID específico
await setDoc(
  doc(db, 'clubs', clubeId, 'membros', membroId),
  { ...dadosMembro, clubeId }
);

// ✅ Atualizar parcialmente
await updateDoc(
  doc(db, 'clubs', clubeId, 'membros', membroId),
  { nome: novoNome, atualizadoEm: Timestamp.now() }
);
```

---

## Soft Delete

```typescript
// ✅ CORRETO — soft delete
async function desativarMembro(clubeId: string, membroId: string) {
  const ref = doc(db, 'clubs', clubeId, 'membros', membroId);
  await updateDoc(ref, { ativo: false });
}

// ❌ ERRADO — hard delete (evitar para registros com dados vinculados)
// await deleteDoc(ref);

// ✅ Filtrar apenas ativos nas queries
const q = query(
  collection(db, 'clubs', clubeId, 'membros'),
  where('ativo', '==', true)
);
```

---

## writeBatch (Operações Atômicas)

Use `writeBatch` quando múltiplos documentos devem ser escritos juntos:

```typescript
// ✅ Batch para operações compostas
async function registrarPresenca(
  clubeId: string,
  chamadaId: string,
  presencas: Array<{ membroId: string; presente: boolean }>
) {
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

  // Atualizar status da chamada também no mesmo batch
  const chamadaRef = doc(db, 'clubs', clubeId, 'chamadas', chamadaId);
  batch.update(chamadaRef, { status: 'registrada' });

  await batch.commit();
}
```

---

## deepCleanUndefined

Sempre limpar `undefined` antes de salvar no Firestore:

```typescript
// Utilitário (verificar se já existe em firestoreDb.ts)
function deepCleanUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(deepCleanUndefined) as unknown as T;
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepCleanUndefined(v)])
    ) as T;
  }
  return obj;
}

// Usar antes de setDoc/addDoc
await setDoc(ref, deepCleanUndefined(dados));
```

---

## Firebase Auth

```typescript
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const auth = getAuth();

// Observer de estado
onAuthStateChanged(auth, (user) => {
  if (user) {
    // usuário logado
    const uid = user.uid;
  } else {
    // não logado
  }
});

// Logout
await signOut(auth);
```

---

## Seeds Idempotentes

```typescript
// ✅ Verificar antes de inserir
async function seedEspecialidades(clubeId: string) {
  const ref = doc(db, 'clubs', clubeId, 'meta', 'seeds');
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data()?.especialidades) {
    return; // já foi seed
  }

  const batch = writeBatch(db);
  ESPECIALIDADES_DEFAULT.forEach(esp => {
    const espRef = doc(collection(db, 'clubs', clubeId, 'especialidades'));
    batch.set(espRef, { ...esp, clubeId, ativo: true });
  });
  batch.set(ref, { especialidades: true, seedEm: Timestamp.now() });
  await batch.commit();
}
```

---

## Erros Comuns e Correções

| Erro | Causa | Correção |
|------|-------|----------|
| `permission-denied` | Query sem `clubeId` ou Security Rule bloqueando | Verificar filtro por `clubeId` |
| `not-found` | Documento não existe | Usar `getDoc` + verificar `exists()` |
| `invalid-argument` | Tipo inválido (undefined, objeto complexo) | Aplicar `deepCleanUndefined` |
| `Resource exhausted` | Muitas operações simultâneas | Usar `writeBatch` |

---

## Security Rules (Referência)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clubs/{clubeId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.clubeId == clubeId;
    }
  }
}
```
