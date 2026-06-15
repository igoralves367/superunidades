# Spec Técnico — Sócios no Painel da Unidade

## Visão Geral

Toda a lógica vive em `pages/PublicRanking.tsx`. Nenhum novo arquivo é necessário — apenas extensão do componente `CounselorPanel` e do `ActiveQuarterEditor` existentes.

## Mudanças por Componente

---

### 1. `CounselorPanel` — nova aba "Sócios"

**Arquivo**: `pages/PublicRanking.tsx`

#### 1.1 Novo tipo de aba

```typescript
type PanelTab = 'trimestres' | 'membros' | 'socios'; // adicionar 'socios'
```

#### 1.2 Estado local novo

```typescript
const [socios, setSocios] = useState<Socio[]>([]);
const [pagamentos, setPagamentos] = useState<PagamentoSocio[]>([]);
const [sociosLoading, setSociosLoading] = useState(false);
const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
const [socioForm, setSocioForm] = useState({ nome: '', valorMensal: '', mesIngresso: getCurrentMesRef() });
const [savingSocio, setSavingSocio] = useState(false);
const [expandedSocioId, setExpandedSocioId] = useState<string | null>(null);
```

#### 1.3 Carregar dados de sócios

Executar uma única vez ao montar o componente (não aguardar clicar na aba):

```typescript
useEffect(() => {
  let cancelled = false;
  setSociosLoading(true);
  Promise.all([
    fs.listSocios(clubId),
    fs.listPagamentosSocios(clubId),
  ]).then(([allSocios, allPagamentos]) => {
    if (cancelled) return;
    setSocios(allSocios.filter(s => s.unidadeId === unit.id && s.ativo));
    setPagamentos(allPagamentos);
    setSociosLoading(false);
  }).catch(() => setSociosLoading(false));
  return () => { cancelled = true; };
}, [clubId, unit.id]);
```

#### 1.4 `socioCount` derivado

```typescript
const socioCount = socios.length; // sócios ativos da unidade
```

**Usar em**: passar como prop para `ActiveQuarterEditor` (ver seção 2).

#### 1.5 Função `handleCreateSocio`

```typescript
const handleCreateSocio = async () => {
  if (!socioForm.nome.trim() || !socioForm.valorMensal) return;
  setSavingSocio(true);
  try {
    await fs.createSocio(clubId, {
      nome: socioForm.nome.trim(),
      valorMensal: parseFloat(socioForm.valorMensal),
      mesIngresso: socioForm.mesIngresso,
      unidadeId: unit.id,
      ativo: true,
    });
    // Recarregar apenas sócios
    const updated = await fs.listSocios(clubId);
    setSocios(updated.filter(s => s.unidadeId === unit.id && s.ativo));
    setIsSocioModalOpen(false);
    setSocioForm({ nome: '', valorMensal: '', mesIngresso: getCurrentMesRef() });
  } finally {
    setSavingSocio(false);
  }
};
```

#### 1.6 Helpers de pagamento

```typescript
// Retorna os pagamentos de um sócio ordenados do mais recente
const pagamentosDeSocio = (socioId: string): PagamentoSocio[] =>
  pagamentos
    .filter(p => p.socioId === socioId)
    .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia))
    .slice(0, 6);

// Retorna se o mês atual está pago
const isMesAtualPago = (socioId: string): boolean => {
  const mesAtual = getCurrentMesRef(); // YYYY-MM
  return pagamentos.some(p => p.socioId === socioId && p.mesReferencia === mesAtual);
};
```

#### 1.7 Nova aba na barra de navegação

Adicionar botão "Sócios" com ícone `Heart` (lucide-react) ao lado de "Membros" na barra de abas existente.

#### 1.8 Conteúdo da aba Sócios

Quando `activeTab === 'socios'`:

```
┌─────────────────────────────────────────┐
│ SÓCIOS DESBRAVADOR          [+ Adicionar]│
│ X de 4 conquistados                      │
├─────────────────────────────────────────┤
│ ● Irmão Silva           [PAGO / PENDENTE]│
│   R$ 50/mês · desde jan/2026            │
│   ▼ (expand) últimos 6 meses            │
│     ├─ jun/2026  PAGO  R$50  15/06/2026 │
│     ├─ mai/2026  PAGO  R$50  05/05/2026 │
│     └─ abr/2026  PENDENTE               │
├─────────────────────────────────────────┤
│ (estado vazio se nenhum sócio)          │
└─────────────────────────────────────────┘
```

**Visual**: dark card com borda branca/10, mesmo padrão do painel.
**Badge PAGO**: texto `#34D399` (verde).
**Badge PENDENTE**: texto `#FFD60A` (amarelo).
**Contador**: "X de 4 sócios" — 4 é a meta do Clubão (hardcoded).

#### 1.9 Modal "Adicionar Sócio"

Mesmos campos do modal em `Financeiro.tsx`, sem o dropdown de unidade (pré-definida) e sem "indicado por":

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome do Patrocinador | text | sim |
| Cota Mensal (R$) | number (step 0.01) | sim |
| Mês de Ingresso | month | sim (default: mês atual) |

Botão "Registrar Sócio" chama `handleCreateSocio`.

---

### 2. `ActiveQuarterEditor` — pré-preenchimento de quantidade

**Arquivo**: `pages/PublicRanking.tsx`

#### 2.1 Nova prop

```typescript
interface ActiveQuarterEditorProps {
  // ...existentes...
  socioCount?: number; // quantidade de sócios ativos da unidade
}
```

#### 2.2 Lógica de pré-preenchimento

Nos requisitos com `requiresQuantity === true` e cujo `id` corresponde ao padrão `*socio-desbravador*`, usar `socioCount` como valor padrão do draft quando o campo `quantity` ainda não foi preenchido pelo usuário:

```typescript
const getDraft = (req: RankingRequirement) => {
  const entry = resultados[req.id];
  const isSocioReq = req.requiresQuantity && req.id.includes('socio-desbravador');
  const defaultQuantity = isSocioReq && socioCount != null
    ? String(socioCount)
    : (entry?.quantity != null ? String(entry.quantity) : '');
  return drafts[req.id] ?? {
    observation: entry?.submission?.observation ?? '',
    quantity: defaultQuantity,
  };
};
```

**Resultado**: campo quantity do "Sócio Desbravador" abre pré-preenchido com o total de sócios ativos. O conselheiro pode editar antes de enviar — não é bloqueado.

---

### 3. Propagação da prop em `CounselorPanel`

Passar `socioCount` ao renderizar `ActiveQuarterEditor`:

```tsx
<ActiveQuarterEditor
  clubId={clubId}
  quarter={selectedQuarter}
  unitId={unit.id}
  unitName={unit.nome}
  requirements={requirements}
  progressDoc={progressDoc}
  socioCount={socioCount}   // ← novo
/>
```

---

### 4. Imports adicionais

```typescript
import { ..., Heart, UserPlus } from 'lucide-react';
import { Socio, PagamentoSocio } from '../types';
```

`getCurrentMesRef` já existe em `services/firestoreDb.ts` ou pode ser definida localmente:
```typescript
const getCurrentMesRef = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
```

---

## Firestore

Nenhuma nova coleção. Leitura de:
- `clubs/{clubeId}/socios` — filtrado client-side por `unidadeId === unit.id && ativo === true`
- `clubs/{clubeId}/pagamentos_socios` — filtrado client-side por `socioId in [ids dos sócios da unidade]`

Escrita:
- `clubs/{clubeId}/socios` — via `fs.createSocio()` existente

## Segurança

Mesmo modelo do painel atual: operações com `clubeId` da URL, `unidadeId` da unidade resolvida pelo código `?u=`. Não requer autenticação adicional.

## Sem Novos Arquivos

Todas as alterações ficam em `pages/PublicRanking.tsx`. Nenhum novo componente, service ou type.
