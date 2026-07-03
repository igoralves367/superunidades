# Progresso — validacoes-clubao

## Status: implementação completa (11/11 tasks)

| Task | Descrição | Status |
|------|-----------|--------|
| TASK-001 | Tipos TypeScript (batizado, pgNome, validacaoMeta, AutoFrequenciaResult) | done |
| TASK-002 | buildAutoFrequencia + módulo puro frequencia.ts | done |
| TASK-003 | FrequenciaAutoCard | done |
| TASK-004 | Forms manuais (Manual, Devocional, Classes) | done |
| TASK-005 | ValidacaoDetailModal + ValidacaoUnitCard | done |
| TASK-006 | ValidacoesPanel + integração tabs Clubão | done |
| TASK-007 | Campos batizado e pgNome em Membros | done |
| TASK-008 | Testes unitários buildAutoFrequencia (6 testes) | done |
| TASK-009 | Code review | done — APROVADO COM RESSALVAS |
| TASK-010 | Performance review | done |
| TASK-011 | Security review | done |

## Quality Gates
- `npx tsc --noEmit`: limpo (exceto erros pré-existentes Modal.tsx/firebase.ts)
- `npx vitest run`: 15 testes passando (9 frequência + 6 validações)
- `npm run build`: OK

## Decisões de implementação
- Reuso de `ranking_progress` (DD-1): validações persistem em `validacaoMeta` no entry existente; pontos fluem para o ranking via recompute.
- `buildFrequencySummary` movido para `services/frequencia.ts` (módulo puro) para evitar import circular Reunioes↔firestoreDb e permitir teste sem React.
- Frequência conselheiros: mapeada para `completed`/`penaltyInput` do requisito `BOOLEAN_WITH_PENALTY` (penalidade FIXED 100). Magnitude por conselheiro registrada em `validacaoMeta.counselorAbsences` para visibilidade.
- Classes (`BOOLEAN`): `completed` quando todos os ativos confirmados; ids confirmados em `notes`, contagem em `validacaoMeta.dbvsAtivosNaClasse`.

## Ressalvas (não bloqueantes)
- `loadData` do painel sem `catch` (consistente com Clubão atual).
- `listPresencasPorTrimestre` filtra no cliente (limitação MVP herdada).
- Uso de `React.FC` (consistente com o projeto).

## Pendente
- Teste manual no browser (golden path: validar uma unidade, conferir reflexo no ranking).
- `/sdd.finish`.
