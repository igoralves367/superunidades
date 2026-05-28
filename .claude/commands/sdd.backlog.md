---
name: sdd.backlog
description: Gerenciar backlog centralizado do projeto (TODOs, DEBTs, IDEAs). Use para adicionar, listar, priorizar ou converter itens em features.
model: sonnet
argument-hint: "[add|list|done|start] [--type TYPE]"
---

# Comando: /sdd.backlog

**Descrição**: Gerenciar backlog centralizado do projeto

**Uso**:
- `/sdd.backlog` → Listar backlog completo
- `/sdd.backlog add` → Adicionar novo item
- `/sdd.backlog add --type todo "descrição"` → Adicionar TODO
- `/sdd.backlog add --type debt "descrição"` → Adicionar DEBT
- `/sdd.backlog add --type idea "descrição"` → Adicionar IDEA
- `/sdd.backlog done <ID>` → Marcar item como concluído
- `/sdd.backlog start <ID>` → Criar feature a partir do item

---

## Ajuda Rápida

> `/sdd.backlog help` → Mostra este resumo

**Arquivo**: `sdd/backlog.md`

---

## Tipos de Item

| Tipo | Prefixo | Descrição |
|------|---------|-----------|
| **TODO** | `TODO-XXX` | Tarefa técnica pendente, melhoria ou correção |
| **DEBT** | `DEBT-XXX` | Dívida técnica que precisa ser endereçada |
| **IDEA** | `IDEA-XXX` | Ideia para feature futura, não comprometida |

---

## Workflow

### /sdd.backlog (listar)

Ler `sdd/backlog.md` e exibir em tabelas separadas por tipo.
Destacar itens com prioridade `Critical` ou `High`.

### /sdd.backlog add

Perguntar ao usuário:
1. Tipo: TODO / DEBT / IDEA
2. Título (curto, descritivo)
3. Prioridade: Critical / High / Medium / Low
4. Área/Feature afetada (opcional)

Gerar próximo ID sequencial do tipo (ex: TODO-006 se já existe TODO-001 a TODO-005).

Adicionar ao `sdd/backlog.md` na seção correta.

**Para IDEAs**: também perguntar Valor (High/Medium/Low) e Complexidade estimada.

### /sdd.backlog done <ID>

Marcar item como concluído no `sdd/backlog.md`:
- Mover para seção `## Concluídos` (criar se não existir)
- Adicionar data de conclusão

### /sdd.backlog start <ID>

Converter item em feature:
1. Ler item pelo ID
2. Derivar nome de feature do título
3. Executar lógica de `/sdd.start --from-backlog <ID>`
4. Marcar item como `in-progress` no backlog

---

## Estrutura do backlog.md

```markdown
# Super Unidades — Backlog

## TODOs
| ID | Título | Prioridade | Feature |
|----|--------|------------|---------|
| TODO-001 | ... | High | - |

## DEBTs
| ID | Título | Prioridade | Área |
|----|--------|------------|------|
| DEBT-001 | ... | Critical | Todos |

## IDEAs
| ID | Título | Valor | Complexidade |
|----|--------|-------|--------------|
| IDEA-001 | ... | High | Medium |

## Concluídos
| ID | Título | Concluído Em |
|----|--------|-------------|
| TODO-XXX | ... | 2026-05-27 |
```

---

## Regras do Agente IA

1. **Não criar duplicatas** — Verificar se item similar já existe antes de adicionar
2. **IDs sequenciais** — Gerar próximo ID dentro do tipo (nunca reutilizar IDs)
3. **Arquivo centralizado** — Sempre operar em `sdd/backlog.md`
4. **Help flag** — `/sdd.backlog help` exibe apenas o resumo
