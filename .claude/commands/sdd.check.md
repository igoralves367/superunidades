---
name: sdd.check
description: Ver status da feature, progresso e resultados de validação. Use quando quiser checar a saúde da feature ou executar validações de consistência.
model: sonnet
argument-hint: "[feature-name] [--sync|--compliance|--resume]"
---

# Comando: /sdd.check

**Descrição**: Ver status da feature, executar verificações de consistência e validar padrões

**Uso**:
- `/sdd.check` → Status da feature atual
- `/sdd.check [nome-feature]` → Status de feature específica
- `/sdd.check --sync` → Verificar consistência specs/tasks/código + propor correções
- `/sdd.check --compliance` → Verificar TypeScript/testes + propor correções
- `/sdd.check task TASK-XXX` → Detalhes de task específica
- `/sdd.check --resume` → Listar sessões retomáveis

---

## Ajuda Rápida

> `/sdd.check help` → Mostra este resumo

---

## Workflow por Subcomando

### /sdd.check (padrão)

Ler `sdd/wip/` e encontrar feature atual (a que tem tasks `in_progress` ou a mais recente).

Exibir:
```
## Status — [feature-name]
Data: [YYYYMMDD] | Modo: standard | Projeto: greenfield

### Fase Atual: [fase]
- ✅ Spec funcional: aprovado
- ✅ Spec técnico: aprovado
- 🔄 Tasks: 3/8 concluídas (37%)
- ⏳ Implementação: em andamento

### Tasks
| ID | Título | Status | Layer |
|----|--------|--------|-------|
| TASK-001 | Tipos TypeScript | ✅ done | 1 |
| TASK-002 | Componente principal | ✅ done | 1 |
| TASK-003 | Queries Firestore | 🔄 in_progress | 2 |
| TASK-004 | Testes unitários | ⏳ pending | 1 |
| TASK-005 | Code review | ⏳ pending | 3 |

### Branch
🌿 feature/[feature-name] | Commits: X desde develop

### Próximo Passo
→ /sdd.build --next  (continuar com TASK-003)
```

### /sdd.check --sync

Verificar consistência entre:
1. Spec funcional ↔ Spec técnico (não devem contradizer)
2. Spec técnico ↔ Tasks (tasks devem cobrir tudo no spec)
3. Tasks ↔ Código (arquivos listados nas tasks existem?)

Exibir inconsistências e propor correções.

### /sdd.check --compliance

Verificar:
```bash
# TypeScript
npx tsc --noEmit
# Testes
npx vitest run
# Build
npm run build
```

Exibir resultado de cada check com status.

### /sdd.check task TASK-XXX

Exibir detalhes completos da task:
- ID, título, descrição
- Status atual
- Critérios de aceitação (marcando quais passaram)
- Arquivos afetados
- Dependências

### /sdd.check --resume

Listar todas as features com trabalho em andamento:
```
## Sessões Retomáveis

| Feature | Fase | Última Atividade | Próxima Task |
|---------|------|------------------|--------------|
| ranking-reta-final | build | 2026-05-25 | TASK-004 |
| filtro-membros | spec | 2026-05-26 | spec técnico |

Para retomar:
  /sdd.build --resume    (continuar ranking-reta-final)
  /sdd.spec --resume     (continuar filtro-membros)
```

---

## Indicadores de Status

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completo/Aprovado |
| 🔄 | Em andamento |
| ⏳ | Pendente |
| ❌ | Bloqueado/Falhou |
| ⚠️ | Atenção necessária |

---

## Regras do Agente IA

1. **Ler estado atual** — Sempre ler `tasks.json` e `meta.md` ao executar
2. **Sugerir próximo passo** — Sempre indicar o que fazer em seguida
3. **Help flag** — `/sdd.check help` exibe apenas o resumo
