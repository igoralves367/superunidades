# SDD Kit — Guia de Workflow

**Versão**: 1.0.0 (adaptado para superunidades)
**Stack**: React 19 + TypeScript + Firebase + Vite

---

## Modos de Execução

| Modo | Comando | Ideal Para |
|------|---------|-----------|
| **Express** | `/sdd.go` (1 comando) | Features simples, protótipos rápidos |
| **Padrão** | 4-5 comandos | Maioria das features **(PADRÃO)** |

---

## Workflow Express (1 Comando)

Para features com requisitos claros:

```
/sdd.go "adicionar filtro de busca nos membros"
```

**O que acontece**:
1. IA faz 3-5 perguntas críticas
2. Gera specs funcional + técnico automaticamente
3. Gera e aprova tasks automaticamente
4. Implementa todas as tasks
5. Valida e arquiva

---

## Workflow Padrão (4-5 Comandos)

Para a maioria das features:

```
/sdd.start → /sdd.spec → /sdd.plan → /sdd.build → /sdd.finish
```

### Fase 0: Inicializar

**Comando**: `/sdd.start "feature-name"`

**O que acontece**:
- Deriva nome kebab-case da descrição (se necessário)
- Cria `sdd/wip/YYYYMMDD-feature-name/` com estrutura
- Inicializa `meta.md` com metadados
- Cria branch `feature/nome`
- Detecta modo greenfield/brownfield

**Output**: Feature pronta para especificação

**Próximo**: `/sdd.spec`

---

### Fases 1-2: Especificações

**Comando**: `/sdd.spec`

**O que acontece**:

**Spec Funcional (O QUÊ construir)**:
- IA entrevista sobre problema, objetivos e usuários
- Constrói histórias de usuário com critérios de aceitação
- Define métricas de sucesso
- Pergunta: "Spec funcional pronto para aprovação?" [S/n]

**Spec Técnico (COMO construir)**:
- IA carrega spec funcional e explora código existente
- Projeta componentes React, modelo de dados Firestore
- Documenta decisões técnicas (DD-N)
- Pergunta: "Spec técnico pronto para aprovação?" [S/n]

**Output**: Ambos os specs validados e aprovados

**Próximo**: `/sdd.plan`

---

### Fase 3: Planejamento de Tasks

**Comando**: `/sdd.plan`

**O que acontece**:
- IA analisa specs
- Gera 5-20 tasks granulares por layer
- Exibe tabela de tasks com complexidade
- Pergunta: "Ajustar alguma task?" [S/n]
- Propõe estratégia de execução (Sequential/Batched/Parallel)

**Output**: Tasks aprovadas com estratégia de execução

**Próximo**: `/sdd.build`

---

### Fase 4: Implementação

**Comando**: `/sdd.build`

**O que acontece**:
- Executa tasks na ordem da estratégia
- Verifica TypeScript após cada task
- Cria commits por task
- Reporta progresso
- Pausa em erros ou decisões de design

**Output**: Todas as tasks implementadas, testadas, commitadas

**Próximo**: `/sdd.finish`

---

### Conclusão

**Comando**: `/sdd.finish`

**O que acontece**:
- Executa validações finais:
  - TypeScript (`tsc --noEmit`)
  - Testes (`vitest run`)
  - Build (`npm run build`)
  - Padrões do projeto (multi-tenant, soft delete, sem secrets)
- Gera documentação de conclusão
- Arquiva para `sdd/features/`
- Exibe métricas finais e instruções para PR

**Output**: Feature arquivada com documentação

---

## Camadas do Projeto

| Layer | Nome | Conteúdo | Gates |
|-------|------|----------|-------|
| **1** | Local/UI | Componentes React, hooks, tipos | `tsc --noEmit`, `vitest run` |
| **2** | Firebase | Operações Firestore, Auth | Sem erros runtime, multi-tenant |
| **3** | Qualidade | Code review, security | `sdd-code-reviewer` skill |

---

## Comparação dos Modos

| Aspecto | Express | Padrão |
|---------|---------|--------|
| Comandos | 1 | 4-5 |
| Interação | Baixa | Média |
| Controle | Mínimo | Equilibrado |
| Perguntas | 3-5 críticas | Entrevista completa |
| Confirmações | Nenhuma | Em pontos-chave |
| Ideal para | Features simples | Maioria das features |

---

## Controle Granular (Flags Opcionais)

Para mais controle dentro do modo padrão:

```bash
/sdd.start "feature-complexa"

# Fases separadas de spec
/sdd.spec functional
/sdd.spec functional --approve
/sdd.spec technical
/sdd.spec technical --approve

# Refinamento explícito de plan
/sdd.plan --refine
/sdd.plan --approve

# Implementação direcionada
/sdd.build task TASK-001
/sdd.build phase 2
/sdd.build --layer 2
```

---

## Modo Brownfield

Para modificar sistemas com specs documentados:

**Detecção**: Automática se `sdd/specs/` existe

**Estrutura**:
```
sdd/wip/YYYYMMDD-feature/
├── 1-functional/spec.md     # Novos requisitos (delta)
├── 2-technical/spec.md      # Como implementar as mudanças
├── 3-tasks/tasks.json
├── 4-implementation/progress.md
└── meta.md                  # affected_specs, impacto
```

**Princípio**: Em brownfield, seus specs descrevem o DELTA — o que muda no sistema existente.

---

## Engenharia Reversa

Para documentar codebases existentes sem specs:

```bash
/sdd.reverse-eng
# Cria:
#   sdd/extracted/raw/           (Fase 1: Inventário)
#   sdd/extracted/DOCUMENTATION_GAPS.md  (Fase 2: Gaps)
#   sdd/extracted/functional-spec.md     (Fase 3: Síntese)
#   sdd/extracted/technical-spec.md      (Fase 3: Síntese)
```

Após engenharia reversa, usar workflow padrão com contexto brownfield.

---

## Estrutura de Pastas

```
sdd/
├── backlog.md                    # Backlog centralizado
├── PROJECT.md                    # Configuração do projeto
├── PATTERNS.md                   # Padrões acumulados (auto-gerado)
├── wip/                          # Em andamento
│   └── YYYYMMDD-feature-name/
│       ├── 1-functional/spec.md
│       ├── 2-technical/spec.md
│       ├── 3-tasks/tasks.json
│       ├── 4-implementation/progress.md
│       └── meta.md
├── features/                     # Concluídas
│   └── YYYYMMDD-feature-name/
│       ├── README.md
│       └── ...
└── cancelled/                    # Canceladas
    └── YYYYMMDD-feature-name_DATA/
```

---

## Comandos Utilitários

| Comando | Propósito |
|---------|-----------|
| `/sdd.check` | Ver status e progresso |
| `/sdd.check --sync` | Verificar consistência |
| `/sdd.check --resume` | Listar sessões retomáveis |
| `/sdd.list` | Listar todas as features |
| `/sdd.backlog` | Gerenciar backlog |
| `/sdd.rollback` | Reverter para fase anterior |
| `/sdd.cancel` | Cancelar feature |
| `/sdd.fix` | Corrigir erros |
| `/sdd.help` | Ajuda do framework |
