# Spec Técnico — clubao-validacao-conselheiro

## Visão Geral

Reaproveita o documento `ranking_progress/{quarterId}__{unitId}` e o mapa
`resultados[requirementId]` já existentes. Adiciona campos de **submissão/validação**
por requisito. O conselheiro grava submissões (PENDENTE) sem aplicar pontos; a aprovação
da diretoria calcula os pontos com `calculateRequirementBreakdown` e marca `completed=true`.

Nenhuma coleção nova. Nenhum novo `RankingRequirementRuleType`.

## Modelo de Dados

### Extensão de `RankingProgressEntry` (`types.ts`)

```typescript
export type RequirementSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RequirementSubmission {
  status: RequirementSubmissionStatus;
  observation?: string;                 // observação do conselheiro
  submittedBy?: { id: string; nome: string };
  submittedAt?: any;
  reviewedBy?: { id: string; nome: string };
  reviewedAt?: any;
  rejectionReason?: string;             // motivo da diretoria ao reprovar
}
```

Adicionar campo opcional em `RankingProgressEntry`:
```typescript
  submission?: RequirementSubmission;   // undefined = NÃO SUBMETIDO
```

`completed` continua sendo a fonte de verdade para o cálculo de pontos (ranking).
A regra de aplicação: pontos só contam quando `submission.status === 'APPROVED'`
(que é o único momento em que setamos `completed=true` por este fluxo).

## Camada de Serviço (`services/firestoreDb.ts`)

Funções novas que fazem **merge parcial** no mapa `resultados` (sem reescrever o doc todo):

### 1. `submitRequirementByCounselor`
```typescript
submitRequirementByCounselor(
  clubId, quarterId, unitId, requirementId,
  payload: { observation?: string; quantity?: number },
  user: { id: string; nome: string }
): Promise<void>
```
- Lê o doc `ranking_progress/{quarterId}__{unitId}` (cria se não existir).
- Grava `resultados[requirementId]` com `completed=false`, `calculatedPoints=0`,
  `quantity` (se informado) e `submission = { status:'PENDING', observation, submittedBy:user, submittedAt }`.
- Preserva os demais requisitos. `merge:true`.

### 2. `withdrawRequirementSubmission`
```typescript
withdrawRequirementSubmission(clubId, quarterId, unitId, requirementId): Promise<void>
```
- Conselheiro desmarca um PENDENTE/REPROVADO → remove a submissão (volta a NÃO SUBMETIDO),
  zera `completed`/pontos do requisito.

### 3. `reviewRequirementSubmission`
```typescript
reviewRequirementSubmission(
  clubId, quarterId, unitId,
  requirement: RankingRequirement,
  decision: 'APPROVE' | 'REJECT',
  reviewer: { id: string; nome: string },
  rejectionReason?: string
): Promise<void>
```
- **APPROVE**: calcula breakdown com `calculateRequirementBreakdown(requirement, entry)`,
  grava `completed=true`, `basePoints/bonusPoints/penaltyPoints/calculatedPoints`,
  `submission.status='APPROVED'`, `reviewedBy`, `reviewedAt`.
- **REJECT**: `completed=false`, `calculatedPoints=0`, `submission.status='REJECTED'`,
  `rejectionReason`, `reviewedBy`, `reviewedAt`.
- Recalcula `totalPoints` do doc (soma de `calculatedPoints`).

> Reaproveitar o padrão de `saveRankingUnitProgress` para o recálculo de `totalPoints`
> e `deepCleanUndefined`. Considerar extrair um helper `patchRequirementEntry`.

## Camada de UI

### A. DNA da Unidade — `components/UnitDna/UnitDnaPanel.tsx` (+ subcomponentes)

1. **Seletor de trimestre** (ativo / anterior) no header.
   - `quarters` ordenados por `number`; "anterior" = quarter imediatamente antes do ativo.
   - Trimestre anterior → tudo readonly (indicadores já existentes + lista readonly de requisitos).
2. **Nova seção "Requisitos do Trimestre"** (novo componente `CounselorRequirementsList.tsx`):
   - Só aparece para o trimestre ATIVO e para CONSELHEIRO/INSTRUTOR com `user.unidadeId`.
   - Carrega `listRankingRequirements(quarter)` filtrando os tipos elegíveis (RN-5: exclui
     os de validação automática e MANUAL_SCORE) e o doc `ranking_progress` da unidade.
   - Cada item: badge de estado, checkbox "cumprido", textarea observação, campo quantidade
     quando `requiresQuantity`. Botão "Enviar para validação" chama `submitRequirementByCounselor`.
   - APROVADO → travado. REPROVADO → mostra `rejectionReason`, permite re-enviar.
3. Diretoria continua vendo o DNA em modo leitura (seletor de unidade já existe).

### B. Clubão (Diretoria) — `pages/Clubao.tsx` + novo `components/Aprovacoes/`

1. Nova aba `'aprovacoes'` (label "Validação por Unidade") em `ClubaoTab`.
2. `AprovacoesPanel.tsx`:
   - Lista unidades com contadores (PENDENTE / APROVADO / REPROVADO) lendo `ranking_progress`
     do trimestre ativo + `listRankingRequirements`.
   - Clique numa unidade → `AprovacaoUnitModal.tsx` lista requisitos submetidos com a
     observação do conselheiro e botões Aprovar / Reprovar (motivo opcional).
   - Aprovar/Reprovar chama `reviewRequirementSubmission` e recarrega.

## Decisões Técnicas

- **DD-1**: Sem coleção nova — submissão vive dentro de `resultados[requirementId].submission`.
  Motivo: evita join cross-collection; o ranking já lê esse doc.
- **DD-2**: Pontos aplicados só na aprovação (decisão do usuário). `completed` só vira `true`
  via `reviewRequirementSubmission(APPROVE)`. Pendentes contribuem 0.
- **DD-3**: Requisitos de validação automática (devocional/classes/frequência) e MANUAL_SCORE
  ficam fora da lista do conselheiro (RN-5), continuam exclusivos da aba Validações.
- **DD-4**: Merge parcial do mapa `resultados` para não sobrescrever lançamentos simultâneos
  da diretoria.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `types.ts` | + `RequirementSubmissionStatus`, `RequirementSubmission`, campo `submission` em `RankingProgressEntry` |
| `services/firestoreDb.ts` | + `submitRequirementByCounselor`, `withdrawRequirementSubmission`, `reviewRequirementSubmission` |
| `components/UnitDna/UnitDnaPanel.tsx` | + seletor de trimestre, montar lista de requisitos |
| `components/UnitDna/CounselorRequirementsList.tsx` | **novo** — lista de marcação do conselheiro |
| `pages/Clubao.tsx` | + aba `'aprovacoes'` |
| `components/Aprovacoes/AprovacoesPanel.tsx` | **novo** — lista de unidades com contadores |
| `components/Aprovacoes/AprovacaoUnitModal.tsx` | **novo** — detalhe aprovar/reprovar |

## Estratégia de Testes

- Unit (vitest): `reviewRequirementSubmission` APPROVE aplica `calculatedPoints` corretos
  e recalcula `totalPoints`; REJECT zera pontos; submissão PENDENTE não soma pontos.
- Permissão: conselheiro só submete para `user.unidadeId` (validação na UI + no service).
- Browser: marcar como conselheiro → aprovar como diretoria → ponto reflete no ranking.
