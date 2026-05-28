---
name: sdd.build
description: Implementar tasks da feature seguindo a estratégia aprovada. Use quando tasks estão aprovadas e o usuário está pronto para codificar. Executa por layer com quality gates.
model: opus
argument-hint: "[task TASK-XXX|phase N|--layer N|--next|--resume]"
---

# Comando: /sdd.build

**Descrição**: Implementar tasks seguindo a estratégia de execução aprovada

**Uso**:
- `/sdd.build` → Implementar todas as tasks (comportamento por modo)
- `/sdd.build task TASK-XXX` → Implementar task específica
- `/sdd.build phase N` → Implementar fase específica
- `/sdd.build --layer N` → Implementar até o layer N
- `/sdd.build --resume` → Retomar sessão interrompida
- `/sdd.build --next` → Continuar com próxima task pendente

---

## Ajuda Rápida

> `/sdd.build help` → Mostra este resumo

**Pré-requisito**: Tasks aprovadas via `/sdd.plan`

---

## Pré-Requisitos (BLOQUEANTE)

| Verificação | Em caso de falha |
|-------------|------------------|
| `tasks.json` existe | Executar `/sdd.plan` |
| Tasks aprovadas em meta.md | Executar `/sdd.plan --approve` |

---

## Workflow (Etapas em Ordem)

### Etapa 1: Carregar Estado

Ler `sdd/wip/[feature]/3-tasks/tasks.json` e `meta.md`.
Identificar próxima task pendente respeitando dependências.
Verificar estratégia de execução (sequential/batched/parallel).

### Etapa 2: Carregar Contexto

Antes de cada task, carregar:
1. Spec funcional relevante (histórias de usuário afetadas)
2. Spec técnico relevante (decisões de design DD-N da task)
3. Código existente dos arquivos listados na task
4. Padrões do projeto (`sdd/PROJECT.md`)

### Etapa 3: Implementar Tasks por Layer

#### Layer 1 — Local/UI

**Contexto obrigatório**:
- Ler `CLAUDE.md` para convenções do projeto
- Verificar componentes existentes antes de criar novos
- Seguir padrões de `sdd/PROJECT.md`

**Ao implementar cada task**:
1. Ler arquivos afetados listados na task
2. Implementar seguindo convenções do projeto
3. Verificar TypeScript: `npx tsc --noEmit`
4. Executar testes: `npx vitest run` (se existirem)
5. Commit: `git add [arquivos]; git commit -m "feat: [descrição]"`
6. Marcar task como `done` em `tasks.json`

**Padrões obrigatórios em todo código**:
```typescript
// Multi-tenant: sempre filtrar por clubeId
const membros = await getDocs(
  query(collection(db, 'clubs', clubeId, 'membros'), 
    where('ativo', '==', true))
);

// Soft delete: nunca deletar, apenas desativar
await updateDoc(docRef, { ativo: false });

// Batch para operações compostas
const batch = writeBatch(db);
batch.update(ref1, { campo: valor });
batch.update(ref2, { campo: valor });
await batch.commit();

// Limpar undefined antes do Firestore
const dados = deepCleanUndefined({ campo: valor });
await setDoc(docRef, dados);
```

**Nomenclatura**:
- Componentes: PascalCase (`RankingCard.tsx`)
- Funções/hooks: camelCase (`useRankingData`)
- Tipos: PascalCase (`RankingItem`)
- Constantes: UPPER_SNAKE_CASE (`MAX_PONTOS`)

#### Layer 2 — Firebase

**Antes de implementar**:
- Verificar coleções existentes no `firestoreDb.ts`
- Confirmar que operações seguem o padrão multi-tenant
- Para novas queries, verificar se índices serão necessários

**Operações comuns**:
```typescript
// Leitura com filtro de clube
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Escrita com batch (operações atômicas)
import { writeBatch, doc } from 'firebase/firestore';

// Auth check
import { getAuth } from 'firebase/auth';
```

**Quality gate Layer 2**:
- Sem erros de runtime Firebase no console
- Queries com `clubeId` em toda coleção raiz
- Sem secrets hardcoded (API keys, etc.)

#### Layer 3 — Qualidade

**Task: Code Review** (`Skill("sdd-code-reviewer")`):
- Verificar padrões TypeScript (sem `any` implícito)
- Verificar multi-tenant (todas queries têm `clubeId`)
- Verificar soft delete
- Verificar tratamento de erros
- Verificar sem hardcoded secrets

**Task: Performance Review**:
- Queries Firestore otimizadas (sem N+1)
- Re-renders desnecessários em React
- `useCallback`/`useMemo` onde necessário
- Listas grandes precisam de paginação?

**Task: Security Review**:
- `clubeId` validado em todas as operações
- Sem exposição de dados entre clubes
- Firebase Security Rules consideradas
- Sem `GEMINI_API_KEY` ou outros secrets no código

### Etapa 4: Quality Gate Final

Após todas as tasks de Layer 1 e 2:

```bash
# TypeScript check (OBRIGATÓRIO)
npx tsc --noEmit
# Deve retornar 0 erros

# Testes (se existirem)
npx vitest run

# Build de produção (verificar warnings)
npm run build
```

**Se TypeScript check falhar**: PARAR. Corrigir erros antes de continuar.

### Etapa 5: Relatório de Progresso

Após cada task concluída:
```
✅ TASK-002: Implementar componente principal
   📁 Arquivos: src/components/Ranking/RankingCard.tsx
   🔧 TypeScript: OK
   🧪 Testes: 3 passando
   📝 Commit: feat: adicionar componente RankingCard

   Progresso: 2/6 tasks (33%)
```

---

## Tratamento de Erros

**TypeScript errors**:
- Corrigir inline, sem alterar os tipos para `any`
- Se o erro indicar problema de design → pausar e informar

**Firebase errors**:
- `permission-denied`: verificar regras de segurança e `clubeId`
- `not-found`: verificar se coleção/documento existe

**Erros de build**:
- Verificar imports (Firebase SDK, React)
- Verificar que não há `export default` duplo

**Se qualquer etapa falhar** (após 2 tentativas):
1. Mostrar detalhes do erro
2. Oferecer opções:
   - (a) Tentar correção diferente
   - (b) Pular para próxima task
   - (c) Usar `/sdd.fix` para análise mais profunda

---

## Comportamento por Modo

| Modo | Confirmações | Pausas | Retry |
|------|-------------|--------|-------|
| **Express** | Nenhuma | Apenas erros | 2x auto |
| **Standard** | Entre layers | Antes de Layer 3 | 2x auto |

---

## Convenções de Commit

```
feat: [descrição em português do que foi implementado]
fix: [descrição do que foi corrigido]
refactor: [descrição da refatoração]
test: [descrição dos testes adicionados]
```

**Exemplos**:
```
feat: adicionar componente de filtro de busca nos membros
fix: corrigir query de ranking com clubeId ausente
refactor: extrair hook useRankingData do componente
```

---

## Auto-Retry

No modo express, tentativas automáticas (máx 2x):
- TypeScript errors → tentar corrigir automaticamente
- Import errors → tentar resolver path
- Após 2 falhas: parar e mostrar erro ao usuário

---

## Regras do Agente IA

1. **Ler antes de escrever** — Verificar código existente antes de implementar
2. **Multi-tenant sempre** — Todo acesso Firestore deve ter `clubeId`
3. **TypeScript estrito** — Sem `any` implícito, sem `@ts-ignore`
4. **Commit por task** — Commit após cada task concluída
5. **Não pular layers** — Layer 2 só após Layer 1 completo, Layer 3 por último
6. **Gates são obrigatórias** — `npx tsc --noEmit` deve passar antes de avançar
