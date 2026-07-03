# Progress — clubao-validacao-conselheiro

## Status: IMPLEMENTADO (aguarda teste no browser)

## Tasks
- [x] TASK-001 — modelo de dados (`types.ts`): RequirementSubmissionStatus, RequirementSubmission, campo `submission` em RankingProgressEntry
- [x] TASK-002 — serviço (`firestoreDb.ts`): submitRequirementByCounselor, withdrawRequirementSubmission, reviewRequirementSubmission + helper patchRequirementEntry; lógica pura extraída em `clubaoSubmission.ts`
- [x] TASK-003 — teste vitest (`clubaoSubmission.test.ts`): 4 casos, todos passando
- [x] TASK-004 — DNA (`UnitDnaPanel.tsx` + `CounselorRequirementsList.tsx`): seletor de trimestre (atual/anterior), lista de auto-declaração para conselheiro
- [x] TASK-005 — Diretoria (`Clubao.tsx` + `Aprovacoes/AprovacoesPanel.tsx` + `AprovacaoUnitModal.tsx`): aba "Validação por Unidade" com aprovar/reprovar

## Validação técnica
- `tsc --noEmit`: zero erros novos (restam apenas pré-existentes em Modal.tsx e firebase.ts)
- vitest: 4/4 passando

## Pendente
- Teste no browser (requer login Firebase do usuário): marcar como conselheiro → aprovar como diretoria → conferir reflexo no ranking.
- Decisão de produto: incluir INSTRUTOR no acesso ao menu DNA (hoje só DIRETORIA/CONSELHEIRO).
