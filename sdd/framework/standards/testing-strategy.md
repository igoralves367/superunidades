# Estratégia de Testes — Superunidades

**Runner**: vitest
**Meta de cobertura**: 60% (meta inicial — projeto sem testes)
**Linguagem dos testes**: Português para descrições, inglês para código

---

## Contexto

O projeto superunidades atualmente não possui testes automatizados (DEBT-001).
A meta de 60% é inicial e realista para um projeto brownfield adicionando testes progressivamente.

---

## O Que Testar

### Prioridade Alta

1. **Funções de serviço Firebase**: lógica de transformação de dados
2. **Funções de cálculo**: pontuação, ranking, totais financeiros
3. **Hooks customizados**: lógica de estado e side effects
4. **Componentes com lógica condicional**: exibição baseada em permissões/estado

### Prioridade Baixa (testar se sobrar tempo)

- Componentes puramente visuais
- Wrappers simples de biblioteca
- Funções triviais (getters, formatadores simples)

---

## Estrutura dos Testes

```
src/
  __tests__/               (ou colocar ao lado dos arquivos)
  components/
    Feature/
      Feature.test.tsx
  services/
    featureService.test.ts
  hooks/
    useFeature.test.ts
```

---

## Exemplos de Testes

### Função de Serviço (sem Firebase)

```typescript
// rankingService.test.ts
import { describe, it, expect } from 'vitest';
import { calcularPontuacaoTotal } from './rankingService';

describe('calcularPontuacaoTotal', () => {
  it('retorna 0 para membro sem registros', () => {
    expect(calcularPontuacaoTotal([])).toBe(0);
  });

  it('soma pontos de múltiplos registros', () => {
    const registros = [
      { tipo: 'reuniao', pontos: 10 },
      { tipo: 'especialidade', pontos: 20 },
    ];
    expect(calcularPontuacaoTotal(registros)).toBe(30);
  });

  it('ignora registros com pontos negativos', () => {
    const registros = [
      { tipo: 'reuniao', pontos: 10 },
      { tipo: 'penalidade', pontos: -5 },
    ];
    expect(calcularPontuacaoTotal(registros)).toBe(10);
  });
});
```

### Componente React

```typescript
// MeuComponente.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MeuComponente } from './MeuComponente';

describe('MeuComponente', () => {
  it('exibe mensagem de loading inicialmente', () => {
    render(<MeuComponente clubeId="clube1" />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando props inválidos', () => {
    render(<MeuComponente clubeId="" />);
    expect(screen.getByText(/clube/i)).toBeInTheDocument();
  });

  it('chama onAction ao clicar no botão', async () => {
    const onAction = vi.fn();
    render(<MeuComponente clubeId="clube1" onAction={onAction} />);
    
    await userEvent.click(screen.getByRole('button', { name: /ação/i }));
    
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```

### Mock de Firebase

```typescript
// Para testar componentes que usam Firebase, usar vi.mock
import { vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      { id: 'membro1', data: () => ({ nome: 'João', ativo: true, clubeId: 'clube1' }) }
    ]
  }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));
```

**Atenção**: Mocks de Firebase são frágeis. Preferir testar a lógica de transformação, não a integração.

---

## Configuração do vitest

O projeto usa vitest. Para executar:

```bash
# Executar todos os testes
npx vitest run

# Executar em modo watch
npx vitest

# Com cobertura
npx vitest run --coverage
```

---

## Gates de Teste por Task

Quando uma task inclui testes, os critérios de aceitação devem incluir:

```json
"acceptance_criteria": [
  "AC-1: Testes unitários cobrindo caminho principal",
  "AC-2: Teste de caso de erro implementado",
  "GATE: npx vitest run passa sem falhas"
]
```

---

## Convenção de Descrições

```typescript
describe('[Componente/Função]', () => {
  it('[o que faz] quando [condição]', () => { });
  it('retorna [resultado] para [input]', () => { });
  it('chama [callback] quando [evento]', () => { });
  it('exibe [mensagem] quando [estado]', () => { });
});
```
