# Spec Funcional — validacoes-clubao

## Problema
A diretoria e conselheiros precisam validar, trimestre a trimestre, se as unidades e membros cumprem os requisitos do Campori (Clubão). Hoje essas validações são lançadas manualmente no Clubão de forma genérica, sem fluxo estruturado por tipo. Adicionalmente, os dados de frequência calculados em Reuniões não alimentam automaticamente a pontuação do Clubão.

## Objetivo
Criar um painel de Validações dentro do módulo Clubão que:
1. Organiza os 6 requisitos de validação do Campori em categorias separadas por unidade/trimestre
2. Auto-calcula frequência de conselheiros e frequência às reuniões do clube a partir dos dados de Reuniões
3. Fornece formulários estruturados para as validações manuais (Cultos, PG, Devocional, Classes)
4. Persiste os resultados e reflete a pontuação no ranking do Clubão

## Usuários-Alvo
- **DIRETORIA**: acesso completo — visualiza e valida todas as unidades
- **CONSELHEIRO**: valida apenas a própria unidade
- **INSTRUTOR**: somente leitura

## Histórias de Usuário

### US-1: Painel de validações por unidade
**Como** diretor,  
**Quero** ver um painel com o status de todas as 6 validações por unidade no trimestre selecionado,  
**Para que** eu tenha visibilidade do cumprimento de cada requisito do Campori.

**Critérios de Aceitação**:
- AC-1: Nova aba "Validações" no módulo Clubão
- AC-2: Lista todas as unidades ativas com o status de cada validação (cumprida/pendente)
- AC-3: Exibe pontos obtidos vs pontos possíveis por unidade
- AC-4: Seletor de trimestre filtra os dados exibidos

### US-2: Frequência de conselheiros (auto)
**Como** diretor,  
**Quero** que a frequência dos conselheiros seja calculada automaticamente a partir dos dados de Reuniões,  
**Para que** não precise lançar manualmente esses dados no Clubão.

**Critérios de Aceitação**:
- AC-1: Sistema lê `reunioes_presencas` do trimestre ativo
- AC-2: Calcula % de presença de cada conselheiro da unidade
- AC-3: Aplica penalidade de -100 pts por conselheiro com ausência (< 100% de presença)
- AC-4: Exibe badge "Automático" indicando que foi calculado pelo sistema
- AC-5: Dados permanecem visíveis também no Resumo Trimestral de Reuniões

### US-3: Frequência às reuniões do clube (auto)
**Como** diretor,  
**Quero** que a frequência dos desbravadores às reuniões do clube seja calculada automaticamente,  
**Para que** o bônus de 50 pts com 85% de presença seja aplicado sem intervenção manual.

**Critérios de Aceitação**:
- AC-1: Sistema calcula % de presença média da unidade nas reuniões do clube no trimestre
- AC-2: 60 pts base são concedidos se há dados de presença registrados
- AC-3: Bônus +50 pts é aplicado automaticamente se ≥ 85% de presença
- AC-4: Exibe o % calculado junto com o status

### US-4: Validar frequência aos cultos (manual)
**Como** conselheiro,  
**Quero** registrar o % de presença da minha unidade nos cultos da igreja,  
**Para que** o sistema calcule os 60 pts base e o eventual bônus.

**Critérios de Aceitação**:
- AC-1: Campo numérico de % de presença (0–100)
- AC-2: 60 pts concedidos ao preencher (independente do %)
- AC-3: Bônus +50 pts aplicado automaticamente se ≥ 85%
- AC-4: Salva por unidade e trimestre

### US-5: Validar participação em PG (manual)
**Como** conselheiro,  
**Quero** registrar o % de participação da minha unidade em Pequenos Grupos,  
**Para que** o sistema calcule os 60 pts base e o eventual bônus.

**Critérios de Aceitação**:
- AC-1: Campo numérico de % de participação em PG (0–100)
- AC-2: 60 pts concedidos ao preencher
- AC-3: Bônus +50 pts se ≥ 85%
- AC-4: Exibe lista dos desbravadores da unidade com o campo de PG como referência

### US-6: Validar Devocional Pessoal (manual)
**Como** conselheiro,  
**Quero** confirmar se todos os desbravadores realizam o devocional e registrar os não batizados presentes na Escola Sabatina,  
**Para que** o sistema calcule os 200 pts base e os bônus.

**Critérios de Aceitação**:
- AC-1: Checkbox "Todos realizam devocional e lição da ES"
- AC-2: Campo numérico "Não batizados presentes na Escola Sabatina"
- AC-3: 200 pts ao confirmar o devocional
- AC-4: +50 pts por não batizado registrado
- AC-5: Lista de desbravadores com campo `batizado` visível como referência

### US-7: Validar Classes (manual)
**Como** conselheiro,  
**Quero** confirmar que cada desbravador está participando ativamente da sua classe,  
**Para que** o sistema valide o requisito de 200 pts.

**Critérios de Aceitação**:
- AC-1: Lista de desbravadores da unidade com a classe atual de cada um
- AC-2: Checkbox por desbravador confirmando participação ativa na classe
- AC-3: Para desbravadores > 16 anos: flag opcional "Participa do Clube de Líderes"
- AC-4: 200 pts quando 100% dos desbravadores confirmados; proporcional abaixo disso

### US-8: Campos de PG e batismo em Membros
**Como** diretor,  
**Quero** registrar se um desbravador é batizado e qual PG ele frequenta,  
**Para que** esses dados alimentem as validações do Clubão.

**Critérios de Aceitação**:
- AC-1: Campo `batizado` (sim/não) no formulário de cadastro/edição de desbravador
- AC-2: Campo `pgNome` (texto) no formulário de desbravador
- AC-3: Ambos os campos visíveis na tela de detalhes do membro

## Fluxo Principal
1. Usuário acessa Clubão → aba "Validações"
2. Seleciona trimestre
3. Sistema busca dados de frequência de Reuniões e auto-preenche as validações automáticas
4. Lista de unidades exibe status de cada validação com pontuação parcial
5. Usuário clica em uma unidade para abrir o painel de detalhe
6. Preenche validações manuais (Cultos, PG, Devocional, Classes)
7. Salva → pontuação refletida no ranking do Clubão

## Fluxos Alternativos
- **Sem reuniões no trimestre**: validações automáticas exibem "Sem dados de reuniões"
- **Conselheiro**: só enxerga e edita a própria unidade
- **Trimestre sem quarter ativo**: seletor mostra aviso

## Métricas de Sucesso
- As 6 validações são visíveis e funcionais para cada unidade
- Frequência de conselheiros e frequência às reuniões do clube são auto-calculadas
- Pontuação das validações refletida no ranking do Clubão sem lançamento duplicado

## Fora de Escopo
- CRUD de grupos de PG (apenas campo texto no desbravador)
- Verificação automática de classe por faixa etária (manual por enquanto)
- Escola Sabatina com controle de presença individualizado
- Notificações automáticas para conselheiros
- Validações de trimestres anteriores (somente leitura, sem edição retroativa)
