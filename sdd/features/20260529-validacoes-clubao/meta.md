# Meta — validacoes-clubao

## Identificação
- **Feature**: validacoes-clubao
- **Data de início**: 20260529
- **Pasta**: sdd/wip/20260529-validacoes-clubao/
- **Modo do projeto**: brownfield
- **Modo de execução**: standard

## Configuração
- **Linguagem dos specs**: pt
- **Cobertura alvo**: 60%

## Estado
- **Fase atual**: 4-implementation
- **Spec funcional**: aprovado
- **Spec técnico**: aprovado
- **Tasks**: aprovado
- **Implementação**: 0/0 completas

## Contexto Inicial
Módulo de Validações dentro do Clubão. Cada validação representa um requisito de pontuação do campori, organizado por unidade e trimestre.

Validações planejadas:
1. Frequência Conselheiros (100pts) — automático via reunioes_presencas
2. Frequência Reuniões Clube (60pts) — automático via reunioes_presencas
3. Frequência Cultos (60pts) — entrada manual por unidade
4. Frequentar PG (60pts) — novo campo PG em desbravadores + entrada manual
5. Devocional Pessoal (200pts) — entrada manual + campo batismo em desbravadores
6. Classes (200pts) — campo classe já existe + validação trimestral manual

Obs: Frequência Conselheiros permanece também em Reuniões (relatorio + Validações alimentado automaticamente).
Novos campos necessários em Membros: PG (pequeno grupo) e batizado (boolean).
