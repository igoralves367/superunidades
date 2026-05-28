# Spec Técnico — [feature-name]

> **Instrução**: Este spec descreve COMO será construído.
> Texto em português do Brasil; código, tipos e nomes de funções em inglês.
> Cada seção deve ser completa o suficiente para um desenvolvedor implementar sem ambiguidade.

---

## Visão Geral da Arquitetura

[Descrição de 2-3 parágrafos explicando como as partes se conectam.
Pode incluir diagrama em ASCII ou lista de relações entre componentes.]

```
[ComponentePrincipal]
├── [SubComponente1]    → lista/tabela de dados
├── [SubComponente2]    → formulário ou modal
└── usa: [Serviço]      → operações Firestore
```

---

## Layer 1 — Componentes e UI

### Componentes Novos

| Componente | Arquivo | Propósito |
|------------|---------|-----------|
| `ComponentePrincipal` | `src/components/Feature/ComponentePrincipal.tsx` | [propósito] |
| `SubComponente` | `src/components/Feature/SubComponente.tsx` | [propósito] |

### Componentes Modificados

| Componente | Arquivo | Mudança |
|------------|---------|---------|
| `ComponenteExistente` | `src/components/Existente/ComponenteExistente.tsx` | [o que muda] |

### Props Principais

```typescript
// ComponentePrincipal
interface ComponentePrincipalProps {
  clubeId: string;
  // ... outros props
  onSuccess?: () => void;
}
```

### Hooks Customizados (se necessário)

```typescript
// src/hooks/useFeatureName.ts
function useFeatureName(clubeId: string) {
  // lógica de estado
  return { dados, loading, erro, refetch };
}
```

### Tipos TypeScript Novos

```typescript
// src/types/featureName.ts (ou no types/index.ts existente)
interface NovoTipo {
  id: string;
  clubeId: string;     // sempre presente
  campo1: string;
  campo2: number;
  ativo: boolean;      // soft delete
  criadoEm: Timestamp;
}
```

---

## Layer 2 — Firebase

### Coleções Firestore Afetadas

| Coleção | Operações | Filtros |
|---------|-----------|---------|
| `clubs/{clubeId}/[nome]` | getDocs, addDoc | `where('ativo', '==', true)` |
| `clubs/{clubeId}/[outro]` | updateDoc | por ID |

### Estrutura de Documentos

```typescript
// clubs/{clubeId}/[nome]/{docId}
{
  id: string;          // auto por Firestore
  clubeId: string;     // redundante, útil para queries
  campo1: string;
  campo2: number;
  ativo: boolean;      // false = soft deleted
  criadoEm: Timestamp;
  atualizadoEm?: Timestamp;
}
```

### Queries Principais

```typescript
// Query de listagem
const q = query(
  collection(db, 'clubs', clubeId, 'nome'),
  where('ativo', '==', true),
  orderBy('campo1')
);

// Query filtrada
const q = query(
  collection(db, 'clubs', clubeId, 'nome'),
  where('ativo', '==', true),
  where('campo2', '==', valor)
);
```

### Operações de Escrita

```typescript
// Criar
await addDoc(collection(db, 'clubs', clubeId, 'nome'), {
  ...dados, clubeId, ativo: true, criadoEm: Timestamp.now()
});

// Atualizar
await updateDoc(doc(db, 'clubs', clubeId, 'nome', id), {
  campo: novoValor, atualizadoEm: Timestamp.now()
});

// Soft delete
await updateDoc(doc(db, 'clubs', clubeId, 'nome', id), {
  ativo: false
});
```

**writeBatch necessário**: [Sim/Não — se sim, descrever quando]

### Índices Firestore Necessários

| Coleção | Campos | Tipo |
|---------|--------|------|
| `clubs/{id}/nome` | `ativo ASC, campo1 ASC` | Composto |

*(Índices simples são criados automaticamente)*

---

## Decisões Técnicas

### DD-1: [Título da Decisão]

**Problema**: [O que precisava ser decidido]

**Opção A**: [Primeira abordagem]
- Prós: [vantagens]
- Contras: [desvantagens]

**Opção B**: [Segunda abordagem]
- Prós: [vantagens]
- Contras: [desvantagens]

**Decisão**: Opção [A/B]

**Motivo**: [Justificativa detalhada]

---

### DD-2: [Título da Decisão]

[Mesma estrutura]

---

## Estrutura de Arquivos

```
src/
  components/
    [FeatureName]/
      [ComponentePrincipal].tsx
      [SubComponente].tsx
  hooks/
    use[FeatureName].ts           (se hook customizado)
  services/
    [domain]Service.ts            (se novo serviço)
  types/
    [feature].ts                  (se tipos isolados)
```

---

## Rotas / Navegação

| Rota | Componente | Acesso |
|------|------------|--------|
| `/[rota]` | `[Componente]` | [perfis permitidos] |

*(Se não há novas rotas, indicar qual componente existente recebe a feature)*

---

## Permissões por Perfil

| Funcionalidade | Diretor | Conselheiro | Instrutor |
|----------------|---------|-------------|-----------|
| Visualizar | ✅ | ✅ | [sim/não] |
| Criar/Editar | ✅ | [sim/não] | ❌ |
| Excluir/Desativar | ✅ | ❌ | ❌ |

---

## Estratégia de Testes

### O Que Testar

- [ ] [Componente] renderiza com props válidas
- [ ] [Função] retorna resultado esperado para input X
- [ ] Tratamento de erro quando Firebase falha

### O Que Não Precisa de Teste

- Componentes puramente visuais sem lógica
- Wrappers simples de biblioteca externa

---

## Restrições Técnicas

- [Limitação ou constraint que afeta a implementação]
- [Ex: "Firestore não suporta OR entre coleções — usar query separada"]
- [Ex: "Tailwind via CDN — sem purge de classes não usadas"]
