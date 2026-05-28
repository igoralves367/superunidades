# Meta — resumo-frequencia-reunioes

## Identificação
- **Feature**: resumo-frequencia-reunioes
- **Data de início**: 20260528
- **Pasta**: sdd/wip/20260528-resumo-frequencia-reunioes/
- **Modo do projeto**: brownfield
- **Modo de execução**: standard

## Configuração
- **Linguagem dos specs**: pt
- **Cobertura alvo**: 60%
- **Tipo de projeto**: production

## Estado
- **Fase atual**: 1-functional
- **Spec funcional**: aprovado
- **Spec técnico**: aprovado
- **Tasks**: aprovado
- **Implementação**: 3/7 completas (TASK-001, TASK-002, TASK-003)
- **Estratégia de execução**: batched

## Contexto Inicial
Resumo de frequência das reuniões por trimestre. O sistema já registra presença/falta
por unidade no módulo de Reuniões (coleções `reunioes` e `reunioes_presencas`).
O usuário precisa de um relatório resumido por trimestre mostrando:
- Frequência da unidade nas reuniões (média de presença dos membros), com quantidade
  e porcentagem (ex: 80% da unidade presente no trimestre).
- Frequência do conselheiro nas reuniões, com quantidade e porcentagem.

## Contexto Brownfield
- **Specs afetados**: módulo Reuniões (pages/Reunioes.tsx), coleções
  clubs/{clubeId}/reunioes e clubs/{clubeId}/reunioes_presencas
- **Impacto estimado**: Reunioes.tsx (nova visão de resumo trimestral),
  firestoreDb.ts (agregação de presenças por trimestre), services/ranking.ts ou
  novo cálculo puro de frequência
- **Aviso**: feature iniciada sem specs brownfield prévios (/sdd.reverse-eng não executado)

## Branch
- Branch atual no início: develop (havia mudanças não commitadas — branch não trocada
  por segurança; trabalhar na branch atual ou criar feature/resumo-frequencia-reunioes
  manualmente após commit das mudanças pendentes)
