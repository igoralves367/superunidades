---
name: sdd.fix
description: Corrigir erros com consistência horizontal. Use quando /sdd.build encontra erros que precisam de análise mais profunda ou quando há problemas de TypeScript, Firebase ou padrões do projeto.
model: opus
argument-hint: "[TASK-XXX|--type TYPE]"
---

# Comando: /sdd.fix

**Descrição**: Diagnosticar e corrigir erros com análise de consistência horizontal

**Uso**:
- `/sdd.fix` → Diagnosticar erros na feature atual
- `/sdd.fix TASK-XXX` → Focar na task com problemas
- `/sdd.fix --type typescript` → Focar em erros TypeScript
- `/sdd.fix --type firebase` → Focar em erros Firebase/Firestore
- `/sdd.fix --type patterns` → Verificar violações de padrões

---

## Ajuda Rápida

> `/sdd.fix help` → Mostra este resumo

---

## Tipos de Erro e Estratégias

### TypeScript Errors (--type typescript)

**Diagnóstico**:
```bash
npx tsc --noEmit 2>&1
```

**Erros comuns e correções**:

| Erro | Causa Provável | Correção |
|------|----------------|----------|
| `Property does not exist on type` | Tipo incompleto | Adicionar propriedade ao tipo/interface |
| `Type 'X' is not assignable to type 'Y'` | Tipo errado | Verificar e corrigir tipo da variável |
| `Cannot find module` | Import incorreto | Verificar caminho do import |
| `Object is possibly undefined` | Sem verificação de null | Adicionar guard `if (x)` ou optional chaining `?.` |
| `Implicit 'any'` | Tipo não declarado | Declarar tipo explicitamente |

**Processo de correção**:
1. Listar todos os erros TypeScript
2. Categorizar por arquivo
3. Corrigir do mais simples ao mais complexo
4. Re-executar `tsc --noEmit` para verificar

### Firebase Errors (--type firebase)

**Erros comuns**:

| Erro | Causa | Correção |
|------|-------|----------|
| `permission-denied` | Falta `clubeId` na query ou Security Rules | Verificar filtro por `clubeId` |
| `not-found` | Documento não existe | Adicionar verificação de existência |
| `invalid-argument` | Tipo de dado incorreto | Verificar tipos esperados pelo Firestore |
| Valores undefined | `deepCleanUndefined` não aplicado | Chamar `deepCleanUndefined()` antes de salvar |

**Verificação de padrão multi-tenant**:
```typescript
// ❌ ERRADO — sem clubeId
const ref = collection(db, 'membros');

// ✅ CORRETO — com clubeId
const ref = collection(db, 'clubs', clubeId, 'membros');
```

### Pattern Violations (--type patterns)

**Verificações**:

1. **Soft delete**:
   - ❌ `deleteDoc(ref)` em recursos principais
   - ✅ `updateDoc(ref, { ativo: false })`

2. **Batch operations**:
   - ❌ Múltiplos `setDoc/updateDoc` separados
   - ✅ `writeBatch` para operações atômicas

3. **Error handling**:
   - ❌ Sem try/catch
   - ✅ `try { ... } catch (e) { console.error(e); alert('Mensagem amigável'); }`

4. **React imports**:
   - ❌ `import React from 'react'` (desnecessário em React 19)
   - ✅ `import { useState, useEffect } from 'react'`

---

## Workflow de Diagnóstico

### Etapa 1: Coleta de Erros

Executar todas as verificações e coletar:
```bash
npx tsc --noEmit 2>&1
npx vitest run 2>&1 (se existir)
npm run build 2>&1
```

### Etapa 2: Classificação

Classificar cada erro em uma categoria:
- `SYNTAX_ERROR`: problema de sintaxe TypeScript
- `TYPE_ERROR`: incompatibilidade de tipos
- `FIREBASE_ERROR`: problema de acesso/estrutura Firestore
- `PATTERN_VIOLATION`: violação de padrão do projeto
- `IMPORT_ERROR`: import não resolvido
- `DESIGN_FLAW`: problema que requer mudança de design

### Etapa 3: Priorização

| Categoria | Prioridade | Ação |
|-----------|------------|------|
| `SYNTAX_ERROR` | Alta | Corrigir imediatamente |
| `TYPE_ERROR` | Alta | Corrigir sem usar `any` |
| `FIREBASE_ERROR` | Alta | Verificar padrões |
| `IMPORT_ERROR` | Alta | Resolver caminho |
| `PATTERN_VIOLATION` | Média | Corrigir e documentar |
| `DESIGN_FLAW` | Bloqueante | Pausar e consultar usuário |

### Etapa 4: Correção

Para cada erro (por prioridade):
1. Ler o arquivo com o erro em contexto
2. Identificar causa raiz (não apenas o sintoma)
3. Corrigir preservando todos os outros padrões do projeto
4. Re-verificar após correção

### Etapa 5: Relatório

```
## Relatório de Correção

### Erros Corrigidos
- ✅ src/components/Ranking/RankingCard.tsx:15 — Type error corrigido
- ✅ src/services/rankingService.ts:42 — clubeId adicionado à query

### Erros Bloqueantes (requerem decisão)
- ❌ DESIGN_FLAW: A estrutura de dados atual não suporta o requisito US-3
  Opções:
  (a) Modificar spec técnico
  (b) Adaptar implementação dentro do modelo atual

### Verificações Finais
TypeScript: ✅ 0 erros
Build: ✅ OK
```

---

## Regras do Agente IA

1. **Causa raiz, não sintoma** — Entender POR QUÊ o erro ocorre antes de corrigir
2. **Sem `any`** — Nunca resolver type errors com `any` ou `@ts-ignore`
3. **Preservar padrões** — A correção não deve violar outros padrões do projeto
4. **Design flaw = pausa** — Se o erro indica problema de design, pausar e consultar
5. **Horizontalidade** — Verificar se o mesmo erro existe em outros arquivos similares
