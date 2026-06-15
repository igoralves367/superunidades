# Meta — socios-painel-unidade

## Identificação
- **Feature**: socios-painel-unidade
- **Data de início**: 20260615
- **Pasta**: sdd/wip/20260615-socios-painel-unidade/
- **Modo do projeto**: brownfield
- **Modo de execução**: express

## Configuração
- **Linguagem dos specs**: pt
- **Cobertura alvo**: 60%

## Estado
- **Fase atual**: 4-implementation
- **Spec funcional**: aprovado
- **Spec técnico**: aprovado
- **Tasks**: aprovado
- **Implementação**: 0/7 completas

## Contexto Inicial
No painel público da unidade (PublicRanking.tsx, CounselorPanel, acessado via ?u=CODE), adicionar seção "Sócios" que:
1. Lista apenas os sócios ativos com unidadeId === unit.id (cada unidade só vê seus próprios sócios)
2. Mostra status de parcelas mensais de cada sócio (meses pagos/pendentes)
3. Permite adicionar novo sócio via modal com os mesmos campos do Financeiro (nome, cota mensal, mês ingresso — unidadeId pré-preenchido com a unidade atual)
4. Ao adicionar sócio, a contagem de sócios ativos da unidade é exibida e pode ser usada na submissão do requisito "Sócio Desbravador" do Clubão

Mesmo modelo de segurança já existente no painel (código da unidade via ?u=, sem login adicional).
