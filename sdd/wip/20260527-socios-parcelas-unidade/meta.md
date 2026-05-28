# Meta — socios-parcelas-unidade

## Identificação
- **Feature**: socios-parcelas-unidade
- **Data de início**: 20260527
- **Pasta**: sdd/wip/20260527-socios-parcelas-unidade/
- **Modo do projeto**: brownfield
- **Modo de execução**: standard

## Configuração
- **Linguagem dos specs**: pt
- **Cobertura alvo**: 60%
- **Tipo de projeto**: production

## Estado
- **Fase atual**: 1-functional
- **Spec funcional**: em_revisão
- **Spec técnico**: pendente
- **Tasks**: pendente
- **Implementação**: 0/0 completas

## Contexto Inicial
Ajustar aba de sócios: cada sócio faz PIX mensal de valor fixo, vinculado a uma unidade.
Precisa de controle de parcelas por data, histórico de pagamentos por sócio,
e relatório de inadimplência por unidade para contato com responsável.

## Contexto Brownfield
- **Specs afetados**: aba SOCIOS em Financeiro.tsx, coleção clubs/{clubeId}/socios
- **Impacto estimado**: Financeiro.tsx (aba SOCIOS), firestoreDb.ts (novas funções), types.ts (novo tipo PagamentoSocio)
