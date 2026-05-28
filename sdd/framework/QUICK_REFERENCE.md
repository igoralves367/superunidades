# SDD Kit — Referência Rápida

## Workflow em 30 Segundos

```
Express:  /sdd.go "descrição"  →  tudo automatizado

Padrão:
  /sdd.start "nome"   → criar feature
  /sdd.spec           → especificar (funcional + técnico)
  /sdd.plan           → planejar tasks
  /sdd.build          → implementar
  /sdd.finish         → validar e arquivar
```

## Onde Estou?

```
/sdd.check            → status da feature atual
/sdd.check --resume   → sessões retomáveis
/sdd.list             → todas as features
```

## Preciso Corrigir Algo

```
Erro TypeScript:   /sdd.fix --type typescript
Erro Firebase:     /sdd.fix --type firebase
Voltar ao spec:    /sdd.rollback 2
Desfazer task:     /sdd.rollback --task TASK-XXX
```

## Gerenciar Backlog

```
/sdd.backlog                       → listar
/sdd.backlog add --type idea "..." → adicionar ideia
/sdd.backlog add --type todo "..." → adicionar todo
/sdd.backlog start TODO-001        → criar feature do backlog
```

## Regras Invioláveis

```
1. Specs em português (pt-BR)
2. Todo Firestore: collection(db, 'clubs', clubeId, ...)
3. Soft delete: ativo: false (nunca deleteDoc)
4. TypeScript: sem any implícito
5. "Faça sua mágica" = autorização para implementar
```

## Stack do Projeto

```
React 19 + TypeScript 5.8 + Vite 6
Firebase (Auth + Firestore)
Tailwind CSS (CDN) + Lucide React
Recharts (gráficos)
```

## Estrutura sdd/

```
sdd/
  backlog.md       → TODOs, DEBTs, IDEAs
  PROJECT.md       → Stack e convenções
  PATTERNS.md      → Padrões acumulados
  wip/             → Features em andamento
  features/        → Features concluídas
  framework/       → Esta documentação
```
