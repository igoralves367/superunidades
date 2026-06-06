# Spec Técnico — clubao-dna-unidade

## Visão Geral da Arquitetura

O DNA da Unidade é um componente React autônomo (`UnitDnaPanel`) que:
1. Recebe `user: Usuario` (e opcionalmente `unidadeIdOverride`)
2. Carrega os dados necessários do Firestore em paralelo
3. Deriva os 3 indicadores reaproveitando funções puras já existentes
4. Renderiza um cartão com percentuais, estrelas e estados vazios

Não cria entidades, não escreve no Firestore, não possui formulários.

```
App.tsx
  └─ case 'dna-unidade' → UnitDnaPanel (user)
       ├─ Firestore (read-only): quarters, requirements, progress, reunioes, presencas, desbravadores, classes, requisitos, progresso
       ├─ services/ranking.ts → buildRankingRows() → progressPercent
       ├─ services/frequencia.ts → buildFrequencySummary() → unitFrequencyPct
       └─ cálculo inline de progresso de classes (padrão de Progresso.tsx)
```

---

## Camadas Afetadas

### Layer 1 — Componentes e UI

**Componentes novos:**
- `components/UnitDna/UnitDnaPanel.tsx` — componente principal, orquestra dados e renderiza o painel
- `components/UnitDna/DnaIndicatorCard.tsx` — card reutilizável para exibir um indicador (título, valor %, descrição, estrelas opcionais)

**Componentes modificados:**
- `App.tsx` — adicionar `import UnitDnaPanel` + `case 'dna-unidade'` no switch de tabs
- `components/Sidebar.tsx` — adicionar item de navegação "DNA da Unidade" (perfil: CONSELHEIRO e DIRETORIA)

**Tipos TypeScript novos** (`types.ts` — adicionar ao final, sem quebrar existentes):
```ts
export interface UnitDnaData {
  rankingPercent: number | null;       // 0-1; null se sem quarter ativo
  rankingStars: 3 | 4 | 5 | null;      // null se rankingPercent === null
  rankingCompletedCount: number;
  rankingTotalRequirements: number;
  frequencyPercent: number | null;     // 0-100 (já é pct em UnitFrequencySummary); null se sem reuniões
  frequencyMemberCount: number;
  frequencyTotalMeetings: number;
  classesAvgPercent: number | null;    // 0-100; null se nenhum desbravador com classe
  classesCompletedCount: number;       // desbravadores com 100% na classe atual
  classesMemberCount: number;          // desbravadores com classeId atribuído
}
```

**Hooks:**
- Sem hooks customizados — lógica de carregamento fica dentro de `useEffect` no `UnitDnaPanel`

---

### Layer 2 — Firebase

**Coleções lidas (somente leitura):**

| Coleção | Função | Quando |
|---|---|---|
| `clubs/{clubeId}/ranking_quarters` | `fs.listRankingQuarters(clubId)` | Sempre |
| `clubs/{clubeId}/ranking_requirements` | `fs.listRankingRequirements(clubId, quarterId)` | Se quarter ativo encontrado |
| `clubs/{clubeId}/ranking_progress` | `fs.listRankingProgress(clubId, quarterId)` | Se quarter ativo encontrado |
| `clubs/{clubeId}/reunioes` | `fs.listReunioes(clubId)` | Sempre |
| `clubs/{clubeId}/reunioes_presencas` | `fs.listPresencasPorTrimestre(clubId, trimestre)` | Se trimestre mapeado |
| `clubs/{clubeId}/desbravadores` | `fs.listDesbravadores(clubId)` | Sempre |
| `clubs/{clubeId}/classes` | `fs.listClasses(clubId)` | Sempre |
| `clubs/{clubeId}/requisitos` | `fs.listRequisitos(clubId)` | Sempre |
| `clubs/{clubeId}/desbravadores/{id}/progresso` | `fs.listProgressoDesbravador(clubId, id)` | Por cada desbravador da unidade |

**Nenhuma escrita no Firestore.** `writeBatch`: não aplicável.

**Mapeamento `RankingQuarter.number` → `Reuniao.trimestre`:**
Os dois sistemas usam campos independentes. A regra é:
`RankingQuarter.number` (1 | 2 | 3) === `Reuniao.trimestre` numericamente.
O componente passa `activeQuarter.number` como `trimestre` para `buildFrequencySummary`.

**Quarter ativo (mesma lógica do Portal):**
```ts
const activeQuarter =
  quarters.find(q => q.ativo && q.status === 'ACTIVE') ??
  quarters.find(q => q.status === 'CLOSED') ??
  quarters.find(q => q.ativo) ??
  null;
```

---

### Layer 3 — Qualidade

- **Cobertura de testes**: 60% mínimo
- **Segurança**: todas as queries passam `user.clubeId` (nunca hardcoded)
- **Soft delete**: filtrar `d.status === 'ATIVO'` em `Desbravador` (campo `status`, não `ativo`)
- **Multi-tenant**: `user.clubeId` validado antes de qualquer query

---

## Decisões Técnicas

### DD-1: Sem nova coleção Firestore
**Problema**: armazenar o resultado do DNA para evitar recalcular a cada acesso.
**Decisão**: não persistir. Calcular sempre no cliente a partir dos dados existentes.
**Alternativas rejeitadas**: criar documento `dna_snapshots` — violaria a diretriz "zero entidades novas".
**Motivo**: os dados já estão carregados em memória quando o conselheiro acessa o painel; o recálculo é O(n) sobre arrays locais, não requer round-trips adicionais.

### DD-2: Progresso de classes via N queries sequenciais
**Problema**: `listProgressoDesbravador` só aceita um `dbvId` por vez; para N desbravadores são N queries.
**Decisão**: disparar `Promise.all(dbvsDaUnidade.map(d => fs.listProgressoDesbravador(clubId, d.id)))`.
**Alternativas rejeitadas**: coleção agregada de progresso por unidade — não existe.
**Motivo**: desbravadores por unidade tipicamente são 4-8; N queries paralelas são aceitáveis. Se performance for problema, pode ser otimizado depois com cache.

### DD-3: Cálculo de progresso de classe (regra de "concluído")
**Problema**: não existe flag persistida de "avançou de classe".
**Decisão**: percentual individual = `requisitos feitos na classe atual / total de requisitos da classe atual`. "Concluído" = 100%. Média da unidade = média dos percentuais individuais.
**Alternativas rejeitadas**: usar `classeIds.length > 1` — não é confiável (campo legado).
**Motivo**: alinhado com o cálculo já usado em `Progresso.tsx`.

### DD-4: Estrelas derivadas de `progressPercent`
**Problema**: não existe função `calcStars` isolada em `ranking.ts` (confirmado pelo explorer).
**Decisão**: implementar inline no `UnitDnaPanel` com a mesma regra do manual:
`stars = pct >= 0.8 ? 5 : pct >= 0.6 ? 4 : 3`.
**Alternativas rejeitadas**: extrair para `ranking.ts` — fora de escopo desta feature.
**Motivo**: lógica trivial de 3 linhas; não justifica extração.

### DD-5: Componente autônomo (portátil)
**Problema**: `PortalUnidade.tsx` não existe em `develop`.
**Decisão**: `UnitDnaPanel` recebe `user: Usuario` e `unidadeIdOverride?: string | null`. Acessível via tab própria (`dna-unidade`) enquanto o Portal não estiver em `develop`. Quando reconciliado, é só importar e renderizar `<UnitDnaPanel user={user} />` dentro do Portal.
**Alternativas rejeitadas**: aguardar merge do Portal — bloquearia o desenvolvimento.
**Motivo**: desacoplamento por design; sem risco de conflito futuro.

---

## Estrutura de Arquivos

```
src/
  components/
    UnitDna/
      UnitDnaPanel.tsx       ← componente principal (carregamento + composição)
      DnaIndicatorCard.tsx   ← card reutilizável (título, valor, descrição, estrelas)
  App.tsx                    ← adicionar case 'dna-unidade'
  components/Sidebar.tsx     ← adicionar item de nav
  types.ts                   ← adicionar interface UnitDnaData
```

---

## Rotas/Navegação

- Nova tab interna: `activeTab === 'dna-unidade'`
- Perfis que veem no sidebar: `CONSELHEIRO`, `DIRETORIA`
- Sem rota hash pública (não há necessidade de link externo para este painel)

---

## Contratos de Interface

```ts
// UnitDnaPanel.tsx
interface UnitDnaPanelProps {
  user: Usuario;
  unidadeIdOverride?: string | null; // para Diretoria inspecionar uma unidade específica
}

// DnaIndicatorCard.tsx
interface DnaIndicatorCardProps {
  title: string;
  value: number | null;        // 0-100 (já normalizado para exibição)
  description: string;         // texto auxiliar (ex: "12 de 15 requisitos cumpridos")
  emptyMessage?: string;       // exibido quando value === null
  stars?: 3 | 4 | 5 | null;   // opcional; exibido apenas no indicador de Clubão
  loading?: boolean;
}
```

**Funções puras reutilizadas (sem modificação):**
```ts
// services/ranking.ts
buildRankingRows(units, requirements, progressDocs): RankingRow[]
// → usar: row.progressPercent (0-1) e row.completedCount

// services/frequencia.ts
buildFrequencySummary(presencas, membros, unidades, reunioes, trimestre, cargos): UnitFrequencySummary[]
// → usar: summary.unitFrequencyPct (0-100 | null) e summary.memberCount
```

---

## Estratégia de Testes

**Unidade (`vitest`):**
- Cálculo de estrelas: `pct=0.80→5, pct=0.79→4, pct=0.60→4, pct=0.59→3`
- Progresso médio de classes: array de desbravadores com diferentes % → média correta
- Ignorar desbravadores sem `classeId` no cálculo
- Estado vazio: sem desbravadores → `classesAvgPercent = null`
- Mapeamento `RankingQuarter.number → trimestre`: `number=2, trimestre=2` → reuniões filtradas corretamente

**Fora de escopo dos testes:**
- Mocks de Firestore (dados reais nas funções de integração)
- Testes de snapshot de UI
