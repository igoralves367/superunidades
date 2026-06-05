# clubao-governanca — Fluxo de Governança e Aprovação

**Concluída em**: 2026-06-05
**Branch**: feature/clubao-governanca

## O que foi construído

Fluxo `PENDING → SUBMITTED → APPROVED / REJECTED` por unidade/trimestre no Clubão. CONSELHEIRO envia para aprovação; DIRETORIA aprova ou rejeita. Apenas status APPROVED pontua no ranking.

## Arquivos principais

- `types.ts` — `RankingApprovalStatus`, `RankingApprovalMeta`
- `services/firestoreDb.ts` — `submitRankingUnitForApproval`, `reviewRankingUnitApproval`
- `services/ranking.ts` — filtro por `approvalStatus` em `buildRankingRows`
- `pages/Clubao.tsx` — integração completa
- `components/Clubao/ApprovalStatusBar.tsx` — componente de status + ações

## Retrocompatibilidade

Documentos existentes sem `approvalStatus` são tratados como APPROVED — zero breaking change.
