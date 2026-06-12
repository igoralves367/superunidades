# Spec Funcional — ranking-publico-engajamento (v2)

> **Redesign completo** — substituí spec original. Nova visão aprovada pelo usuário em 2026-06-08.

## Problema

O ranking público atual expõe pontuações e posições das unidades, revelando quem está na frente antes do trimestre terminar. O usuário quer:
1. Ocultar placar geral — mostrar apenas as 3 unidades mais engajadas, sem revelar quem lidera
2. Transformar o link individual em um painel completo do conselheiro (requisitos + membros)

## Objetivo

**Parte A — Ranking público:** Substituir a lista de pontuação por um painel de engajamento que exibe apenas as 3 unidades mais engajadas em **ordem alfabética**, sem pontuação visível.

**Parte B — Painel individual do conselheiro (`?u=UNITCODE`):** Transformar a visão read-only em um painel interativo onde o conselheiro pode marcar requisitos do trimestre atual e gerenciar seus membros.

---

## Parte A — Ranking Público (tela principal)

### US-1: Visualizar as 3 unidades mais engajadas
**Como** membro, responsável ou público externo,
**Quero** ver quais 3 unidades estão mais engajadas,
**Para que** haja motivação sem revelar posições.

**Critérios de Aceitação**:
- AC-1: A tela principal (`#ranking/{clubSlug}`) exibe exatamente as 3 unidades com maior índice de engajamento.
- AC-2: As 3 unidades aparecem em **ordem alfabética** — não por ranking/posição.
- AC-3: Nenhuma pontuação, número de posição ou percentual é exibido.
- AC-4: O restante das unidades NÃO aparece na tela principal.
- AC-5: Cada card exibe: nome da unidade, foto/avatar, e o selo "Em chamas 🔥".
- AC-6: Se menos de 3 unidades tiverem engajamento > 0, exibe apenas as que têm (sem forçar 3).

### US-2: Links individuais acessíveis
**Como** conselheiro,
**Quero** ver o link da minha unidade na seção "Links Individuais",
**Para que** eu possa acessar meu painel direto.

**Critérios de Aceitação**:
- AC-7: A seção "Links Individuais" continua existindo com o nome e código de cada unidade.
- AC-8: Clicar em LINK ou usar `?u=UNITCODE` na URL abre o painel individual.

---

## Parte B — Painel Individual do Conselheiro (`?u=UNITCODE`)

### US-3: Resumo de trimestres anteriores (leitura)
**Como** conselheiro,
**Quero** ver o resumo dos trimestres já encerrados,
**Para que** eu acompanhe o histórico da minha unidade.

**Critérios de Aceitação**:
- AC-9: Trimestres com `status === 'CLOSED'` aparecem em abas ou seção separada.
- AC-10: Para cada trimestre fechado: total de pontos, requisitos cumpridos vs total, breakdown por categoria.
- AC-11: Requisitos são exibidos como read-only (checkbox visual, sem interação).

### US-4: Marcar requisitos do trimestre atual
**Como** conselheiro,
**Quero** marcar quais requisitos minha unidade cumpriu no trimestre em andamento,
**Para que** a diretoria veja minha autodeclaração sem eu precisar de login.

**Critérios de Aceitação**:
- AC-12: Trimestre com `status === 'ACTIVE'` exibe requisitos como checkboxes interativos.
- AC-13: O conselheiro pode marcar/desmarcar requisitos booleanos livremente.
- AC-14: Ao marcar, um botão "Salvar" ou auto-save persiste no Firestore.
- AC-15: A pontuação calculada é mostrada ao conselheiro (para fins de transparência), mas não aparece na tela pública principal.
- AC-16: Requisitos do tipo numérico (`QUANTITY`, `RECURRING`) permitem entrada de quantidade.

### US-5: Visualizar membros da unidade
**Como** conselheiro,
**Quero** ver os desbravadores da minha unidade em uma aba separada,
**Para que** eu tenha visão geral da equipe.

**Critérios de Aceitação**:
- AC-17: Aba "Membros" lista todos os desbravadores ativos da unidade.
- AC-18: Cada membro exibe: nome, função, classe, status PG.
- AC-19: O conselheiro pode editar: nome, função (cargo), classe e se completou PG (sim/não).
- AC-20: Frequência nas reuniões do clube é exibida (total de reuniões vs presenças confirmadas) — somente leitura.

---

## Fora de Escopo

- Sem login obrigatório — acesso via código de unidade.
- Sem aprovação de diretoria nesta tela (aprovação continua no `Clubao.tsx` interno).
- Sem cadastro de novos membros nesta página.
- Sem edição de requisitos customizados.
- Sem histórico de quem marcou o quê (auditoria fica para versão futura).
