# clubao-q2 — Requisitos Q2 do Clubão

**Concluída em**: 2026-06-05  
**Branch**: feature/clubao-q2

## O que foi construído

14 requisitos oficiais do 2º Trimestre (Junho • Julho • Agosto) do Clubão de Unidades, substituindo 4 seeds genéricos de placeholder.

## Arquivos principais

- `seed/rankingSeed.ts` — `rankingRequirementsQuarter2Seed`, `DEPRECATED_SEED_IDS_V2_TO_V3`, `RANKING_SEED_VERSION = 3`
- `services/firestoreDb.ts` — `ensureDefaultRanking` deleta IDs deprecated v2 antes do upsert

## Migração automática

Qualquer clube existente recebe os requisitos corretos na próxima visita ao Clubão (detecção por `RANKING_SEED_VERSION`).
