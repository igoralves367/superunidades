# SDD Kit — Referência de Comandos

**Versão**: 1.0.0 (adaptado para superunidades)

---

## Comandos Principais

### /sdd.go
```
Uso: /sdd.go "descrição da feature"
Flags: --resume
Modo: Express (workflow completo automatizado)
```
Orquestra todo o workflow: start → spec → plan → build → finish com interação mínima (3-5 perguntas).

---

### /sdd.start
```
Uso: /sdd.start "descrição" [flags]
Flags:
  --express           Inicializar em modo express
  --from-backlog <ID> Criar a partir de item do backlog
  --rename [nome]     Renomear feature atual
  --reopen [nome]     Reabrir feature concluída
  --reopen [nome] --phase N  Reabrir em fase específica
```
Inicializa nova feature: cria pasta `sdd/wip/`, `meta.md`, e branch `feature/nome`.

---

### /sdd.spec
```
Uso: /sdd.spec [fase] [flags]
Fases:
  (nenhuma)         Auto-detectar fase atual
  functional        Apenas spec funcional
  technical         Apenas spec técnico
Flags:
  --approve         Aprovar spec atual
  --iterate "desc"  Refinar spec com nova informação
  --summary         Ver resumo sem carregar spec completo
  --resume          Retomar sessão interrompida
```
Cria e aprova especificações funcional (O QUÊ) e técnica (COMO).

---

### /sdd.plan
```
Uso: /sdd.plan [flags]
Flags:
  --approve  Aprovar tasks e escolher estratégia
  --refine   Refinar tasks existentes
  --resume   Retomar sessão interrompida
  --view     Exibir tasks em tabela
```
Gera tasks de implementação a partir dos specs aprovados. Cria `tasks.json`.

---

### /sdd.build
```
Uso: /sdd.build [alvo] [flags]
Alvos:
  (nenhum)           Implementar todas as tasks
  task TASK-XXX      Implementar task específica
  phase N            Implementar fase N
Flags:
  --layer N   Implementar até layer N
  --resume    Retomar sessão interrompida
  --next      Continuar com próxima task pendente
```
Implementa tasks seguindo a estratégia aprovada, com quality gates por layer.

---

### /sdd.finish
```
Uso: /sdd.finish [flags]
Flags:
  --skip-tests  Pular re-execução de testes (não recomendado)
```
Valida feature completa e arquiva de `sdd/wip/` para `sdd/features/`.

---

## Comandos Utilitários

### /sdd.check
```
Uso: /sdd.check [alvo] [flags]
Alvos:
  (nenhum)      Feature atual
  [nome]        Feature específica
  task TASK-XXX Task específica
Flags:
  --sync        Verificar consistência specs/tasks/código
  --compliance  Verificar TypeScript/testes
  --resume      Listar sessões retomáveis
```
Visualiza status, progresso e validações da feature.

---

### /sdd.fix
```
Uso: /sdd.fix [alvo] [flags]
Alvos:
  (nenhum)     Diagnosticar feature atual
  TASK-XXX     Focar em task com problemas
Flags:
  --type typescript  Erros TypeScript
  --type firebase    Erros Firebase/Firestore
  --type patterns    Violações de padrões
```
Diagnóstico e correção de erros com análise de consistência horizontal.

---

### /sdd.list
```
Uso: /sdd.list [flags]
Flags:
  (nenhum)    Features em andamento (wip)
  --all       Todas (wip + concluídas + canceladas)
  --features  Apenas concluídas
  --cancelled Apenas canceladas
```
Lista features do projeto com status e progresso.

---

### /sdd.backlog
```
Uso: /sdd.backlog [ação] [flags]
Ações:
  (nenhuma)          Listar backlog completo
  add                Adicionar item interativamente
  add --type todo    Adicionar TODO
  add --type debt    Adicionar DEBT
  add --type idea    Adicionar IDEA
  done <ID>          Marcar item como concluído
  start <ID>         Criar feature a partir do item
```
Gerencia backlog centralizado (`sdd/backlog.md`).

---

### /sdd.cancel
```
Uso: /sdd.cancel [nome] [flags]
Flags:
  --reason "motivo"  Documentar motivo do cancelamento
```
Cancela feature em andamento, arquivando em `sdd/cancelled/`. **Sempre pede confirmação.**

---

### /sdd.rollback
```
Uso: /sdd.rollback [N|alvo]
Alvos:
  (nenhum)       Reverter para fase anterior
  N              Reverter para fase N (1-4)
  --task TASK-X  Desfazer task específica
  --phase N      Alias para N
```
Reverte para fase anterior do workflow. Atualiza estado do framework (não desfaz git automaticamente).

---

### /sdd.help
```
Uso: /sdd.help [tópico]
Tópicos:
  (nenhum)   Visão geral e lista de comandos
  workflow   Guia completo do workflow
  [comando]  Ajuda específica (ex: /sdd.help spec)
```

---

### /sdd.project
```
Uso: /sdd.project [ação]
Ações:
  (nenhuma)      Resumo do PROJECT.md
  --stack        Ver stack tecnológico
  --conventions  Ver convenções de código
  --edit         Editar PROJECT.md guiado
  patterns       Ver PATTERNS.md
  patterns --add Adicionar padrão manualmente
```
Gerencia configurações e padrões do projeto SDD.

---

### /sdd.reverse-eng
```
Uso: /sdd.reverse-eng [flags]
Flags:
  --phase 1         Apenas extração
  --phase 3         Apenas síntese (requer 1-2)
  --domain [nome]   Focar em domínio específico
```
Documenta codebase existente por engenharia reversa. Output em `sdd/extracted/`.

---

## Referência Rápida de Flags

| Flag | Aplicável a | Descrição |
|------|-------------|-----------|
| `help` | Todos | Exibir ajuda rápida do comando |
| `--express` | start, go | Modo com interação mínima |
| `--approve` | spec, plan | Aprovar spec/tasks atual |
| `--resume` | go, build, spec, check | Retomar sessão interrompida |
| `--next` | build | Continuar com próxima task |
| `--refine` | plan | Refinar tasks antes de aprovar |
| `--sync` | check | Verificar consistência |
| `--compliance` | check | Verificar TypeScript/testes |
| `--all` | list | Listar todas as features |
| `--reason` | cancel | Documentar motivo |
| `--task` | rollback | Reverter task específica |
| `--phase N` | start --reopen, rollback | Fase alvo |

---

## Convenções de Naming

| Item | Formato | Exemplo |
|------|---------|---------|
| Nome de feature | kebab-case | `filtro-busca-membros` |
| Pasta de feature | YYYYMMDD-kebab | `20260527-filtro-busca-membros` |
| Branch git | feature/kebab | `feature/filtro-busca-membros` |
| ID de task | TASK-NNN | `TASK-001` |
| ID de backlog | TIPO-NNN | `TODO-001`, `DEBT-003` |
| ID de decisão | DD-N | `DD-1`, `DD-3` |

---

## Gates de Qualidade por Fase

| Fase | Gate | Bloqueante |
|------|------|-----------|
| Spec funcional | Histórias de usuário + critérios | Sim |
| Spec técnico | Arquitetura + tipos + decisões | Sim |
| Tasks | JSON válido + critérios por task | Sim |
| Implementação | `tsc --noEmit` + padrões | Sim |
| Conclusão | Build + testes + code review | Sim |
