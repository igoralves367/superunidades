---
name: sdd.project
description: Visualizar e editar configurações do projeto (PROJECT.md). Use para ver o stack, convenções e configurações do SDD Kit para este projeto.
model: sonnet
argument-hint: "[--edit|--stack|--conventions|patterns]"
---

# Comando: /sdd.project

**Descrição**: Gerenciar configurações do projeto SDD

**Uso**:
- `/sdd.project` → Exibir resumo de PROJECT.md
- `/sdd.project --stack` → Ver stack tecnológico
- `/sdd.project --conventions` → Ver convenções de código
- `/sdd.project --edit` → Abrir PROJECT.md para edição guiada
- `/sdd.project patterns` → Ver PATTERNS.md (padrões acumulados)
- `/sdd.project patterns --add` → Adicionar novo padrão manualmente

---

## Ajuda Rápida

> `/sdd.project help` → Mostra este resumo

---

## /sdd.project (padrão)

Ler `sdd/PROJECT.md` e exibir resumo:

```
# Super Unidades — Configuração do Projeto

## Stack
  Frontend:   React 19, TypeScript ~5.8.2, Vite 6.2.0
  Estilo:     Tailwind CSS (CDN), Lucide React
  Gráficos:   Recharts 3.7.0
  Backend:    Firebase Auth + Firestore

## Layers
  Layer 1: Local/UI (React, TypeScript, hooks)
  Layer 2: Firebase (Firestore, Auth, Security Rules)
  Layer 3: Qualidade (TypeScript, code review, security)

## Padrões
  Multi-tenant: clubeId em toda query Firestore
  Soft delete:  ativo: false (nunca deleteDoc em recursos principais)
  Batch:        writeBatch para operações compostas

## Testes
  Runner:    vitest
  Cobertura: 60% (meta)
  
## Branches
  Principal:  develop
  Features:   feature/[nome-kebab-case]

## Commits
  Estilo: conventional commits em português
  Tipos:  feat, fix, refactor, docs, chore, test
```

---

## /sdd.project --edit

Guia interativo para editar seções específicas de `sdd/PROJECT.md`.

Perguntar qual seção o usuário quer editar:
- Stack (adicionar/remover dependência)
- Convenções (atualizar padrões de código)
- Cobertura alvo (ajustar meta de testes)
- Outra configuração

Aplicar mudança e confirmar com o usuário antes de salvar.

---

## /sdd.project patterns

Ler `sdd/PATTERNS.md` (se existir) e exibir padrões acumulados.

Se não existir: informar que padrões são promovidos via `/sdd.finish`.

---

## /sdd.project patterns --add

Adicionar padrão manualmente ao `sdd/PATTERNS.md`:
1. Nome do padrão
2. Descrição
3. Por que usar
4. Exemplo de código (opcional)

Formato:
```markdown
**[Nome do Padrão]**: [descrição]
**Por que**: [motivo]
**Como**: `[exemplo de código]`
```

---

## Regras do Agente IA

1. **Ler arquivo atual** — Sempre ler `sdd/PROJECT.md` antes de exibir
2. **Não reescrever desnecessariamente** — Para `--edit`, modificar apenas a seção solicitada
3. **Help flag** — `/sdd.project help` exibe apenas o resumo
