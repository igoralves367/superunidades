# Super Unidades — Agente Técnico SDD

Você é um agente técnico sênior trabalhando no projeto **Super Unidades**, um sistema web de gestão de clubes de Desbravadores.

## Stack do Projeto

- **Frontend**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS (CDN)
- **Banco de dados**: Firebase Firestore (NoSQL multi-tenant)
- **Autenticação**: Firebase Auth
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Build**: Vite (`npm run dev` / `npm run build`)

## Arquitetura Multi-Tenant

- Toda operação é isolada por `clubeId`
- Caminho base: `clubs/{clubeId}/subcoleção`
- Nunca acessar dados sem validar `clubeId`

## Arquivos Principais

| Arquivo | Papel |
|---------|-------|
| `App.tsx` | Roteador principal, módulo ativo |
| `types.ts` | Contratos de entidades |
| `constants.ts` | Labels, cores, mapeamentos |
| `firebase.ts` | Inicialização do SDK Firebase |
| `services/firestoreDb.ts` | Todas as operações Firestore |
| `services/ranking.ts` | Cálculo puro de pontuação |
| `store/AuthContext.tsx` | Sessão, login, bootstrap |

## SDD Kit — Spec-Driven Development

Este projeto usa o **SDD Kit** para desenvolvimento orientado a specs.

### Fluxo Obrigatório

```
/sdd.spec (O QUÊ) → /sdd.plan (TAREFAS) → /sdd.build (CÓDIGO) → /sdd.finish (CONCLUÍDO)
```

### Comandos Disponíveis

| Comando | Propósito |
|---------|-----------|
| `/sdd.go` | Modo Express — workflow completo automático |
| `/sdd.start` | Inicializar nova feature |
| `/sdd.spec` | Criar specs funcional e técnica |
| `/sdd.plan` | Gerar tarefas de implementação |
| `/sdd.build` | Implementar tarefas com quality gates |
| `/sdd.finish` | Validar e arquivar feature concluída |
| `/sdd.check` | Ver status da feature atual |
| `/sdd.fix` | Corrigir erros com consistência horizontal |
| `/sdd.list` | Listar todas as features |
| `/sdd.backlog` | Gerenciar backlog (TODO/DEBT/IDEA) |
| `/sdd.project` | Ver/editar PROJECT.md |
| `/sdd.cancel` | Cancelar feature atual |
| `/sdd.rollback` | Reverter para fase anterior |
| `/sdd.reverse-eng` | Documentar código existente |
| `/sdd.help` | Ajuda do framework |

### Estrutura de Diretórios SDD

```
sdd/
├── PROJECT.md          # Convenções do projeto
├── backlog.md          # Backlog centralizado
├── wip/                # Features em desenvolvimento
│   └── YYYYMMDD-nome/
│       ├── meta.md
│       ├── 1-functional/spec.md
│       ├── 2-technical/spec.md
│       ├── 3-tasks/tasks.json
│       └── 4-implementation/progress.md
└── features/           # Features concluídas/arquivadas
```

### Regras do Framework

- Nunca criar código sem spec funcional + técnica aprovada
- Specs em **Português do Brasil**
- Termos técnicos em inglês (Firebase, Firestore, React, TypeScript, etc.)
- Nunca pular fases do workflow
- Criar arquivos em `sdd/wip/` somente via `/sdd.start`
- Gatilho para geração de código: **"faça sua mágica"** ou **"faca sua magica"**

### Skills Disponíveis

- `react-typescript-expert` — padrões React 19 + TypeScript
- `firebase-expert` — Firestore, Auth, Security Rules
- `sdd-code-reviewer` — revisão de código e segurança
- `sdd-kit-expert` — conhecimento do framework SDD

### Agentes Disponíveis

- `sdd-implementer` — implementação de tarefas
- `sdd-system-designer` — design de arquitetura
- `sdd-explorer` — exploração de código existente
- `sdd-debugger` — diagnóstico e correção de bugs

## Referência Rápida do Projeto

### Coleções Firestore

**Top-level**: `users`, `clubs`

**Subcoleções por clube** (`clubs/{clubeId}/`):
- Estrutura: `classes`, `cargos`, `unidades`, `tipos_instrutor`, `requisitos`
- Membros: `desbravadores`, `secretaria`, `progresso`
- Ranking: `ranking_quarters`, `ranking_requirements`, `ranking_progress`, `clubao_unidades`
- Reuniões: `reunioes`, `reunioes_presencas`
- Financeiro: `caixa`, `doacoes`, `despesas`, `socios`, `campanhas_venda`, `venda_items`
- Eventos: `campori_eventos`, `campori_carnes`, `campori_parcelas`, `campori_receitas`, `campori_despesas`
- Fanfarra: `fanfarra_instrumentos`

### Rotas Públicas (hash-based)

- `#ranking/{clubId}` — ranking público
- `#chamada/{clubId}` — chamada pública
- `#agenda/{clubId}` — agenda pública
- `#fanfarra/{clubId}` — painel de fanfarra
- `#fanfacoes/{clubId}` — fações de fanfarra

### Perfis de Usuário

`DIRETORIA`, `CONSELHEIRO`, `INSTRUTOR`, `FINANCEIRO`

### Padrões Importantes

- **Soft delete**: `ativo: false` (preserva integridade referencial)
- **Batch operations**: `writeBatch` para consistência cruzada
- **Seed idempotente**: verificação por metadados antes de inserir dados base
- **Multi-tenant**: todo service valida `clubeId` obrigatoriamente

## Idioma

Toda comunicação, spec e documentação em **Português do Brasil**.
Código, variáveis, funções e comentários: **Inglês** (seguindo convenção do projeto).
