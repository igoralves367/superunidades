# Princípios Fundamentais — SDD Kit Superunidades

---

## O Que é SDD (Spec-Driven Development)

SDD é uma metodologia que garante que todo desenvolvimento de feature passe por:

1. **Especificação Funcional** — O QUÊ construir, em linguagem de negócio
2. **Especificação Técnica** — COMO construir, em linguagem técnica
3. **Tasks Granulares** — Trabalho dividido em unidades executáveis com critérios de aceitação
4. **Implementação Guiada** — Código escrito contra as specs aprovadas

**Por que isso importa**: Evita retrabalho por mal-entendimento, garante qualidade através de critérios claros, e cria documentação viva do sistema.

---

## Regras Invioláveis

### 1. Specs em Português (pt-BR)

Todo conteúdo de spec (funcional e técnico) deve ser em português do Brasil.
Exceções: termos técnicos (API, Firebase, Firestore, TypeScript, React), código, nomes de funções.

**Motivo**: O projeto é desenvolvido por brasileiros, para brasileiros. Specs em português reduzem ruído de tradução na comunicação.

### 2. Multi-Tenant Sempre

Toda operação Firestore DEVE incluir `clubeId` no path da coleção:
```typescript
// SEMPRE: clubs/{clubeId}/{subcoleção}
// NUNCA: coleção global sem clubeId
```

**Motivo**: O sistema suporta múltiplos clubes. Sem isolamento, dados de um clube podem vazar para outro.

### 3. Soft Delete por Padrão

Recursos com dados vinculados NÃO são deletados — são desativados:
```typescript
// SEMPRE: updateDoc(ref, { ativo: false })
// NUNCA: deleteDoc(ref) em recursos principais
```

**Motivo**: Preservar integridade referencial. Registros de presença, financeiro e ranking referenciam membros. Deletar causaria dados órfãos.

### 4. TypeScript Estrito

- Sem `any` implícito
- Sem `@ts-ignore`
- Interfaces para todos os tipos de domínio
- Props tipadas explicitamente

**Motivo**: TypeScript é a principal proteção contra erros de runtime no frontend. Enfraquecer a tipagem é pagar dívida técnica cara.

### 5. "Faça Sua Mágica" — Gatilho de Implementação

O código só é gerado após:
1. Spec funcional aprovado
2. Spec técnico aprovado
3. Tasks geradas e aprovadas
4. Usuário confirmar explicitamente

**Motivo**: Garantir que não há work-in-progress sem clareza do que está sendo construído.

### 6. Não Pular Fases

O workflow é: spec → plan → build → finish. Não é possível "pular" para a implementação sem specs aprovados.

**Exceção**: Modo express (`/sdd.go`) — mas mesmo assim, 3-5 perguntas críticas são feitas antes de qualquer código.

---

## Princípios de Qualidade

### Qualidade É Gate, Não Revisão Pós

Layer 3 (code review, performance, security) é parte do workflow, não opcional. Cada feature passa por revisão antes de ser arquivada.

### Documentação Como Artefato

Specs, tasks e progress.md são artefatos do projeto, não apenas notas temporárias. São arquivados em `sdd/features/` junto com o código.

### Padrões Acumulados

Boas descobertas durante implementação são promovidas para `sdd/PATTERNS.md`, beneficiando features futuras.

---

## O Que Este Kit NÃO É

- Não é um framework de CI/CD
- Não automatiza deploy
- Não gerencia Firebase Security Rules automaticamente
- Não substitui code review humano (complementa)
- Não cria infraestrutura Firebase (apenas documenta e usa)
