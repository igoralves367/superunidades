---
name: sdd.plan
description: Gerar tasks de implementação a partir dos specs aprovados. Use quando ambos os specs estão aprovados e o usuário está pronto para detalhar o trabalho em tasks executáveis com estimativas.
model: opus
argument-hint: "[--approve|--refine|--resume|--view]"
---

# Comando: /sdd.plan

**Descrição**: Gerar, refinar e aprovar tasks de implementação

**Uso**:
- `/sdd.plan` → Comportamento automático baseado no modo
- `/sdd.plan --refine` → Refinar tasks existentes
- `/sdd.plan --approve` → Aprovar tasks e escolher estratégia
- `/sdd.plan --resume` → Retomar sessão de planejamento interrompida
- `/sdd.plan --view` → Visualizar tasks em formato de tabela

---

## Ajuda Rápida

> `/sdd.plan help` → Mostra este resumo

**Pré-requisito**: Spec técnico aprovado (`/sdd.spec technical --approve`)

---

## Pré-Requisitos (BLOQUEANTE)

| Verificação | Em caso de falha |
|-------------|------------------|
| Spec funcional aprovado | Executar `/sdd.spec functional --approve` |
| Spec técnico aprovado | Executar `/sdd.spec technical --approve` |

---

## Workflow (Etapas em Ordem)

### Etapa 1: Verificar Fase

Ler `meta.md` e verificar que spec_tecnico está `aprovado`.
Se não: bloquear com mensagem `❌ Spec técnico não aprovado. Execute /sdd.spec technical --approve primeiro.`

### Etapa 2: Ler Specs

Ler:
- `sdd/wip/[feature]/1-functional/spec.md`
- `sdd/wip/[feature]/2-technical/spec.md`

### Etapa 3: Gerar Tasks

**Regras de geração**:

| Regra | Detalhe |
|-------|---------|
| Layer assignment | Layer 1=local/UI, Layer 2=Firebase, Layer 3=Qualidade |
| Tipo de projeto | Ler `meta.md → projeto.tipo` (prototype/production) |
| Tasks de qualidade | Layer 3 sempre presente (exceto protótipos) |

**Tasks obrigatórias**:
- `TASK-[N]`: Verificação TypeScript (`npx tsc --noEmit`)
- `TASK-[N]`: Code review (`sdd-code-reviewer`)
- `TASK-[N]`: Security review (verificar clubeId, sem secrets hardcoded)

**Tasks de teste** (não protótipos):
- `TASK-[N]`: Testes unitários com vitest (meta 60% de cobertura)

**NUNCA gerar**:
- Tasks de deploy
- Tasks de "publicar em produção"
- Tasks que dependem de acesso ao Firebase console

**Decisões de Design → Tasks**:
Para cada DD-N no spec técnico, identificar qual task implementa aquela decisão e adicionar `"design_decisions": ["DD-1"]` na task correspondente.

**Layer 3 deve conter exatamente 3 tasks**:
1. Code Review → invocar `Skill("sdd-code-reviewer")`
2. Performance Review → verificar queries Firestore, re-renders desnecessários
3. Security Review → verificar clubeId, soft delete, sem secrets expostos

### Etapa 4: Seleção de Estratégia

| Modo | Comportamento |
|------|---------------|
| **Express** | Auto-selecionar Batched |
| **Standard** | Perguntar ao usuário |

**Opções de estratégia** (modo standard):

| Estratégia | Tokens | Ideal Para |
|------------|--------|-----------|
| Sequential | ~80K | Features simples (≤5 tasks) |
| Batched (Recomendado) | ~100K | Maioria dos projetos |
| Parallel | ~140K | Features complexas |

**Auto-seleção** (standard): se ≤5 tasks e todas Low → Sequential. Caso contrário perguntar.

### Etapa 5: Exibir Tasks e Aprovar

Exibir tabela de tasks:

```
## Tasks para Aprovação

| ID | Título | Layer | Complexidade | Dependências |
|----|--------|-------|--------------|--------------|
| TASK-001 | Criar tipos TypeScript | 1 | Low | - |
| TASK-002 | Implementar componente principal | 1 | Medium | TASK-001 |
| TASK-003 | Adicionar queries Firestore | 2 | Medium | TASK-002 |
| TASK-004 | Testes unitários | 1 | Low | TASK-002 |
| TASK-005 | Code review | 3 | Low | TASK-003 |
| TASK-006 | Security review | 3 | Low | TASK-003 |

Total: 6 tasks | Layer 1: 3 | Layer 2: 1 | Layer 3: 2
Estratégia: Batched
```

Perguntar ao usuário: "Aprovar estas tasks?"
- Sim → salvar `tasks.json`, atualizar meta.md, continuar
- Ajustar → modo de refinamento
- Cancelar → encerrar

### Etapa 6: Pós-Aprovação

Salvar `sdd/wip/[feature]/3-tasks/tasks.json`.
Atualizar meta.md: `tasks: aprovado`.
Sugerir próximo passo: `/sdd.build`

---

## Estrutura do tasks.json

```json
{
  "feature": "feature-name",
  "execution_strategy": "batched",
  "stats": {
    "total": 6,
    "done": 0,
    "by_layer": { "1": 3, "2": 1, "3": 2 }
  },
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Título curto",
      "description": "2-3 frases de descrição.",
      "status": "pending",
      "layer": 1,
      "complexity": "Low",
      "depends_on": [],
      "files": ["src/components/Feature/Component.tsx"],
      "acceptance_criteria": [
        "AC-1: Componente renderiza sem erros",
        "GATE: npx tsc --noEmit passa sem erros"
      ],
      "references": ["US-1"],
      "design_decisions": ["DD-1"]
    }
  ]
}
```

---

## Layers do Projeto

| Layer | Nome | Propósito | Gates |
|-------|------|-----------|-------|
| **1** | Local/UI | Componentes React, hooks, tipos, lógica local | `npx tsc --noEmit`, `npx vitest run` |
| **2** | Firebase | Operações Firestore, Auth, Security Rules | Sem erros de runtime Firebase |
| **3** | Qualidade | Code review, security, performance | `sdd-code-reviewer` skill |

---

## Validações Antes da Aprovação

- [ ] Cada task tem complexidade (Low/Medium/High)
- [ ] Cada task tem ≥2 critérios de aceitação
- [ ] Dependências referenciam IDs válidos
- [ ] Sem dependências circulares
- [ ] Layer 3 com 3 tasks (code review, performance, security)
- [ ] Task de TypeScript check presente
- [ ] Sem tasks de deploy

---

## Refinamento (--refine)

Ações disponíveis:
- Adicionar nova task
- Modificar task existente
- Dividir task grande
- Remover task
- Ajustar complexidade
- Pronto

---

## Regras do Agente IA

1. **JSON obrigatório** — Gerar `tasks.json`, nunca `tasks.md`
2. **Sem deploys** — Nunca gerar tasks de deploy ou publicação
3. **Layer 3 sempre** — Exceto tipo=prototype
4. **Aprovação explícita** — Exibir todas as tasks antes de pedir aprovação
5. **Help flag** — `/sdd.plan help` exibe apenas o resumo
