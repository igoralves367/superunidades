---
name: sdd.finish
description: Validar, finalizar e arquivar feature concluída. Use quando todas as tasks estão done, TypeScript passa e a feature está pronta para mover de wip/ para features/.
model: sonnet
---

# Comando: /sdd.finish

**Descrição**: Validar, finalizar e arquivar feature concluída

**Uso**:
- `/sdd.finish` → Validar e arquivar
- `/sdd.finish --skip-tests` → Pular re-execução de testes (não recomendado)

---

## Ajuda Rápida

> `/sdd.finish help` → Mostra este resumo

**Pré-requisito**: Todas as tasks de `/sdd.build` concluídas, incluindo Layer 3

---

## Pré-Requisitos (BLOQUEANTE)

| Verificação | Em caso de falha |
|-------------|------------------|
| Todas as tasks `done` | Completar com `/sdd.build` |
| TypeScript check passa | Corrigir erros com `/sdd.fix` |
| Layer 3 completo | Executar code/security review |

---

## Workflow (Etapas em Ordem)

### Etapa 1: Verificar Completion

Ler `tasks.json` e verificar:
- Todas as tasks têm `status: done`
- Incluindo Layer 3 (code review, performance, security)

Se tasks pendentes: listar e bloquear.

### Etapa 2: Validações Finais (OBRIGATÓRIAS)

**Validação A: TypeScript**
```bash
npx tsc --noEmit
```
- DEVE retornar 0 erros
- Sem `any` implícito
- Sem imports não resolvidos

**Validação B: Testes**
```bash
npx vitest run
```
- DEVE passar (ou não existir ainda)
- Cobertura informada (meta: 60%)

**Validação C: Build**
```bash
npm run build
```
- DEVE compilar sem erros críticos

**Validação D: Padrões do Projeto**
Verificar (usando `sdd-code-reviewer`):
- [ ] Sem `any` implícito no código da feature
- [ ] Todas as queries Firestore incluem `clubeId`
- [ ] Sem hardcoded secrets (API keys, tokens)
- [ ] Soft delete implementado corretamente (sem `deleteDoc` em recursos principais)
- [ ] `writeBatch` usado em operações compostas
- [ ] Tratamento de erros com `try/catch + console.error`

### Etapa 3: Exibir Relatório de Validação

```
## Relatório de Validação — [feature-name]

✅ TypeScript: 0 erros
✅ Testes: X passando (cobertura: ~XX%)
✅ Build: OK
✅ Multi-tenant: todas queries com clubeId
✅ Sem secrets hardcoded
⚠️ Cobertura abaixo de 60%: [detalhe]

Tasks concluídas: X/X
Layer 1: ✅ | Layer 2: ✅ | Layer 3: ✅
```

Se qualquer validação crítica falhar: BLOQUEAR e listar o que precisa ser corrigido.

### Etapa 4: Gerar Documentação de Conclusão

Criar `sdd/wip/[feature]/4-implementation/progress.md` atualizado:

```markdown
# Resumo de Implementação — [feature-name]

## O Que Foi Construído
[resumo em 2-3 parágrafos do que foi implementado]

## Decisões Técnicas Tomadas
- DD-1: [decisão e resultado]
- DD-2: [decisão e resultado]

## Arquivos Criados/Modificados
- `src/components/...` — [descrição]
- `src/services/...` — [descrição]

## Padrões Aplicados
- Multi-tenant: [como foi aplicado]
- Soft delete: [onde foi usado]
- Batch operations: [onde foi usado]

## Lições Aprendidas / Padrões Descobertos
[padrões que deveriam ser promovidos para sdd/PATTERNS.md]

## Métricas
- Tasks: X/X concluídas
- Cobertura de testes: ~XX%
- TypeScript errors: 0
```

### Etapa 5: Arquivar Feature

```
# Mover feature para features/
sdd/wip/[YYYYMMDD-feature-name]/ → sdd/features/[YYYYMMDD-feature-name]/

# Criar README.md na feature arquivada
sdd/features/[YYYYMMDD-feature-name]/README.md
```

`README.md` resumindo:
- O que foi construído
- Como foi implementado
- Arquivos principais
- Data de conclusão

### Etapa 6: Atualizar PATTERNS.md

Se foram descobertos padrões reutilizáveis durante a implementação:
- Adicionar em `sdd/PATTERNS.md` (criar se não existir)
- Formato: `**Padrão**: descrição | **Por que**: motivo | **Como**: exemplo`

### Etapa 7: Sugestões de PR

Exibir:
```
✅ Feature '[feature-name]' arquivada com sucesso!
   📁 Arquivada em: sdd/features/[YYYYMMDD-feature-name]/
   🌿 Branch: feature/[feature-name]

   Próximos passos:
   1. Criar Pull Request para 'develop'
   2. Solicitar code review do PR
   3. Fazer merge após aprovação
   
   Comando PR:
   gh pr create --title "feat: [descrição da feature]" --base develop
```

---

## Critérios de Arquivamento

A feature SÓ é arquivada quando:
1. ✅ Todas as tasks `done` (incluindo Layer 3)
2. ✅ `npx tsc --noEmit` retorna 0 erros
3. ✅ `npm run build` compila sem erros críticos
4. ✅ Validações D (padrões) aprovadas pelo code reviewer

---

## Regras do Agente IA

1. **Não pular validações** — Todas as validações obrigatórias devem ser executadas
2. **Bloquear se não pronto** — Melhor pausar aqui que arquivar código quebrado
3. **Documentar decisões** — O progress.md é para o próximo desenvolvedor
4. **Promover padrões** — Boas descobertas devem ir para PATTERNS.md
5. **Help flag** — `/sdd.finish help` exibe apenas o resumo
