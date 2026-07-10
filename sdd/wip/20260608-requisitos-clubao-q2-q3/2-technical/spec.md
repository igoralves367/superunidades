# Spec Técnico — requisitos-clubao-q2-q3

## Visão Geral

Mudança exclusivamente em `seed/rankingSeed.ts`. Substituir os 4 seeds placeholder de Q2/Q3 por 34 requisitos reais (14 de Q2 + 20 de Q3), seguindo o mesmo padrão estrutural dos 19 requisitos de Q1.

Nenhuma outra camada é afetada — o painel de Validações e o ranking já consomem os requisitos dinamicamente pelo `quarterId` e pelos IDs no padrão `q{N}-{tipo}`.

## Arquivo Afetado

```
seed/rankingSeed.ts  (única modificação)
```

## Estrutura dos Novos Seeds

### Padrão de IDs
- Q2: `q2-{tipo-kebab-case}`
- Q3: `q3-{tipo-kebab-case}`

### Novos exports

```typescript
export const rankingRequirementsQuarter2Seed: RankingRequirementSeed[]  // 14 itens
export const rankingRequirementsQuarter3Seed: RankingRequirementSeed[]  // 20 itens
```

`DEFAULT_RANKING_REQUIREMENT_SEEDS` passa a ser:
```typescript
export const DEFAULT_RANKING_REQUIREMENT_SEEDS = [
  ...rankingRequirementsQuarter1Seed,   // 19 itens (existente)
  ...rankingRequirementsQuarter2Seed,   // 14 itens (novo)
  ...rankingRequirementsQuarter3Seed,   // 20 itens (novo)
];
```

Os 4 itens placeholder antigos (req_acao_missionaria, req_reuniao_fora, req_culto_presenca, req_avaliacao_manual) são **removidos**.

## Mapeamento Completo dos Seeds — Q2

| displayOrder | id | quarterNumber | category | name | points | ruleType | bonus | penalty |
|---|---|---|---|---|---|---|---|---|
| 1 | q2-classe-biblica | 2 | Evangelismo | Classe Bíblica | 300 | BOOLEAN | — | — |
| 2 | q2-capelania | 2 | Evangelismo | Capelania | 200 | BOOLEAN_WITH_BONUS | FIXED +50 | — |
| 3 | q2-ano-biblico | 2 | Evangelismo | Ano Bíblico | 400 | BOOLEAN_WITH_BONUS | FIXED +20/capelania | — |
| 4 | q2-impacto-esperanca | 2 | Vida Espiritual e Igreja | Impacto Esperança | 100 | BOOLEAN_WITH_BONUS | FIXED +50 (100% unidade) | — |
| 5 | q2-dons-talentos | 2 | Vida Espiritual e Igreja | Dons e Talentos | 100 | BOOLEAN_WITH_PENALTY | — | FIXED -100 |
| 6 | q2-quebrando-silencio | 2 | Vida Espiritual e Igreja | Quebrando o Silêncio | 100 | BOOLEAN_WITH_BONUS | FIXED +50 (100% unidade) | — |
| 7 | q2-unidade-igreja | 2 | Vida Espiritual e Igreja | Unidade/Igreja | 100 | BOOLEAN | — | — |
| 8 | q2-jejum | 2 | Vida Espiritual e Igreja | Jejum | 100 | BOOLEAN | — | — |
| 9 | q2-desafio-memoria | 2 | Vida Espiritual e Igreja | Desafio da Memória | 100 | BOOLEAN | — | — |
| 10 | q2-pais-presentes | 2 | Família | Pais Presentes | 100 | BOOLEAN | — | — |
| 11 | q2-reunioes-pais | 2 | Família | Reuniões de Pais | 100 | BOOLEAN | — | — |
| 12 | q2-nos-amarras | 2 | Desenvolvimento do Desbravador | Nós e Amarras | 10 | RECURRING | — | — |
| 13 | q2-socio-desbravador | 2 | Sócio Desbravador | Sócio Desbravador | 400 | QUANTITY_WITH_PENALTY | — | MANUAL -100/desistente ou -400 se zero |
| 14 | q2-vendas-unidade | 2 | Finanças | Vendas na Unidade | 200 | BOOLEAN_WITH_PENALTY | — | FIXED -200 |

## Mapeamento Completo dos Seeds — Q3

| displayOrder | id | quarterNumber | category | name | points | ruleType | bonus | penalty |
|---|---|---|---|---|---|---|---|---|
| 1 | q3-dia-fazer-bem | 3 | Impacto Social | Dia de Fazer o Bem | 100 | BOOLEAN | — | — |
| 2 | q3-clube-no-lar | 3 | Impacto Social | Clube no Lar | 100 | BOOLEAN | — | — |
| 3 | q3-cesta-basica | 3 | Impacto Social | Cesta Básica | 100 | BOOLEAN | — | — |
| 4 | q3-semana-lenco | 3 | Impacto Social | Semana do Lenço | 200 | BOOLEAN | — | — |
| 5 | q3-socio-trimestre | 3 | Engajamento e Sustentação | Sócio Desbravador (Trimestre) | 100 | QUANTITY_WITH_PENALTY | — | FIXED -50 se não atingir 2 |
| 6 | q3-barraca | 3 | Estrutura e Identidade | Barraca | 800 | BOOLEAN | — | — |
| 7 | q3-bandeirim | 3 | Estrutura e Identidade | Bandeirim | 150 | BOOLEAN | — | — |
| 8 | q3-mastro | 3 | Estrutura e Identidade | Mastro | 150 | BOOLEAN_WITH_BONUS | FIXED +pontos (mastro mais criativo) | — |
| 9 | q3-uniforme-atividades | 3 | Estrutura e Identidade | Uniforme de Atividades | 100 | BOOLEAN_WITH_PENALTY | — | FIXED -100/desbravador sem camisa |
| 10 | q3-uniforme-oficial | 3 | Estrutura e Identidade | Uniforme Oficial | 300 | BOOLEAN_WITH_PENALTY | — | FIXED -300/desbravador sem uniforme |
| 11 | q3-camisa-mibes | 3 | Estrutura e Identidade | Camisa da MIBES | 100 | BOOLEAN_WITH_PENALTY | — | FIXED -50/desbravador sem |
| 12 | q3-portal-clube | 3 | Estrutura e Identidade | Portal do Clube | 150 | BOOLEAN | — | — |
| 13 | q3-batismo | 3 | Consagração Espiritual | Batismo | 800 | BOOLEAN | — | — |
| 14 | q3-nos-amarras | 3 | Desenvolvimento do Desbravador | Nós e Amarras | 10 | RECURRING | — | — |
| 15 | q3-socio-desbravador | 3 | Sócio Desbravador | Sócio Desbravador | 400 | QUANTITY_WITH_PENALTY | — | MANUAL -100/desistente ou -400 se zero |
| 16 | q3-oratorio | 3 | Concursos | Oratória | 350 | MANUAL_SCORE | — | — |
| 17 | q3-musica | 3 | Concursos | Música | 350 | MANUAL_SCORE | — | — |
| 18 | q3-poesia | 3 | Concursos | Poesia | 250 | MANUAL_SCORE | — | — |
| 19 | q3-desafio-nos-amarras | 3 | Concursos | Desafio Nós e Amarras | 300 | MANUAL_SCORE | — | — |
| 20 | q3-ordem-unida | 3 | Concurso de Ordem Unida | Ordem Unida | 115 | MANUAL_SCORE | — | — |

## Decisões Técnicas

### DD-1: QUANTITY_WITH_PENALTY para Sócio Desbravador
**Problema**: Sócio Desbravador tem regra composta — 100 pts/sócio + penalidades por desistência.  
**Decisão**: Usar `QUANTITY_WITH_PENALTY` com `penaltyType: 'MANUAL'` e descrição detalhando -100/desistente ou -400 se zero.  
**Motivo**: Mantém consistência com os `ruleType` existentes. A penalidade de desistência é gerenciada manualmente pela diretoria no lançamento.

### DD-2: MANUAL_SCORE para Concursos
**Problema**: Oratória, Música, Poesia e Ordem Unida têm critérios subjetivos avaliados pela diretoria.  
**Decisão**: `MANUAL_SCORE` com `maxManualScore` definido (350, 350, 250, 300, 115).  
**Motivo**: Permite lançamento livre pela diretoria dentro do teto máximo.

### DD-3: Sem novos tipos
**Decisão**: Nenhum novo `RankingRequirementRuleType` é necessário. Os 7 tipos existentes cobrem todos os casos.  
**Motivo**: Evita breaking changes no painel de validações e no ranking.

## Estratégia de Testes
- TypeScript sem erros após a modificação
- `DEFAULT_RANKING_REQUIREMENT_SEEDS.length === 53` (19 + 14 + 20)
- IDs únicos: sem colisões entre Q1, Q2 e Q3
- `buildDefaultRankingRequirements` continua funcionando corretamente
