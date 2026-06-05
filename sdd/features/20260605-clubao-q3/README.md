# clubao-q3 — Requisitos Q3 do Clubão

**Concluída em**: 2026-06-05  
**Branch**: feature/clubao-q3

## O que foi construído

20 requisitos oficiais do 3º Trimestre (Setembro • Outubro • Novembro) do Clubão de Unidades. Completa a ETAPA 0 do Roadmap 2026 (Q1 + Q2 + Q3).

## Arquivos principais

- `seed/rankingSeed.ts` — `rankingRequirementsQuarter3Seed`, `RANKING_SEED_VERSION = 4`

## Migração automática

Qualquer clube existente recebe os requisitos corretos na próxima visita ao Clubão (detecção por `RANKING_SEED_VERSION`). Nenhum ID deprecated — `firestoreDb.ts` não foi alterado.
