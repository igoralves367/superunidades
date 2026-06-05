# Spec Técnico — clubao-governanca

## Identificação
- **Feature**: clubao-governanca
- **Versão**: 1.0
- **Status**: pendente de aprovação

---

## Visão Geral da Arquitetura

Adicionamos um campo `approvalStatus` ao documento `ranking_progress` e um campo `approvalMeta` com metadados (quem aprovou/rejeitou, quando, motivo). A tela `Clubao.tsx` passa a usar o status para controlar bloqueio de edição e exibir as ações corretas por perfil. O cálculo do ranking em `buildRankingRows` filtra apenas documentos com `approvalStatus === 'APPROVED'`.

Nenhuma nova coleção Firestore é necessária — o status vive dentro do documento `ranking_progress` existente.

---

## Camadas Afetadas

### Layer 1 — Tipos TypeScript (`types.ts`)

**Novo tipo:**
```typescript
export type RankingApprovalStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface RankingApprovalMeta {
  status: RankingApprovalStatus;
  submittedAt?: Timestamp;
  submittedBy?: { id: string; nome: string; email: string };
  reviewedAt?: Timestamp;
  reviewedBy?: { id: string; nome: string; email: string };
  rejectionReason?: string;
}
```

**Modificação em `RankingUnitProgressDoc`** (tipo existente):
```typescript
// Adicionar campos opcionais:
approvalStatus?: RankingApprovalStatus;   // default: 'PENDING' se ausente
approvalMeta?: RankingApprovalMeta;
```

---

### Layer 2 — Firebase (`services/firestoreDb.ts`)

**Coleção afetada:** `clubs/{clubeId}/ranking_progress`

**Novas funções:**

```typescript
// Atualiza apenas o status de aprovação do documento de progresso
submitRankingUnitForApproval(
  clubId: string,
  quarterId: string,
  unitId: string,
  submittedBy: { id: string; nome: string; email: string }
): Promise<void>

// Aprova ou rejeita um documento de progresso
reviewRankingUnitApproval(
  clubId: string,
  quarterId: string,
  unitId: string,
  action: 'APPROVED' | 'REJECTED',
  reviewedBy: { id: string; nome: string; email: string },
  rejectionReason?: string
): Promise<void>
```

**Modificação em `saveRankingUnitProgress`:**
- Se o usuário for DIRETORIA, ao salvar define `approvalStatus: 'APPROVED'` automaticamente.
- Se o usuário for CONSELHEIRO e o status atual for `APPROVED`, resetar para `PENDING` (edição invalida aprovação anterior).

**ID do documento:** permanece `{quarterId}__{unitId}` — sem mudança.

---

### Layer 3 — Cálculo de Ranking (`services/ranking.ts`)

**Modificação em `buildRankingRows`:**
```typescript
// Ignorar documentos sem approvalStatus 'APPROVED'
const progressDoc = progressDocs.find(d => d.unitId === unit.id && d.approvalStatus === 'APPROVED');
```
Documentos com status `PENDING`, `SUBMITTED` ou `REJECTED` retornam `totalPoints: 0` no ranking.

---

### Layer 4 — UI (`pages/Clubao.tsx`)

**Comportamento por status e perfil:**

| Status | CONSELHEIRO | DIRETORIA |
|--------|-------------|-----------|
| PENDING | Pode editar + botão "Enviar para Aprovação" | Pode editar (salvar = APPROVED) |
| SUBMITTED | Somente leitura + badge "Aguardando aprovação" | Pode editar + botões "Aprovar" / "Rejeitar" |
| APPROVED | Somente leitura + badge "Aprovado" | Pode editar (salvar = APPROVED) |
| REJECTED | Pode editar + motivo visível + botão "Reenviar" | Pode editar + botões "Aprovar" / "Rejeitar" |

**Componente novo:** `components/Clubao/ApprovalStatusBar.tsx`
- Exibe badge de status com cor (cinza/amarelo/verde/vermelho)
- Exibe botões de ação conforme perfil e status atual
- Exibe motivo de rejeição quando status = REJECTED

**Modificações em `Clubao.tsx`:**
- Importar e renderizar `ApprovalStatusBar` acima do formulário de requisitos
- Bloquear campos (readonly) quando status = SUBMITTED ou APPROVED e perfil = CONSELHEIRO
- Handler `handleSubmitForApproval()` → chama `submitRankingUnitForApproval`
- Handler `handleReview(action, reason?)` → chama `reviewRankingUnitApproval`
- Ao salvar como CONSELHEIRO com status APPROVED, exibir confirmação: "Editar irá invalidar a aprovação. Continuar?"

---

## Decisões Técnicas

### DD-1: Status no documento `ranking_progress` vs coleção separada
**Problema**: Guardar o status de aprovação junto ao progresso ou em coleção nova?
**Decisão**: Dentro do mesmo documento `ranking_progress`.
**Alternativas rejeitadas**: Nova coleção `ranking_approvals` — mais complexa, requer join adicional.
**Motivo**: Status e dados são a mesma unidade lógica; evita nova fonte de verdade. Firestore cobra por leitura, juntar no mesmo documento é mais barato.

### DD-2: Aprovação por unidade/trimestre (não por requisito)
**Problema**: Granularidade da aprovação.
**Decisão**: Uma aprovação por documento `{quarterId}__{unitId}`.
**Alternativas rejeitadas**: Aprovação por requisito individual (`validacaoMeta.confirmadoRanking` existente) — granularidade excessiva para o fluxo desejado.
**Motivo**: A diretoria revisa o conjunto da unidade, não requisito a requisito. Mais simples e direto.

### DD-3: Edição pela DIRETORIA sem fluxo de submissão
**Problema**: DIRETORIA precisa poder corrigir dados sem depender do conselheiro.
**Decisão**: Qualquer save feito pelo perfil DIRETORIA define status como APPROVED automaticamente.
**Motivo**: A diretoria é a autoridade final; seu save já é a aprovação.

---

## Estrutura de Arquivos

```
pages/
  Clubao.tsx                        (modificar)
components/
  Clubao/
    ApprovalStatusBar.tsx           (novo)
services/
  firestoreDb.ts                    (modificar: 2 novas funções + ajuste saveRankingUnitProgress)
  ranking.ts                        (modificar: filtro approvalStatus em buildRankingRows)
types.ts                            (modificar: RankingApprovalStatus, RankingApprovalMeta, RankingUnitProgressDoc)
```

---

## Contratos de Interface

```typescript
// ApprovalStatusBar.tsx
interface ApprovalStatusBarProps {
  status: RankingApprovalStatus;
  approvalMeta?: RankingApprovalMeta;
  perfil: PerfilAcesso;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  loading?: boolean;
}
```

---

## Estratégia de Testes

- `ranking.ts`: testar que `buildRankingRows` retorna 0 pts para unidades não-APPROVED
- `firestoreDb.ts`: testar transições de status válidas
- `ApprovalStatusBar.tsx`: testar renderização por perfil × status (4 × 2 = 8 cenários)
