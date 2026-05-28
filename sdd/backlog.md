# Super Unidades — Backlog

Backlog centralizado do projeto. Gerenciado via `/sdd.backlog`.

---

## TODOs

| ID | Título | Prioridade | Feature |
|----|--------|------------|---------|
| TODO-001 | Modularizar firestoreDb.ts por domínio | High | - |
| TODO-002 | Corrigir currentQuarter fixo em PublicChamada | Medium | - |
| TODO-003 | Remover exposição de GEMINI_API_KEY no vite.config.ts | High | - |
| TODO-004 | Substituir múltiplos alert() por componente central de feedback | Medium | - |
| TODO-005 | Adicionar paginação para listas grandes (membros, presença, caixa) | Low | - |

---

## DEBTs

| ID | Título | Prioridade | Área |
|----|--------|------------|------|
| DEBT-001 | Ausência de suíte de testes automatizados | Critical | Todos |
| DEBT-002 | Módulos legados não roteados (Admin, Secretaria, Desbravadores, Progresso) | Medium | Navegação |
| DEBT-003 | Firestore Security Rules não versionadas no repositório | High | Segurança |
| DEBT-004 | Sem observabilidade além de console.error | Medium | Operações |
| DEBT-005 | Sem estratégia de retry/backoff para falhas Firebase | Low | Resiliência |

---

## IDEAs

| ID | Título | Valor | Complexidade |
|----|--------|-------|--------------|
| IDEA-001 | Dashboard com gráficos de evolução de ranking por trimestre | High | Medium |
| IDEA-002 | Exportação de relatórios em PDF/CSV | Medium | Medium |
| IDEA-003 | Notificações push para reuniões | Low | High |
| IDEA-004 | Modo offline com sincronização | Medium | High |
