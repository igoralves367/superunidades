---
name: sdd.list
description: Listar todas as features do projeto (wip, concluídas, canceladas). Use para ter uma visão geral do progresso do desenvolvimento.
model: sonnet
argument-hint: "[--wip|--features|--cancelled|--all]"
---

# Comando: /sdd.list

**Descrição**: Listar todas as features do projeto

**Uso**:
- `/sdd.list` → Listar features em andamento (wip)
- `/sdd.list --all` → Listar todas (wip + concluídas + canceladas)
- `/sdd.list --features` → Apenas features concluídas
- `/sdd.list --cancelled` → Apenas features canceladas

---

## Ajuda Rápida

> `/sdd.list help` → Mostra este resumo

---

## Workflow

### Etapa 1: Escanear Diretórios

```
sdd/wip/         → features em andamento
sdd/features/    → features concluídas
sdd/cancelled/   → features canceladas
```

Para cada feature, ler `meta.md` para obter:
- Nome, data de início, modo, fase atual
- Status das tasks (se `tasks.json` existir)

### Etapa 2: Exibir

**Formato padrão** (`/sdd.list`):

```
## Features em Andamento

| Feature | Início | Fase | Progresso | Branch |
|---------|--------|------|-----------|--------|
| filtro-busca-membros | 20260527 | build | 3/8 tasks | feature/filtro-busca-membros |
| relatorio-financeiro | 20260520 | spec | funcional aprovado | feature/relatorio-financeiro |

Total: 2 features em andamento
```

**Formato completo** (`/sdd.list --all`):

```
## Em Andamento (wip/)
[tabela acima]

## Concluídas (features/)
| Feature | Conclusão | Tasks | Branch |
|---------|-----------|-------|--------|
| ranking-reta-final | 20260515 | 12/12 | merged |

## Canceladas (cancelled/)
| Feature | Cancelada Em | Motivo |
|---------|-------------|--------|
| (nenhuma) | - | - |
```

---

## Indicadores

| Fase | Descrição |
|------|-----------|
| `init` | Inicializada, specs pendentes |
| `spec` | Criando especificações |
| `plan` | Planejando tasks |
| `build` | Implementando |
| `finish` | Finalizando/Arquivando |

---

## Regras do Agente IA

1. **Ler meta.md** — Sempre ler o arquivo de cada feature para dados atualizados
2. **Ordenar por data** — Mais recentes primeiro
3. **Help flag** — `/sdd.list help` exibe apenas o resumo
