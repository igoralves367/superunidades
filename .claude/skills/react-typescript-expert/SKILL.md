# Skill: react-typescript-expert

**Versão**: 1.0.0
**Propósito**: Especialista em React 19 + TypeScript para o projeto superunidades

---

## Quando Invocar

Invocar esta skill quando:
- Criando ou revisando componentes React
- Definindo tipos TypeScript para features novas
- Projetando estrutura de componentes e hierarquia
- Criando hooks customizados
- Resolvendo problemas de tipagem

---

## Stack de Referência

```yaml
react: 19 (sem React.FC — usar function declarations)
typescript: ~5.8.2 (modo estrito)
build: Vite 6.2.0
icons: Lucide React
charts: Recharts 3.7.0
styling: Tailwind CSS (CDN, classes utilitárias)
```

---

## Padrões de Componentes

### Estrutura de Componente

```typescript
// ✅ CORRETO — React 19, sem React.FC, sem import React
import { useState, useEffect } from 'react';
import { Tipo } from '../types';

interface Props {
  clubeId: string;
  onSuccess?: () => void;
}

export function MeuComponente({ clubeId, onSuccess }: Props) {
  const [dados, setDados] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, [clubeId]);

  async function carregarDados() {
    try {
      setLoading(true);
      const resultado = await buscarDados(clubeId);
      setDados(resultado);
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (erro) return <div className="text-red-600">{erro}</div>;

  return (
    <div>
      {/* conteúdo */}
    </div>
  );
}
```

### Hooks Customizados

```typescript
// ✅ Hook para carregar dados com estado
function useDados(clubeId: string) {
  const [dados, setDados] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await buscarDados(clubeId);
        setDados(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [clubeId]);

  return { dados, loading };
}
```

---

## Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `RankingCard.tsx` |
| Hooks | camelCase com `use` | `useRankingData.ts` |
| Funções | camelCase | `calcularPontuacao` |
| Tipos/Interfaces | PascalCase | `Membro`, `RankingItem` |
| Constantes | UPPER_SNAKE_CASE | `MAX_PONTOS_REUNIAO` |
| Arquivos de componente | PascalCase | `ListaMembros.tsx` |
| Arquivos de serviço | camelCase | `rankingService.ts` |

---

## Tipos TypeScript

```typescript
// ✅ Interface de domínio com campos explícitos
interface Membro {
  id: string;
  nome: string;
  clubeId: string;
  perfil: 'diretor' | 'conselheiro' | 'instrutor' | 'desbravador';
  ativo: boolean;
  criadoEm: Timestamp;
}

// ✅ Tipos de props com opcionais explícitos
interface RankingCardProps {
  item: RankingItem;
  posicao: number;
  onClick?: (id: string) => void;   // ? = opcional
}

// ❌ EVITAR
const dados: any = {};
function calcular(x: any): any { }
```

---

## Tailwind CSS

```tsx
// ✅ Classes Tailwind diretamente
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <span className="text-sm font-medium text-gray-700">{nome}</span>
  <span className="text-xs text-gray-500">{data}</span>
</div>

// ✅ Classes condicionais
<div className={`p-2 rounded ${ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
  {status}
</div>
```

---

## Recharts (Gráficos)

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={dados}>
    <XAxis dataKey="nome" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="pontos" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

---

## Anti-Padrões a Evitar

```typescript
// ❌ NÃO usar any
const x: any = {};

// ❌ NÃO usar @ts-ignore
// @ts-ignore
objeto.campo;

// ❌ NÃO usar React.FC
const Comp: React.FC<Props> = ({ }) => { };

// ❌ NÃO importar React sem usar
import React from 'react';

// ❌ NÃO ignorar erros de TypeScript silenciosamente
try { } catch (e) { }  // sem console.error

// ✅ CORRETO
try { } catch (e) { console.error(e); alert('Erro ao processar'); }
```

---

## Estrutura de Pastas por Feature

```
src/
  components/
    [FeatureName]/
      [PrincipalComponent].tsx    # Componente raiz da feature
      [SubComponent].tsx          # Sub-componentes
  hooks/
    use[FeatureName].ts           # Hook customizado se necessário
  services/
    [domain]Service.ts            # Funções de serviço (Firestore)
  types/
    [domain].ts                   # Tipos da feature
```
