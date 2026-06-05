# Spec Técnico — Clubão Q2

## Identificação
- **Feature**: clubao-q2
- **Versão**: 1.0
- **Status**: pendente de aprovação

---

## Escopo da Mudança

Apenas **`seed/rankingSeed.ts`** e **`services/firestoreDb.ts`** precisam ser modificados. Nenhuma mudança de UI, types, components ou outros services é necessária.

---

## Arquivo: `seed/rankingSeed.ts`

### 1. Incrementar versão do seed

```ts
// ANTES
export const RANKING_SEED_VERSION = 2;

// DEPOIS
export const RANKING_SEED_VERSION = 3;
```

### 2. Criar `rankingRequirementsQuarter2Seed`

Adicionar após `rankingRequirementsQuarter1Seed`, antes de `DEFAULT_RANKING_REQUIREMENT_SEEDS`:

```ts
export const rankingRequirementsQuarter2Seed: RankingRequirementSeed[] = [
  // --- Evangelismo ---
  {
    id: 'q2-classe-biblica',
    quarterNumber: 2,
    category: 'Evangelismo',
    name: 'Classe Bíblica',
    description: 'Todos os desbravadores não batizados devem estar frequentando a Classe Bíblica.',
    points: 300,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 1, active: true
  },
  {
    id: 'q2-capelania',
    quarterNumber: 2,
    category: 'Evangelismo',
    name: 'Capelania',
    description: 'Realizar capelania no clube com organização e participação.',
    points: 200,
    ruleType: 'BOOLEAN_WITH_BONUS',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: true, bonusType: 'FIXED', bonusValue: 50,
    bonusDescription: 'Bônus de +50 pontos para a capelania mais criativa.',
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 2, active: true
  },
  {
    id: 'q2-ano-biblico',
    quarterNumber: 2,
    category: 'Evangelismo',
    name: 'Ano Bíblico',
    description: 'Todo desbravador receberá Bíblia personalizada com calendário do Ano Bíblico. Avaliação por participação nas atividades bíblicas propostas, incluindo Kahoot nas capelanias.',
    points: 400,
    ruleType: 'BOOLEAN_WITH_BONUS',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: true, bonusType: 'FIXED', bonusValue: 20,
    bonusDescription: 'Bônus de +20 pontos para a unidade vencedora do concurso bíblico em cada capelania.',
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 3, active: true
  },
  // --- Vida Espiritual e Igreja ---
  {
    id: 'q2-impacto-esperanca',
    quarterNumber: 2,
    category: 'Vida Espiritual e Igreja',
    name: 'Impacto Esperança',
    description: 'Participação nas ações do Impacto Esperança.',
    points: 100,
    ruleType: 'BOOLEAN_WITH_BONUS',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: true, bonusType: 'FIXED', bonusValue: 50,
    bonusDescription: 'Bônus de +50 pontos com 100% da unidade presente.',
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 4, active: true
  },
  {
    id: 'q2-dons-talentos',
    quarterNumber: 2,
    category: 'Vida Espiritual e Igreja',
    name: 'Dons e Talentos',
    description: 'Todos os conselheiros deverão estar ajudando em outros departamentos da igreja, além do Clube de Desbravadores.',
    points: 100,
    ruleType: 'BOOLEAN_WITH_PENALTY',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'FIXED', penaltyValue: 100,
    penaltyDescription: 'Perda de 100 pontos caso não cumpra.',
    maxManualScore: null, displayOrder: 5, active: true
  },
  {
    id: 'q2-quebrando-silencio',
    quarterNumber: 2,
    category: 'Vida Espiritual e Igreja',
    name: 'Quebrando o Silêncio',
    description: 'Participação na campanha Quebrando o Silêncio.',
    points: 100,
    ruleType: 'BOOLEAN_WITH_BONUS',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: true, bonusType: 'FIXED', bonusValue: 50,
    bonusDescription: 'Bônus de +50 pontos com 100% da unidade presente.',
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 6, active: true
  },
  {
    id: 'q2-unidade-igreja',
    quarterNumber: 2,
    category: 'Vida Espiritual e Igreja',
    name: 'Unidade/Igreja',
    description: 'Realizar 01 Escola Sabatina e 01 Culto JA conduzidos pela unidade.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 7, active: true
  },
  {
    id: 'q2-jejum',
    quarterNumber: 2,
    category: 'Vida Espiritual e Igreja',
    name: 'Jejum',
    description: 'Participação mínima de 50% da unidade no jejum.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 8, active: true
  },
  {
    id: 'q2-desafio-memoria',
    quarterNumber: 2,
    category: 'Vida Espiritual e Igreja',
    name: 'Desafio da Memória',
    description: 'Um desbravador por unidade recita o desafio mensal.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 9, active: true
  },
  // --- Família ---
  {
    id: 'q2-pais-presentes',
    quarterNumber: 2,
    category: 'Família',
    name: 'Pais Presentes',
    description: 'Levar pais para eventos do clube ou da unidade.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 10, active: true
  },
  {
    id: 'q2-reunioes-pais',
    quarterNumber: 2,
    category: 'Família',
    name: 'Reuniões de Pais',
    description: '80% de presença dos pais nas reuniões convocadas.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 11, active: true
  },
  // --- Desenvolvimento do Desbravador ---
  {
    id: 'q2-nos-amarras',
    quarterNumber: 2,
    category: 'Desenvolvimento do Desbravador',
    name: 'Nós e Amarras',
    description: 'A cada reunião em que se pedir os nós, a unidade receberá 10 pontos se alcançar sucesso na execução dos nós.',
    points: 10,
    ruleType: 'RECURRING',
    requiresQuantity: true,
    quantityLabel: 'Quantidade de reuniões com êxito em nós e amarras',
    pointsPerUnit: 10,
    maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 12, active: true
  },
  // --- Finanças ---
  {
    id: 'q2-socio-desbravador',
    quarterNumber: 2,
    category: 'Finanças',
    name: 'Sócio Desbravador',
    description: 'Meta de 04 sócios por unidade assíduos durante o ano. 100 pontos por cada sócio conquistado. O sócio pode ser pais/responsáveis, membros da igreja ou amigos externos.',
    points: 400,
    ruleType: 'QUANTITY_WITH_PENALTY',
    requiresQuantity: true,
    quantityLabel: 'Quantidade de sócios conquistados',
    pointsPerUnit: 100,
    maxQuantity: 4,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'MANUAL', penaltyValue: null,
    penaltyDescription: 'Perda de 100 pontos a cada sócio desistente ou 400 pontos caso não consiga nenhum sócio.',
    maxManualScore: null, displayOrder: 13, active: true
  },
  {
    id: 'q2-vendas-unidade',
    quarterNumber: 2,
    category: 'Finanças',
    name: 'Vendas na Unidade',
    description: 'Cada unidade deverá ter pelo menos uma venda durante o ano para comprar itens da unidade.',
    points: 200,
    ruleType: 'BOOLEAN_WITH_PENALTY',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'FIXED', penaltyValue: 200,
    penaltyDescription: 'Perda de 200 pontos caso não cumpra.',
    maxManualScore: null, displayOrder: 14, active: true
  }
];
```

### 3. IDs dos seeds genéricos a remover

Os seguintes IDs existem no Firestore de clubes já criados e devem ser deletados durante o re-seed:

```ts
export const DEPRECATED_SEED_IDS_V2_TO_V3 = [
  'req_acao_missionaria',
  'req_reuniao_fora',
  'req_culto_presenca',
  'req_avaliacao_manual'
];
```

### 4. Atualizar `DEFAULT_RANKING_REQUIREMENT_SEEDS`

```ts
// ANTES
export const DEFAULT_RANKING_REQUIREMENT_SEEDS: RankingRequirementSeed[] = [
  ...rankingRequirementsQuarter1Seed,
  { id: 'req_acao_missionaria', ... },
  { id: 'req_reuniao_fora', ... },
  { id: 'req_culto_presenca', ... },
  { id: 'req_avaliacao_manual', ... }
];

// DEPOIS
export const DEFAULT_RANKING_REQUIREMENT_SEEDS: RankingRequirementSeed[] = [
  ...rankingRequirementsQuarter1Seed,
  ...rankingRequirementsQuarter2Seed
];
```

---

## Arquivo: `services/firestoreDb.ts`

### Modificação em `ensureDefaultRanking`

Após o bump de versão, a função deve deletar os IDs deprecated antes de inserir os novos seeds:

```ts
import { RANKING_SEED_VERSION, DEPRECATED_SEED_IDS_V2_TO_V3, buildDefaultRankingQuarters, buildDefaultRankingRequirements } from '../seed/rankingSeed';

// Dentro de ensureDefaultRanking, após criar o batch:
DEPRECATED_SEED_IDS_V2_TO_V3.forEach(id => {
  batch.delete(doc(db, 'clubs', clubId, 'ranking_requirements', id));
});
```

---

## Pontuação Máxima Q2

| Categoria | Pts base |
|-----------|----------|
| Evangelismo | 900 |
| Vida Espiritual e Igreja | 600 |
| Família | 200 |
| Desenvolvimento do Desbravador | — (ilimitado/recorrente) |
| Finanças | 400 |
| **Total base** | **2.100** |

Bônus possíveis:
- Capelania mais criativa: +50
- Ano Bíblico concurso (por capelania): +20 x N
- Impacto Esperança 100%: +50
- Quebrando o Silêncio 100%: +50

---

## Impacto e Riscos

| Item | Avaliação |
|------|-----------|
| Mudança de UI | Nenhuma |
| Mudança de types | Nenhuma |
| Mudança de services de cálculo | Nenhuma |
| Risco de perda de dados | Baixo — `ranking_progress` não é tocado |
| Risco de rollback | Baixo — `RANKING_SEED_VERSION` pode ser revertido para 2 |
| Compatibilidade com Q1 existente | Total — IDs de Q1 não são afetados |

---

## Ordem de Implementação

1. Adicionar `rankingRequirementsQuarter2Seed` em `seed/rankingSeed.ts`
2. Adicionar `DEPRECATED_SEED_IDS_V2_TO_V3` em `seed/rankingSeed.ts`
3. Atualizar `DEFAULT_RANKING_REQUIREMENT_SEEDS` para usar o novo array
4. Incrementar `RANKING_SEED_VERSION = 3`
5. Atualizar `ensureDefaultRanking` em `services/firestoreDb.ts` para deletar IDs deprecated
6. Rodar `npm run build` — sem erros TypeScript esperados (nenhum tipo novo)
