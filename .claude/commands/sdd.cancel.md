---
name: sdd.cancel
description: Cancelar feature em andamento. Use quando uma feature foi abandonada ou precisa ser descartada. Move a pasta de wip/ para cancelled/.
model: sonnet
argument-hint: "[feature-name] [--reason MOTIVO]"
---

# Comando: /sdd.cancel

**Descrição**: Cancelar feature em andamento

**Uso**:
- `/sdd.cancel` → Cancelar feature atual (com confirmação)
- `/sdd.cancel [nome]` → Cancelar feature específica
- `/sdd.cancel --reason "motivo"` → Cancelar com motivo documentado

---

## Ajuda Rápida

> `/sdd.cancel help` → Mostra este resumo

---

## Workflow

### Etapa 1: Identificar Feature

Se nome fornecido: buscar em `sdd/wip/[nome]`.
Se não: encontrar feature atual (a mais recente em `sdd/wip/`).

### Etapa 2: Verificar Estado

Verificar se há trabalho significativo que seria perdido:
- Specs aprovados?
- Tasks implementadas (`done`)?
- Commits na branch?

Mostrar resumo do que será cancelado.

### Etapa 3: Confirmar com Usuário

Mostrar o que será cancelado e pedir confirmação explícita:

```
⚠️ Cancelar feature '[feature-name]'?

Estado atual:
- Spec funcional: aprovado
- Spec técnico: pendente
- Tasks: 0/0
- Branch: feature/[nome]

Esta ação é reversível com /sdd.start --reopen [nome].

Motivo (opcional): [motivo fornecido ou "não especificado"]

Confirmar cancelamento? (sim/não)
```

**NUNCA cancelar sem confirmação explícita do usuário.**

### Etapa 4: Arquivar como Cancelada

```
sdd/wip/[YYYYMMDD-feature-name]/ → sdd/cancelled/[YYYYMMDD-feature-name]_[DATA-CANCELAMENTO]/
```

Adicionar `CANCELLED.md` na pasta:
```markdown
# Feature Cancelada — [feature-name]

- **Cancelada em**: [data]
- **Motivo**: [motivo]
- **Estado ao cancelar**: [fase em que estava]
- **Para reabrir**: /sdd.start --reopen [nome]
```

### Etapa 5: Branch Git

**NÃO deletar** a branch automaticamente — o usuário pode querer o histórico.

Mostrar:
```
✅ Feature '[feature-name]' cancelada
   📁 Arquivada em: sdd/cancelled/[nome]_[data]/
   🌿 Branch 'feature/[nome]' mantida (delete manualmente se necessário)
   💡 Para reabrir: /sdd.start --reopen [nome]
```

---

## Regras do Agente IA

1. **Sempre confirmar** — Nunca cancelar sem confirmação explícita do usuário
2. **Não deletar branch** — Preservar histórico de commits
3. **Documentar motivo** — Registrar no CANCELLED.md
4. **Reversível** — Informar ao usuário como reabrir se mudar de ideia
5. **Help flag** — `/sdd.cancel help` exibe apenas o resumo
