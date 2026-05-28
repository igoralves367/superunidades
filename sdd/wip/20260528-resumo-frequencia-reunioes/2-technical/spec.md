# Spec Técnico — resumo-frequencia-reunioes

## Visão Geral da Arquitetura

Feature de **somente leitura + agregação**: não cria novos documentos Firestore,
não adiciona coleções. Consome dados já existentes em `reunioes` e
`reunioes_presencas` e exibe um resumo calculado no lado cliente.

Impacto restrito a dois arquivos: `pages/Reunioes.tsx` (nova seção de UI)
e uma função pura de cálculo embutida no mesmo arquivo.

```
Reunioes.tsx
  └─ nova seção "Resumo Trimestral"
       ├─ seletor de trimestre (estado: summaryQuarter)
       ├─ carrega dados via funções já existentes no firestoreDb.ts
       ├─ executa buildFrequencySummary() — função pura local
       └─ renderiza tabela por unidade
```

## Camadas Afetadas

### Layer 1 — Componentes e UI

**Componentes modificados**: `pages/Reunioes.tsx` (única alteração)

**Novo estado adicionado ao componente**:
```typescript
const [activeView, setActiveView] = useState<'agenda' | 'resumo'>('agenda');
const [summaryQuarter, setSummaryQuarter] = useState<1 | 2 | 3 | 4>(() => {
  // reutiliza o mesmo cálculo de trimestre padrão já existente no componente
  const m = new Date().getMonth();
  return (Math.floor(m / 3) + 1) as 1 | 2 | 3 | 4;
});
const [summaryData, setSummaryData] = useState<UnitFrequencySummary[] | null>(null);
const [isSummaryLoading, setIsSummaryLoading] = useState(false);
```

**Novo tipo local** (definido no topo de Reunioes.tsx, não em types.ts — é um
tipo de apresentação, não um contrato de domínio):
```typescript
interface UnitFrequencySummary {
  unidadeId: string;
  unidadeNome: string;
  memberCount: number;           // membros ativos excluindo conselheiro
  unitFrequencyPct: number | null; // null = sem membros ou sem reuniões
  counselorId: string | null;
  counselorNome: string | null;
  counselorPresent: number | null; // presenças do conselheiro
  counselorTotal: number | null;   // total de reuniões (denominador)
  counselorFrequencyPct: number | null; // null = sem conselheiro
  totalMeetings: number;
}
```

**Toggle de visão** (inserido logo abaixo do header da página, acima das seções
de trimestre existentes):
```tsx
<div className="flex gap-2 mb-4">
  <button onClick={() => setActiveView('agenda')}
    className={activeView === 'agenda' ? 'bg-[#00F5A0] text-black ...' : 'border ...'}>
    Agenda
  </button>
  <button onClick={() => setActiveView('resumo')}
    className={activeView === 'resumo' ? 'bg-[#00F5A0] text-black ...' : 'border ...'}>
    Resumo Trimestral
  </button>
</div>

{activeView === 'agenda' && <> {/* seções de trimestre existentes, sem alteração */} </>}
{activeView === 'resumo' && <FrequenciaSummarySection ... />}
```

**Tabela do Resumo** — renderização inline dentro de Reunioes.tsx:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Resumo Trimestral — [1º / 2º / 3º / 4º] Trimestre                 │
│  [10 reuniões no período]                                            │
├──────────────┬───────────────────────┬───────────────────────────────┤
│ Unidade      │ Frequência da Unidade │ Conselheiro                   │
├──────────────┼───────────────────────┼───────────────────────────────┤
│ Leões        │ 80%  (5 membros)      │ João Silva  9/10  90%         │
│ Águias       │ 65%  (4 membros)      │ Maria Santos 7/10  70%        │
│ Feras        │ —    (sem membros)    │ Sem conselheiro               │
└──────────────┴───────────────────────┴───────────────────────────────┘
```

Cores por faixa de frequência (reutiliza padrão visual do relatório existente):
- ≥ 75%: `text-[#00F5A0]` (verde)
- 50–74%: `text-yellow-400` (amarelo)
- < 50%: `text-[#E53935]` (vermelho)
- `null` / sem dados: `text-gray-400`

### Layer 2 — Firebase

**Nenhuma escrita nova**. Apenas leituras, todas multi-tenant.

**Funções existentes reutilizadas** (sem modificação):

| Função | Arquivo | Uso |
|--------|---------|-----|
| `listPresencasPorTrimestre(clubId, trimestre)` | firestoreDb.ts:1697 | Presenças do trimestre |
| `listDesbravadores(clubId)` | firestoreDb.ts:397 | Membros + cargos |
| `listUnidades(clubId)` | firestoreDb.ts | Unidades ativas |
| `listReunioes(clubId)` | firestoreDb.ts:1664 | Contagem de reuniões por trimestre |

**Carregamento do resumo** (disparado ao trocar trimestre ou ao abrir a aba):
```typescript
const loadSummary = async () => {
  setIsSummaryLoading(true);
  const [presencas, membros, unidades, todasReunioes] = await Promise.all([
    fs.listPresencasPorTrimestre(user.clubeId, summaryQuarter),
    fs.listDesbravadores(user.clubeId),
    fs.listUnidades(user.clubeId),
    fs.listReunioes(user.clubeId),
  ]);
  const result = buildFrequencySummary(
    presencas, membros, unidades, todasReunioes, summaryQuarter
  );
  setSummaryData(result);
  setIsSummaryLoading(false);
};
```

**Nenhuma query adicional** ao Firestore — tudo é cálculo lado cliente.

### Layer 3 — Função Pura de Cálculo

Definida no topo de `Reunioes.tsx` (fora do componente, testável isoladamente):

```typescript
function buildFrequencySummary(
  presencas: ReuniaoPresenca[],
  membros: Desbravador[],
  unidades: Unidade[],
  todasReunioes: Reuniao[],
  trimestre: number
): UnitFrequencySummary[] {
  // 1. Reuniões ativas do trimestre (denominador fixo)
  const reunioesTrimestre = todasReunioes.filter(
    r => r.trimestre === trimestre && r.ativo
  );
  const totalMeetings = reunioesTrimestre.length;
  const reuniaoIds = new Set(reunioesTrimestre.map(r => r.id));

  // 2. Filtrar presenças apenas das reuniões do trimestre (segurança)
  const presencasTrimestre = presencas.filter(p => reuniaoIds.has(p.reuniaoId));

  // 3. Membros ativos
  const membrosAtivos = membros.filter(m => m.status === 'ATIVO');

  // 4. Para cada unidade ativa
  return unidades
    .filter(u => u.ativo)
    .map(unidade => {
      // Identificar conselheiro: membro ativo com cargo CONSELHEIRO + unidadeId === unidade.id
      const conselheiro = membrosAtivos.find(m =>
        m.cargos?.some(
          c => c.cargoId === CargoDesbravador.CONSELHEIRO && c.unidadeId === unidade.id
        )
      ) ?? null;

      // Membros da unidade (excluindo conselheiro)
      const membrosUnidade = membrosAtivos.filter(
        m => m.unidadeId === unidade.id && m.id !== conselheiro?.id
      );

      // Frequência da unidade
      let unitFrequencyPct: number | null = null;
      if (membrosUnidade.length > 0 && totalMeetings > 0) {
        const sumPct = membrosUnidade.reduce((acc, m) => {
          const presente = presencasTrimestre.filter(
            p => p.desbravadorId === m.id && p.presente
          ).length;
          return acc + (presente / totalMeetings) * 100;
        }, 0);
        unitFrequencyPct = Math.round(sumPct / membrosUnidade.length);
      }

      // Frequência do conselheiro
      let counselorPresent: number | null = null;
      let counselorFrequencyPct: number | null = null;
      if (conselheiro && totalMeetings > 0) {
        counselorPresent = presencasTrimestre.filter(
          p => p.desbravadorId === conselheiro.id && p.presente
        ).length;
        counselorFrequencyPct = Math.round((counselorPresent / totalMeetings) * 100);
      }

      return {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        memberCount: membrosUnidade.length,
        unitFrequencyPct,
        counselorId: conselheiro?.id ?? null,
        counselorNome: conselheiro?.nome ?? null,
        counselorPresent,
        counselorTotal: conselheiro ? totalMeetings : null,
        counselorFrequencyPct,
        totalMeetings,
      };
    });
}
```

**Notas de segurança do cálculo**:
- Sem marcação = falta (denominador sempre `totalMeetings` por membro)
- Conselheiro excluído da média da unidade
- Arredondamento com `Math.round` (sem casas decimais)
- Unidade com `memberCount === 0` → `unitFrequencyPct = null` (exibe "—")
- Unidade sem conselheiro identificado → coluna conselheiro exibe "Sem conselheiro"

## Decisões Técnicas

### DD-1: Cálculo lado cliente, sem nova função Firestore
**Problema**: Onde executar a agregação de frequência?
**Decisão**: Cálculo puro no cliente — função `buildFrequencySummary()` local em Reunioes.tsx.
**Alternativas rejeitadas**: Nova função em `firestoreDb.ts`; Cloud Function.
**Motivo**: Os dados já são carregados com as 4 funções existentes. Não há ganho em
criar uma 5ª função de serviço só para agregar — seria abstração sem valor. Cloud
Function seria over-engineering para um cálculo sem escrita.

### DD-2: Toggle agenda/resumo, não nova rota
**Problema**: Como expor a nova visão sem criar nova rota?
**Decisão**: Estado local `activeView: 'agenda' | 'resumo'` + toggle de botões.
**Alternativas rejeitadas**: Nova rota `#reunioes-resumo`; tab component externo.
**Motivo**: A feature é contextual à página Reuniões. Criar rota separada geraria
breadcrumb e navegação desnecessários. Tab interno é mais simples e consistente
com o padrão já usado em Financeiro.tsx (aba SOCIOS, CAIXA etc).

### DD-3: Identificação do conselheiro via coleção `cargos` (cruzamento por tipo)
**Problema**: Como encontrar o conselheiro de uma unidade?
**Decisão**: Carregar `listCargos(clubId)`, obter os IDs de cargos cujo `tipo === 'CONSELHEIRO'`,
e identificar o conselheiro como o membro ativo cujo `cargos[].cargoId` está nesse conjunto
e cujo `cargos[].unidadeId === unidade.id`.
**Alternativas rejeitadas**: Comparar `cargoId` diretamente com o enum string 'CONSELHEIRO'.
**Motivo**: Verificação no código real (mockData.ts:47, firestoreDb.ts:648,
Desbravadores.tsx:128) mostrou que `MemberCargo.cargoId` é o **ID do documento** da
coleção `cargos` (ex: `cargo_conselheiro`), **não** o valor do enum. O cargo tem o campo
`tipo` ('CONSELHEIRO') que é o discriminador correto. Por isso `listCargos` é uma 5ª
fonte de dados obrigatória.
**Implicação**: `buildFrequencySummary` recebe um parâmetro adicional `cargos: Cargo[]`
(ou um Set de IDs de cargos conselheiro pré-computado).

### DD-4: UnitFrequencySummary como tipo local, não em types.ts
**Problema**: Onde declarar a interface de apresentação?
**Decisão**: Interface local no topo de Reunioes.tsx.
**Motivo**: Tipo de apresentação pura, sem uso em outros módulos. Não pertence ao
contrato de domínio em `types.ts`.

## Estrutura de Arquivos (alterações)

```
pages/
  Reunioes.tsx              ← MODIFICADO
    + interface UnitFrequencySummary (tipo local)
    + function buildFrequencySummary() (função pura, fora do componente)
    + estado: activeView, summaryQuarter, summaryData, isSummaryLoading
    + loadSummary() (efeito disparado ao mudar activeView ou summaryQuarter)
    + toggle Agenda / Resumo Trimestral no topo
    + renderização da tabela de resumo
```

Nenhum arquivo novo criado.

## Contratos de Interface

**buildFrequencySummary** (função pura):
```typescript
function buildFrequencySummary(
  presencas: ReuniaoPresenca[],
  membros: Desbravador[],
  unidades: Unidade[],
  todasReunioes: Reuniao[],
  trimestre: number
): UnitFrequencySummary[]
```

**loadSummary** (side-effect dentro do componente):
- Dispara em: mount (quando `activeView === 'resumo'`) e ao mudar `summaryQuarter`
- Não dispara quando `activeView === 'agenda'`

## Permissões por Perfil

A seção "Resumo Trimestral" segue a mesma permissão da página Reuniões.tsx:
acessível a todos os perfis autenticados (`DIRETORIA`, `CONSELHEIRO`, `INSTRUTOR`,
`FINANCEIRO`). Nenhuma restrição adicional por perfil necessária nesta feature.

## Estratégia de Testes

- Testar `buildFrequencySummary()` com dados mockados:
  - Unidade com 3 membros, 10 reuniões, 0 presenças → 0%
  - Unidade sem registros de presença (nenhum doc em presencas) → 0%
  - Unidade sem membros ativos → null (exibe "—")
  - Unidade com conselheiro identificado → coluna conselheiro preenchida
  - Unidade sem conselheiro → "Sem conselheiro"
  - Trimestre sem reuniões ativas → totalMeetings = 0, todos null
