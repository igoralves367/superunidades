# Spec Técnico — Clubão Q3

## Identificação
- **Feature**: clubao-q3
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
export const RANKING_SEED_VERSION = 3;

// DEPOIS
export const RANKING_SEED_VERSION = 4;
```

### 2. Criar `rankingRequirementsQuarter3Seed`

Adicionar após `rankingRequirementsQuarter2Seed`, antes de `DEFAULT_RANKING_REQUIREMENT_SEEDS`:

```ts
export const rankingRequirementsQuarter3Seed: RankingRequirementSeed[] = [
  // --- Impacto Social ---
  {
    id: 'q3-dia-fazer-bem',
    quarterNumber: 3,
    category: 'Impacto Social',
    name: 'Dia de Fazer o Bem',
    description: 'Realizar ações sociais como limpeza, doações ou ajuda comunitária.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 1, active: true
  },
  {
    id: 'q3-clube-no-lar',
    quarterNumber: 3,
    category: 'Impacto Social',
    name: 'Clube no Lar',
    description: 'Realizar pelo menos uma vez na semana um culto na casa de um desbravador com meditação, louvor e oração.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 2, active: true
  },
  {
    id: 'q3-cesta-basica',
    quarterNumber: 3,
    category: 'Impacto Social',
    name: 'Cesta Básica',
    description: 'Arrecadar 01 cesta básica completa.',
    points: 100,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 3, active: true
  },
  {
    id: 'q3-semana-lenco',
    quarterNumber: 3,
    category: 'Impacto Social',
    name: 'Semana do Lenço',
    description: 'Uso do lenço durante toda a semana por todos da unidade.',
    points: 200,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 4, active: true
  },
  // --- Engajamento e Sustentação ---
  {
    id: 'q3-socio-trimestral',
    quarterNumber: 3,
    category: 'Engajamento e Sustentação',
    name: 'Sócio Desbravador (Trimestral)',
    description: 'Meta de 02 sócios no trimestre.',
    points: 100,
    ruleType: 'BOOLEAN_WITH_PENALTY',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'FIXED', penaltyValue: 50,
    penaltyDescription: 'Perda de 50 pontos caso não consiga 02 sócios no trimestre.',
    maxManualScore: null, displayOrder: 5, active: true
  },
  // --- Estrutura e Identidade ---
  {
    id: 'q3-barraca',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Barraca',
    description: '01 barraca para 07 pessoas como patrimônio da unidade.',
    points: 800,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 6, active: true
  },
  {
    id: 'q3-bandeirim',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Bandeirim',
    description: 'Bordado com o nome da unidade.',
    points: 150,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 7, active: true
  },
  {
    id: 'q3-mastro',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Mastro',
    description: 'Apresentar mastro organizado.',
    points: 150,
    ruleType: 'BOOLEAN_WITH_BONUS',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: true, bonusType: 'MANUAL', bonusValue: null,
    bonusDescription: 'Bônus extra para o mastro mais criativo (valor definido pela diretoria).',
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 8, active: true
  },
  {
    id: 'q3-uniforme-atividades',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Uniforme de Atividades',
    description: 'Todos devem possuir camisa do clube.',
    points: 100,
    ruleType: 'BOOLEAN_WITH_PENALTY',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'PER_UNIT', penaltyValue: 100,
    penaltyDescription: 'Perda de 100 pontos por desbravador sem camisa do clube.',
    maxManualScore: null, displayOrder: 9, active: true
  },
  {
    id: 'q3-uniforme-oficial',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Uniforme Oficial',
    description: '100% da unidade com uniforme completo.',
    points: 300,
    ruleType: 'BOOLEAN_WITH_PENALTY',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'PER_UNIT', penaltyValue: 300,
    penaltyDescription: 'Perda de 300 pontos por desbravador sem uniforme completo.',
    maxManualScore: null, displayOrder: 10, active: true
  },
  {
    id: 'q3-camisa-mibes',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Camisa da MIBES',
    description: 'Todos devem possuir camisa da MIBES.',
    points: 100,
    ruleType: 'BOOLEAN_WITH_PENALTY',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: true, penaltyType: 'PER_UNIT', penaltyValue: 50,
    penaltyDescription: 'Perda de 50 pontos por desbravador sem camisa da MIBES.',
    maxManualScore: null, displayOrder: 11, active: true
  },
  {
    id: 'q3-portal-clube',
    quarterNumber: 3,
    category: 'Estrutura e Identidade',
    name: 'Portal do Clube',
    description: 'Apresentar proposta de portal.',
    points: 150,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 12, active: true
  },
  // --- Consagração Espiritual ---
  {
    id: 'q3-batismo',
    quarterNumber: 3,
    category: 'Consagração Espiritual',
    name: 'Batismo',
    description: 'Alcançar 01 batismo no ano.',
    points: 800,
    ruleType: 'BOOLEAN',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: null, displayOrder: 13, active: true
  },
  // --- Desenvolvimento do Desbravador ---
  {
    id: 'q3-nos-amarras',
    quarterNumber: 3,
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
    maxManualScore: null, displayOrder: 14, active: true
  },
  // --- Finanças ---
  {
    id: 'q3-socio-desbravador',
    quarterNumber: 3,
    category: 'Finanças',
    name: 'Sócio Desbravador (Anual)',
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
    maxManualScore: null, displayOrder: 15, active: true
  },
  // --- Concursos ---
  {
    id: 'q3-oratoria',
    quarterNumber: 3,
    category: 'Concursos',
    name: 'Oratória',
    description: 'Serão avaliados: coerência com o tema, fundamentação bíblica e desenvolvimento da oratória.',
    points: 0,
    ruleType: 'MANUAL_SCORE',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: 350, displayOrder: 16, active: true
  },
  {
    id: 'q3-musica',
    quarterNumber: 3,
    category: 'Concursos',
    name: 'Música',
    description: 'Tema: "Sempre Desbravador". Letra e música devem ser originais e criadas pela unidade.',
    points: 0,
    ruleType: 'MANUAL_SCORE',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: 350, displayOrder: 17, active: true
  },
  {
    id: 'q3-poesia',
    quarterNumber: 3,
    category: 'Concursos',
    name: 'Poesia',
    description: 'Tema: "Sempre Desbravador". Duração até 03 minutos. Avaliação: conteúdo, criatividade e apresentação.',
    points: 0,
    ruleType: 'MANUAL_SCORE',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: 250, displayOrder: 18, active: true
  },
  {
    id: 'q3-desafio-nos-amarras',
    quarterNumber: 3,
    category: 'Concursos',
    name: 'Desafio Nós e Amarras',
    description: 'A unidade que realizar no menor tempo todos os nós da classe de amigo.',
    points: 0,
    ruleType: 'MANUAL_SCORE',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: 300, displayOrder: 19, active: true
  },
  {
    id: 'q3-ordem-unida',
    quarterNumber: 3,
    category: 'Concursos',
    name: 'Ordem Unida',
    description: 'Avalia disciplina, organização, postura e domínio dos comandos. Mínimo 80% da unidade. 5 a 7 minutos (-1 ponto a cada 10s acima do tempo). Critérios: comandos parados (20), em movimento (20), postura (10), alinhamento básico (10), comando (15), avançados (15), alinhamento avançado (10), brado (15). Extras: até +10 (apito, gestos, corneta).',
    points: 0,
    ruleType: 'MANUAL_SCORE',
    requiresQuantity: false, quantityLabel: null, pointsPerUnit: null, maxQuantity: null,
    allowBonus: false, bonusType: null, bonusValue: null, bonusDescription: null,
    allowPenalty: false, penaltyType: null, penaltyValue: null, penaltyDescription: null,
    maxManualScore: 115, displayOrder: 20, active: true
  }
];
```

### 3. Atualizar `DEFAULT_RANKING_REQUIREMENT_SEEDS`

```ts
// ANTES
export const DEFAULT_RANKING_REQUIREMENT_SEEDS: RankingRequirementSeed[] = [
  ...rankingRequirementsQuarter1Seed,
  ...rankingRequirementsQuarter2Seed
];

// DEPOIS
export const DEFAULT_RANKING_REQUIREMENT_SEEDS: RankingRequirementSeed[] = [
  ...rankingRequirementsQuarter1Seed,
  ...rankingRequirementsQuarter2Seed,
  ...rankingRequirementsQuarter3Seed
];
```

---

## Arquivo: `services/firestoreDb.ts`

Nenhuma mudança necessária além do import já existente — não há IDs deprecated para deletar nesta versão (os placeholders do Q3 foram removidos no Q2). A detecção de `RANKING_SEED_VERSION = 4` já é suficiente para disparar o re-seed.

---

## Pontuação Máxima Q3

| Categoria | Pts base |
|-----------|----------|
| Impacto Social | 500 |
| Engajamento e Sustentação | 100 |
| Estrutura e Identidade | 1.750 |
| Consagração Espiritual | 800 |
| Desenvolvimento do Desbravador | — (ilimitado/recorrente) |
| Finanças | 400 |
| Concursos | 1.350 (máx manual) |
| **Total base (sem concursos)** | **3.550** |
| **Total com concursos** | **4.900** |

---

## Impacto e Riscos

| Item | Avaliação |
|------|-----------|
| Mudança de UI | Nenhuma |
| Mudança de types | Nenhuma |
| Mudança de services de cálculo | Nenhuma |
| Risco de perda de dados | Baixo — `ranking_progress` não é tocado |
| Compatibilidade com Q1 e Q2 | Total — IDs de Q1 e Q2 não são afetados |

---

## Ordem de Implementação

1. Adicionar `rankingRequirementsQuarter3Seed` em `seed/rankingSeed.ts`
2. Atualizar `DEFAULT_RANKING_REQUIREMENT_SEEDS` para incluir o novo array
3. Incrementar `RANKING_SEED_VERSION = 4`
4. Rodar `npx tsc --noEmit` — sem erros esperados
