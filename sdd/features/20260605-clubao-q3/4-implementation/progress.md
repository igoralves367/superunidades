# Resumo de Implementação — clubao-q3

## O Que Foi Construído

20 requisitos oficiais do 3º Trimestre (Setembro • Outubro • Novembro) do Clubão de Unidades, completa a ETAPA 0 do Roadmap 2026.

`RANKING_SEED_VERSION` bumped de 3 para 4. O array `rankingRequirementsQuarter3Seed` foi adicionado ao `DEFAULT_RANKING_REQUIREMENT_SEEDS`, garantindo que clubes novos recebam os seeds automaticamente e clubes existentes recebam via migração automática na próxima visita ao Clubão.

## Arquivos Criados/Modificados

- `seed/rankingSeed.ts` — `RANKING_SEED_VERSION = 4`, `rankingRequirementsQuarter3Seed` (20 seeds), `DEFAULT_RANKING_REQUIREMENT_SEEDS` atualizado

## Decisões Técnicas

- **Sem deprecated IDs**: Os dois placeholders Q3 (`req_culto_presenca`, `req_avaliacao_manual`) foram deletados na migração Q2 (v2→v3). A migração v3→v4 não requer nenhum `batch.delete()` extra — `firestoreDb.ts` não foi alterado.
- **Mastro bônus MANUAL**: O manual não especifica o valor do bônus criativo; usado `bonusType: 'MANUAL'` com `bonusValue: null` para que a diretoria defina manualmente.
- **Penalidades PER_UNIT**: Uniforme de Atividades (-100/desb), Uniforme Oficial (-300/desb), Camisa MIBES (-50/desb) usam `penaltyType: 'PER_UNIT'` conforme redação do manual.

## Categorias

| Categoria | Requisitos | Regra |
|-----------|-----------|-------|
| Impacto Social | 4 | BOOLEAN |
| Engajamento e Sustentação | 1 | BOOLEAN_WITH_PENALTY |
| Estrutura e Identidade | 7 | BOOLEAN / BOOLEAN_WITH_BONUS / BOOLEAN_WITH_PENALTY |
| Consagração Espiritual | 1 | BOOLEAN |
| Desenvolvimento do Desbravador | 1 | RECURRING |
| Finanças | 1 | QUANTITY_WITH_PENALTY |
| Concursos | 5 | MANUAL_SCORE |

## Métricas

- Tasks: 5/5 concluídas
- TypeScript errors novos: 0
- Arquivos modificados: 1
