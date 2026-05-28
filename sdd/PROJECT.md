# Super Unidades — PROJECT.md

## Visão do Produto

**O que é**: Sistema web de gestão de clubes de Desbravadores, focado em operações diárias.

**Problema resolvido**: Centraliza dados administrativos e operacionais do clube em um único sistema multi-clube, reduzindo controle manual disperso.

**Usuários-alvo**: Diretores, conselheiros, instrutores e responsáveis financeiros de clubes de Desbravadores.

**Princípios**:
- Multi-tenant por `clubeId` — isolamento total de dados entre clubes
- Firebase direto no frontend — sem backend próprio
- Soft delete para preservar integridade referencial
- Seeds idempotentes no bootstrap do clube

**Anti-metas**:
- Não é um sistema de comunicação/chat
- Não gerencia relação com entidade eclesiástica superior
- Não tem app mobile nativo

---

## Stack

```yaml
frontend:
  framework: React 19
  language: TypeScript ~5.8.2
  build: Vite 6.2.0
  styling: Tailwind CSS (CDN)
  icons: Lucide React
  charts: Recharts 3.7.0

backend:
  auth: Firebase Auth
  database: Firebase Firestore
  sdk: firebase@latest

testing:
  runner: vitest
  coverage_target: 60%  # Meta inicial — projeto sem testes

language:
  specs: pt  # Português do Brasil
  code: en   # Código em inglês
```

---

## Convenções de Código

```yaml
architecture: Layered SPA (UI → Services → Firebase)
naming:
  components: PascalCase
  functions: camelCase
  types: PascalCase
  constants: UPPER_SNAKE_CASE
  files: camelCase.tsx / PascalCase.tsx para componentes

patterns:
  multi_tenant: Sempre validar clubeId no service layer
  soft_delete: ativo = false (não excluir registros vinculados)
  batch: writeBatch para operações compostas
  error_handling: try/catch com alert() + console.error()
  seed: verificar metadados antes de inserir dados base

imports:
  firebase: import { ... } from 'firebase/firestore'
  react: import React, { useState, useEffect } from 'react'
  types: import { Tipo } from '../types'
  services: import { ... } from '../services/firestoreDb'
```

---

## Camadas do Projeto

### Layer 1 — Local/UI
Componentes React, hooks, TypeScript types, lógica de negócio local.
- Build gate: `npx tsc --noEmit` sem erros
- Testes: `npx vitest run` (quando existirem)

### Layer 2 — Firebase
Operações Firestore, Firebase Auth, integração com serviços externos.
- Sem erros de runtime Firebase
- Operações com `writeBatch` onde necessário

### Layer 3 — Qualidade
Revisão de código, TypeScript safety, security rules.
- Nenhum `any` implícito
- Sem `console.error` descobertos
- Sem hardcoded secrets

---

## Convenções de Branch

```yaml
branch_strategy: feature branches
main_branch: develop
feature_prefix: feature/
naming: feature/nome-da-feature-kebab-case
```

---

## Convenções de Commit

```yaml
style: conventional commits
format: "tipo: descrição em português"
types: [feat, fix, refactor, docs, chore, test]
examples:
  - "feat: adicionar modo reta final no ranking"
  - "fix: corrigir cálculo de pontuação base"
  - "refactor: modularizar firestoreDb por domínio"
```

---

## Revisão de Código

```yaml
code_review: required
spec_approval: required before implementation
test_coverage: 60% minimum (meta atual)
review_gates:
  - TypeScript sem erros
  - Sem qualquer implícito
  - Padrões de multi-tenant respeitados
  - Sem dados hardcoded ou secrets expostos
```

---

## Hub Members

Não aplicável — projeto único (não é um hub multi-app).
