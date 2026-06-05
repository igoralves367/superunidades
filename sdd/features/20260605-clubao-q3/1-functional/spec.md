# Spec Funcional — Clubão Q3

## Identificação
- **Feature**: clubao-q3
- **Versão**: 1.0
- **Status**: pendente de aprovação

---

## Objetivo

Implementar os 20 requisitos oficiais do 3º Trimestre (Setembro • Outubro • Novembro) do Clubão de Unidades no sistema Super Unidades. Este trimestre completa o Clubão (ETAPA 0 do Roadmap 2026).

---

## Contexto

Q1 (19 req) e Q2 (14 req) já implementados. Q3 é o último trimestre. Seed version atual: 3. Q3 bumpa para versão 4. Não há seeds de placeholder para Q3 — os documentos genéricos que existiam (req_culto_presenca, req_avaliacao_manual) já foram removidos no Q2.

---

## Requisitos do 3º Trimestre

### Categoria: Impacto Social

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 1 | Dia de Fazer o Bem | 100 | Boolean | — | — |
| 2 | Clube no Lar | 100 | Boolean | — | — |
| 3 | Cesta Básica | 100 | Boolean | — | — |
| 4 | Semana do Lenço | 200 | Boolean | — | — |

**Descrições:**
- **Dia de Fazer o Bem**: Realizar ações sociais como limpeza, doações ou ajuda comunitária.
- **Clube no Lar**: Realizar pelo menos uma vez na semana um culto na casa de um desbravador com meditação, louvor e oração.
- **Cesta Básica**: Arrecadar 01 cesta básica completa.
- **Semana do Lenço**: Uso do lenço durante toda a semana por todos da unidade.

---

### Categoria: Engajamento e Sustentação

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 5 | Sócio Desbravador (Trimestral) | 100 | Boolean | — | -50 (se não conseguir) |

**Descrições:**
- **Sócio Desbravador (Trimestral)**: Meta de 02 sócios no trimestre. Penalidade de 50 pontos caso não consiga.

---

### Categoria: Estrutura e Identidade

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 6 | Barraca | 800 | Boolean | — | — |
| 7 | Bandeirim | 150 | Boolean | — | — |
| 8 | Mastro | 150 | Boolean | pontuação extra (mastro mais criativo) | — |
| 9 | Uniforme de Atividades | 100 | Boolean | — | -100/desbravador sem camisa |
| 10 | Uniforme Oficial | 300 | Boolean | — | -300/desbravador sem uniforme |
| 11 | Camisa da MIBES | 100 | Boolean | — | -50/desbravador sem |
| 12 | Portal do Clube | 150 | Boolean | — | — |

**Descrições:**
- **Barraca**: 01 barraca para 07 pessoas como patrimônio da unidade.
- **Bandeirim**: Bordado com o nome da unidade.
- **Mastro**: Apresentar mastro organizado. Bônus extra para o mastro mais criativo (valor definido pela diretoria).
- **Uniforme de Atividades**: Todos devem possuir camisa do clube.
- **Uniforme Oficial**: 100% da unidade com uniforme completo.
- **Camisa da MIBES**: Todos devem possuir camisa da MIBES.
- **Portal do Clube**: Apresentar proposta de portal.

---

### Categoria: Consagração Espiritual

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 13 | Batismo | 800 | Boolean | — | — |

**Descrições:**
- **Batismo**: Alcançar 01 batismo no ano.

---

### Categoria: Desenvolvimento do Desbravador

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 14 | Nós e Amarras | 10/reunião | Recorrente | — | — |

**Descrições:**
- **Nós e Amarras**: A cada reunião em que se pedir os nós, a unidade receberá 10 pontos se alcançar sucesso. Sem teto de pontuação.

---

### Categoria: Finanças (Sócio Desbravador Anual)

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 15 | Sócio Desbravador (Anual) | 100/sócio (máx 400) | Quantidade | — | -100/desistente ou -400 se nenhum |

**Descrições:**
- **Sócio Desbravador (Anual)**: Meta de 04 sócios por unidade assíduos durante o ano. 100 pontos por cada sócio conquistado. O sócio pode ser pais/responsáveis, membros da igreja ou amigos externos.

---

### Categoria: Concursos

| # | Nome | Pontos | Regra | Bônus | Penalidade |
|---|------|--------|-------|-------|------------|
| 16 | Oratória | até 350 | Nota manual | — | — |
| 17 | Música | até 350 | Nota manual | — | — |
| 18 | Poesia | até 250 | Nota manual | — | — |
| 19 | Desafio Nós e Amarras | até 300 | Nota manual | — | — |
| 20 | Ordem Unida | até 115 | Nota manual | — | — |

**Descrições:**
- **Oratória**: Avaliados coerência com o tema, fundamentação bíblica e desenvolvimento da oratória.
- **Música**: Tema "Sempre Desbravador". Letra e música devem ser originais e criadas pela unidade.
- **Poesia**: Tema "Sempre Desbravador". Duração até 03 minutos. Avaliação: conteúdo, criatividade e apresentação.
- **Desafio Nós e Amarras**: A unidade que realizar no menor tempo todos os nós da classe de amigo.
- **Ordem Unida**: Avalia disciplina, organização, postura e domínio dos comandos. Mínimo 80% da unidade. 5 a 7 minutos. Máximo 115 pontos (100 base + 10 extras + 5 de brado). Penalidade de -1 ponto a cada 10 segundos acima do tempo.

---

## Comportamento Esperado

### Para clubes novos
O seed correto do Q3 é inserido automaticamente ao criar o clube (via `ensureDefaultRanking`).

### Para clubes existentes
A migração ocorre na próxima vez que o clube acessa o Clubão — o sistema detecta `RANKING_SEED_VERSION = 4` e executa o re-seed, inserindo os 20 requisitos do Q3 sem afetar Q1 ou Q2.

### UI
Nenhuma alteração de interface é necessária. A tela de Clubão já suporta todos os `ruleType` utilizados.

---

## Critérios de Aceitação

- [ ] Os 20 requisitos do Q3 aparecem na tela de Clubão quando o 3º Trimestre está selecionado
- [ ] Pontuação base máxima do Q3 é de 3.900 pontos (sem bônus, sem concursos)
- [ ] Concursos com nota manual aceitam valores entre 0 e o máximo definido
- [ ] Penalidades PER_UNIT (uniforme, camisa) funcionam corretamente
- [ ] Clubes existentes recebem os requisitos automaticamente na próxima visita
- [ ] Q1 e Q2 não são afetados pela migração
