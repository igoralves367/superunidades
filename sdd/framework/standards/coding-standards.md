# Padrões de Código — Superunidades

**Stack**: React 19 + TypeScript ~5.8.2 + Vite 6.2.0

---

## TypeScript

### Tipos Explícitos

```typescript
// ✅ CORRETO — tipos explícitos
interface Membro {
  id: string;
  nome: string;
  clubeId: string;
  ativo: boolean;
}

function calcularPontos(membro: Membro): number {
  return membro.pontos ?? 0;
}

// ❌ ERRADO — nunca usar any implícito
const dados: any = {};
function processar(x: any): any { }
```

### Optional Chaining e Nullish Coalescing

```typescript
// ✅ Preferir optional chaining
const nome = membro?.nome ?? 'Sem nome';
const primeiro = lista?.[0];

// ✅ Preferir nullish coalescing para defaults
const pontos = dados.pontos ?? 0;
```

### Enums e Union Types

```typescript
// ✅ Union types (mais simples que enums)
type PerfilUsuario = 'diretor' | 'conselheiro' | 'instrutor' | 'responsavel_financeiro';
type StatusTask = 'pending' | 'in_progress' | 'done';

// ✅ Const objects para conjuntos com valor
const PERFIS = {
  DIRETOR: 'diretor',
  CONSELHEIRO: 'conselheiro',
} as const;
type Perfil = typeof PERFIS[keyof typeof PERFIS];
```

---

## React 19

### Estrutura de Componente

```typescript
// ✅ CORRETO — React 19
import { useState, useEffect, useCallback } from 'react';
import { NomeTipo } from '../types';

interface Props {
  clubeId: string;
  onAction?: (id: string) => void;
}

export function NomeComponente({ clubeId, onAction }: Props) {
  // estado
  const [dados, setDados] = useState<NomeTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // efeitos
  useEffect(() => {
    carregarDados();
  }, [clubeId]);

  // funções
  async function carregarDados() {
    try {
      setLoading(true);
      const res = await buscarDados(clubeId);
      setDados(res);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setErro('Não foi possível carregar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // render
  if (loading) return <div className="text-center p-4">Carregando...</div>;
  if (erro) return <div className="text-red-600 p-4">{erro}</div>;

  return (
    <div>
      {/* conteúdo */}
    </div>
  );
}
```

### Proibições React

```typescript
// ❌ Não usar React.FC
const Comp: React.FC<Props> = ({ }) => {};

// ❌ Não importar React sem usar (React 19)
import React from 'react';

// ❌ Não usar index como key em listas mutáveis
lista.map((item, index) => <div key={index}>...)

// ✅ Usar ID único como key
lista.map(item => <div key={item.id}>...)
```

### Performance

```typescript
// useCallback para funções passadas como props
const handleClick = useCallback((id: string) => {
  onAction?.(id);
}, [onAction]);

// useMemo para computações caras
const totalPontos = useMemo(
  () => membros.reduce((acc, m) => acc + m.pontos, 0),
  [membros]
);
```

---

## Nomenclatura

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Componente | PascalCase | `RankingCard` |
| Arquivo de componente | PascalCase.tsx | `RankingCard.tsx` |
| Hook | camelCase com `use` | `useRankingData` |
| Arquivo de hook | camelCase.ts | `useRankingData.ts` |
| Função de serviço | camelCase | `getMembrosAtivos` |
| Arquivo de serviço | camelCase.ts | `rankingService.ts` |
| Interface/Tipo | PascalCase | `RankingItem` |
| Constante | UPPER_SNAKE_CASE | `MAX_PONTOS_REUNIAO` |
| Variável | camelCase | `clubeId`, `listaFiltrada` |

---

## Imports

```typescript
// Ordem recomendada de imports:
// 1. React e hooks
import { useState, useEffect } from 'react';

// 2. Firebase
import { collection, getDocs, query, where } from 'firebase/firestore';

// 3. Biblioteca externa (Lucide, Recharts)
import { Plus, Trash2 } from 'lucide-react';

// 4. Tipos internos
import { Membro, RankingItem } from '../types';

// 5. Serviços internos
import { getMembrosAtivos } from '../services/firestoreDb';

// 6. Componentes internos
import { LoadingSpinner } from './shared/LoadingSpinner';
```

---

## Comentários

Adicionar comentário **apenas** quando o WHY não é óbvio:

```typescript
// ✅ Comentário necessário — explica constraint não óbvio
// Firestore não suporta OR entre campos diferentes — usar query separada
const q1 = query(col, where('status', '==', 'ativo'));
const q2 = query(col, where('status', '==', 'pendente'));

// ❌ Comentário desnecessário — o código já diz isso
// Buscar membros ativos
const membros = await getMembrosAtivos(clubeId);
```

---

## Tailwind CSS

```tsx
// ✅ Classes inline para estilo simples
<div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow">

// ✅ Classes condicionais com template string
<button className={`px-4 py-2 rounded ${ativo ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>

// ✅ cn() ou clsx() se disponível no projeto para classes complexas
```

---

## Tratamento de Erros

```typescript
// Padrão obrigatório para operações Firebase
try {
  await operacaoFirebase();
  // sucesso: atualizar estado
} catch (e) {
  console.error('[contexto]:', e);        // para debugging
  alert('Mensagem amigável ao usuário'); // feedback imediato
  setErro('Mensagem para exibir na UI'); // estado de erro
}
```
