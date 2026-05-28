---
name: sdd.help
description: Ajuda do SDD Kit. Exibe referência de comandos, workflow e exemplos. Use quando precisar de orientação sobre como usar o framework.
model: sonnet
argument-hint: "[comando|workflow|start|spec|plan|build|finish]"
---

# Comando: /sdd.help

**Descrição**: Documentação e ajuda do SDD Kit

**Uso**:
- `/sdd.help` → Visão geral e lista de comandos
- `/sdd.help workflow` → Guia completo do workflow
- `/sdd.help [comando]` → Ajuda específica de um comando
- `/sdd.help start` → Ajuda do /sdd.start
- `/sdd.help spec` → Ajuda do /sdd.spec

---

## /sdd.help (visão geral)

```
# SDD Kit — Super Unidades

Desenvolvimento spec-driven para o projeto superunidades.
Stack: React 19 + TypeScript + Firebase + Vite

## Workflow Padrão
/sdd.start → /sdd.spec → /sdd.plan → /sdd.build → /sdd.finish

## Workflow Express (1 comando)
/sdd.go "descrição da feature"

## Comandos Principais
  /sdd.start   Inicializar nova feature
  /sdd.spec    Criar especificações (funcional + técnico)
  /sdd.plan    Gerar tasks de implementação
  /sdd.build   Implementar tasks
  /sdd.finish  Validar e arquivar feature

## Utilitários
  /sdd.check    Ver status e progresso
  /sdd.fix      Corrigir erros
  /sdd.list     Listar features
  /sdd.backlog  Gerenciar backlog
  /sdd.cancel   Cancelar feature
  /sdd.rollback Reverter para fase anterior
  /sdd.go       Modo express (workflow completo)

## Exemplos Rápidos
  /sdd.go "adicionar filtro de busca nos membros"
  /sdd.start "relatorio-financeiro"
  /sdd.check
  /sdd.list --all
  /sdd.backlog add --type idea "exportação PDF"

## Estrutura de Pastas
  sdd/wip/        Features em andamento
  sdd/features/   Features concluídas
  sdd/backlog.md  Backlog centralizado
  sdd/PROJECT.md  Configuração do projeto

## Documentação Completa
  sdd/framework/WORKFLOW.md    Guia do workflow
  sdd/framework/COMMANDS.md    Referência de comandos
```

---

## /sdd.help workflow

Exibir conteúdo de `sdd/framework/WORKFLOW.md` adaptado para o projeto.

---

## /sdd.help [comando]

Executar o comando especificado com o flag `help`:
- `/sdd.help start` → equivale a `/sdd.start help`
- `/sdd.help spec` → equivale a `/sdd.spec help`
- `/sdd.help plan` → equivale a `/sdd.plan help`
- etc.

---

## Regras do Agente IA

1. **Sempre mostrar exemplos** — Respostas de help devem incluir exemplos práticos
2. **Contexto do projeto** — Adaptar exemplos para superunidades (não genéricos)
3. **Conciso** — Help deve caber em ~30 linhas por tópico
