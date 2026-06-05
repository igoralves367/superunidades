# Resumo de Implementação — clubao-q2

## O Que Foi Construído

Implementados os 14 requisitos oficiais do 2º Trimestre do Clubão de Unidades, substituindo os 4 seeds genéricos de placeholder que existiam no sistema. Os novos requisitos cobrem 5 categorias: Evangelismo (3), Vida Espiritual e Igreja (6), Família (2), Desenvolvimento do Desbravador (1) e Finanças (2).

A migração é automática: na próxima visita ao módulo Clubão, cada clube existente recebe os 14 requisitos reais e tem os 4 placeholders removidos. Dados de progresso (`ranking_progress`) não são afetados.

## Decisões Técnicas Tomadas

- **DD-1**: `RANKING_SEED_VERSION` bumped de 2 para 3 — gatilho automático de re-seed sem intervenção manual
- **DD-2**: `batch.delete()` explícito para os 4 IDs deprecated — necessário porque `{ merge: true }` não remove documentos existentes com IDs que saíram do seed
- **DD-3**: `q2-socio-desbravador` usa `QUANTITY_WITH_PENALTY` com `penaltyType: 'MANUAL'` — a penalidade exige input manual (número de desistências varia)
- **DD-4**: `DEPRECATED_SEED_IDS_V2_TO_V3` exportado como constante nomeada — permite rastreabilidade e facilita o mesmo padrão para v3→v4 (Q3)

## Arquivos Criados/Modificados

- `seed/rankingSeed.ts` — versão 3, novo array `rankingRequirementsQuarter2Seed` (14 seeds), constante `DEPRECATED_SEED_IDS_V2_TO_V3`, `DEFAULT_RANKING_REQUIREMENT_SEEDS` atualizado
- `services/firestoreDb.ts` — import atualizado, `ensureDefaultRanking` agora deleta IDs deprecated antes do batch de upsert

## Padrões Aplicados

- **Multi-tenant**: todas operações Firestore passam `clubId` via `ensureDefaultRanking(clubId)`
- **Batch operations**: deleção dos deprecated + upsert dos novos em um único `writeBatch`
- **Seed versionado**: padrão `RANKING_SEED_VERSION` + meta doc garante idempotência

## Métricas

- Tasks: 2/2 arquivos modificados
- TypeScript errors nos arquivos da feature: 0
- Erros pré-existentes no projeto (Modal.tsx, firebase.ts): inalterados
