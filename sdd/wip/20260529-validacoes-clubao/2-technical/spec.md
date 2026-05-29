# Spec Técnico — validacoes-clubao

## Visão Geral da Arquitetura

O módulo de Validações é uma nova aba dentro de `Clubao.tsx` que reutiliza inteiramente a infraestrutura de dados existente (`ranking_requirements` + `ranking_progress`). Os 6 requisitos de validação já estão seeded com IDs fixos no padrão `q{N}-{tipo}`. A feature adiciona:

1. Uma UI dedicada com formulários estruturados por tipo de validação
2. Lógica de auto-cálculo de frequência que lê `reunioes_presencas` e escreve em `ranking_progress`
3. Novos campos `batizado` e `pgNome` em `Desbravador`

```
Reuniões                 Clubão (aba Validações)
    │                          │
    ├─ reunioes_presencas ──►  ValidacoesPanel
    │   (read-only)             │
    │                           ├─ auto-calc freq → ranking_progress
    │                           └─ manual input  → ranking_progress
                                                        │
                                                   Ranking (aba)
                                                   totalPoints ✓
```

## IDs de Requisitos por Trimestre

Pattern: `q{quarter.number}-{tipo}` — já seeded para Q1, Q2, Q3.

| ID (Q1)                          | Pontos | Tipo de cálculo |
|----------------------------------|--------|-----------------|
| `q1-frequencia-conselheiros`     | 100    | Auto (reunioes) |
| `q1-frequencia-reunioes-clube`   | 60     | Auto (reunioes) |
| `q1-frequencia-cultos`           | 60     | Manual          |
| `q1-frequentar-pg`               | 60     | Manual          |
| `q1-devocional-pessoal`          | 200    | Manual          |
| `q1-classes`                     | 200    | Manual          |

Para Q2/Q3 basta substituir o prefixo: `q2-frequencia-conselheiros`, etc.

## Camadas Afetadas

### Layer 1 — Componentes e UI

**Componentes novos**:
- `components/Validacoes/ValidacoesPanel.tsx` — painel principal com lista de unidades e seletor de trimestre
- `components/Validacoes/ValidacaoUnitCard.tsx` — card de resumo por unidade (6 badges de status + pontuação)
- `components/Validacoes/ValidacaoDetailModal.tsx` — modal com os 6 formulários de validação da unidade
- `components/Validacoes/FrequenciaAutoCard.tsx` — exibe resultado auto-calculado (badge "Automático", %, penalidades)
- `components/Validacoes/ManualValidacaoForm.tsx` — form reutilizável para validações manuais (Cultos, PG)
- `components/Validacoes/DevocionallForm.tsx` — form para Devocional (checkbox + contagem de não batizados)
- `components/Validacoes/ClassesForm.tsx` — form com lista de desbravadores + checkbox por membro

**Componentes modificados**:
- `pages/Clubao.tsx` — adiciona tabs (Ranking | Validações), integra `ValidacoesPanel`
- `pages/Membros.tsx` — adiciona campos `batizado` e `pgNome` no modal de edição do desbravador

**Tipos TypeScript novos**:

```typescript
// Em types.ts — extensão de RankingProgressEntry
interface RankingProgressEntry {
  // campos existentes...
  validacaoMeta?: {
    presencaPercent?: number;          // para cultos/PG/reunioes
    quantidadeNaoBatizados?: number;   // para devocional
    dbvsAtivosNaClasse?: number;       // para classes
    autoCalculated?: boolean;          // true = calculado pelo sistema
    counselorAbsences?: number;        // para freq. conselheiros (contagem de faltas)
  };
}

// Em types.ts — extensão de Desbravador
interface Desbravador {
  // campos existentes...
  batizado?: boolean;
  pgNome?: string;
}

// Novo tipo auxiliar (não persiste no Firestore)
interface AutoFrequenciaResult {
  unitId: string;
  conselheiros: {
    requirementId: string;  // ex: 'q1-frequencia-conselheiros'
    absences: number;
    penaltyPoints: number;
    details: { nome: string; presencaPercent: number }[];
  };
  reunioes: {
    requirementId: string;  // ex: 'q1-frequencia-reunioes-clube'
    presencaPercent: number;
    bonusPoints: number;
    basePoints: number;
  };
}
```

**Hooks necessários**:
- `useValidacoes(clubId, quarterId)` — hook local em `ValidacoesPanel.tsx` que:
  - Carrega `ranking_requirements` filtrados pelos 6 IDs de validação do trimestre
  - Carrega `ranking_progress` de todas as unidades para o trimestre
  - Chama `buildAutoFrequencia` e faz merge nos resultados
  - Retorna estado consolidado por unidade

### Layer 2 — Firebase

**Coleções Firestore**:

| Coleção | Operação | Descrição |
|---------|----------|-----------|
| `clubs/{clubeId}/ranking_requirements` | read | Filtra pelos 6 IDs de validação do trimestre ativo |
| `clubs/{clubeId}/ranking_progress` | read/write | Lê e salva resultados por unidade (`{quarterId}__{unitId}`) |
| `clubs/{clubeId}/reunioes` | read | Filtra por `trimestre == quarter.number && ativo == true` |
| `clubs/{clubeId}/reunioes_presencas` | read | Lê presenças para auto-cálculo |
| `clubs/{clubeId}/desbravadores` | read/write | Lê membros por unidade; salva `batizado` e `pgNome` |

**Nova função em `services/firestoreDb.ts`**:

```typescript
async function buildAutoFrequencia(
  clubId: string,
  quarterId: string,
  quarterNumber: 1 | 2 | 3,
  unidades: Unidade[],
  desbravadores: Desbravador[],
  cargos: Cargo[]
): Promise<AutoFrequenciaResult[]>
```

- Reutiliza a lógica de `buildFrequencySummary` (que já calcula % por unidade e conselheiros)
- Retorna `AutoFrequenciaResult[]` — um por unidade
- NÃO persiste no Firestore; apenas calcula. A persistência ocorre ao salvar no modal.

**Operações de escrita**:

```typescript
// Salvar resultado de validação (manual ou auto) — reutiliza saveRankingUnitProgress existente
saveRankingUnitProgress(clubId, quarterId, unitId, resultados, updatedBy)
```

- `writeBatch`: não necessário (escritas são por unidade, atômicas no doc existente)
- `deepCleanUndefined()`: aplicar antes de salvar `validacaoMeta`

**Trimestre mapping**:
`RankingQuarter.number (1|2|3)` === `Reuniao.trimestre (1|2|3|4)` — mapeamento direto.

### Layer 3 — Qualidade

- Cobertura mínima: 60%
- Testes unitários para `buildAutoFrequencia` (cálculo de penalidades e bônus)
- Soft delete: desbravadores com `status === 'INATIVO'` excluídos das validações de Classes
- `clubeId` obrigatório em toda operação Firestore

## Decisões Técnicas

### DD-1: Reuso de `ranking_progress` para validações
**Problema**: onde persistir os resultados das 6 validações.  
**Decisão**: usar a coleção `ranking_progress` existente, adicionando `validacaoMeta` aos entries.  
**Alternativas rejeitadas**: nova coleção `validacoes_resultados` — criaria duplicação e precisaria de sync com o ranking.  
**Motivo**: os pontos de validação JÁ SÃO pontos do ranking. Reuso elimina camada de sync.

### DD-2: Auto-cálculo sem write automático
**Problema**: quando persistir os resultados de frequência calculados automaticamente.  
**Decisão**: auto-cálculo roda ao abrir o modal de detalhe; só persiste quando o usuário clica em "Salvar".  
**Alternativas rejeitadas**: salvar automaticamente ao abrir a aba — pode sobrescrever ajustes manuais sem intenção.  
**Motivo**: controle explícito do usuário sobre o que é salvo.

### DD-3: IDs de requisitos dinamicamente construídos
**Problema**: requisitos de validação existem por trimestre (`q1-*`, `q2-*`, `q3-*`).  
**Decisão**: construir os IDs dinamicamente com `q${quarter.number}-{tipo}`.  
**Motivo**: reutiliza o seed existente sem duplicar constantes; o `RankingQuarter.number` já fornece o número correto.

### DD-4: Permissão por perfil no front-end
**Problema**: conselheiros só devem editar sua própria unidade.  
**Decisão**: filtrar `unidadeId` a partir de `user.cargos` — mesmo padrão usado em outros módulos.  
**Motivo**: consistência com padrão existente no projeto.

## Estrutura de Arquivos

```
src/
  components/
    Validacoes/
      ValidacoesPanel.tsx       (novo)
      ValidacaoUnitCard.tsx     (novo)
      ValidacaoDetailModal.tsx  (novo)
      FrequenciaAutoCard.tsx    (novo)
      ManualValidacaoForm.tsx   (novo)
      DevocionallForm.tsx       (novo)
      ClassesForm.tsx           (novo)
  pages/
    Clubao.tsx                  (modificado — adiciona tabs)
    Membros.tsx                 (modificado — campos batizado + pgNome)
  services/
    firestoreDb.ts              (modificado — buildAutoFrequencia)
  types.ts                      (modificado — Desbravador + RankingProgressEntry)
```

## Contratos de Interface

```typescript
// ValidacoesPanel
interface ValidacoesPanelProps {
  clubeId: string;
  user: Usuario;
  quarters: RankingQuarter[];
  unidades: Unidade[];
  desbravadores: Desbravador[];
  cargos: Cargo[];
}

// ValidacaoDetailModal
interface ValidacaoDetailModalProps {
  clubeId: string;
  quarter: RankingQuarter;
  unit: Unidade;
  requirements: RankingRequirement[];      // 6 requisitos de validação
  progress: RankingUnitProgressDoc | null;
  desbravadores: Desbravador[];            // membros da unidade
  autoFrequencia: AutoFrequenciaResult | null;
  onSave: (resultados: Record<string, RankingProgressEntry>) => Promise<void>;
  onClose: () => void;
  canEdit: boolean;
}
```

## Estratégia de Testes

**Testes unitários** (`buildAutoFrequencia`):
- Unidade com 100% de presença dos conselheiros → 0 penalidades
- Unidade com 1 conselheiro ausente → -100 pts
- Unidade com 84% de presença → sem bônus (60 pts base)
- Unidade com 85% de presença → bônus +50 pts aplicado
- Sem reuniões no trimestre → retorna entries vazios, sem erro

**Testes de tipo**:
- TypeScript sem erros em `Desbravador` com novos campos opcionais
- `RankingProgressEntry.validacaoMeta` aceita `undefined`
