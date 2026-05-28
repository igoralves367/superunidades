---
name: sdd.go
description: Modo Express — orquestra start, spec, plan, build e finish em um único comando. Use para desenvolvimento rápido de features quando quiser o workflow completo automatizado com interação mínima.
model: opus
argument-hint: "[descrição-da-feature]"
---

# Comando: /sdd.go

**Descrição**: Modo Express — orquestra o workflow completo automaticamente

**Uso**:
- `/sdd.go "nome-da-feature"` → Workflow automático com nome explícito
- `/sdd.go "descrição da feature"` → Deriva nome automaticamente da descrição
- `/sdd.go --resume` → Retomar workflow express interrompido

---

## Ajuda Rápida

> `/sdd.go help` → Mostra este resumo

**Fluxo**: start → spec → plan → build → finish (3-5 perguntas no total)

**Exemplos**:
```
/sdd.go "ranking-modo-reta-final"
/sdd.go "adicionar filtro de busca nos membros"
```

---

## Arquitetura: Padrão Orquestrador

> **CRÍTICO**: `/sdd.go` é um **orquestrador**, NÃO uma implementação standalone.
> Invoca os comandos padrão com regras do modo express.

**Fluxo**: `/sdd.start --express` → `/sdd.spec` → `/sdd.plan` → `/sdd.build` → `/sdd.finish`

---

## Regras Express

### 1. Perguntas Consolidadas (3-5 apenas)

| # | Pergunta | Propósito | Quando |
|---|----------|-----------|--------|
| 1 | Qual é a feature principal? | Problema e objetivo | Sempre |
| 2 | Quem usa? (perfil de usuário) | Contexto de uso | Sempre |
| 3 | Restrições técnicas? | Decisões arquiteturais | Sempre |
| 4 | Integra com quais coleções Firestore? | Dependências de dados | Se dados envolvidos |
| 5 | Há regras de permissão por perfil? | Controle de acesso | Se perfis afetados |

### 2. Defaults Predefinidos

| Decisão | Default Express |
|---------|----------------|
| Estratégia de execução | Batched |
| Meta de cobertura | 60% |
| Template | Full |

### 3. Comportamento Auto-Avanço

- Sem prompts de confirmação entre etapas
- Pausar somente em: erros, decisões de segurança, perguntas consolidadas

---

## Fluxo de Execução

| Etapa | Comando | Override |
|-------|---------|----------|
| 0 | Validação do input | Deriva nome se for descrição |
| 1 | `/sdd.start "<nome>" --express` | Ver `sdd.start.md` |
| 2 | `/sdd.spec` | Perguntas consolidadas |
| 3 | `/sdd.plan` | Auto-seleciona Batched |
| 4 | `/sdd.build` | Auto-retry 2x no máximo |
| 5 | `/sdd.finish` | Todas validações obrigatórias |

---

## Tratamento de Erros

Se qualquer etapa falhar, mostrar detalhes do erro e opções:
- (a) Corrigir e tentar novamente com o comando apropriado
- (b) Continuar no modo padrão: `/sdd.check`
- (c) Cancelar: `/sdd.cancel`

---

## Instruções para o Agente IA

### Step 0: Validação do Input

Se input for nome kebab-case válido → usar diretamente
Se input for descrição → derivar nome (extrair substantivos-chave, kebab-case), NÃO confirmar

### Steps 1-5

Executar cada comando referenciando os arquivos de skill correspondentes.
Não duplicar lógica — aplicar apenas overrides do modo express.

**Regra de Gatilho**: No modo express, o gatilho "faça sua mágica" é considerado implicitamente aprovado. Implementar diretamente após spec + plan aprovados.
