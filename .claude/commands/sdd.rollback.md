---
name: sdd.rollback
description: Reverter para fase anterior do workflow. Use quando specs ou tasks precisam ser refeitos ou quando uma task específica precisa ser desfeita.
model: sonnet
argument-hint: "[N|--task TASK-XXX|--phase N]"
---

# Comando: /sdd.rollback

**Descrição**: Reverter para fase anterior ou desfazer task específica

**Uso**:
- `/sdd.rollback` → Reverter para fase anterior (com confirmação)
- `/sdd.rollback N` → Reverter para fase N (1=funcional, 2=técnico, 3=tasks, 4=build)
- `/sdd.rollback --task TASK-XXX` → Desfazer task específica
- `/sdd.rollback --phase N` → Alias para `/sdd.rollback N`

---

## Ajuda Rápida

> `/sdd.rollback help` → Mostra este resumo

---

## Fases

| N | Fase | O que significa |
|---|------|-----------------|
| 1 | Spec funcional | Refazer especificação funcional |
| 2 | Spec técnico | Refazer especificação técnica |
| 3 | Tasks | Regenerar tasks de implementação |
| 4 | Build | Retomar implementação |

---

## Workflow

### /sdd.rollback N

**Etapa 1**: Identificar o que será perdido ao reverter para fase N.

Por exemplo, reverter para fase 2 (spec técnico):
- Spec técnico: será resetado para `pendente`
- Tasks: serão descartadas
- Código implementado: NÃO é desfeito automaticamente (apenas estado do framework)

**Etapa 2**: Confirmar com o usuário:

```
⚠️ Reverter para fase 2 (spec técnico)?

O que acontecerá:
- ✏️  Spec técnico: resetado para edição
- 🗑️  Tasks (tasks.json): descartadas
- 💻 Código implementado: MANTIDO (git reset manual se necessário)

Confirmar? (sim/não)
```

**Etapa 3**: Executar rollback:
- Atualizar `meta.md` com nova fase atual
- Resetar status das fases afetadas para `pendente`
- Apagar `tasks.json` (se reversão para fase ≤3)
- NÃO apagar specs anteriores automaticamente — perguntar

**Etapa 4**: Confirmar:
```
✅ Revertido para fase 2 (spec técnico)
   📝 Spec técnico: aberto para edição
   🗑️  Tasks: descartadas
   
   Continue com: /sdd.spec technical
```

### /sdd.rollback --task TASK-XXX

Reverter task específica:
1. Verificar se task existe e está `done`
2. Mostrar o que a task modificou (arquivos)
3. Perguntar: reverter via git? (mostrar commits da task)
4. Se sim: `git revert [commit]` ou `git checkout [commit] -- [arquivos]`
5. Atualizar `tasks.json` para marcar task como `pending`

---

## Impacto no Git

O rollback do framework (meta.md/tasks.json) é **independente** do git.
Para reverter código, use `git` manualmente ou escolha a opção de git revert ao fazer rollback de task.

```
Opções ao reverter task com commits:
1. Manter código, apenas resetar status da task
2. Reverter commits da task (git revert)
3. Cancelar
```

---

## Regras do Agente IA

1. **Sempre confirmar** — Nunca reverter sem confirmação explícita
2. **Preservar código** — Por padrão, não apagar código — apenas atualizar estado do framework
3. **Informar impacto** — Mostrar claramente o que será perdido
4. **Git separado** — Rollback de framework ≠ git reset; perguntar se quer reverter git também
5. **Help flag** — `/sdd.rollback help` exibe apenas o resumo
