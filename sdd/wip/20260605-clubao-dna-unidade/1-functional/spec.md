# Spec Funcional — clubao-dna-unidade

## Problema

O Conselheiro acompanha sua unidade de forma fragmentada: a pontuação do Clubão está numa tela,
a frequência das reuniões em outra, e o progresso de classes em uma terceira. Não existe uma
visão consolidada e rápida da "saúde" da unidade que permita ao conselheiro entender, em segundos,
onde sua unidade está bem e onde precisa agir.

## Objetivo

Entregar um painel **DNA da Unidade** — um cartão de indicadores estratégicos derivados
exclusivamente de dados que já existem no sistema (ranking do Clubão, presenças em reuniões,
progresso de classes). O painel resume a situação da unidade em três indicadores-chave, sem
criar novas entidades, telas de cadastro ou fontes de dados.

## Usuários-Alvo

- **Conselheiro**: vê o DNA da sua própria unidade (a unidade vinculada ao seu usuário). É o
  usuário principal.
- **Diretoria**: pode visualizar o DNA de qualquer unidade ao inspecionar uma unidade específica
  (reuso do mesmo componente, contexto de leitura). Acesso de leitura, não é o foco desta etapa.

## Histórias de Usuário

### US-1: Visão consolidada da minha unidade
**Como** Conselheiro,
**Quero** ver um painel único com os principais indicadores da minha unidade,
**Para que** eu entenda rapidamente onde minha unidade está bem e onde precisa melhorar.

**Critérios de Aceitação**:
- AC-1: O painel exibe os 3 indicadores: % de requisitos Clubão cumpridos (trimestre ativo),
  frequência média dos membros e progresso de classes dos desbravadores.
- AC-2: Cada indicador mostra um valor percentual claro (0–100%) e um rótulo descritivo.
- AC-3: O painel usa a unidade vinculada ao conselheiro logado (`user.unidadeId`) sem exigir
  seleção manual.
- AC-4: Se o conselheiro não tiver unidade vinculada, o painel exibe um aviso amigável em vez
  de quebrar.

### US-2: Indicador de requisitos do Clubão
**Como** Conselheiro,
**Quero** ver o percentual de requisitos do Clubão já cumpridos no trimestre ativo,
**Para que** eu saiba quanto falta para a unidade atingir a pontuação máxima.

**Critérios de Aceitação**:
- AC-5: O percentual é calculado sobre o trimestre ativo do ranking (mesma seleção de quarter já
  usada no Portal/Clubão).
- AC-6: O cálculo reaproveita a lógica existente de pontuação por unidade (`services/ranking.ts`),
  sem recálculo paralelo.
- AC-7: Exibe também a classificação em estrelas (≥80% = 5★, ≥60% = 4★, abaixo = 3★), coerente
  com a regra do manual.

### US-3: Indicador de frequência média
**Como** Conselheiro,
**Quero** ver a frequência média dos desbravadores da minha unidade nas reuniões,
**Para que** eu identifique queda de engajamento.

**Critérios de Aceitação**:
- AC-8: A frequência é a média de presença dos membros da unidade no trimestre ativo, reaproveitando
  `services/frequencia.ts`.
- AC-9: Conselheiros são excluídos da média de membros (coerente com a regra existente).
- AC-10: Se não houver reuniões registradas no trimestre, o indicador mostra "Sem reuniões
  registradas" em vez de 0% enganoso.

### US-4: Indicador de progresso de classes
**Como** Conselheiro,
**Quero** ver o quanto os desbravadores da minha unidade avançaram nas suas classes,
**Para que** eu acompanhe o desenvolvimento individual agregado da unidade.

**Critérios de Aceitação**:
- AC-11: O indicador mostra o progresso médio de classe dos desbravadores ativos da unidade
  (média dos percentuais de requisitos cumpridos da classe atual de cada um).
- AC-12: Desbravadores sem classe atribuída são ignorados no cálculo (não contam como 0%).
- AC-13: Exibe também a contagem de desbravadores com classe 100% concluída ("X de Y concluíram
  a classe atual").

## Fluxo Principal

1. Conselheiro acessa o painel DNA (via aba/rota do Portal da Unidade ou tela equivalente).
2. O sistema identifica a unidade do conselheiro por `user.unidadeId`.
3. Carrega, em paralelo, os dados necessários do trimestre ativo: ranking (quarters, requirements,
   progress), reuniões + presenças, desbravadores + progresso de classes.
4. Calcula os 3 indicadores reaproveitando as funções puras existentes.
5. Renderiza o cartão DNA com os 3 indicadores, percentuais e estrelas.

## Fluxos Alternativos

- **Sem unidade vinculada**: exibe aviso "Nenhuma unidade vinculada ao seu usuário".
- **Sem trimestre ativo**: indicador de Clubão mostra "Nenhum trimestre ativo".
- **Sem reuniões no trimestre**: indicador de frequência mostra estado vazio explícito.
- **Sem desbravadores na unidade**: indicadores de frequência e classes mostram estado vazio.
- **Diretoria inspecionando**: mesmo componente recebe um `unidadeId` explícito (override), em
  modo leitura.

## Métricas de Sucesso

- Conselheiro consegue identificar os 3 indicadores da sua unidade em uma única tela, sem navegar.
- Zero novas coleções ou campos criados no Firestore (100% derivado de dados existentes).
- Os percentuais do DNA batem com os exibidos nas telas de origem (Clubão, Frequência, Classes)
  para a mesma unidade e trimestre.

## Fora de Escopo

- Não criar persistência de "DNA" (nenhum documento novo no Firestore).
- Não criar indicador financeiro (sócios/vendas) — explicitamente excluído pelo usuário.
- Não criar histórico/evolução temporal do DNA (snapshot do trimestre ativo apenas).
- Não criar exportação (PDF/Excel) nesta etapa.
- Não criar login, permissões ou portal de instrutor.
- Não armazenar fotos, anexos ou evidências.
- Não implementar a comparação entre unidades (visão Diretoria de todas) — apenas leitura
  pontual de uma unidade.

## Observações de Integração

- O Portal da Unidade (ETAPA 2) ainda **não está na branch `develop`**. Por decisão do usuário,
  o DNA é construído isolado sobre `develop`. O componente DNA deve ser **autônomo e portátil**
  (recebe `unidadeId` e renderiza), para ser plugado no Portal quando as branches forem
  reconciliadas, ou montado em uma aba própria no estado atual.
