# Spec Funcional — Clubão Q2

## Identificação
- **Feature**: clubao-q2
- **Versão**: 1.0
- **Status**: pendente de aprovação

---

## Objetivo

Implementar os 14 requisitos oficiais do 2º Trimestre (Junho • Julho • Agosto) do Clubão de Unidades no sistema Super Unidades, substituindo os 4 seeds genéricos de placeholder atualmente cadastrados para Q2/Q3.

---

## Contexto

O Q1 já está implementado com 19 requisitos reais. Os seeds de Q2 e Q3 presentes no sistema são apenas exemplos genéricos (ações missionárias, reuniões externas, presença nos cultos, avaliação manual) e não correspondem ao Manual do Clubão. Este spec cobre exclusivamente o Q2.

---

## Requisitos do 2º Trimestre

### Categoria: Evangelismo

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 1 | Classe Bíblica | 300 | Boolean | — | — |
| 2 | Capelania | 200 | Boolean | +50 (capelania mais criativa) | — |
| 3 | Ano Bíblico | 400 | Boolean | +20 (unidade vencedora do concurso bíblico por capelania) | — |

**Descrições:**
- **Classe Bíblica**: Todos os desbravadores não batizados devem estar frequentando a Classe Bíblica.
- **Capelania**: Realizar capelania no clube com organização e participação. Bônus para a capelania mais criativa.
- **Ano Bíblico**: Todo desbravador receberá Bíblia personalizada com calendário do Ano Bíblico. Avaliação por participação nas atividades bíblicas e Kahoot nas capelanias.

---

### Categoria: Vida Espiritual e Igreja

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 4 | Impacto Esperança | 100 | Boolean | +50 (100% da unidade presente) | — |
| 5 | Dons e Talentos | 100 | Boolean | — | -100 (se não cumprir) |
| 6 | Quebrando o Silêncio | 100 | Boolean | +50 (100% da unidade presente) | — |
| 7 | Unidade/Igreja | 100 | Boolean | — | — |
| 8 | Jejum | 100 | Boolean | — | — |
| 9 | Desafio da Memória | 100 | Boolean | — | — |

**Descrições:**
- **Impacto Esperança**: Participação nas ações do Impacto Esperança.
- **Dons e Talentos**: Todos os conselheiros deverão estar ajudando em outros departamentos da igreja, além do Clube de Desbravadores.
- **Quebrando o Silêncio**: Participação na campanha Quebrando o Silêncio.
- **Unidade/Igreja**: Realizar 01 Escola Sabatina e 01 Culto JA conduzidos pela unidade.
- **Jejum**: Participação mínima de 50% da unidade no jejum.
- **Desafio da Memória**: Um desbravador por unidade recita o desafio mensal.

---

### Categoria: Família

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 10 | Pais Presentes | 100 | Boolean | — | — |
| 11 | Reuniões de Pais | 100 | Boolean | — | — |

**Descrições:**
- **Pais Presentes**: Levar pais para eventos do clube ou da unidade.
- **Reuniões de Pais**: 80% de presença dos pais nas reuniões convocadas.

---

### Categoria: Desenvolvimento do Desbravador

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 12 | Nós e Amarras | 10/reunião | Recorrente | — | — |

**Descrições:**
- **Nós e Amarras**: A cada reunião em que se pedir os nós, a unidade receberá 10 pontos se alcançar sucesso na execução. Sem teto de pontuação.

---

### Categoria: Finanças

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 13 | Sócio Desbravador | 100/sócio (máx 400) | Quantidade | — | -100/desistente ou -400 se nenhum |
| 14 | Vendas na Unidade | 200 | Boolean | — | -200 (se não cumprir) |

**Descrições:**
- **Sócio Desbravador**: Meta de 04 sócios por unidade assíduos durante o ano. O sócio pode ser pais/responsáveis, membros da igreja ou amigos externos. Penalidade por desistência ou por não conseguir nenhum sócio.
- **Vendas na Unidade**: Cada unidade deverá ter pelo menos uma venda durante o ano para comprar itens da unidade.

---

## Comportamento Esperado

### Para clubes novos
O seed correto do Q2 é inserido automaticamente ao criar o clube (via `ensureDefaultRanking`).

### Para clubes existentes
A migração ocorre na próxima vez que o clube acessa o Clubão — o sistema detecta que `RANKING_SEED_VERSION` foi incrementado e executa o re-seed, que:
1. Insere os 14 requisitos reais do Q2 (merge por ID)
2. Remove os 4 requisitos genéricos de placeholder (`req_acao_missionaria`, `req_reuniao_fora`, `req_culto_presenca`, `req_avaliacao_manual`)
3. Mantém todos os `ranking_progress` existentes intactos (dados de pontuação das unidades não são apagados)

### UI
Nenhuma alteração de interface é necessária. A tela de Clubão já suporta todos os `ruleType` utilizados nos 14 requisitos.

---

## Critérios de Aceitação

- [ ] Os 14 requisitos do Q2 aparecem na tela de Clubão quando o 2º Trimestre está selecionado
- [ ] Os 4 requisitos genéricos de placeholder não aparecem mais
- [ ] Pontuação máxima base do Q2 é de 2.100 pontos (sem bônus)
- [ ] Bônus e penalidades funcionam conforme descrito no manual
- [ ] Clubes existentes recebem os requisitos corretos automaticamente na próxima visita
- [ ] Dados de progresso existentes não são perdidos
