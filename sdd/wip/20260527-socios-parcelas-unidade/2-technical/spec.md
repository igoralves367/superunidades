# Spec Técnico — socios-parcelas-unidade

## Visão Geral da Arquitetura

A feature expande a aba `SOCIOS` do `Financeiro.tsx` (brownfield). A estrutura atual mostra apenas cards com nome e valor mensal. Vamos:

1. Adicionar nova coleção `pagamentos_socios` para registrar cada PIX recebido
2. Atualizar o form de criação de sócio para incluir vinculação de unidade
3. Expandir `renderSocios()` com sub-abas: **Lista** (status do mês) e **Por Unidade** (inadimplência)
4. Cada card de sócio exibe status do mês atual e permite expandir para ver histórico

```
renderSocios()
├── Sub-abas: [Lista de Sócios] [Por Unidade]
├── Lista de Sócios
│   ├── Resumo do mês (total arrecadado / total esperado)
│   ├── Filtro de mês
│   └── SocioCard (expandível)
│       ├── nome, unidade, valor mensal
│       ├── Badge: Em dia / Pendente (mês filtrado)
│       ├── Botão "Registrar Pagamento" (se pendente)
│       └── Histórico expandível (últimos 12 meses)
└── Por Unidade
    ├── Filtro de mês
    └── UnidadeInadimplenciaCard
        ├── nome da unidade + qtd inadimplentes
        └── lista de sócios em atraso com valor
```

---

## Layer 1 — Componentes e UI

### Componentes Modificados

| Componente | Arquivo | Mudança |
|------------|---------|---------|
| `renderSocios` (função inline) | `pages/Financeiro.tsx` | Adicionar sub-abas, status mensal, histórico |

### Estado Novo no Financeiro.tsx

```typescript
// Estado para pagamentos de sócios
const [pagamentosSocios, setPagamentosSocios] = useState<PagamentoSocio[]>([]);
const [socioSubTab, setSocioSubTab] = useState<'LISTA' | 'POR_UNIDADE'>('LISTA');
const [mesFiltroSocios, setMesFiltroSocios] = useState<string>(getCurrentMesRef()); // 'YYYY-MM'

// Modal de registro de pagamento
const [isPagamentoSocioModalOpen, setIsPagamentoSocioModalOpen] = useState(false);
const [socioSelecionado, setSocioSelecionado] = useState<Socio | null>(null);
const [pagDataPagamento, setPagDataPagamento] = useState('');
const [pagValor, setPagValor] = useState('');
const [pagMesRef, setPagMesRef] = useState('');
const [pagObservacao, setPagObservacao] = useState('');

// Sócios com histórico expandido
const [sociosExpandidos, setSociosExpandidos] = useState<Set<string>>(new Set());
```

### Tipos TypeScript Novos

```typescript
// Adicionar em types.ts
export interface PagamentoSocio {
  id: string;
  clubeId: string;
  socioId: string;
  dataPagamento: string;     // 'YYYY-MM-DD'
  valorPago: number;
  mesReferencia: string;     // 'YYYY-MM' — mês ao qual o pagamento se refere
  observacao?: string;
  criadoEm?: Timestamp;
}
```

### Atualização no tipo Socio (types.ts)

O tipo `Socio` já tem `unidadeId?: string`. Sem mudança de tipo necessária.
Apenas garantir que o form de criação passe o campo.

### Helper Functions (dentro de Financeiro.tsx)

```typescript
// Retorna 'YYYY-MM' do mês atual
function getCurrentMesRef(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Formata 'YYYY-MM' para exibição: 'Mai/2026'
function formatMesRef(mesRef: string): string {
  const [year, month] = mesRef.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(month) - 1]}/${year}`;
}

// Verifica se sócio pagou em determinado mês
function socioEstaEmDia(socioId: string, mesRef: string, pagamentos: PagamentoSocio[]): boolean {
  return pagamentos.some(p => p.socioId === socioId && p.mesReferencia === mesRef);
}

// Retorna os últimos N meses como array de 'YYYY-MM'
function getUltimosMeses(n: number): string[] { ... }
```

---

## Layer 2 — Firebase

### Nova Coleção

```
clubs/{clubeId}/pagamentos_socios/{pagamentoId}
```

Campos:
```typescript
{
  id: string;            // auto Firestore
  clubeId: string;
  socioId: string;
  dataPagamento: string; // 'YYYY-MM-DD'
  valorPago: number;
  mesReferencia: string; // 'YYYY-MM'
  observacao?: string;
  criadoEm: Timestamp;
}
```

### Queries Necessárias

```typescript
// Listar todos os pagamentos de sócios do clube
const q = query(
  collection(db, 'clubs', clubeId, 'pagamentos_socios'),
  orderBy('mesReferencia', 'desc')
);

// Opcional (filtro por mês — se performance exigir)
const q = query(
  collection(db, 'clubs', clubeId, 'pagamentos_socios'),
  where('mesReferencia', '==', mesFiltro),
);
```

**Estratégia de carregamento**: Carregar todos os pagamentos dos últimos 12 meses em memória e filtrar no frontend. Simples e suficiente para a quantidade de sócios típica de um clube (<100).

### Funções de Serviço Novas em firestoreDb.ts

```typescript
// Listar pagamentos de sócios
export const listPagamentosSocios = (clubId: string): Promise<PagamentoSocio[]> =>
  listSimpleCol<PagamentoSocio>(clubId, 'pagamentos_socios');

// Criar pagamento
export const createPagamentoSocio = async (
  clubId: string,
  payload: Omit<PagamentoSocio, 'id' | 'clubeId' | 'criadoEm'>
): Promise<PagamentoSocio> => {
  const docRef = doc(collection(db, 'clubs', clubId, 'pagamentos_socios'));
  const novo: PagamentoSocio = {
    id: docRef.id,
    clubeId: clubId,
    ...payload,
    criadoEm: serverTimestamp() as Timestamp,
  };
  await setDoc(docRef, deepCleanUndefined(novo));
  return novo;
};

// Deletar pagamento (desfazer registro)
export const deletePagamentoSocio = async (clubId: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, 'clubs', clubId, 'pagamentos_socios', id));
};
```

### Atualização em createSocio

`createSocio` já existe. O form precisa passar `unidadeId` quando selecionado.
Sem alteração na função de serviço — apenas o form passará o campo.

### Carregamento no useEffect de Financeiro.tsx

Adicionar `listPagamentosSocios` e `listUnidades` (se não estiver carregado) ao `Promise.all` do load inicial.

---

## Decisões Técnicas

### DD-1: Onde armazenar pagamentos — subcoleção do sócio vs coleção raiz

**Problema**: Pagamentos podem ficar em `socios/{id}/pagamentos` (subcoleção) ou em `pagamentos_socios` (coleção raiz do clube).

**Opção A**: Subcoleção `socios/{id}/pagamentos`
- Prós: dados co-localizados com o sócio
- Contras: Para o relatório por unidade, precisaria buscar pagamentos de TODOS os sócios separadamente (N queries)

**Opção B**: Coleção raiz `pagamentos_socios`
- Prós: 1 única query para todos os pagamentos do clube; filtros por mês simples
- Contras: levemente menos "organizada" no Firestore

**Decisão**: Opção B — `pagamentos_socios` como coleção raiz do clube.
**Motivo**: O relatório de inadimplência por unidade precisa cruzar todos os sócios com todos os pagamentos de um mês — muito mais simples com 1 query.

### DD-2: Carregar tudo ou paginar por mês

**Problema**: Carregar todos os pagamentos históricos vs carregar apenas os do mês filtrado.

**Decisão**: Carregar últimos 12 meses em memória, filtrar no frontend.
**Motivo**: Volume esperado é baixo (<100 sócios × 12 meses = <1200 documentos). Evita múltiplas queries ao trocar o mês no filtro.

---

## Estrutura de Arquivos Modificados

```
pages/
  Financeiro.tsx     → renderSocios() expandido, novos estados, novo modal
services/
  firestoreDb.ts     → 3 novas funções (listPagamentosSocios, createPagamentoSocio, deletePagamentoSocio)
types.ts             → interface PagamentoSocio adicionada
```

---

## Permissões por Perfil

| Funcionalidade | Diretoria | Resp. Financeiro | Conselheiro |
|----------------|-----------|-----------------|-------------|
| Ver lista de sócios | ✅ | ✅ | ✅ |
| Cadastrar/editar sócio | ✅ | ✅ | ❌ |
| Registrar pagamento | ✅ | ✅ | ❌ |
| Ver relatório por unidade | ✅ | ✅ | ✅ (só sua unidade) |

*Nota: verificar se Financeiro.tsx já tem guarda de perfil ou se segue o padrão atual de acesso irrestrito dentro do módulo.*

---

## Estratégia de Testes

- Testar `socioEstaEmDia()` — verificação de pagamento por mês
- Testar `getUltimosMeses()` — geração de lista de meses
- Testar `formatMesRef()` — formatação de display
- Testar `createPagamentoSocio` — via mock do Firestore
