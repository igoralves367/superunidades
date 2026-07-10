# Spec Funcional — requisitos-clubao-q2-q3

## Problema
Os requisitos do 2º Trimestre (Junho/Julho/Agosto) e 3º Trimestre (Setembro/Outubro/Novembro) do Clubão de Unidades não estão seeded no sistema. Atualmente, o `rankingSeed.ts` possui apenas requisitos placeholder genéricos para Q2 e Q3 (req_acao_missionaria, req_reuniao_fora, req_culto_presenca, req_avaliacao_manual), incompatíveis com o manual oficial do Clubão. Isso impede a diretoria de registrar e pontuar corretamente as unidades nos trimestres 2 e 3.

## Objetivo
Substituir os seeds placeholder de Q2 e Q3 pelos requisitos reais do manual oficial, seguindo o mesmo padrão estrutural dos 19 requisitos de Q1 já implementados.

## Usuários-Alvo
- **DIRETORIA**: registra e valida pontuação das unidades em Q2 e Q3
- **CONSELHEIRO**: acompanha a pontuação da própria unidade
- **INSTRUTOR**: somente leitura

## Requisitos do 2º Trimestre

### Evangelismo
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Classe Bíblica | 300 | BOOLEAN — todos não batizados frequentando |
| Capelania | 200 | BOOLEAN_WITH_BONUS (+50 mais criativa) |
| Ano Bíblico | 400 | BOOLEAN_WITH_BONUS (+20 por capelania vencedora) |

### Vida Espiritual e Igreja
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Impacto Esperança | 100 | BOOLEAN_WITH_BONUS (+50 com 100% presente) |
| Dons e Talentos | 100 | BOOLEAN_WITH_PENALTY (-100 se não cumprir) |
| Quebrando o Silêncio | 100 | BOOLEAN_WITH_BONUS (+50 com 100% presente) |
| Unidade/Igreja | 100 | BOOLEAN — realizar 01 ES e 01 JA |
| Jejum | 100 | BOOLEAN — 50% mínimo da unidade |
| Desafio da Memória | 100 | BOOLEAN — um desbravador recita desafio mensal |

### Família
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Pais Presentes | 100 | BOOLEAN |
| Reuniões de Pais | 100 | BOOLEAN — 80% de presença nas reuniões |

### Desenvolvimento do Desbravador
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Nós e Amarras | 10/reunião | RECURRING |

### Sócio Desbravador
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Sócio Desbravador | 400 | QUANTITY_WITH_PENALTY — 100/sócio, max 4, penalidade -100/desistente ou -400 se zero |

### Finanças
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Vendas na Unidade | 200 | BOOLEAN_WITH_PENALTY (-200 se não cumprir) |

**Total Q2: 14 requisitos**

## Requisitos do 3º Trimestre

### Impacto Social
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Dia de Fazer o Bem | 100 | BOOLEAN |
| Clube no Lar | 100 | BOOLEAN |
| Cesta Básica | 100 | BOOLEAN |
| Semana do Lenço | 200 | BOOLEAN |

### Engajamento e Sustentação
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Sócio Desbravador (trimestre) | 100 | QUANTITY — meta 2 sócios no trimestre, penalidade -50 |

### Estrutura e Identidade
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Barraca | 800 | BOOLEAN |
| Bandeirim | 150 | BOOLEAN |
| Mastro | 150 | BOOLEAN_WITH_BONUS (mais criativo, bônus a definir pela diretoria) |
| Uniforme de Atividades | 100 | BOOLEAN_WITH_PENALTY (-100/desbravador sem camisa) |
| Uniforme Oficial | 300 | BOOLEAN_WITH_PENALTY (-300/desbravador sem uniforme) |
| Camisa da MIBES | 100 | BOOLEAN_WITH_PENALTY (-50/desbravador sem) |
| Portal do Clube | 150 | BOOLEAN |

### Consagração Espiritual
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Batismo | 800 | BOOLEAN — alcançar 01 batismo no ano |

### Desenvolvimento do Desbravador
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Nós e Amarras | 10/reunião | RECURRING |

### Sócio Desbravador (anual)
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Sócio Desbravador | 400 | QUANTITY_WITH_PENALTY — 100/sócio, max 4, -100/desistente ou -400 se zero |

### Concursos
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Oratória | 350 | MANUAL_SCORE |
| Música | 350 | MANUAL_SCORE |
| Poesia | 250 | MANUAL_SCORE |
| Desafio Nós e Amarras | 300 | MANUAL_SCORE — menor tempo |

### Concurso de Ordem Unida
| Requisito | Pontos | Tipo |
|-----------|--------|------|
| Ordem Unida | 115 | MANUAL_SCORE — avaliação por critérios, máx 115 pts |

**Total Q3: 20 requisitos**

## Histórias de Usuário

### US-1: Seed de Q2 e Q3 carregado
**Como** diretoria,  
**Quero** que ao fazer o seed do clube os requisitos de Q2 e Q3 sejam criados corretamente,  
**Para que** possa registrar a pontuação real das unidades nesses trimestres.

**Critérios de Aceitação**:
- AC-1: `rankingSeed.ts` exporta `rankingRequirementsQuarter2Seed` com 14 itens
- AC-2: `rankingSeed.ts` exporta `rankingRequirementsQuarter3Seed` com 20 itens
- AC-3: Todos os seeds de Q2/Q3 placeholder antigos são removidos
- AC-4: `DEFAULT_RANKING_REQUIREMENT_SEEDS` inclui Q1 + Q2 + Q3 reais

### US-2: Visualização no Clubão
**Como** diretoria,  
**Quero** ver os requisitos reais de Q2 e Q3 ao selecionar esses trimestres no Clubão,  
**Para que** possa validar e pontuar cada unidade conforme o manual.

**Critérios de Aceitação**:
- AC-1: Ao selecionar Q2, o painel exibe os 14 requisitos do 2º trimestre
- AC-2: Ao selecionar Q3, o painel exibe os 20 requisitos do 3º trimestre
- AC-3: Pontos, bônus e penalidades são exibidos corretamente

## Fora de Escopo
- UI nova para Q2/Q3 (usa o painel de validações já existente)
- Cálculo automático de frequência para Q2/Q3 (mesma lógica do Q1 já funciona com IDs dinâmicos)
- Gestão de concursos (oratória, música, poesia) — apenas registro de pontuação manual
