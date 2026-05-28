# Skill: sdd-code-reviewer

**Versão**: 1.0.0
**Propósito**: Revisor de código para o projeto superunidades — qualidade, segurança e padrões

---

## Quando Invocar

Invocar esta skill quando:
- Executando Layer 3 (code review task) do `/sdd.build`
- Revisando código antes de `/sdd.finish`
- Verificando violações de padrões após implementação
- Auditando segurança de código existente

---

## Checklist de Code Review

### 1. TypeScript

- [ ] Sem `any` implícito (nenhum campo tipado como `any` sem motivo)
- [ ] Sem `@ts-ignore` ou `@ts-expect-error`
- [ ] Interfaces/tipos definidos para todos os dados de domínio
- [ ] Props de componentes tipadas explicitamente
- [ ] Retornos de funções tipados quando não óbvio

### 2. Multi-Tenant (CRÍTICO)

- [ ] **TODA** query Firestore inclui `clubeId` no path
- [ ] Nenhum acesso a coleção raiz sem `clubs/{clubeId}/`
- [ ] `clubeId` validado antes de operações de escrita
- [ ] Sem dados de um clube podendo vazar para outro

**Verificação rápida** — procurar por:
```typescript
// ❌ Violação multi-tenant — checar se existe
collection(db, 'membros')     // sem clubs/{id}/
collection(db, 'chamadas')    // sem clubs/{id}/
```

### 3. Soft Delete

- [ ] Recursos principais usam `ativo: false` (não `deleteDoc`)
- [ ] Queries de listagem filtram por `where('ativo', '==', true)`
- [ ] Operações de "deletar" na UI apenas desativam

**Verificação** — procurar por:
```typescript
// ❌ Hard delete em recurso principal
deleteDoc(doc(db, 'clubs', clubeId, 'membros', id))
```

### 4. Segurança

- [ ] Sem secrets hardcoded (API keys, tokens, senhas)
- [ ] Sem `VITE_*` secrets expostos desnecessariamente
- [ ] Dados de usuário não logados acessíveis a terceiros?
- [ ] Rota pública expõe dados que deveriam ser privados?

**Verificação** — procurar por:
```typescript
// ❌ Secret hardcoded
const apiKey = 'AIzaSy...';
const SECRET = 'xxxxxxxxxxx';
```

### 5. Tratamento de Erros

- [ ] `try/catch` em todas as operações assíncronas Firebase
- [ ] `console.error` chamado no catch
- [ ] Mensagem amigável exibida ao usuário (sem stack trace na UI)
- [ ] Estado de erro tratado nos componentes (não só loading)

```typescript
// ✅ Tratamento completo
try {
  await operacaoFirebase();
} catch (e) {
  console.error('Erro ao [operação]:', e);
  alert('Erro ao processar. Tente novamente.');
  setErro('Mensagem amigável');
}
```

### 6. Padrões React

- [ ] Sem `React.FC` — usar function declarations
- [ ] Sem `import React from 'react'` desnecessário (React 19)
- [ ] `useEffect` com dependências corretas
- [ ] Sem memory leaks (subscriptions não canceladas)
- [ ] Chaves (`key`) em listas — não usar índice como key quando há ID

### 7. Performance

- [ ] Sem queries N+1 (buscar lista e depois buscar cada item separadamente)
- [ ] `useCallback`/`useMemo` onde lista ou função é passada como prop
- [ ] Dados carregados uma vez e reutilizados, não recarregados desnecessariamente
- [ ] Sem re-renders desnecessários por estado mal estruturado

### 8. Acessibilidade (Básica)

- [ ] Botões com texto descritivo (não apenas ícones sem label)
- [ ] Formulários com `label` associado ao input
- [ ] Cores não são único indicador de estado (usar texto/ícone também)

---

## Output do Review

```markdown
## Code Review — [feature-name]

### ✅ Aprovado
- Multi-tenant: todas as queries incluem clubeId
- TypeScript: sem any implícito
- Soft delete: implementado corretamente

### ⚠️ Atenção (não bloqueante)
- src/components/MeuComp.tsx:45 — useCallback poderia reduzir re-renders
- src/services/service.ts:12 — comentário desatualizado

### ❌ Bloqueante (deve corrigir antes de prosseguir)
- src/components/OutroComp.tsx:23 — Query sem clubeId: `collection(db, 'membros')`
- src/config/firebase.ts:5 — API key hardcoded

### Resultado: APROVADO | APROVADO COM RESSALVAS | REPROVADO
```

---

## Executar Review

Para executar um review completo:

1. Listar arquivos modificados desde a branch base:
   ```bash
   git diff --name-only develop
   ```

2. Ler cada arquivo modificado relevante (`.tsx`, `.ts`, excluindo `*.test.ts`)

3. Aplicar checklist para cada arquivo

4. Gerar relatório consolidado

---

## Regras desta Skill

1. **Objetividade** — Citar arquivo e linha para cada problema encontrado
2. **Severidade** — Distinguir bloqueante de atenção
3. **Sem nit-picks** — Não comentar sobre estilo se não viola padrão do projeto
4. **Multi-tenant é crítico** — Qualquer violação multi-tenant é sempre bloqueante
5. **Segurança é crítica** — Qualquer secret exposto é sempre bloqueante
