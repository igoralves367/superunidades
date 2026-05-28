# Skill: sdd-kit-expert

**Versão**: 1.0.0
**Propósito**: Especialista no SDD Kit adaptado para o superunidades — guia de workflow e framework

---

## Quando Invocar

Invocar esta skill quando:
- Usuário pergunta como usar o SDD Kit
- Há dúvidas sobre qual comando executar
- Precisar explicar o workflow para um novo usuário
- Verificar se o projeto está seguindo o processo correto
- Diagnosticar problemas com o framework (specs desatualizados, tasks inconsistentes)

---

## Visão Geral do SDD Kit — Superunidades

O SDD Kit é um framework de desenvolvimento spec-driven para o projeto **superunidades** (React 19 + TypeScript + Firebase).

Garante que toda feature tenha:
1. **Spec funcional** — O QUÊ construir (em português)
2. **Spec técnico** — COMO construir (em português)
3. **Tasks** — Tarefas executáveis com critérios de aceitação
4. **Implementação** — Código com quality gates

---

## Fluxos de Trabalho

### Workflow Express (1 comando)
```
/sdd.go "descrição da feature"
→ 3-5 perguntas → auto-spec → auto-plan → auto-build → auto-finish
```

### Workflow Padrão (4-5 comandos)
```
/sdd.start "feature-name"    → Inicializar (cria pasta, branch, meta.md)
/sdd.spec                    → Criar spec funcional + técnico
/sdd.plan                    → Gerar tasks (tasks.json)
/sdd.build                   → Implementar tasks por layer
/sdd.finish                  → Validar e arquivar
```

---

## Estrutura de Pastas

```
c:\WorkSparce\superunidades\
├── CLAUDE.md                     # Ponto de entrada do AI — contexto do projeto
├── sdd/
│   ├── PROJECT.md                # Stack, convenções, camadas
│   ├── backlog.md                # TODOs, DEBTs, IDEAs
│   ├── wip/                      # Features em andamento
│   │   └── YYYYMMDD-feature/
│   │       ├── 1-functional/spec.md
│   │       ├── 2-technical/spec.md
│   │       ├── 3-tasks/tasks.json
│   │       ├── 4-implementation/progress.md
│   │       └── meta.md
│   ├── features/                 # Features concluídas
│   └── framework/                # Documentação do framework
├── .claude/
│   ├── commands/                 # Comandos sdd.*
│   ├── skills/                   # Skills especializadas
│   └── agents/                   # Subagentes
```

---

## Camadas do Projeto

| Layer | Nome | Conteúdo | Gates |
|-------|------|----------|-------|
| 1 | Local/UI | React, TypeScript, hooks, lógica | `tsc --noEmit`, `vitest run` |
| 2 | Firebase | Firestore, Auth, Security Rules | Sem erros runtime, queries com clubeId |
| 3 | Qualidade | Code review, security, performance | `sdd-code-reviewer` skill |

---

## Comandos por Situação

| Situação | Comando |
|----------|---------|
| Quero começar uma feature nova | `/sdd.start "descrição"` |
| Quero ver o status do projeto | `/sdd.check` |
| Quero retomar onde parei | `/sdd.check --resume` |
| Tive um erro durante o build | `/sdd.fix` |
| Quero desfazer minha última task | `/sdd.rollback --task TASK-XXX` |
| Preciso refazer o spec técnico | `/sdd.rollback 2` |
| Quero ver todas as features | `/sdd.list --all` |
| Quero adicionar uma ideia ao backlog | `/sdd.backlog add --type idea "..."` |
| Quero cancelar uma feature | `/sdd.cancel` |
| Quero arquivar uma feature | `/sdd.finish` |

---

## Regras Invioláveis

1. **Specs em português** — Spec funcional e técnico sempre em pt-BR
2. **Multi-tenant** — Toda query Firestore com `clubeId`
3. **"Faça sua mágica"** — Implementação só começa após specs + plan aprovados
4. **Não pular fases** — spec → plan → build → finish (nessa ordem)
5. **TypeScript estrito** — Sem `any` implícito, sem `@ts-ignore`
6. **Soft delete** — `ativo: false` em vez de `deleteDoc` para recursos principais

---

## Diagnóstico de Problemas Comuns

### "Não sei por onde começar"
→ Execute `/sdd.go "descrição da feature"` para workflow completo automatizado

### "Esqueci onde parei"
→ Execute `/sdd.check --resume` para ver sessões retomáveis

### "O TypeScript está dando erro"
→ Execute `/sdd.fix --type typescript` para diagnóstico focado

### "A query Firebase está dando permission-denied"
→ Verificar se a query inclui `collection(db, 'clubs', clubeId, ...)` no path

### "Preciso mudar algo no spec depois de gerar as tasks"
→ Execute `/sdd.rollback 2` para voltar ao spec técnico (tasks serão descartadas)

---

## Histórico de Features

Para ver features concluídas e seus padrões:
```
sdd/features/             → features arquivadas com documentação
sdd/PATTERNS.md           → padrões acumulados de features anteriores
```
