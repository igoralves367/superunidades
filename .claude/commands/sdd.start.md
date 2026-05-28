---
name: sdd.start
description: Inicializa uma nova feature no SDD Kit. Use para criar a estrutura sdd/wip/, configurar metadados e preparar para desenvolvimento. Suporta --reopen para features arquivadas.
model: sonnet
argument-hint: "[descrição-da-feature] [--express|--from-backlog|--reopen|--rename]"
---

# Comando: /sdd.start

**Descrição**: Inicializa nova feature no SDD Kit

**Uso**:
- `/sdd.start "descrição-da-feature"` → Modo padrão
- `/sdd.start "descrição" --express` → Modo express
- `/sdd.start --from-backlog <ID>` → Criar de item do backlog
- `/sdd.start --rename [novo-nome]` → Renomear feature atual
- `/sdd.start --reopen [nome-feature]` → Reabrir feature concluída
- `/sdd.start --reopen [nome] --phase N` → Reabrir em fase específica

---

## Ajuda Rápida

> `/sdd.start help` → Mostra este resumo

**Exemplos**:
```
/sdd.start "filtro de busca nos membros"
/sdd.start "relatorio-financeiro" --express
/sdd.start --from-backlog TODO-001
/sdd.start --reopen ranking-reta-final
```

---

## Workflow (Etapas em Ordem)

### Etapa 1: Validar Input (BLOQUEANTE)

1. **Detectar tipo de input**:
   - Nome válido kebab-case (3-100 chars)? → Continuar
   - Descrição em linguagem natural (>3 palavras)? → Derivar nome automaticamente
     - Mostrar: `✓ Nome inferido: 'nome-kebab' (da sua descrição)`
     - Salvar descrição original no meta.md para contexto do /sdd.spec
     - NÃO pedir confirmação — continuar para Etapa 2
   - Formato inválido? → Rejeitar e pedir correção

2. **Verificar unicidade**: Feature não deve existir em `sdd/wip/`

### Etapa 2: Detectar Modo do Projeto

```
se sdd/specs/ ou sdd/features/ existe → project_mode = brownfield
senão → project_mode = greenfield
```

Se brownfield sem specs existentes:
- Mostrar aviso informativo (não bloqueante)
- Perguntar: quer executar `/sdd.reverse-eng` primeiro?
- Se continuar sem specs: adicionar aviso no meta.md

### Etapa 3: Criar Estrutura de Pastas

Gerar prefixo de data YYYYMMDD e criar:
```
sdd/wip/YYYYMMDD-feature-name/
  1-functional/
  2-technical/
  3-tasks/
  4-implementation/
    artifacts/
  meta.md
```

Se nome colidir com feature existente: derivar variante automática (ex: `auth-v2`) e informar usuário.

### Etapa 4: Criar meta.md

```markdown
# Meta — [feature-name]

## Identificação
- **Feature**: [feature-name]
- **Data de início**: [YYYYMMDD]
- **Pasta**: sdd/wip/[YYYYMMDD-feature-name]/
- **Modo do projeto**: greenfield | brownfield
- **Modo de execução**: standard | express

## Configuração
- **Linguagem dos specs**: pt
- **Cobertura alvo**: 60%

## Estado
- **Fase atual**: 1-functional
- **Spec funcional**: pendente
- **Spec técnico**: pendente
- **Tasks**: pendente
- **Implementação**: 0/0 completas

## Contexto Inicial
[descrição original do usuário, se fornecida]
```

### Etapa 5: Git Branch

Verificar branch atual. Se em `develop`, `main` ou `master`:
- Criar `feature/[feature-name]`

**Segurança**: Nunca trocar branch com mudanças não commitadas. Se houver mudanças pendentes, avisar e não trocar.

### Etapa 6: Mensagem de Sucesso

```
✅ Feature '[feature-name]' inicializada ([YYYYMMDD])
   📁 Local: sdd/wip/[YYYYMMDD-feature-name]/
   🌿 Branch: feature/[feature-name]

   Próximo: /sdd.spec
```

---

## Flag --from-backlog

`/sdd.start --from-backlog <ID>`:
1. Ler item de `sdd/backlog.md` pelo ID (ex: TODO-001, DEBT-003)
2. Sugerir nome da feature baseado no título do item
3. Pré-popular contexto no meta.md
4. Marcar item como `in-progress` no backlog
5. Adicionar `from_backlog: <ID>` no meta.md

---

## Flag --rename

`/sdd.start --rename [novo-nome]`:
1. Encontrar feature atual em `sdd/wip/`
2. Validar novo nome (kebab-case, único)
3. Bloquear se houver tasks com `status: in_progress`
4. Renomear pasta mantendo o prefixo de data
5. Atualizar meta.md e tasks.json

---

## Flag --reopen

`/sdd.start --reopen [nome] [--phase N]`:
1. Verificar se feature existe em `sdd/features/`
2. Checar dependências reversas (bloquear se outras features dependem desta)
3. Determinar fase alvo (perguntar ou usar `--phase N`)
4. Mover `sdd/features/[nome]` → `sdd/wip/[nome]`
5. Atualizar meta.md e criar branch `feature/nome-reopen`

**Fases**: 1=Funcional, 2=Técnico, 3=Tasks, 4=Implementação

---

## Regras do Agente IA

1. **Validar primeiro** — Nunca criar arquivos antes de validar o input
2. **Auto-inferir nome** — Se descrição longa, inferir nome kebab-case sem perguntar
3. **Não pular etapas** — Criar estrutura completa antes de avançar
4. **Branch segura** — Nunca trocar branch com mudanças não salvas
5. **Help flag** — `/sdd.start help` exibe apenas o resumo, não executa a lógica
