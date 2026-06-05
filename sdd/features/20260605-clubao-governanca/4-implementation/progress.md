# Resumo de Implementação — clubao-governanca

## O Que Foi Construído

Fluxo de governança e aprovação para o Clubão de Unidades. Status `PENDING → SUBMITTED → APPROVED / REJECTED` por documento `ranking_progress`. CONSELHEIRO envia para aprovação; DIRETORIA aprova ou rejeita. Somente unidades APPROVED pontuam no ranking público.

## Arquivos Modificados

- `types.ts` — `RankingApprovalStatus`, `RankingApprovalMeta`, campos opcionais em `RankingUnitProgressDoc`
- `services/ranking.ts` — `buildRankingRows` filtra por `approvalStatus === 'APPROVED'`; documentos sem status são tratados como APPROVED (retrocompatibilidade)
- `services/firestoreDb.ts` — funções `submitRankingUnitForApproval`, `reviewRankingUnitApproval`; `saveRankingUnitProgress` com `forceApprove` (DIRETORIA) e reset automático quando CONSELHEIRO edita um doc APPROVED
- `pages/Clubao.tsx` — `ApprovalStatusBar` integrado, handlers `handleSubmitForApproval / handleApprove / handleReject`, campos bloqueados quando `isFieldReadonly`, badge de status na lista do ranking
- `components/Clubao/ApprovalStatusBar.tsx` — componente novo com badge de status + botões condicionais por perfil

## Decisões Técnicas

- **Retrocompatibilidade**: documentos sem `approvalStatus` são tratados como APPROVED em `buildRankingRows` (`!doc?.approvalStatus || doc.approvalStatus === 'APPROVED'`) — dados existentes continuam pontuando.
- **forceApprove em saveRankingUnitProgress**: DIRETORIA passa `forceApprove: true` e o save define status como APPROVED diretamente, sem precisar de passo extra.
- **Reset no save do CONSELHEIRO**: se o doc estava APPROVED e CONSELHEIRO edita, status volta para PENDING automaticamente (edição invalida aprovação anterior).

## Métricas

- Tasks: 8/8 concluídas
- TypeScript errors novos: 0
- Arquivos modificados: 4
- Arquivo criado: 1
