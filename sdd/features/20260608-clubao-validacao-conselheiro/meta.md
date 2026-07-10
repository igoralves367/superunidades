# Meta — clubao-validacao-conselheiro

## Identificação
- **Feature**: clubao-validacao-conselheiro
- **Data de início**: 20260608
- **Pasta**: sdd/wip/20260608-clubao-validacao-conselheiro/
- **Modo do projeto**: brownfield
- **Modo de execução**: express

## Configuração
- **Linguagem dos specs**: pt
- **Cobertura alvo**: 60%

## Estado
- **Fase atual**: 4-implementation
- **Spec funcional**: aprovado
- **Spec técnico**: aprovado
- **Tasks**: 5 definidas
- **Implementação**: 5/5 completas (aguarda teste no browser)

## Contexto Inicial
Transformar o DNA da Unidade num portal do conselheiro: ele marca requisitos do trimestre atual como cumpridos (com observação) e enxerga o histórico do trimestre anterior (pontuações, presença por desbravador, classes). Do lado da diretoria, no módulo Clubão, ao clicar numa unidade vê os requisitos marcados e aprova/reprova. Aprovar aplica os pontos ao ranking na hora.

## Decisões do usuário (2026-06-08)
- Aprovação da diretoria aplica os pontos ao ranking imediatamente (completed=true + confirmadoRanking).
- Conselheiro vê histórico do trimestre anterior (escopo incluído).
- Conselheiro pode anexar observação ao marcar um requisito.
