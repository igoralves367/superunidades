# Spec Funcional — resumo-frequencia-reunioes

## Problema
O sistema já registra presença e falta dos membros nas reuniões por unidade
(módulo Reuniões, coleções `reunioes` e `reunioes_presencas`). Hoje só é possível
ver o relatório de **uma reunião isolada**. Não existe uma visão consolidada que
responda perguntas como:

- "Qual a frequência média da Unidade Leões neste trimestre?"
- "O conselheiro da Unidade Águias compareceu a quantas reuniões?"

A diretoria precisa desse resumo para acompanhar o engajamento das unidades e
cobrar a presença dos conselheiros ao longo do trimestre.

## Objetivo
Entregar um **resumo de frequência por trimestre** dentro do módulo Reuniões,
mostrando, para cada unidade ativa:
- A frequência da unidade (média de presença dos membros), com porcentagem.
- A frequência do conselheiro da unidade, com quantidade e porcentagem.
- A base do cálculo (quantas reuniões existiram no trimestre).

## Usuários-Alvo
- **Diretoria**: acompanha o engajamento geral, identifica unidades com baixa
  frequência e conselheiros ausentes.
- **Conselheiro**: visualiza a própria frequência e a da sua unidade.

## Histórias de Usuário

### US-1: Ver frequência das unidades no trimestre
**Como** membro da diretoria,
**Quero** ver a frequência média de cada unidade num trimestre selecionado,
**Para que** eu saiba quais unidades têm boa presença e quais precisam de atenção.

**Critérios de Aceitação**:
- AC-1: Posso selecionar o trimestre (1 a 4) e a tela mostra o resumo daquele trimestre.
- AC-2: Para cada unidade ativa, vejo a porcentagem de frequência da unidade
  (ex: "80%") acompanhada do número de membros considerados (ex: "80% (5 membros)").
- AC-3: O número total de reuniões do trimestre é exibido como base do cálculo.
- AC-4: Unidades sem nenhuma reunião registrada no trimestre são exibidas com
  frequência "—" (sem dados), não 0%.

### US-2: Ver frequência do conselheiro no trimestre
**Como** membro da diretoria,
**Quero** ver quantas reuniões o conselheiro de cada unidade compareceu e a porcentagem,
**Para que** eu possa cobrar presença dos conselheiros.

**Critérios de Aceitação**:
- AC-5: Para cada unidade, vejo o nome do conselheiro, a fração de presença
  (ex: "9/10") e a porcentagem (ex: "90%").
- AC-6: Se a unidade não tem conselheiro com cargo CONSELHEIRO vinculado,
  é exibido "Sem conselheiro" em vez de um cálculo.
- AC-7: O conselheiro é identificado como o membro (desbravador ativo) que possui
  o cargo CONSELHEIRO vinculado àquela unidade.

### US-3: Distinguir frequência da unidade x do conselheiro
**Como** membro da diretoria,
**Quero** que a frequência da unidade considere apenas os membros (não o conselheiro),
**Para que** os dois indicadores não se misturem e fiquem comparáveis.

**Critérios de Aceitação**:
- AC-8: O conselheiro é excluído do cálculo da média da unidade.
- AC-9: A frequência do conselheiro é calculada e exibida separadamente.

## Fluxo Principal
1. O usuário abre o módulo Reuniões.
2. Acessa a aba/seção "Resumo Trimestral".
3. Seleciona o trimestre desejado (padrão: trimestre atual).
4. O sistema carrega todas as reuniões ativas daquele trimestre e as presenças vinculadas.
5. O sistema calcula, por unidade:
   - Frequência da unidade = média das porcentagens individuais dos membros
     (presenças do membro ÷ reuniões do trimestre).
   - Frequência do conselheiro = presenças do conselheiro ÷ reuniões do trimestre.
6. Uma tabela é exibida com uma linha por unidade: nome da unidade, frequência da
   unidade (%), nome do conselheiro, frequência do conselheiro (fração + %).

## Fluxos Alternativos
- **Trimestre sem reuniões**: exibir mensagem "Nenhuma reunião registrada neste trimestre"
  e não calcular porcentagens.
- **Unidade sem membros ativos**: exibir frequência da unidade como "—".
- **Unidade sem conselheiro**: exibir "Sem conselheiro" na coluna do conselheiro.
- **Membro sem registro de presença numa reunião**: conta como **falta**. O denominador
  é sempre o total de reuniões ativas do trimestre (ausência de marcação = faltou).

## Métricas de Sucesso
- A diretoria consegue obter a frequência de qualquer unidade em um trimestre em
  menos de 3 cliques (abrir Reuniões → Resumo → selecionar trimestre).
- O resumo mostra frequência da unidade e do conselheiro separadamente, com
  porcentagem e fração, para 100% das unidades ativas.

## Fora de Escopo
- Incluir conselheiros que **não** estão cadastrados como desbravadores ativos
  na chamada (a presença do conselheiro depende de ele já aparecer na chamada atual).
- Exportação para PDF/Excel do resumo.
- Comparação entre trimestres ou gráficos de tendência ao longo do ano.
- Rota pública para o resumo de frequência (somente visão admin nesta feature).
- Alterar a forma como a presença é registrada (apenas leitura/agregação dos dados existentes).

## Decisões de Cálculo (resolvidas)
- **D1**: Membro sem registro de presença numa reunião **conta como falta**.
  O denominador é sempre o total de reuniões ativas do trimestre.
- **D2**: A frequência da unidade é exibida como **porcentagem média + número de
  membros considerados** (ex: "80% (5 membros)").
- **D3**: Frequência da unidade = média das porcentagens individuais dos membros
  (cada membro: presenças ÷ total de reuniões do trimestre).
- **D4**: O conselheiro é o desbravador ativo com cargo CONSELHEIRO vinculado à
  unidade; é excluído da média da unidade e tem frequência reportada à parte.
