---
name: sdd.spec
description: Criar e aprovar especificações funcionais e técnicas. Use para definir requisitos (funcional) ou arquitetura de implementação (técnico). Suporta --approve, --iterate e --summary.
model: opus
argument-hint: "[functional|technical] [--approve|--iterate|--summary]"
---

# Comando: /sdd.spec

**Descrição**: Criar e gerenciar especificações funcionais e técnicas

**Uso**:
- `/sdd.spec` → Auto-detecta fase, comportamento baseado no modo
- `/sdd.spec "descrição"` → Iniciar com contexto (alimenta a entrevista)
- `/sdd.spec functional` → Apenas spec funcional
- `/sdd.spec technical` → Apenas spec técnico
- `/sdd.spec functional --approve` → Aprovar spec funcional
- `/sdd.spec technical --approve` → Aprovar spec técnico
- `/sdd.spec --iterate "mudança"` → Refinar spec (mostra preview)
- `/sdd.spec --summary` → Resumo sem carregar spec completo

---

## Ajuda Rápida

> `/sdd.spec help` → Mostra este resumo

**Fluxo**: Spec Funcional (O QUÊ) → Spec Técnico (COMO) → Aprovação → `/sdd.plan`

---

## Delegação de Subagentes

| Tipo de Decisão | Subagente | Quando Usar |
|-----------------|-----------|-------------|
| Design de arquitetura | `sdd-system-designer` | Estrutura de componentes, estratégia de dados |
| Exploração de código | `sdd-explorer` | Padrões existentes, coleções Firestore |
| Revisão de código | `sdd-code-reviewer` | Verificação de segurança e qualidade |

---

## Pré-Requisitos (BLOQUEANTE)

| Verificação | Em caso de falha |
|-------------|------------------|
| Feature inicializada (`sdd/wip/` existe) | Executar `/sdd.start` |
| meta.md presente | Executar `/sdd.start` |

---

## Workflow (Etapas em Ordem)

### Etapa 1: Detectar Fase Atual

Ler `meta.md` da feature atual para determinar o que já foi feito:
- Spec funcional pendente → iniciar spec funcional
- Spec funcional aprovado, técnico pendente → iniciar spec técnico
- Ambos aprovados → informar que specs estão prontos, sugerir `/sdd.plan`

### Etapa 2: Spec Funcional (O QUÊ Construir)

**Objetivo**: Documentar o problema, objetivos e critérios de sucesso em linguagem de negócio.

**Entrevista** (perguntas-chave para o usuário):

1. **Problema/Contexto**: Qual problema esta feature resolve? Quem é afetado?
2. **Usuários**: Quem usará esta feature? (Diretor, Conselheiro, Instrutor, Responsável Financeiro)
3. **Funcionalidade principal**: O que exatamente o usuário poderá fazer?
4. **Critérios de sucesso**: Como saberemos que funcionou? Quais são os casos de uso principais?
5. **Restrições**: Há limitações conhecidas? Integrações necessárias?

**Estrutura do spec funcional** (`1-functional/spec.md`):

```markdown
# Spec Funcional — [feature-name]

## Problema
[Descrição clara do problema que esta feature resolve]

## Objetivo
[O que esta feature entrega ao usuário]

## Usuários-Alvo
- [Perfil 1]: [como usa a feature]
- [Perfil 2]: [como usa a feature]

## Histórias de Usuário

### US-1: [Título]
**Como** [tipo de usuário],
**Quero** [ação/funcionalidade],
**Para que** [benefício/valor].

**Critérios de Aceitação**:
- AC-1: [critério mensurável]
- AC-2: [critério mensurável]

## Fluxo Principal
[Descrição passo a passo do caminho feliz]

## Fluxos Alternativos
[Casos de borda, erros, permissões]

## Métricas de Sucesso
- [Métrica mensurável 1]
- [Métrica mensurável 2]

## Fora de Escopo
- [O que explicitamente NÃO será feito]
```

**Ao completar**: Perguntar ao usuário se o spec funcional está pronto para aprovação.
- Se sim: marcar `spec_funcional: aprovado` no meta.md e avançar para spec técnico
- Se não: iterar com o usuário

### Etapa 3: Spec Técnico (COMO Construir)

**Objetivo**: Documentar arquitetura, decisões técnicas e contratos de dados.

**Entrevista** (perguntas-chave para o usuário):

1. **Componentes React**: Novos componentes ou modificação de existentes?
2. **Coleções Firestore**: Quais coleções serão lidas/escritas? Novos campos?
3. **Permissões por perfil**: Quais perfis (Diretor, Conselheiro, etc.) têm acesso e com quais permissões?
4. **Estado e hooks**: Lógica de estado complexa? Hooks customizados necessários?
5. **Integrações**: Alguma dependência especial (Recharts, exportação, etc.)?

**Exploração de código obrigatória** (usando `sdd-explorer`):
- Identificar componentes existentes relacionados
- Verificar padrões de consulta Firestore no `firestoreDb.ts`
- Verificar como permissões por perfil são tratadas atualmente

**Estrutura do spec técnico** (`2-technical/spec.md`):

```markdown
# Spec Técnico — [feature-name]

## Visão Geral da Arquitetura
[Diagrama ou descrição de como as partes se conectam]

## Camadas Afetadas

### Layer 1 — Componentes e UI
- **Componentes novos**: [lista]
- **Componentes modificados**: [lista]
- **Tipos TypeScript**: [novos tipos/interfaces]
- **Hooks**: [hooks necessários]

### Layer 2 — Firebase
- **Coleções Firestore**:
  - `clubs/{clubeId}/[subcoleção]`: [operações: read/write/query]
- **Estrutura de dados**:
  ```typescript
  interface NovaTipo {
    campo: tipo;
  }
  ```
- **Operações Firestore**:
  - [query principal]
  - [operações de escrita]
  - writeBatch: [sim/não, motivo]

### Layer 3 — Qualidade
- **Cobertura de testes**: 60% mínimo
- **Segurança**: [verificações de clubeId, soft delete]

## Decisões Técnicas

### DD-1: [Título da Decisão]
**Problema**: [o que precisava ser decidido]
**Decisão**: [o que foi escolhido]
**Alternativas rejeitadas**: [e por quê]
**Motivo**: [justificativa]

## Estrutura de Arquivos
```
src/
  components/[Feature]/
    [ComponentePrincipal].tsx
    [ComponenteAuxiliar].tsx
  services/
    [domainService].ts  (se novo serviço necessário)
  types/
    [feature].ts
```

## Rotas/Navegação
[Novas rotas ou modificações em rotas existentes]

## Contratos de Interface
[Props de componentes principais, assinaturas de funções de serviço]

## Estratégia de Testes
- [O que testar unitariamente]
- [Casos de borda a cobrir]
```

**Ao completar**: Perguntar ao usuário se o spec técnico está pronto para aprovação.
- Se sim: marcar `spec_tecnico: aprovado` no meta.md e sugerir `/sdd.plan`
- Se não: iterar com o usuário

---

## Comportamento por Modo

| Modo | Perguntas | Aprovação | Avançar |
|------|-----------|-----------|---------|
| **Express** | Consolidadas (3-5) | Auto após respostas | Automático |
| **Standard** | Entrevista completa | Solicitar explicitamente | Após aprovação |

---

## Padrões Obrigatórios nos Specs

### Multi-Tenant
Toda leitura/escrita Firestore DEVE incluir validação de `clubeId`:
- ✅ `clubs/{clubeId}/membros`
- ❌ `membros` (sem isolamento)

### Soft Delete
Para recursos que podem ser desativados:
- Campo `ativo: boolean` — nunca deletar registros com dados vinculados
- Filtrar por `ativo == true` nas queries padrão

### Firestore Patterns
- `writeBatch` para operações compostas (múltiplas escritas atomicamente)
- `deepCleanUndefined()` antes de salvar no Firestore
- Queries com `where('clubeId', '==', clubeId)` em toda coleção raiz

---

## Validações do Spec

**Spec funcional válido quando**:
- [ ] Pelo menos 1 história de usuário com critérios de aceitação
- [ ] Fora de escopo definido
- [ ] Métricas de sucesso presentes

**Spec técnico válido quando**:
- [ ] Coleções Firestore identificadas
- [ ] Tipos TypeScript definidos
- [ ] Permissões por perfil documentadas
- [ ] Estrutura de arquivos mapeada
- [ ] Decisões técnicas registradas com DD-N

---

## Regras do Agente IA

1. **Specs em português** — Todo conteúdo dos specs em pt-BR; código e tipos em inglês
2. **Explorar antes de projetar** — Verificar código existente antes de propor arquitetura
3. **Padrões do projeto** — Seguir convenções de `sdd/PROJECT.md` e `CLAUDE.md`
4. **Não inventar serviços** — Só referenciar coleções Firestore que existem ou propor com justificativa
5. **Multi-tenant obrigatório** — Toda query deve filtrar por `clubeId`
6. **Aprovação explícita** — Nunca avançar sem aprovação do usuário (exceto modo express)
