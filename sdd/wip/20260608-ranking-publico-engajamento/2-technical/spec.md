# Spec Técnico — ranking-publico-engajamento (v2)

> Redesign do `PublicRanking.tsx` + novo painel do conselheiro.

## Arquitetura

### Componentes afetados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `pages/PublicRanking.tsx` | existente | Substituir tela principal por engajamento top-3 alfabético; expandir painel individual |
| `services/firestoreDb.ts` | existente | + `savePublicUnitProgress` |
| `services/engagement.ts` | existente | reutilizar `computeEngagementRows` |

---

## Parte A — Tela principal

### Lógica de engajamento

Reutilizar `computeEngagementRows` de `services/engagement.ts`. Pegar os 3 primeiros rows (maior índice), reordenar alfabeticamente:

```ts
const top3 = rows
  .filter(r => r.fireScore > 0)
  .slice(0, 3)
  .sort((a, b) => a.unidade.nome.localeCompare(b.unidade.nome, 'pt-BR'));
```

### Dados carregados

Mesmo conjunto do `PublicEngagement.tsx`:
- `listUnidades` + `listReunioes` + `listReuniaoPresencas`
- `listRankingQuarters` + `listRankingProgress(activeQuarterId)`
- `listDesbravadores` + class progress agregado

### Card de unidade no top-3

Avatar, nome, selo "Em chamas 🔥". Sem posição, sem pontos.

---

## Parte B — Painel Individual (`?u=UNITCODE`)

### Identificação

`generateUnitCode(unit.id)` → 6 chars. Lógica já existente em `services/ranking.ts`.

### Abas

```
[ Trimestres ] [ Membros ]
```

### Aba Trimestres

**Quarters CLOSED**: read-only — mesmo `UnitView` atual.

**Quarter ACTIVE**:
- BOOLEAN: checkbox interativo
- QUANTITY/RECURRING: input numérico
- Botão "Salvar Progresso" → `savePublicUnitProgress`
- Pontuação calculada exibida para o conselheiro

### `savePublicUnitProgress` (novo)

```ts
export const savePublicUnitProgress = async (
  clubId: string,
  quarterId: string,
  unitId: string,
  state: Record<string, RankingProgressEntry>,
  lastEditor: { nome: string }
) => {
  validateClub(clubId);
  const docId = `${quarterId}_${unitId}`;
  const docRef = doc(db, 'clubs', clubId, 'ranking_progress', docId);
  await setDoc(docRef, deepCleanUndefined({
    quarterId,
    unitId,
    clubeId: clubId,
    resultados: state,
    origemSubmissao: 'CONSELHEIRO_PUBLICO',
    updatedAt: serverTimestamp(),
    lastEditor
  }), { merge: true });
};
```

### Aba Membros

**Lista**: `listDesbravadores(clubId)` filtrado por `unidadeId === unit.id && status === 'ATIVO'`

**Edição inline por membro**:
- `nome`: input texto
- `cargo` (função): select fixo — Conselheiro Assistente, Escrivão, Tesoureiro, Membro
- `classe`: select com valores do tipo `Classe` já em `types.ts`
- `pg`: checkbox (booleano)
- Salvar → `updateDesbravador(clubId, id, patch)`

**Frequência (read-only)**:
- Total de reuniões vs presenças onde `desbravadorId === member.id`
- Exibir: `8/12 reuniões`

---

## Tasks

| # | Descrição | Arquivos |
|---|-----------|---------|
| T-01 | Tela principal: top-3 engajados em ordem alfabética | `PublicRanking.tsx` |
| T-02 | Painel individual: aba Trimestres leitura (quarters fechados) | `PublicRanking.tsx` |
| T-03 | Painel individual: aba Trimestres escrita (quarter ativo) + `savePublicUnitProgress` | `PublicRanking.tsx`, `firestoreDb.ts` |
| T-04 | Painel individual: aba Membros lista + frequência | `PublicRanking.tsx` |
| T-05 | Painel individual: aba Membros edição inline | `PublicRanking.tsx`, `firestoreDb.ts` |
